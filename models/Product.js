const mongoose = require('mongoose')
const slugify = require('slugify')

const productSchema = new mongoose.Schema({
	title: {
		type: String,
		required: [true, 'Please enter the Product name'],
		trim: true,
	},
	slug: {
		type: String,
	},
	highlight: {
		type: String,
		default: function () {
			if (this.released) {
				return Date.now()
			}
			return null
		},
	},
	description: {
		type: String,
		trim: true,
	},
	memory: {
		type: String,
		default: 'Not Specified',
	},
	storage: {
		type: String,
		required: [true, 'Please enter the Storage configuration'],
	},
	color: {
		type: String,
		required: [true, 'Please enter the Product Color'],
	},
	os: {
		type: String,
		required: [true, 'Please enter the OS'],
	},
	brand: {
		type: mongoose.Schema.ObjectId,
		ref: 'Brand',
		required: [true, 'Please enter the Brand name'],
	},
	category: {
		type: mongoose.Schema.ObjectId,
		ref: 'Category',
		required: [true, 'Please enter the Product category'],
	},
	mrp: {
		type: Number,
		required: [true, 'Please enter the Product MRP'],
		min: 0,
	},
	price: {
		type: Number,
		required: [true, 'Please enter the Product Price'],
		min: 0,
		validate: {
			validator: function (value) {
				if (value > this.mrp) return false
				return true
			},
			message: 'Price must be lesser than the product MRP',
		},
	},
	stock: {
		type: Number,
		required: [true, 'Please enter the Stock'],
		maxlength: [4, 'Stock cannot exceed limit'],
		default: 1,
		min: 0,
	},
	images: [{ type: String, required: true }],
	status: {
		type: String,
		enum: ['listed', 'delisted'],
		required: [true, 'Please choose a Status for the Product'],
	},
	createdAt: {
		type: Date,
		immutable: true,
		default: () => new Date(),
	},
	updatedAt: {
		type: Date,
	},
})

productSchema.pre('save', function (next) {
	if (this.images.length === 0) {
		throw { statusCode: 400, message: 'Product should have atleast one image' }
	}
	next()
})

productSchema.pre('save', async function (next) {
	this.updatedAt = new Date()
	next()
})

productSchema.pre('save', function (next) {
	if (this.memory == '') this.memory = 'Not Specified'
	next()
})

productSchema.pre('save', function (next) {
	if (this.memory == 'Not Specified') this.highlight = `${this.color}, ${this.storage}`
	else this.highlight = `${this.memory}, ${this.storage}`
	next()
})

productSchema.post('save', async function (doc, next) {
	try {
		if (!doc.slug) {
			const baseSlug = slugify(doc.title, { lower: true })
			const uniqueSlug = `${baseSlug}-${doc._id}`
			doc.slug = uniqueSlug
			await doc.save()
			next()
		} else next()
	} catch (err) {
		next(err)
	}
})

module.exports = mongoose.model('Product', productSchema, 'products')
