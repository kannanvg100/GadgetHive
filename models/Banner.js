const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
    title: {
		type: String,
        required: [true, 'Title is required']
	},
	image: {
		type: String,
        required: [true, 'Image is required']
	},
	link: {
		type: String,
        required: [true, 'Link is required']
	},
	isActive: {
		type: Boolean,
        default: [true, 'Status is required']
	},
    createdAt: {
		type: Date,
        immutable: true,
		default: Date.now,
	},
})

module.exports = mongoose.model('Banner', bannerSchema, 'banners')