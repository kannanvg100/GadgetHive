const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			minLength: [3, 'Name should have atleast 3 Chars'],
			trim: true,
		},
		email: {
			type: String,
			required: [true, 'Please Enter Your Email address'],
			validate: [validator.isEmail, 'Please Enter a Valid Email'],
			unique: true,
			lowercase: true,
			trim: true,
		},
		phone: {
			type: Number,
			required: [true, 'Please Enter Your Mobile number'],
			minLength: [12, 'Mobile number should be 12 Digits'],
			unique: true,
			trim: true,
		},
		password: {
			type: String,
			required: [true, 'Please Enter Your Password'],
			minLength: [4, 'Password should have atleast 4 Chars'],
			select: false,
			trim: true,
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		address: [
			{
				name: {
					type: String,
					required: true,
				},
				streetName: {
					type: String,
					required: true,
				},
				town: {
					type: String,
					required: true,
				},
				pincode: {
					type: Number,
					required: true,
				},
				phone: {
					type: Number,
					required: true,
				},
			},
		],
	}
)

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next()
	}
	this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema, 'users')
