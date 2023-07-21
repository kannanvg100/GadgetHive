const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please Enter Category name'],
		unique: [true, 'The Category name already exists'],
	},
	description: {
		type: String,
	},
	isDeleted: {
        type: Boolean,
        default: false
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

module.exports = mongoose.model('Category', categorySchema, 'categories')
