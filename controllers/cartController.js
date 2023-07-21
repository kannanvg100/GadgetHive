const User = require('../models/User')
const Category = require('../models/Category')
const Cart = require('../models/Cart')
const Order = require('../models/Order')
const Product = require('../models/Product')
const mongoose = require('mongoose')

module.exports = {
	getCart: async (req, res) => {
        console.log("inside acrt");
		const userId = req.session.user._id
		try {
			const cart = await Cart.findOne({ user: userId }).populate({
				path: 'items.productId',
				select: 'title color memory storage price mrp images',
			})
			res.render('user/cart', { items: cart.items, address: items.address[0], hideCartIcon: true })
		} catch (err) {
			console.error(err)
		}
	},

	addToCart: async (req, res) => {
		const userId = req.session.user._id
		const { productId } = req.body
		const quantity = Number(req.body.quantity)
		try {
			const cart = await Cart.findOne({ user: userId })
			if (cart.items.length === 0) {
				cart.items.push({ productId, quantity })
				res.status(200).json({ success: true })
			} else {
				let i
				for (i = 0; i < cart.items.length; i++) {
					if (cart.items[i].productId == productId) {
						const currQuantity = cart.items[i].quantity
						if (currQuantity < 10) {
							if (currQuantity + quantity > 10) {
								cart.items[i].quantity = 10
								res.status(200).json({ success: false, message: 'Maximum quantity added' })
							} else {
								cart.items[i].quantity = currQuantity + quantity
								res.status(200).json({ success: true })
							}
						} else res.status(400).json({ success: false, message: 'Maximum quantity already added' })
						break
					}
				}
				if (i === cart.items.length) {
					cart.items.push({ productId, quantity })
					res.status(200).json({ success: true })
				}
			}
			cart.save()
		} catch (error) {
			console.error(error.message)
			res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},

	deleteCartItem: async (req, res) => {
		const productId = req.body.id

		const userId = req.session.user._id
		const cart = await Cart.findOne({ user: userId })

		try {
			await Cart.findByIdAndUpdate({ user: userId }, { $pull: { items: { productId } } })
			res.status(200).json({ success: true })
		} catch (error) {
			console.error(error.message)
			res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},

	cartCheckOut: async (req, res) => {
		const _id = req.session.user._id
		const { addressId, paymentType } = req.body

		if (paymentType === 'COD') {
			try {
				const data = await User.findById(_id)
					.populate({
						path: 'cart.product',
						select: 'name price',
					})
					.select('-price')

				const address = data.address.find((addr) => addr._id.toString() === addressId)
				const order = { user: _id, items: data.cart, address, totalAmount: Infinity }
				await Order.create(order)
				data.cart = []
				data.save()
				res.status(200).json({ success: true })
			} catch (error) {
				console.error(error.message)
				res.status(500).json({ success: false, message: 'Something went wrong' })
			}
		} else if (paymentType === 'RAZORPAY') {
			var options = {
				amount: 50000,
				currency: 'INR',
				receipt: 'order_rcptid_11',
			}
			try {
				const order = await razorpay.orders.create(options)
				res.status(200).json({ orderId: order.id })
			} catch (err) {
				console.error(err)
				res.send(err.message)
			}
			F
		} else if (paymentType === 'PAYPAL') {
		} else {
			res.status(500).json({ success: false, message: 'Pls select a payment option' })
		}
	},

	updateCartQuantity: async (req, res) => {
		try {
			const { productId, quantity } = req.body
			const { _id: id } = req.session.user
			const user = await User.findById(id)
			let i
			for (i = 0; i < user.cart.length; i++) {
				if (user.cart[i].product == productId) {
					user.cart[i].quantity = quantity
					res.status(200).json({ success: true })
					break
				}
			}
			if (i === user.cart.length) res.status(500).json({ success: false, message: 'Something went wrong' })
			else user.save()
		} catch (error) {
			console.error(error)
			res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},
}
