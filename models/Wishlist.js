const mongoose = require('mongoose')

const wishlistSchema = new mongoose.Schema({
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
	},
	items: [
		{
			product: {
				type: mongoose.Schema.ObjectId,
				ref: 'Product',
				required: true,
			}
		},
	],
})

module.exports = mongoose.model('Wishlist', wishlistSchema, 'wishlists')
