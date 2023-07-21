const Product = require('../models/Product')
const Category = require('../models/Category')
const Brand = require('../models/Brand')
const mongoose = require('mongoose')

const RESULTS_PER_PAGE = 6

module.exports = {
	getAllListedProducts: async (req, res) => {
		try {
			const { category, page } = req.params
			const categories = await Category.aggregate([{ $group: { _id: null, values: { $push: '$name' } } }])
			const categoryID = await Category.findOne({ name: category })
			let filter = { status: 'listed' }
			if (category !== 'all') filter.category = categoryID._id
			const documentCount = await Product.countDocuments(filter)
			let products = await Product.find(filter)
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
			res.render('user/products-list', {
				products,
				categories: categories[0].values,
				page,
				totalPages,
				path: [
					{ name: 'Home', url: '/' },
					{ name: category, url: '' },
				],
			})
		} catch (error) {
			console.error(error.message)
		}
	},

	getAllfilteredProducts: async (req, res) => {
		try {
			const filter = req.query
			console.log('📄 > file: productController.js:39 > getAllfilteredProducts: > req.query:', req.query)
			filter.brand = await Brand.findOne({ name: filter.brand })
			console.log('📄 > file: productController.js:39 > getAllfilteredProducts: > filter:', filter)
			const { page } = req.params
			filter.status = 'listed'
			const categories = await Category.aggregate([{ $group: { _id: null, values: { $push: '$name' } } }])
			const documentCount = await Product.countDocuments(filter)
			let products = await Product.find(filter)
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
			// console.log('📄 > file: productController.js:19 > getAllListedProducts: > products:', products)
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
			res.render('user/products-list', {
				products,
				categories: categories[0].values,
				page,
				totalPages,
				path: [
					{ name: 'Home', url: '/' },
					{ name: 'Search', url: '' },
				],
			})
		} catch (error) {
			console.error(error.message)
		}
	},

	getAllProducts: async (req, res) => {
		const { category, page } = req.params
		let filter = {}
		if (category !== 'all') filter.category = category
		try {
			const documentCount = await Product.countDocuments(filter)
			let products = await Product.find(filter)
				.populate({
					path: 'category',
					select: 'name',
				})
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
			res.render('admin/products-list', {
				products,
				page,
				totalPages,
			})
		} catch (error) {
			console.error(error.message)
		}
	},

	getProductByID: async (req, res) => {
		const { id } = req.params
		try {
			const categories = await Category.aggregate([{ $group: { _id: null, values: { $push: '$name' } } }])
			let product = await Product.findById(id).populate('category')
			res.render('user/product-details', {
				product,
				categories: categories[0].values,
				path: [
					{ name: 'Home', url: '/home' },
					{ name: product.category.name, url: `/shop/${product.category.name}/p/1` },
					{ name: product.title, url: '' },
				],
			})
		} catch (error) {
			console.error(error.message)
			throw new Error(error.message)
		}
	},

	getAddProductForm: async (req, res) => {
		try {
			const categories = await Category.find({})
			const brands = await Brand.find({})
			res.render('admin/add-edit-product', { product: null, categories, brands })
		} catch (error) {
			console.error(error)
			throw new Error(error.message)
		}
	},

	getEditProductForm: async (req, res) => {
		id = req.query.id
		const product = await Product.findById(id)
		try {
			const categories = await Category.find({})
			const brands = await Brand.find({})
			res.render('admin/add-edit-product', {
				product,
				categories,
				brands,
				editMode: true,
			})
		} catch (error) {
			console.error(error)
			throw new Error(error.message)
		}
	},

	addProduct: async (req, res) => {
		const productData = JSON.parse(req.body.productData)
		productData.images = []

		if (req.files.length > 0) {
			req.files.forEach((item) => productData.images.push(item.filename))
			try {
				await Product.create(productData)
				return res.status(200).json({ success: true })
            } catch (error) {
                if (error.name === 'ValidationError') {
                    console.error(error)
                    res.status(500).json({ success: false, message: error.errors.title.message })
                } else {
                    console.error(error)
                    res.status(500).json({ success: false, message: "Something went wrong, Pls try again later"})
                }
            }
		} else res.status(400).json({ success: false, message: 'Please choose Product image files' })
	},

	editProduct: async (req, res) => {
		const productData = JSON.parse(req.body.productData)
		const id = productData.id
        
		try {
            const product = await Product.findById(id)
			if (req.files.length > 0) {
				req.files.forEach((item) => product.images.push(item.filename))
			}

			for (const [key, value] of Object.entries(productData)) {
				product[key] = value
			}
			await product.save()

			return res.status(200).json({ success: true })
		} catch (error) {
			if (error.name === 'ValidationError') {
				console.error(error)
				res.status(500).json({ success: false, message: error.errors.title.message })
			} else {
				console.error(error)
				res.status(500).json({ success: false, message: "Something went wrong, Pls try again later"})
			}
		}
	},

	deleteProduct: async (req, res) => {
		const { id } = req.body
		try {
			await Product.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			console.error(error.message)
			res.status(500).json({ success: false, message: 'Product deleting failed' })
		}
	},

	deleteImage: async (req, res) => {
		const { id, file } = req.body
		try {
			await Product.findByIdAndUpdate(id, { $pull: { images: file } })
			res.status(200).json({ success: true })
		} catch (error) {
			console.error(error.message)
			res.status(500).json({ success: false, message: 'Image deleting failed' })
		}
	},
}
