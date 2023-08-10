const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
	title: {
		type: String,
		required: [true, 'Please enter the Product name'],
		trim: true,
	},
	highlight: {
		type: String,
		default: function () {
			return `${this.memory}, ${this.storage}`
		},
	},
	description: {
		type: String,
		required: [true, 'Please enter the Product description'],
	},
	memory: {
		type: String,
		required: [true, 'Please enter the Memory configuration'],
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
	avgRating: {
		type: Number,
		default: 4.3,
	},
	numOfReviews: {
		type: Number,
		default: 12,
	},
	reviews: [
		{
			user: {
				type: mongoose.Schema.ObjectId,
				ref: 'User',
				required: true,
			},
			name: {
				type: String,
				required: true,
			},
			rating: {
				type: Number,
				min: 1,
				max: 5,
				required: true,
			},
			comment: {
				type: String,
			},
		},
	],
	status: {
		type: String,
		enum: ['listed', 'delisted', 'draft'],
		required:[true, 'Please choose a Status for the Product'],
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

productSchema.pre('save', async function (next) {
	this.updatedAt = new Date()
})

module.exports = mongoose.model('Product', productSchema, 'products')
