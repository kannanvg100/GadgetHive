const Cart = require('../models/Cart')
const Product = require('../models/Product')
const Coupon = require('../models/Coupon')
const mongoose = require('mongoose')

module.exports = {
	// get cart items
	getCart: async (req, res, next) => {
		const userId = new mongoose.Types.ObjectId(req.session.user._id)
		try {
			const cart = await Cart.findOne({ user: userId }).populate({ path: 'items.productId' })
			const items = cart.items
			const address = req.session.user.address
			const coupons = await Coupon.find({}).sort({ createdAt: -1 })
			res.render('user/cart', { items, address, coupons, hideCartIcon: true, title: 'Shopping Bag' })
		} catch (err) {
			next(err)
		}
	},

	// add item to cart
	addToCart: async (req, res, next) => {
		const { productId } = req.body
		const quantity = Number(req.body.quantity)
		const userId = req.session.user._id

		try {
			const product = await Product.findById(productId).select('stock')
			if (product.stock < quantity) {
				res.status(400).json({ success: false, message: 'Not enough stock' })
				return
			}
			const cart = await Cart.findOne({ user: userId })
			if (!cart) {
				await Cart.create({ user: userId, items: [{ productId, quantity }] })
				res.status(200).json({ success: true })
			} else {
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
			}
		} catch (error) {
			next(error)
		}
	},

	// delete item from cart
	deleteCartItem: async (req, res, next) => {
		const itemId = req.body.id
		const userId = req.session.user._id

		try {
			await Cart.findOneAndUpdate({ user: userId }, { $pull: { items: { _id: itemId } } }, { new: true })
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	// update cart item quantity
	updateCartQuantity: async (req, res, next) => {
		try {
			const { productId, quantity } = req.body
			const { _id: userId } = req.session.user
			const cart = await Cart.findOne({ user: userId })

			const item = cart.items.id(productId)
			if (item) {
				item.quantity = quantity
				cart.save()
				res.status(200).json({ success: true })
			} else {
				throw { statusCode: 404, message: 'Item not found' }
			}
		} catch (error) {
			next(error)
		}
	},
}
