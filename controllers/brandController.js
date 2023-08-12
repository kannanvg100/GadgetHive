const Brand = require('../models/Brand')
const Product = require('../models/Product')

module.exports = {
    //  Get list of brands
	getBrands: async (req, res, next) => {
		try {
			const brands = await Brand.find({}).sort({ displayOrder: -1 })
			const counts = await Product.aggregate([{ $group: { _id: '$brand', count: { $sum: 1 } } }])
			res.render('admin/brand-list', { brands, counts })
		} catch (error) {
			next(error)
		}
	},

    //  Get add brand form
	getAddBrandForm: async (req, res, next) => {
		try {
			res.render('admin/add-edit-brand', { brand: null, editMode: false })
		} catch (error) {
			next(error)
		}
	},

    // Add brand to database
	addBrand: async (req, res, next) => {
		try {
			const { name, displayName, description, displayOrder } = JSON.parse(req.body.data)
			const image = req.file.filename
			await Brand.create({ name, displayName, description, displayOrder, image })
			res.status(200).json({ success: true })
		} catch (error) {
			console.error(error.message)
			next(error)
		}
	},

    // Get edit brand form with data
	getEditBrandForm: async (req, res, next) => {
		const id = req.query.id
		try {
			const brand = await Brand.findById(id)
			res.render('admin/add-edit-brand', { brand, editMode: true })
		} catch (error) {
			console.error(error.message)
			next(error)
		}
	},

    // Delete brand from database
	deleteBrand: async (req, res, next) => {
		try {
			const id = req.body.id
			await Brand.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

    // Upadte brand details in database
	editBrand: async (req, res, next) => {
		try {
			const data = JSON.parse(req.body.data)
			const brand = await Brand.findById(data.id)
			if (isNaN(data.displayOrder)) throw { message: 'Display order must be a number', statusCode: 400 }
			Object.assign(brand, data)
			const image = req.file
			if (image) {
				brand.image = image.filename
			}
			await brand.save()
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},
}
