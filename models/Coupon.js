const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
	code: {
		type: String,
		required: [true, 'Please Enter the coupon code'],
		unique: true,
        uppercase: true
	},
	description: {
		type: String,
	},
    discount: {
        type: Number,
        required: [true, 'Please Enter the coupon discount'],
        min: 0,
        max: 100,
    },
    minAmount: {
        type: Number,
        required: [true, 'Please Enter the coupon min amount'],
        min: 0,
    },
    maxDiscount: {
        type: Number,
        required: [true, 'Please Enter the coupon max discount'],
        min: 0,
    },
    // displayOrder: {
	// 	type: Number,
	// 	required: [true, 'Please Enter Brand display order'],
    //     validate: {
    //         validator: function (value) {
    //             return typeof value === 'number';
    //         },
    //         message: 'Display order must be a number.',
    //     },
	// },
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

module.exports = mongoose.model('Coupon', couponSchema, 'coupons')
