/* eslint-disable no-undef */
const Order = require('../models/Order')
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const Wallet = require('../models/Wallet')
const Coupon = require('../models/Coupon')
const razorpay = require('../config/razorpay')
const crypto = require('crypto')
const excel = require('exceljs')

const RESULTS_PER_PAGE = 12

module.exports = {
	getAllOrders: async (req, res, next) => {
		try {
			const { page } = req.params
			const id = req.session.user._id
			const documentCount = await Order.countDocuments({ user: id })
			const orders = await Order.find({ user: id })
				.populate('items.productId')
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
				.sort({ createdAt: -1 })
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
			res.render('user/orders', {
				orders,
				page,
				totalPages,
				title: 'My Orders',
			})
		} catch (error) {
			next(error)
		}
	},

	getOrderById: async (req, res, next) => {
		const id = req.session.user._id
		const orderId = req.params.id
		try {
			const order = await Order.findOne({ user: id, _id: orderId }).populate({
				path: 'items.productId',
				select: 'title images',
			})
			res.render('user/order-details', {
				order,
				title: 'My Orders',
			})
		} catch (error) {
			next(error)
		}
	},

	cancelOrder: async (req, res, next) => {
		const userId = req.session.user._id
		const orderId = req.query.id
		try {
			await Order.findOneAndUpdate({ user: userId, _id: orderId }, { orderStatus: 'cancelled_by_user' })

			const order = await Order.findById(orderId)
			if (order.paymentMode !== 'COD') {
				const wallet = await Wallet.findOne({ user: userId })
				wallet.transactions.push({ title: `Refund for Order #${orderId}`, amount: order.finalAmount })
				wallet.save()
			}
			res.status(200).json({ success: true, message: 'Order Cancelled' })
		} catch (error) {
			next(error)
		}
	},

	returnOrder: async (req, res, next) => {
		const userId = req.session.user._id
		const orderId = req.query.id
		try {
			await Order.findOneAndUpdate({ user: userId, _id: orderId }, { orderStatus: 'returned' })
			const order = await Order.findById(orderId)
			if (order.paymentMode !== 'COD') {
				const wallet = await Wallet.findOne({ user: userId })
				wallet.transactions.push({ title: `Refund for Order #${orderId}`, amount: order.finalAmount })
				wallet.save()
			}
			res.status(200).json({ success: true, message: 'Return accepted' })
		} catch (error) {
			next(error)
		}
	},

	cancelOrderAdmin: async (req, res, next) => {
		const orderId = req.query.id
		try {
			await Order.findOneAndUpdate({ _id: orderId }, { orderStatus: 'cancelled_by_admin' })
			const order = await Order.findById(orderId)
			if (order.paymentMode !== 'COD') {
				const wallet = await Wallet.findOne({ user: order.user })
				wallet.transactions.push({ title: `Refund for Order #${orderId}`, amount: order.finalAmount })
				wallet.save()
			}
			res.status(200).json({ success: true, message: 'Order Cancelled' })
		} catch (error) {
			next(error)
		}
	},

	getAllOrdersAdmin: async (req, res, next) => {
		const { page } = req.params

		try {
			const documentCount = await Order.countDocuments({})
			const orders = await Order.find({})
				.populate('user')
				.sort({ createdAt: -1 })
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
			res.render('admin/orders-list', {
				orders,
				page,
				totalPages,
			})
		} catch (error) {
			next(error)
		}
	},

	getOrderByIdAdmin: async (req, res, next) => {
		const orderId = req.query.id
		const order = await Order.findById(orderId).populate({
			path: 'items.productId',
			select: 'title images',
		})
		res.render('admin/order-details', { order })
	},

	checkOut: async (req, res, next) => {
		const userId = req.session.user._id
		const { addressId, paymentType, couponId } = req.body
		try {
			const cart = await Cart.findOne({ user: userId })
				.populate({
					path: 'items.productId',
					select: 'price stock',
				})
				.select('-price')

			const updateOperations = []
			let isAvailable = true
			for (const item of cart.items) {
				if (item.quantity > item.productId.stock) {
					isAvailable = false
					break
				}
				updateOperations.push({
					updateOne: {
						filter: { _id: item.productId._id.toString() },
						update: { $inc: { stock: -item.quantity } },
					},
				})
			}

			if (!isAvailable) return res.status(404).json({ success: false, message: 'Some items are out of stock' })

			const result = await Product.bulkWrite(updateOperations)

			if (result.modifiedCount !== cart.items.length) {
				return res.status(500).json({ success: false, message: 'Something went wrong, Pls try again later' })
			}

			const orderItems = []
			let totalAmount = 0
			cart.items.forEach((item) => {
				const tmp = { productId: item.productId._id, quantity: item.quantity, price: item.productId.price }
				totalAmount += item.productId.price * item.quantity
				orderItems.push(tmp)
			})

			const coupon = await Coupon.findById(couponId)
			let discount = 0
			if (coupon && totalAmount >= coupon.minAmount) {
				discount = (totalAmount * coupon.discount) / 100
				discount = discount > coupon.maxDiscount ? coupon.maxDiscount : discount
			}

			// TODO
			const address = req.session.user.address.find((addr) => addr._id.toString() === addressId)

			const orderData = {
				user: userId,
				items: orderItems,
				address,
				totalAmount: 0,
				finalAmount: 0,
				discount,
				paymentMode: paymentType,
			}

			if (paymentType === 'COD') {
				orderData.orderStatus = 'placed'
				const order = await Order.create(orderData)
				await Cart.findOneAndUpdate({ user: userId }, { items: [] })
				res.status(200).json({ success: true, url: `/orders/${order._id}` })
			} else if (paymentType === 'RAZORPAY') {
				const order = await Order.create(orderData)
				const razorpayOrder = await razorpay.orders.create({
					amount: order.finalAmount * 100,
					currency: 'INR',
					receipt: order._id.toString(),
				})
				order.paymentData = razorpayOrder
				order.save()
				res.status(200).json({ success: true, url: `/orders/payment?oid=${order._id}` })
			} else if (paymentType === 'WALLET') {
				const wallet = await Wallet.findOne({ user: userId })
				let totalAmount = 0
				for (const it of orderItems) totalAmount += it.price
				totalAmount -= orderData.discount
				if (wallet.balance < totalAmount)
					res.status(500).json({ success: false, message: 'Not enough balance in the wallet' })
				else {
					const order = await Order.create(orderData)
					wallet.transactions.push({ title: `Spend for order #${order._id}`, amount: -order.finalAmount })
					wallet.save()
					orderData.orderStatus = 'placed'
					await Cart.findOneAndUpdate({ user: userId }, { items: [] })
					res.status(200).json({ success: true, url: `/orders/${order._id}` })
				}
			} else {
				res.status(500).json({ success: false, message: 'Pls select a payment option' })
			}
		} catch (error) {
			next(error)
		}
	},

	payment: async (req, res, next) => {
		try {
			const { oid: orderId } = req.query
			const order = await Order.findById(orderId)
			if (order.orderStatus === 'pending') {
				res.render('user/payment', { order, razorpay_key: process.env.RAZORPAY_KEY_ID })
			}
		} catch (error) {
			next(error)
		}
	},

	checkPayment: async (req, res, next) => {
		try {
			const userId = req.session.user._id

			const { razorpayOrderId, razorpayPaymentId, secret } = req.body

			const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)

			hmac.update(razorpayOrderId + '|' + razorpayPaymentId)
			const generatedSignature = hmac.digest('hex')

			if (generatedSignature === secret) {
				await Order.findOneAndUpdate({ 'paymentData.id': razorpayOrderId }, { orderStatus: 'placed' })
				await Cart.findOneAndUpdate({ user: userId }, { items: [] })
				res.status(200).json({ success: true })
			} else res.status(400).json({ success: false })
		} catch (error) {
			next(error)
		}
	},

	updateStatusAdmin: async (req, res, next) => {
		const { id: orderId, status } = req.query
		try {
			await Order.findOneAndUpdate({ _id: orderId }, { orderStatus: status })
			if (status === 'returned') {
				const order = await Order.findById(orderId)
				if (order.paymentMode !== 'COD') {
					const wallet = await Wallet.findOne({ user: order.user })
					wallet.transactions.push({ title: `Refund for Order #${orderId}`, amount: order.totalAmount })
					wallet.save()
				}
			}
			res.status(200).json({ success: true, message: 'Order Cancelled' })
		} catch (error) {
			next(error)
		}
	},

	getReports: async (req, res, next) => {
		let { from, to } = req.query
		if (!from || !to) {
			return res.render('admin/reports')
		}
		if (from > to) [from, to] = [to, from]
		to += 'T23:59:59.999Z'
		try {
			const orders = await Order.find({ createdAt: { $gte: from, $lte: to }, orderStatus: 'delivered' }).populate(
				'user'
			)
			const workbook = new excel.Workbook()
			const worksheet = workbook.addWorksheet('Orders')

			const data = orders.map((order) => [
				order._id,
				order.createdAt.toDateString(),
				order.totalAmount,
				order.paymentMode,
			])

			worksheet.addRows([['Order ID', 'Order Date', 'Total Amount', 'Payment Mode'], ...data])

			await workbook.xlsx.writeFile('orders_last_month.xlsx')

			from = from.split('T')[0]
			to = to.split('T')[0]
			res.render('admin/reports', { orders, from, to })
		} catch (error) {
			next(error)
		}
	},
}
