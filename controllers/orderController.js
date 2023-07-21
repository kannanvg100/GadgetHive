const Order = require('../models/Order')
const razorpay = require('../config/razorpay')

const RESULTS_PER_PAGE = 6

module.exports = {
	getAllOrdersUser: async (req, res) => {
		const { page } = req.params
		id = req.session.user._id
		const documentCount = await Order.countDocuments({ user: id })
		let orders = await Order.find({ user: id })
			.populate('items.product._id')
			.skip((page - 1) * RESULTS_PER_PAGE)
			.limit(RESULTS_PER_PAGE)
			.sort({ createdAt: -1 })
		const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
		res.render('user/orders', {
			orders,
			page,
			totalPages,
		})
	},
	getOrderByIdUser: async (req, res) => {
		id = req.session.user._id
		const orderId = req.params.id
		try {
			let order = await Order.findOne({ user: id, _id: orderId }).populate({
				path: 'items.product._id',
				select: 'title images',
			})
			res.render('user/order-details', {
				order,
			})
		} catch (error) {
			console.error(error)
		}
	},
	cancelOrderUser: async (req, res) => {
		id = req.session.user._id
		const orderId = req.query.id
		try {
			let order = await Order.findOneAndUpdate({ user: id, _id: orderId }, { status: 'cancelled_by_user' })
			res.status(200).json({ success: true, message: 'Order Cancelled' })
		} catch (error) {
			console.error(error)
			res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},
	cancelOrderAdmin: async (req, res) => {
		const orderId = req.query.id
		try {
			let order = await Order.findOneAndUpdate({ _id: orderId }, { status: 'cancelled_by_admin' })
			res.status(200).json({ success: true, message: 'Order Cancelled' })
		} catch (error) {
			console.error(error)
			res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},
	getAllUsersOrders: async (req, res) => {
		const { page } = req.params
		const documentCount = await Order.countDocuments({})
		let orders = await Order.find({})
			.populate('user')
			.skip((page - 1) * RESULTS_PER_PAGE)
			.limit(RESULTS_PER_PAGE)
		const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
		res.render('admin/orders-list', {
			orders,
			page,
			totalPages,
		})
	},
	getUsersOrdersById: async (req, res) => {
		const orderId = req.query.id
		try {
			const order = await Order.findById(orderId).populate({
				path: 'items.product._id',
				select: 'title images',
			})
			res.render('admin/order-details', { order })
		} catch (error) {
			console.error(error``)
		}
	},

    getPaymentPage: async (req, res) => {
        res.render("user/test")
    },

	getOrderId: async (req, res) => {
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
	},
}
