const Product = require('../models/Product')
const Category = require('../models/Category')
const Brand = require('../models/Brand')
const Wishlist = require('../models/Wishlist')

const RESULTS_PER_PAGE = 6

module.exports = {
	getAllListedProducts: async (req, res, next) => {
        
		try {
			const { category } = req.params
			const { page } = req.query || 1
			const categoryID = await Category.findOne({ name: category })

			const filter = { status: 'listed' }
			const decodedURL = decodeURIComponent(req.query.f)

            const sortStatus = req.query.sort
            const sort = {}
            if(sortStatus === 'price-asc') sort.price = 1
            else if(sortStatus === 'price-des') sort.price = -1
            else if(sortStatus === 'new') sort.createdAt = -1
            
			if (decodedURL !== 'undefined') {
				decodedURL.split('&').forEach((item) => {
					const [key, value] = item.split('=')
					filter[key] = { $in: value.split(',') }
				})
			}

			// const facetStages = {}
			// const facetFields = ['brand', 'memory', 'storage']

			// facetFields.forEach((field) => {
			// 	facetStages[field] = [
			// 		{ $match: { status: 'listed', category: categoryID._id } },
			// 		{ $group: { _id: `$${field}`, count: { $sum: 1 } } },
			// 		{ $sort: { count: -1 } },
			// 	]
			// })

			// const filterOptionsCounts = await Product.aggregate([{ $facet: facetStages }])

			// const facetStages = {}
			// const facetFields = ['brand', 'memory', 'storage']

			// facetFields.forEach((field) => {
			// 	if (field === 'brand') {
			// 		facetStages[field].unshift({
			// 			$lookup: {
			// 				from: 'brands', // Change this to the actual name of the 'brands' collection
			// 				localField: '_id',
			// 				foreignField: '_id',
			// 				as: 'brandData',
			// 			},
			// 		})

			// 		// Add a $unwind stage to flatten the 'brandData' array
			// 		facetStages[field].push({
			// 			$unwind: '$brandData',
			// 		})

			// 		// Optionally, you can project only the fields you need from the 'brandData'
			// 		facetStages[field].push({
			// 			$project: {
			// 				_id: 1,
			// 				count: 1,
			// 				brandData: {
			// 					_id: 1,
			// 					name: 1, // Change this to the actual field names you want from the 'brands' collection
			// 					// Add more fields as needed
			// 				},
			// 			},
			// 		})
			// 	} else {
			// 		facetStages[field] = [
			// 			{ $match: { status: 'listed', category: categoryID._id } },
			// 			{ $group: { _id: `$${field}`, count: { $sum: 1 } } },
			// 			{ $sort: { count: -1 } },
			// 		]
			// 	}
			// })

			// const filterOptionsCounts = await Product.aggregate([{ $facet: facetStages }])

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
				{
					$match: filter,
				},
				{
					$facet: {
						brand: [
							{
								$group: {
									_id: '$brand',
									count: { $sum: 1 },
								},
							},
							{
								$sort: { count: -1 },
							},
							{
								$lookup: {
									from: 'brands',
									localField: '_id',
									foreignField: '_id',
									as: 'brandData',
								},
							},
							{
								$unwind: '$brandData',
							},
							{
								$project: {
									_id: 1,
									count: 1,
									brandData: {
										_id: 1,
										name: 1,
									},
								},
							},
						],
						color: [
							{
								$group: {
									_id: '$color',
									count: { $sum: 1 },
								},
							},
							{
								$sort: { count: -1 },
							},
						],
						memory: [
							{
								$group: {
									_id: '$memory',
									count: { $sum: 1 },
								},
							},
							{
								$sort: { count: -1 },
							},
						],
					},
				},
			])

			res.render('user/products-list', {
				products,
				categories: categories[0].values,
				filters: filterOptionsCounts[0],
				decodedURL,
				page,
				totalPages,
				path: [
					{ name: 'Home', url: '/' },
					{ name: category, url: '' },
				],
			})
		} catch (error) {
			next(error)
		}
	},

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
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
			res.render('admin/products-list', {
				products,
				page,
				totalPages,
			})
		} catch (error) {
			console.error(error)
			next(error)
		}
	},

	getProductByID: async (req, res, next) => {
		const { id } = req.params
		try {
			const categories = await Category.aggregate([
				{ $match: { isDeleted: false } },
				{ $sort: { displayOrder: -1 } },
				{ $group: { _id: null, values: { $push: '$name' } } },
			])
			let product = await Product.findById(id).populate('category')
            let isWishlisted = false
            if(req.session.user)
            isWishlisted = await Wishlist.countDocuments({ user: req.session.user._id, 'items.product': id})
			res.render('user/product-details', {
				product,
				categories: categories[0].values,
				path: [
					{ name: 'Home', url: '/home' },
					{ name: product.category.name, url: `/shop/${product.category.name}/p/1` },
					{ name: product.title, url: '' },
				],
                isWishlisted,
			})
		} catch (error) {
			console.error(error.message)
			next(error)
		}
	},

	getAddProductForm: async (req, res, next) => {
		try {
			const categories = await Category.find({})
			const brands = await Brand.find({})
			res.render('admin/add-edit-product', { product: null, categories, brands })
		} catch (error) {
			console.error(error)
			next(error)
		}
	},

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
			})
		} catch (error) {
			console.error(error)
			next(error)
		}
	},

	addProduct: async (req, res, next) => {
		try {
			const productData = JSON.parse(req.body.productData)
			productData.images = []

			if (req.files.length > 0) {
				req.files.forEach((item) => productData.images.push(item.filename))
				await Product.create(productData)
				return res.status(200).json({ success: true })
			} else res.status(400).json({ success: false, message: 'Please select some Product images' })
		} catch (error) {
			next(error)
		}
	},

	editProduct: async (req, res, next) => {
		try {
			const productData = JSON.parse(req.body.productData)
			const id = productData.id

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
			next(error)
		}
	},

	deleteProduct: async (req, res, next) => {
		const { id } = req.body
		try {
			await Product.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	deleteImage: async (req, res, next) => {
		const { id, file } = req.body
		try {
			await Product.findByIdAndUpdate(id, { $pull: { images: file } })
			res.status(200).json({ success: true })
		} catch (error) {
			console.error(error.message)
			next(error)
		}
	},
}
