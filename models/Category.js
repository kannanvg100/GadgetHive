const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please Enter Category name'],
		lowercase: true,
		unique: [true, 'The Category name already exists'],
	},
	description: {
		type: String,
	},
	displayOrder: {
		type: Number,
		required: [true, 'Please Enter Category display order'],
	},
	isDeleted: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
})

// pre-save hook to check for duplicate category name
categorySchema.pre('save', async function (next) {
	const category = this
	try {
		if (!category.isModified('name')) {
			return next()
		}
		const duplicateCategory = await mongoose.model('Category').findOne({ name: category.name })

		if (duplicateCategory) {
			const err = new Error('Category name already exists')
			err.statusCode = 400
			return next(err)
		}

		next()
	} catch (err) {
		next(err)
	}
})

module.exports = mongoose.model('Category', categorySchema, 'categories')
