const Product = require('../models/Product')
const Category = require('../models/Category')
const Brand = require('../models/Brand')
const Wishlist = require('../models/Wishlist')
const { uploadToS3, deleteFromS3 } = require('../helpers/awsHelpers')

const RESULTS_PER_PAGE = 8

module.exports = {
	// get products by category
	getAllListedProducts: async (req, res, next) => {
		try {
			const { category } = req.params
			const page = req.query.page || 1
			const categoryID = await Category.findOne({ name: category })

			const decodedURL = decodeURIComponent(req.query.f)

			const sortStatus = req.query.sort
			const sort = {}
			if (sortStatus === 'price-asc') sort.price = 1
			else if (sortStatus === 'price-dec') sort.price = -1
			else if (sortStatus === 'new') sort.createdAt = -1

			let filter = {}
			const query = req.query.q || ''
			const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			if (escapedQuery !== 'undefined') {
				;(filter = {
					$and: [
						{
							$or: [{ $text: { $search: query } }, { title: { $regex: new RegExp(escapedQuery, 'i') } }],
						},
						{ status: 'listed' },
					],
				}),
					{ title: 1 }
			} else {
				filter.status = 'listed'
			}

			if (decodedURL !== 'undefined') {
				decodedURL.split('&').forEach((item) => {
					const [key, value] = item.split('=')
					filter[key] = { $in: value.split(',') }
				})
			}

			const categories = await Category.aggregate([
				{ $match: { isDeleted: false } },
				{ $sort: { displayOrder: -1 } },
				{ $group: { _id: null, values: { $push: '$name' } } },
			])

			if (category !== 'all') filter.category = categoryID._id
			const documentCount = await Product.countDocuments(filter)
			let products = await Product.find(filter)
				.sort(sort)
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)

			const filterOptionsCounts = await Product.aggregate([
				{ $match: filter },
				{
					$facet: {
						brand: [
							{ $group: { _id: '$brand', count: { $sum: 1 } } },
							{ $sort: { count: -1 } },
							{ $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brandData' } },
							{ $unwind: '$brandData' },
							{ $project: { _id: 1, count: 1, brandData: { _id: 1, name: 1 } } },
						],
						color: [{ $group: { _id: '$color', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
						memory: [{ $group: { _id: '$memory', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
						os: [{ $group: { _id: '$os', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
					},
				},
			])

			let title = ''
			if (category === 'all') title = 'Search'
			else if (category === 'phones') title = 'Mobile Phones'
			else if (category === 'watches') title = 'Watches'
			else if (category === 'tablets') title = 'Tablets'

			res.render('user/products-list', {
				products,
				categories: categories[0].values,
				filters: filterOptionsCounts[0],
				decodedURL,
				page,
				totalPages,
				searchQuery: query,
				path: [
					{ name: 'Home', url: '/' },
					{ name: category, url: '' },
				],
				title,
			})
		} catch (error) {
			next(error)
		}
	},

	// Products search
	getAllfilteredProducts: async (req, res, next) => {
		try {
			const filter = req.query
			filter.brand = await Brand.findOne({ name: filter.brand })
			const { page } = req.params
			filter.status = 'listed'
			const categories = await Category.aggregate([
				{ $match: { isDeleted: false } },
				{ $sort: { displayOrder: -1 } },
				{ $group: { _id: null, values: { $push: '$name' } } },
			])
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
					{ name: 'Search', url: '' },
				],
			})
		} catch (error) {
			console.error(error)
			next(error)
		}
	},

	// get all products for admin
	getAllProducts: async (req, res, next) => {
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
				.sort({ createdAt: -1 })
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
			res.render('admin/products-list', {
				products,
				page,
				totalPages,
				title: 'Products',
			})
		} catch (error) {
			console.error(error)
			next(error)
		}
	},

	// get product by id
	getProductByID: async (req, res, next) => {
		const { id } = req.params
		try {
			const product = await Product.findById(id).select('slug')
			if (!product) throw { statusCode: 404, message: 'Product not found' }
			res.redirect(`/shop/p/${product.slug}/${id}`)
		} catch (error) {
			next(error)
		}
	},

	// get product by slug
	getProductBySlug: async (req, res, next) => {
		const { id } = req.params
		try {
			const categories = await Category.aggregate([
				{ $match: { isDeleted: false } },
				{ $sort: { displayOrder: -1 } },
				{ $group: { _id: null, values: { $push: '$name' } } },
			])
			let product = await Product.findById(id).populate('category brand')
			if (!product) throw { statusCode: 404, message: 'Product not found' }
			let isWishlisted = false
			if (req.session.user)
				isWishlisted = await Wishlist.countDocuments({ user: req.session.user._id, 'items.product': id })
			res.render('user/product-details', {
				product,
				categories: categories[0].values,
				path: [
					{ name: 'Home', url: '/' },
					{ name: product.category.name, url: `/shop/${product.category.name}/` },
					{ name: product.title, url: '' },
				],
				isWishlisted,
				title: product.title,
			})
		} catch (error) {
			console.error(error.message)
			next(error)
		}
	},

	// Get add product form
	getAddProductForm: async (req, res, next) => {
		try {
			const categories = await Category.find({})
			const brands = await Brand.find({})
			res.render('admin/add-edit-product', {
				product: null,
				categories,
				brands,
				editMode: false,
				title: 'Add Product',
			})
		} catch (error) {
			console.error(error)
			next(error)
		}
	},

	// Get edit product form
	getEditProductForm: async (req, res, next) => {
		const id = req.query.id
		const product = await Product.findById(id)
		try {
			const categories = await Category.find({})
			const brands = await Brand.find({})
			res.render('admin/add-edit-product', {
				product,
				categories,
				brands,
				editMode: true,
				title: 'Edit Product',
			})
		} catch (error) {
			console.error(error)
			next(error)
		}
	},

	// Add product to database
	addProduct: async (req, res, next) => {
		try {
			const productData = JSON.parse(req.body.productData)
			if (req.files.length > 0) {
				productData.images = await uploadToS3('images', req.files)
				await Product.create(productData)
				return res.status(200).json({ success: true })
			} else res.status(400).json({ success: false, message: 'Please select some Product images' })
		} catch (error) {
			next(error)
		}
	},

	// Edit product in database
	editProduct: async (req, res, next) => {
		try {
			const productData = JSON.parse(req.body.productData)
			const id = productData.id
			const product = await Product.findById(id)
			for (const [key, value] of Object.entries(productData)) {
				product[key] = value
			}
			if (req.files.length > 0) {
				const imageUrls = (productData.images = await uploadToS3('images', req.files))
				product.images.push(...imageUrls)
			}
			await product.save()
			return res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	// Delete product from database
	deleteProduct: async (req, res, next) => {
		const { id } = req.body
		try {
			const product = await Product.findByIdAndDelete(id)
			res.status(200).json({ success: true })
            await deleteFromS3('images', ...product.images)
		} catch (error) {
			next(error)
		}
	},

	// Delete product image from database
	deleteImage: async (req, res, next) => {
		const { id, file } = req.body
		try {
			const product = await Product.findById(id)
			const index = product.images.indexOf(file)
			if (index === -1) throw { statusCode: 404, message: 'Image not found' }
			product.images.splice(index, 1)
			await product.save()
			res.status(200).json({ success: true })
			await deleteFromS3('images', file)
		} catch (error) {
			next(error)
		}
	},
}
