const Brand = require('../models/Brand')
const Product = require('../models/Product')

module.exports = {
	getBrands: async (req, res, next) => {
		try {
			const brands = await Brand.find({}).sort({ displayOrder: -1 })
			const counts = await Product.aggregate([{ $group: { _id: '$brand', count: { $sum: 1 } } }])
			res.render('admin/brand-list', { brands, counts })
		} catch (error) {
			next(error)
		}
	},

	getAddBrandForm: async (req, res, next) => {
		try {
			res.render('admin/add-edit-brand', { brand: null, editMode: false })
		} catch (error) {
			next(error)
		}
	},

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

	deleteBrand: async (req, res, next) => {
		try {
			const id = req.body.id
			await Brand.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

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

	removeDuplateBrands: async (req, res, next) => {
		try {
			const brands = await Brand.find({})
			const counts = await Product.aggregate([{ $group: { _id: '$brand', count: { $sum: 1 } } }])
			const brandNames = counts.map((item) => item._id)
			const brandIds = brands.map((item) => item._id)
			const removeIds = brandIds.filter((item) => !brandNames.includes(item.toString()))
			await Brand.deleteMany({ _id: { $in: removeIds } })
		} catch (error) {
			console.error(error.message)
			next(error)
		}
	},
}
