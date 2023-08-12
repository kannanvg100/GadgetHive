const Category = require('../models/Category')
const Product = require('../models/Product')

module.exports = {
    // Get all categories
	getCategories: async (req, res, next) => {
		try {
			const categories = await Category.find({}).sort({ displayOrder: -1 })
			const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
			res.render('admin/category-list', { categories, counts })
		} catch (error) {
            next(error)
		}
	},

    // get add category form
	getAddCategoryForm: async (req, res) => {
		res.render('admin/add-edit-category', { editMode: false })
	},

    // add category to database
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

    // get edit category form
	getEditCategoryForm: async (req, res, next) => {
		const id = req.query.id
		try {
			const category = await Category.findById(id)
			res.render('admin/add-edit-category', { category, editMode: true })
		} catch (error) {
            next(error)
		}
	},

    // delete category from database
	deleteCategory: async (req, res, next) => {
		try {
			const id = req.body.id
			await Category.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

    // edit category in database
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
