const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
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
			price: {
				type: Number,
				required: true,
				min: 0,
			},
		},
	],
	status: {
		type: String,
		default: 'processing',
	},
	totalAmount: {
		type: Number,
		required: true,
		min: 0,
	},
	paymentMode: {
		type: String,
		required: true,
	},
	address: {
		name: {
			type: String,
			required: true,
		},
		streetName: {
			type: String,
			required: true,
		},
		town: {
			type: String,
			required: true,
		},
		pincode: {
			type: Number,
			required: true,
		},
		phone: {
			type: Number,
			required: true,
		},
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

orderSchema.pre('save', async function (next) {
	let total = 0
	for (let item of this.items) {
		total += item.product.price * item.quantity
	}
	this.totalAmount = total
	next()
})

module.exports = mongoose.model('Order', orderSchema, 'orders')
