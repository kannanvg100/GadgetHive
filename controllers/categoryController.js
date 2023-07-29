const Category = require('../models/Category')
const Product = require('../models/Product')
const catchAsyncError = require('../middlewares/catchAsyncError')

module.exports = {
	getCategories: async (req, res) => {
		try {
			const categories = await Category.find({}).sort({ displayOrder: -1 })
			const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
			res.render('admin/category-list', { categories, counts })
		} catch (error) {
			console.error(error.message)
		}
	},

	getAddCategoryForm: async (req, res) => {
		res.render('admin/add-edit-category', { editMode: false })
	},

	addCategory: async (req, res, next) => {
		try {
			const { name, description, displayOrder } = req.body
			const category = new Category({ name, description, displayOrder })
			await category.save()
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
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

	deleteCategory: async (req, res, next) => {
		try {
			const id = req.body.id
			await Category.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	editCategory: async (req, res, next) => {
		try {
			const data = req.body
			const category = await Category.findById(data.id)
			category.name = data.name
			category.description = data.description
			category.displayOrder = data.displayOrder
			await category.save()
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},
}
