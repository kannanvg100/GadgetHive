const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
	},
	items: [
		{
			productId: {
				type: mongoose.Schema.ObjectId,
				ref: 'Product',
				required: true,
			},
			quantity: {
				type: Number,
				required: true,
				min: 1,
			},
		},
	],
})

module.exports = mongoose.model('Cart', cartSchema, 'carts')
