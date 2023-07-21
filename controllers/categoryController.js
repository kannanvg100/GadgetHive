const Category = require('../models/Category')
const verificationHelpers = require('../config/twilio')
const Product = require('../models/Product')

module.exports = {
	getCategories: async (req, res) => {
		try {
			const categories = await Category.find({})
			const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
			res.render('admin/category-list', { categories, counts })
		} catch (error) {
			console.error(error.message)
		}
	},

	getAddCategoryForm: async (req, res) => {
		res.render('admin/add-edit-category', {editMode: false})
	},

	addCategory: async (req, res) => {
		const { name, description } = req.body

		try {
			await Category.create({ name, description })
		} catch (error) {
			if (error.name === 'ValidationError') {
				console.error(error)
				res.status(500).json({ success: false, message: error.errors.title.message })
			} else {
				console.error(error)
				res.status(500).json({ success: false, message: 'Something went wrong, Pls try again later' })
			}
		}
	},

	getEditCategoryForm: async (req, res) => {
		const id = req.query.id
		try {
			const category = await Category.findById(id)
			res.render('admin/add-edit-category', { category, editMode: true })
		} catch (error) {
			console.error(error.message)
		}
	},
	deleteCategory: async (req, res) => {
		const id = req.body.id
		try {
			const category = await Category.findById(id)
            category.isDeleted = true
            category.save()
			res.status(200).json({ success: true })
		} catch (error) {
			console.error(error.message)
			res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},

	editCategory: async (req, res) => {
		const data = req.body
		try {
			const category = await Category.findById(data.id)
            category.name = data.name
            category.description = data.description
            await category.save()
			res.status(200).json({ success: true })
		} catch (error) {
			console.error(error.message)
			res.status(500).json({ success: false, message: error.message })
		}
	},
}
