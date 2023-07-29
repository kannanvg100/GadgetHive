const Order = require('../models/Order')
const Product = require('../models/Product')

module.exports = {
	processPendingOrders: async () => {
		try {
			const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

			const pendingOrders = await Order.find({
				orderStatus: 'pending',
				createdAt: { $lt: fifteenMinutesAgo },
			})

			for (const order of pendingOrders) {
				for (const item of order.items) {
					const productId = item.productId
					const quantity = item.quantity

					await Product.updateOne({ _id: productId }, { $inc: { quantity: quantity } })
					await Order.updateOne({ _id: order._id }, { $set: { orderStatus: 'payment_failed' } })
				}
			}
		} catch (err) {
			console.error('Error processing pending orders:', err)
		}
	},
}
