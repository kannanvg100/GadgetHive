const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
        lowercase: [true, 'Please Enter the brand name'],
	},
    displayName: {
		type: String,
		required: [true, 'Please Enter Brand display Name'],
	},
	description: {
		type: String,
	},
    displayOrder: {
		type: Number,
		required: [true, 'Please Enter Brand display order'],
        validate: {
            validator: function (value) {
                return typeof value === 'number';
            },
            message: 'Display order must be a number.',
        },
	},
    image: {
		type: String,
		required: [true, 'Please Choose a Brand image'],
	},
    isDeleted: {
        type: Boolean,
        default: false,
    },
	createdAt: {
		type: Date,
        immutable: true,
		default: Date.now,
	},
})

module.exports = mongoose.model('Brand', brandSchema, 'brands')
