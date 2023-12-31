/* eslint-disable no-undef */
const Order = require('../models/Order')
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const Wallet = require('../models/Wallet')
const Coupon = require('../models/Coupon')
const User = require('../models/User')
const razorpay = require('../config/razorpay')
const crypto = require('crypto')
const excel = require('exceljs')
const moment = require('moment')
const puppeteer = require('puppeteer')
const getPdfTemplate = require('../public/reports/getPdfTemplate')
const RESULTS_PER_PAGE = 8

module.exports = {
    // Get all orders admin
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
			if (orders.length === 0)
				return res.render('user/orders', { orders: {}, page, totalPages, title: 'My Orders' })
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

    // Get order by id user
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

    // Cancel order user
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

    // Return order user
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

    // Cancel order admin
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

    // Get all orders admin
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
				title: 'Orders',
			})
		} catch (error) {
			next(error)
		}
	},

    // Get order by id admin
	getOrderByIdAdmin: async (req, res, next) => {
		const orderId = req.query.id
		const order = await Order.findById(orderId).populate({
			path: 'items.productId',
			select: 'title images',
		})
		res.render('admin/order-details', { order, title: 'Orders' })
	},

    // order checkout
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
			let discount = 0
			if (couponId) {
				const coupon = await Coupon.findById(couponId)
				if (coupon && totalAmount >= coupon.minAmount) {
					discount = (totalAmount * coupon.discount) / 100
					discount = discount > coupon.maxDiscount ? coupon.maxDiscount : discount
				}
			}

			const user = await User.findById(userId)
			const address = user.address.id(addressId)

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
				const amount = parseInt(order.finalAmount * 100)
				const razorpayOrder = await razorpay.orders.create({
					amount,
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

    // order payment page
	payment: async (req, res, next) => {
		try {
			const { oid: orderId } = req.query
			const order = await Order.findById(orderId)
			if (order.orderStatus === 'pending') {
				res.render('user/payment', { order, razorpay_key: process.env.RAZORPAY_KEY_ID, title: 'Payment' })
			} else res.redirect(`/orders/${orderId}`)
		} catch (error) {
			next(error)
		}
	},

    // order payment verify
	checkPayment: async (req, res, next) => {
		try {
			const userId = req.session.user._id

			const { razorpayOrderId, razorpayPaymentId, secret } = req.body
			const order = await Order.findOne({ user: userId, 'paymentData.id': razorpayOrderId })
			if (order.orderStatus === 'placed') return res.status(200).json({ success: true })

			const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)

			hmac.update(razorpayOrderId + '|' + razorpayPaymentId)
			const generatedSignature = hmac.digest('hex')

			if (generatedSignature === secret) {
				order.orderStatus = 'placed'
				await Cart.findOneAndUpdate({ user: userId }, { items: [] })
				await order.save()
				res.status(200).json({ success: true })
			} else {
				order.orderStatus = 'payment_failed'
				await order.save()
				res.status(400).json({ success: false })
				order.items.forEach(async (item) => {
					await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })
				})
			}
		} catch (error) {
			next(error)
		}
	},

    // order status update admin
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

    // get sales reports
	getReports: async (req, res, next) => {
		try {
			let { from, to } = req.query

			const today = moment().format('YYYY-MM-DD')
			const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD')
			const last7days = moment().subtract(7, 'days').format('YYYY-MM-DD')
			const last30days = moment().subtract(30, 'days').format('YYYY-MM-DD')
			const lastYear = moment().subtract(1, 'years').format('YYYY-MM-DD')

			if (!from || !to) {
				from = today
				to = today
			}

			if (from > to) [from, to] = [to, from]
			to += 'T23:59:59.999Z'
			const orders = await Order.find({ createdAt: { $gte: from, $lte: to }, orderStatus: 'delivered' }).populate(
				'user'
			)

			from = from.split('T')[0]
			to = to.split('T')[0]
			const netTotalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0)
			const netFinalAmount = orders.reduce((acc, order) => acc + order.finalAmount, 0)
			const netDiscount = orders.reduce((acc, order) => acc + order.discount, 0)

			const dateRanges = [
				{ text: 'Today', from: today, to: today },
				{ text: 'Yesterday', from: yesterday, to: yesterday },
				{ text: 'Last 7 days', from: last7days, to: today },
				{ text: 'Last 30 days', from: last30days, to: today },
				{ text: 'Last year', from: lastYear, to: today },
			]
			res.render('admin/reports', {
				orders,
				from,
				to,
				dateRanges,
				netTotalAmount,
				netFinalAmount,
				netDiscount,
				title: 'Reports',
			})
		} catch (error) {
			next(error)
		}
	},

    // download sales reports
	downloadReports: async (req, res, next) => {
		try {
			const { type } = req.params
			let { from, to } = req.query
			to += 'T23:59:59.999Z'
			const orders = await Order.find({ createdAt: { $gte: from, $lte: to }, orderStatus: 'delivered' }).populate(
				'user'
			)
			const netTotalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0)
			const netFinalAmount = orders.reduce((acc, order) => acc + order.finalAmount, 0)
			const netDiscount = orders.reduce((acc, order) => acc + order.discount, 0)

			if (type === 'excel') {
				const workbook = new excel.Workbook()
				const worksheet = workbook.addWorksheet('Report')

				worksheet.columns = [
					{ header: 'SL. No', key: 's_no', width: 10 },
					{ header: 'Order ID', key: 'oid', width: 20 },
					{ header: 'Date', key: 'createdAt', width: 20 },
					{ header: 'User ID', key: 'userID', width: 20 },
					{ header: 'Total Price', key: 'totalAmount', width: 20 },
					{ header: 'Discount', key: 'discount', width: 20 },
					{ header: 'Final Price', key: 'finalAmount', width: 20 },
					{ header: 'Payment Mode', key: 'paymentMode', width: 20 },
				]

				worksheet.duplicateRow(1, 8, true)
				worksheet.getRow(1).values = ['Sales Report']
				worksheet.getRow(1).font = { bold: true, size: 16 }
				worksheet.getRow(1).alignment = { horizontal: 'center' }
				worksheet.mergeCells('A1:H1')

				worksheet.getRow(2).values = []
				worksheet.getRow(3).values = ['', 'From', from]
				worksheet.getRow(3).font = { bold: false }
				worksheet.getRow(3).alignment = { horizontal: 'right' }
				worksheet.getRow(4).values = ['', 'To', to.split('T')[0]]
				worksheet.getRow(5).values = ['', 'Total Orders', orders.length]
				worksheet.getRow(6).values = ['', 'Net Final Price', netFinalAmount]

				worksheet.getRow(7).values = []
				worksheet.getRow(8).values = []

				let count = 1
				orders.forEach((order) => {
					order.s_no = count
					order.oid = order._id.toString().replace(/"/g, '')
					order.userID = order.user.email
					worksheet.addRow(order)
					count += 1
				})

				worksheet.getRow(9).eachCell((cell) => {
					cell.font = { bold: true }
				})

				worksheet.addRow([])
				worksheet.addRow([])

				worksheet.addRow(['', '', '', '', '', '', 'Net Total Price', netTotalAmount, ''])
				worksheet.addRow(['', '', '', '', '', '', 'Net Discount Price', netDiscount, ''])
				worksheet.addRow(['', '', '', '', '', '', 'Net Final Price', netFinalAmount, ''])
				worksheet.lastRow.eachCell((cell) => {
					cell.font = { bold: true }
				})

				const xlBuffer = await workbook.xlsx.writeBuffer()

                res.setHeader('Content-Disposition', 'attachment; filename=report.xls');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.send(xlBuffer);

			} else {
				const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium-browser' })
				const page = await browser.newPage()

				const content = getPdfTemplate({
					orders,
					netTotalAmount,
					netFinalAmount,
					netDiscount,
				})

				await page.setContent(content)
				const pdfBuffer = await page.pdf({ format: 'A4' })

				res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
                res.setHeader('Content-Type', 'application/pdf');
                res.send(pdfBuffer);
			}
		} catch (error) {
			next(error)
		}
	},
}
