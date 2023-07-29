const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
	},
	transactions: [
		{
			title: {
				type: String,
				required: true,
			},
			amount: {
				type: Number,
				required: true,
			},
			date: {
				type: Date,
				default: Date.now,
			},
		},
	],
	balance: {
		type: Number,
		required: true,
		min: 0,
	},
})

// Update balance
walletSchema.pre('save', async function (next) {
	try {
		let totalAmount = 0
		for (const transaction of this.transactions) {
			totalAmount += transaction.amount
		}
        this.balance = totalAmount
		next()
	} catch (error) {
		next(error)
	}
})

module.exports = mongoose.model('Wallet', walletSchema, 'wallets')
