const User = require('../models/User')
const Category = require('../models/Category')
const Brand = require('../models/Brand')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Banner = require('../models/Banner')
const Wallet = require('../models/Wallet')
const Wishlist = require('../models/Wishlist')
const Cart = require('../models/Cart')
const verificationHelpers = require('../config/nodemailer')

const RESULTS_PER_PAGE = 6

module.exports = {
	// Get Login Form
	getLoginForm: (req, res, next) => {
		try {
			if (req.session.user) res.redirect('/')
			else {
				const email = req.query?.email || ''
				res.render('user/login', { email, title: 'Login' })
			}
		} catch (error) {
			next(error)
		}
	},

	// Get Signup Form
	getSignupForm: (req, res, next) => {
		const refId = req.query.ref
		try {
			if (req.session.user) res.redirect('/')
			else {
				const { email } = req.query
				res.render('user/signup', { email, refId, title: 'Signup' })
			}
		} catch (error) {
			next(error)
		}
	},

	// Get Homepage
	getHomePage: async (req, res, next) => {
		try {
			const categories = await Category.aggregate([
				{ $match: { isDeleted: false } },
				{ $sort: { displayOrder: -1 } },
				{ $group: { _id: null, values: { $push: '$name' } } },
			])

			const brands = await Brand.find().sort({ displayOrder: -1 }).select('name image')
			const latestProducts = await Product.find().sort({ createdAt: -1 }).limit(5)
			const premiumProducts = await Product.find().sort({ price: -1 }).limit(5)
			const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 }).limit(5)
			res.render('user/home', {
				categories: categories[0].values,
				brands,
				banners,
				latestProducts,
				premiumProducts,
			})
		} catch (error) {
			next(error)
		}
	},

	// Redirect to Homepage
	goToHomePage: async (req, res) => {
		res.redirect('/')
	},

	// Verify User form
	registerUser: async (req, res) => {
		try {
			let { email, phone, password, refId } = req.body
			let result = {}
			if (!email) result.emailError = 'Email required'
			if (!phone) result.phoneError = 'Mobile number required'
			if (!password) result.passwordError = 'Password required'
			if (!email || !phone || !password) return res.render('user/signup', result, { title: 'Signup' })

			const user = await User.findOne({ email })
			if (user)
				return res.render('user/signup', { phone, emailError: 'Email already registered', title: 'Signup' })
			const mobile = await User.findOne({ phone: `91${phone}` })
			if (mobile)
				return res.render('user/signup', {
					email,
					phoneError: 'Mobile number already registered',
					title: 'Signup',
				})

			const otp = await verificationHelpers.sendOtp(email)

			req.session.guest = { email, phone, password, refId, otp }

			res.render('user/verify-otp', { email, title: 'Verify OTP' })
		} catch (error) {
			console.error(error)
			res.render('user/signup', {
				mobileNumberError: 'Something went wrong. Try again later',
				title: 'Signup',
			})
		}
	},

	// Register User
	verifyUserOtp: async (req, res, next) => {
		const { otp: enteredOtp } = req.body
		if (req.session.guest == null)
			return res.status(500).json({ success: false, message: 'Something went wrong. Try again later' })
		const { email, phone, password, otp } = req.session.guest
		try {
			if (otp === enteredOtp) {
				const user = await User.create({ email, phone: `91${phone}`, password })
				const refId = req.session.guest.refId
				if (refId) {
					const refWallet = await Wallet.findOne({ user: refId })
					if (refWallet) {
						refWallet.transactions.push({ amount: 1000, title: 'Referral Bonus' })
						refWallet.balance += 1000
						refWallet.save()
					} else {
						await Wallet.create({
							user: refId,
							balance: 1000,
							transactions: [{ amount: 1000, title: 'Referral Bonus' }],
						})
					}
					await Wallet.create({
						user: user._id,
						balance: 1000,
						transactions: [{ amount: 1000, title: 'Signup Bonus' }],
					})
				}
				req.session.guest = null
				res.status(200).json({ success: true, message: 'signup Successful', email })
			} else res.status(400).json({ success: false, message: 'OTP didnt match. Pls try again' })
		} catch (error) {
			next(error)
		}
	},

	// Login User
	loginUser: async (req, res, next) => {
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
		} catch (error) {
			next(error)
		}
	},

	// Check if email is already registered
	checkEmail: async (req, res, next) => {
		let { email } = req.body
		email = email.trim().toLowerCase()
		try {
			const user = await User.findOne({ email })
			if (user) res.json({ success: true })
			else res.json({ success: false })
		} catch (error) {
			next(error)
		}
	},

	// Send OTP to assosiated account with the mail
	sendOtp: async (req, res, next) => {
		const { email } = req.body
		try {
			const user = await User.findOne({ email }).select('phone')
			if (!user) {
				return res.status(404).json({ success: false, message: 'User not found' })
			}
			const otp = await verificationHelpers.sendOtp(email)
			req.session.guest = { email, phone: user.phone, otp }
			if (otp) {
				return res.status(200).json({ success: true, email, phoneDigits: user.phone.toString().slice(-4) })
			} else {
				return res.status(500).json({ success: false, message: 'Failed to send OTP' })
			}
		} catch (error) {
			next(error)
		}
	},

	// Send OTP to assosiated account with the mail
	resendOtp: async (req, res, next) => {
		try {
			let { email, phone, password, refId } = req.session.guest
			if (!email || !phone || !password) return res.json({ success: false, message: 'try signup again.' })

			const user = await User.findOne({ email })
			if (user) return res.json({ success: false, message: 'try signup again.' })
			const mobile = await User.findOne({ phone: `91${phone}` })
			if (mobile) return res.json({ success: false, message: 'try signup again.' })

			const otp = await verificationHelpers.sendOtp(email)

			req.session.guest = { email, phone, password, refId, otp }

			return res.json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	//Login to the account with OTP
	otpLoginUser: async (req, res, next) => {
		if (req.session.guest == null)
			return res.status(500).json({ success: false, message: 'Something went wrong. Try again later' })
		const { phone, email, otp } = req.session.guest
		const { password: enteredOtp } = req.body
		try {
			if (otp === enteredOtp) {
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
		} catch (error) {
			next(error)
		}
	},

	// Logout User
	logoutUser: async (req, res) => {
		delete req.session.user
		res.redirect('/')
	},

	// Login Status
	getUser: async (req, res, next) => {
		try {
			const user = req.session.user
			if (user) {
				let cart = await Cart.findOne({ user: user._id }).select('items').lean()
				if (!cart) cart = await Cart.create({ user: user._id })
				res.status(200).json({
					success: true,
					name: user.name,
					id: user._id,
					cartItemsCount: cart?.items?.length || 0,
				})
			} else res.status(401).json({ success: false })
		} catch (error) {
			next(error)
		}
	},

	//Admin login form
	getAdminLoginForm: async (req, res, next) => {
		try {
			if (req.session.admin) res.redirect('/admin/dashboard')
			else res.render('admin/login', { title: 'Admin Login' })
		} catch (error) {
			next(error)
		}
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
		} catch (error) {
			next(error)
		}
	},

	// Logout Admin
	logoutAdmin: async (req, res, next) => {
		try {
			delete req.session.admin
			res.redirect('/admin')
		} catch (error) {
			next(error)
		}
	},

	//Admin Dashboard
	adminHome: async (req, res, next) => {
		try {
			const orders = await Order.aggregate([
				{ $match: { orderStatus: 'delivered' } },
				{
					$group: {
						_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
						total: { $sum: '$finalAmount' },
						count: { $sum: 1 },
					},
				},
				{ $sort: { _id: 1 } },
			])

			const orderCounts = await Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }])

			const data = orders.map(({ _id, total, count }) => ({ date: _id, amount: total, count }))
			res.render('admin/dashboard', { data, orderCounts, title: 'Dashboard' })
		} catch (error) {
			next(error)
		}
	},

	// Get Add User Form
	getAddUserForm: async (req, res, next) => {
		try {
			res.render('admin/add-edit-user', { user: null, editMode: false, title: 'Add User' })
		} catch (error) {
			next(error)
		}
	},

	// Add User to Database
	addUser: async (req, res, next) => {
		let user = req.body
		try {
			await User.create({
				email: user.email,
				phone: user.phone,
				password: user.password,
				isActive: user.isActive,
			})
			res.redirect('/users/p/1')
		} catch (error) {
			next(error)
		}
	},

	// Get Edit User Form
	getEditUserForm: async (req, res, next) => {
		const id = req.query.id
		try {
			const user = await User.findById(id)
			user.password = ''
			res.render('admin/add-edit-user', { user: JSON.stringify(user), editMode: true, title: 'Edit User' })
		} catch (error) {
			next(error)
		}
	},

	// Update User
	editUser: async (req, res, next) => {
		const id = req.body.id
		let user = req.body
		try {
			const userData = await User.findById(id)
			userData.name = user.name
			userData.email = user.email
			userData.phone = user.phone
			userData.isActive = user.isActive

			await userData.save()

			return res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	// Get All Users
	getAllUsers: async (req, res, next) => {
		try {
			const { page } = req.params
			const documentCount = await User.countDocuments({})
			let users = await User.find({})
				.skip((page - 1) * RESULTS_PER_PAGE)
				.limit(RESULTS_PER_PAGE)
			const totalPages = Math.ceil(documentCount / RESULTS_PER_PAGE)

			for (let i = 0; i < users.length; i++) {
				const wallet = await Wallet.findOne({ user: users[i]._id }).select('balance')
				users[i].balance = wallet?.balance ?? 0
				users[i].orderCount = await Order.countDocuments({ user: users[i]._id })
			}

			res.render('admin/users-list', {
				users,
				page,
				totalPages,
				title: 'Users',
			})
		} catch (error) {
			next(error)
		}
	},

	// Delete User
	deleteUser: async (req, res, next) => {
		const { id } = req.body
		try {
			await User.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	// Instant Search
	instantSearch: async (req, res, next) => {
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
			next(error)
		}
	},

	// Get Account Page
	account: async (req, res, next) => {
		const userId = req.session.user._id
		const user = await User.findById(userId).select('address')
		try {
			res.render('user/account', { address: user.address, title: 'Account' })
		} catch (error) {
			next(error)
		}
	},

	// Get address to database
	addAddress: async (req, res, next) => {
		try {
			const userId = req.session.user._id
			const user = await User.findById(userId)
			user.address.push(req.body)
			await user.save()
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	// Edit Address
	editAddress: async (req, res, next) => {
		try {
			const userId = req.session.user._id
			const addressId = req.body.id
			const user = await User.findById(userId)
			const address = user.address.id(addressId)
			address.set(req.body)
			await user.save()
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	// Delete Address
	deleteAddress: async (req, res, next) => {
		try {
			const userId = req.session.user._id
			const addressId = req.body.id
			const user = await User.findById(userId)
			user.address.pull(addressId)
			await user.save()
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	// Get Wishlist
	wishlist: async (req, res, next) => {
		const user = req.session.user
		const wishlist = await Wishlist.findOne({ user: user._id }).populate('items.product')
		try {
			if (wishlist == null) res.render('user/wishlist', { wishlist: [], title: 'Wishlist' })
			else res.render('user/wishlist', { wishlist: wishlist.items, title: 'Wishlist' })
		} catch (error) {
			next(error)
		}
	},

	// Update Wishlist
	updateWishlist: async (req, res, next) => {
		try {
			const user = req.session.user
			const productId = req.query.id
			const wishlist = await Wishlist.findOne({ user: user._id })
			if (wishlist == null) await Wishlist.create({ user: user._id, items: [{ product: productId }] })
			else {
				if (wishlist.items.some((item) => item.product == productId)) {
					wishlist.items.pull({ product: productId })
				} else {
					wishlist.items.push({ product: productId })
				}
				await wishlist.save()
			}
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	// Get Wallet
	wallet: async (req, res, next) => {
		const userId = req.session.user._id
		try {
			let wallet
			wallet = await Wallet.findOne({ user: userId })
			if (wallet == null) wallet = await Wallet.create({ user: userId, balance: 0 })
			res.render('user/wallet', {
				balance: wallet.balance,
				transactions: wallet.transactions.reverse(),
				title: 'Wallet',
			})
		} catch (error) {
			next(error)
		}
	},

	// Get reset password form
	resetPasswordForm: async (req, res, next) => {
		const { email } = req.query
		try {
			res.render('user/reset-password', { email, title: 'Reset Password' })
		} catch (error) {
			next(error)
		}
	},

	// Check OTP and Reset Password
	checkOtpAndResetPassword: async (req, res, next) => {
		let { email, otp: enteredOtp, password } = req.body

		try {
			let result = {}
			if (!email) result.emailError = 'Email required'
			if (!enteredOtp) result.otpError = 'Mobile number required'
			if (!password) result.passwordError = 'Password required'
			if (!email || !enteredOtp || !password) return res.render('user/reset-password', result)

			const user = await User.findOne({ email }).select('phone')
			const { otp } = req.session.guest

			if (otp === enteredOtp) {
				user.password = password
				await user.save()
				res.redirect(`/login/?email=${email}`)
			} else {
				res.render('user/reset-password', {
					email,
					otpError: 'OTP didnt match. Pls try again',
					title: 'Reset Password',
				})
			}
		} catch (error) {
			next(error)
		}
	},
}
