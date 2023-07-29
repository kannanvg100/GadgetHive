const User = require('../models/User')
const Category = require('../models/Category')
const Brand = require('../models/Brand')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Banner = require('../models/Banner')
const Wallet = require('../models/Wallet')
const verificationHelpers = require('../config/twilio')
const { HostedNumberOrderListInstance } = require('twilio/lib/rest/preview/hosted_numbers/hostedNumberOrder')

const RESULTS_PER_PAGE = 6

module.exports = {
	getLoginForm: (req, res) => {
		if (req.session.user) res.redirect('/home')
		else {
			const email = req.query.email ?? 'kannanvg007@gmail.com'
			res.render('user/login', { email })
		}
	},

	getSignupForm: (req, res) => {
		if (req.session.user) res.redirect('/home')
		else {
			const { email } = req.query
			res.render('user/signup', { email })
		}
	},

	getHomePage: async (req, res) => {
		const categories = await Category.aggregate([
			{ $match: { isDeleted: false } },
			{ $sort: { displayOrder: -1 } },
			{ $group: { _id: null, values: { $push: '$name' } } },
		])

        //get brand names in the order of display order
        const brands = await Brand.find().sort({displayOrder: -1}).select('name image')


		// const brands = await Brand.aggregate([{ $group: { _id: null, values: { $push: '$name' } } }])
		const latestProducts = await Product.find().sort({ createdAt: -1 }).limit(5)
		const banners = await Banner.find({isActive: true}).limit(5)
		res.render('user/home', { categories: categories[0].values, banners, latestProducts })
	},

    goToHomePage: async (req, res) => {
        res.redirect('/')
    },

	// Register User
	registerUser: async (req, res) => {
		let { email, phone, password } = req.body

		let result = {}
		if (!email) result.emailError = 'Email required'
		if (!phone) result.phoneError = 'Mobile number required'
		if (!password) result.passwordError = 'Password required'
		if (!email || !phone || !password) return res.render('user/signup', result)

		try {
			const user = await User.findOne({ email })
			if (user) return res.render('user/signup', { phone, emailError: 'Email already registered' })
			const mobile = await User.findOne({ phone: `91${phone}` })
			if (mobile) return res.render('user/signup', { email, phoneError: 'Mobile number already registered' })

			req.session.guest = { email, phone, password }

			await verificationHelpers.sendOtp(`+91${phone}`)
			res.render('user/verify-otp', { phone })
		} catch (error) {
			console.error(error.message)
			res.render('user/signup', {
				mobileNumberError: 'Something went wrong. Try again later',
			})
		}
	},

	// Register User
	verifyUserOtp: async (req, res) => {
		const { otp } = req.body
		if (req.session.guest == null)
			return res.status(500).json({ success: false, message: 'Something went wrong. Try again later' })
		const { email, phone, password } = req.session.guest
		try {
			const status = await verificationHelpers.verifyOtp(`+91${phone}`, otp)
			if (status === 'approved') {
				await User.create({ email, phone: `91${phone}`, password })
				req.session.guest = null
				res.status(200).json({ success: true, message: 'signup Successful', email })
			} else res.status(400).json({ success: false, message: 'OTP didnt match. Pls try again' })
		} catch (e) {
			console.error(e.message)
			res.status(500).json({ success: false, message: 'Something went wrong. Try again later' })
		}
	},

	// Login User
	loginUser: async (req, res) => {
		const { email, password } = req.body

		if (!email || !password) {
			return res.status(400).json({ success: false, message: 'Email and Password required' })
		}

		try {
			const user = await User.findOne({ email }).select('+password')
			if (!user) {
				return res.status(401).json({ success: false, message: 'Invalid Email or Password' })
			}

			const status = await user.comparePassword(password)
			if (!status) {
				return res.status(401).json({ success: false, message: 'Invalid Email or Password' })
			}

			if (!user.isActive) {
				return res.status(401).json({ success: false, message: 'Account Blocked' })
			}

			req.session.user = user
			return res.json({ success: true })
		} catch (e) {
			console.error(e)
			return res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},

	checkEmail: async (req, res) => {
		let { email } = req.body
		email = email.trim().toLowerCase()
		try {
			const user = await User.findOne({ email })
			if (user) res.json({ success: true })
			else res.json({ success: false })
		} catch (error) {
			res.json({ success: true })
		}
	},

	// Send OTP to assosiated account with the mail
	sendOtp: async (req, res) => {
		const { email } = req.body
		try {
			const user = await User.findOne({ email }).select('phone')
			if (!user) {
				return res.status(404).json({ success: false, message: 'User not found' })
			}
			req.session.guest = { email, phone: user.phone }
			const status = await verificationHelpers.sendOtp(`+${user.phone}`)
			if (status === 'pending') {
				return res.status(200).json({ success: true, message: 'OTP sent' })
			} else {
				return res.status(500).json({ success: false, message: 'Failed to send OTP' })
			}
		} catch (e) {
			console.error(e.message)
			return res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},

	//Login to the account with OTP
	OtpLoginUser: async (req, res) => {
		if (req.session.guest == null)
			return res.status(500).json({ success: false, message: 'Something went wrong. Try again later' })
		const { phone, email } = req.session.guest
		const { password: otp } = req.body
		try {
			const status = await verificationHelpers.verifyOtp(`+${phone}`, otp)
			if (status === 'approved') {
				const user = await User.findOne({ email, phone })
				if (user.isActive) {
					req.session.user = user
					res.status(200).json({ success: true, message: 'Login successful' })
				} else {
					res.status(403).json({ success: false, message: 'Account blocked' })
				}
			} else {
				res.status(500).json({ success: false, message: 'OTP didnt match, Pls try again' })
				console.error('Error:' + status)
			}
		} catch (e) {
			console.error(e.message)
			res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},

	// Logout User
	logoutUser: async (req, res, next) => {
		delete req.session.user
		res.redirect('/home')
	},

	// Login Status
	getUser: async (req, res, next) => {
		const user = req.session.user
		if (user) res.status(200).json({ success: true, name: user.name })
		else res.status(401).json({ success: false })
	},

	//Admin login form
	getAdminLoginForm: async (req, res, next) => {
		if (req.session.admin) res.redirect('/admin/dashboard')
		else res.render('admin/login')
	},

	//Admin login
	loginAdmin: async (req, res, next) => {
		const { email, password } = req.body
		if (!email || !password) {
			return res.status(400).json({ success: false, message: 'Email and Password required' })
		}

		try {
			const user = await User.findOne({ email, isAdmin: true }).select('+password')
			if (!user) {
				return res.status(401).json({ success: false, message: 'Incorrect Email or Password' })
			}

			const status = await user.comparePassword(password)
			if (!status) {
				return res.status(401).json({ success: false, message: 'Incorrect Email or Password' })
			}

			req.session.admin = user
			return res.json({ success: true })
		} catch (e) {
			console.error(e)
			return res.status(500).json({ success: false, message: 'Something went wrong' })
		}
	},

	// Logout Admin
	logoutAdmin: async (req, res, next) => {
		try {
			delete req.session.admin
			res.redirect('/admin')
		} catch (error) {
			console.error(error)
		}
	},

	//Admin Dashboard
	adminHome: async (req, res, next) => {
		// const orders = await Order.aggregate([{$group: {_id: "$createdAt", total: {$sum: "$totalAmount"}}}])
		const orders = await Order.aggregate([
			{ $match: { orderStatus: 'delivered' } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
					total: { $sum: '$totalAmount' },
                    count: { $sum : 1 }
				},
			},
            {$sort: {_id: 1}}
		])

		const data = orders.map(({ _id, total, count }) => ({ date: _id, amount: total, count}))
		res.render('admin/dashboard', { data })
	},

	getAddUserForm: async (req, res, next) => {
		res.render('admin/add-edit-user', { user: null })
	},

	addUser: async (req, res, next) => {
		let user = req.body
		try {
			await User.create({
				email: user.email,
				phone: user.phone,
				password: user.password,
				isActive: user.isActive,
			})
		} catch (error) {
			console.error(error.message)
		}
		res.redirect('/users/p/1')
	},

	getEditUserForm: async (req, res, next) => {
		const id = req.query.id
		try {
			const user = await User.findById(id)
			user.password = ''
			res.render('admin/add-edit-user', { user: JSON.stringify(user), editMode: true })
		} catch (error) {
			console.error(error.message)
		}
	},

	// Update User Profile -- Admin
	editUser: async (req, res, next) => {
		const id = req.body.id
		let user = req.body
		try {
			const userData = await User.findById(id)
			userData.name = user.name
			userData.email = user.email
			userData.phone = user.phone``
			userData.isActive = user.isActive

			await userData.save()

			return res.json({ success: true })
		} catch (error) {
			console.error(error.message)
			return res.json({ success: failed })
		}
	},

	getAllUsers: async (req, res) => {
		const { page } = req.params
		const documentCount = await User.countDocuments({})
		let users = await User.find({})
			.skip((page - 1) * RESULTS_PER_PAGE)
			.limit(RESULTS_PER_PAGE)
		const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)
		res.render('admin/users-list', {
			users,
			page,
			totalPages,
		})
	},

	deleteUser: async (req, res) => {
		const { id } = req.body
		try {
			await User.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			console.error(error.message)
			res.status(500).json({ success: false, message: 'User deleting failed' })
		}
	},

	instantSearch: async (req, res) => {
		const query = req.body.query
		const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		try {
			const results = await Product.find(
				{
					$or: [{ $text: { $search: query } }, { title: { $regex: new RegExp(escapedQuery, 'i') } }],
				},
				{ title: 1 }
			).limit(5)
			res.json({ results })
		} catch (error) {
			console.error('Error:', error.message)
		}
	},

	account: async (req, res) => {
		const user = req.session.user
		try {
			res.render('user/account', { user })
		} catch (error) {
			console.error('Error:', error.message)
		}
	},

	address: async (req, res) => {
		const user = req.session.user
		try {
			res.render('user/address', { user })
		} catch (error) {
			console.error('Error:', error.message)
		}
	},

	wishlist: async (req, res) => {
		const user = req.session.user
		try {
			res.render('user/wishlist', { user })
		} catch (error) {
			console.error('Error:', error.message)
		}
	},

	wallet: async (req, res) => {
		const userId = req.session.user._id
		try {
			let wallet
			wallet = await Wallet.findOne({ user: userId })
			if (wallet == null) wallet = await Wallet.create({ user: userId, balance: 0 })
			res.render('user/wallet', { balance: wallet.balance, transactions: wallet.transactions.reverse() })
		} catch (error) {
			console.error('Error:', error.message)
		}
	},
}
