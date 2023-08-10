const Banner = require('../models/Banner')
const Coupon = require('../models/Coupon')

module.exports = {
	getBanners: async (req, res, next) => {
		try {
			const banners = await Banner.find({})
			res.render('admin/banner-list', { banners })
		} catch (error) {
			next(error)
		}
	},

	getAddBannerForm: async (req, res, next) => {
		try {
            res.render('admin/add-edit-banner', { banner: null, editMode: false })
        } catch (error) {
            next(error)
        }
	},

	addBanner: async (req, res, next) => {
		try {
			const bannerData = JSON.parse(req.body.bannerData)
			const image = req.files[0].filename
			if (image == '') res.status(400).json({ success: false, message: 'Please select a Banner image' })
			bannerData.image = image

			await Banner.create(bannerData)
			return res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	getEditBannerForm: async (req, res, next) => {
		const bannerId = req.query.id
		try {
			const banner = await Banner.findById(bannerId)
			res.render('admin/add-edit-banner', { banner, editMode: true })
		} catch (error) {
			next(error)
		}
	},

	deleteBanner: async (req, res, next) => {
		try {
			const id = req.body.id
			await Banner.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	editBanner: async (req, res, next) => {
		const data = JSON.parse(req.body.bannerData)
		try {
			const banner = await Banner.findById(data.id)
			if (req.files.length > 0) {
				banner.image = req.files[0].filename
			}
			banner.title = data.title
			banner.link = data.link
			banner.isActive = data.isActive
			await banner.save()
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	getCoupons: async (req, res, next) => {
		try {
			const coupons = await Coupon.find({})
			res.render('admin/coupon-list', { coupons })
		} catch (error) {
			next(error)
		}
	},

	getAddCouponForm: async (req, res, next) => {
		try {
			res.render('admin/add-edit-coupon', { banner: null, editMode: false })
		} catch (error) {
			next(error)
		}
	},

	addCoupon: async (req, res, next) => {
		try {
			const couponData = req.body
			await Coupon.create(couponData)
			return res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	getEditCouponForm: async (req, res, next) => {
		const couponId = req.query.id
		try {
			const coupon = await Coupon.findById(couponId)
			res.render('admin/add-edit-coupon', { coupon, editMode: true })
		} catch (error) {
			next(error)
		}
	},

	deleteCoupon: async (req, res, next) => {
		try {
			const id = req.body.id
			await Coupon.findByIdAndDelete(id)
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},

	editCoupon: async (req, res, next) => {
		try {
			const data = req.body
			const coupon = await Coupon.findById(data.id)
			delete data.id
			Object.assign(coupon, data)
			await coupon.save()
			res.status(200).json({ success: true })
		} catch (error) {
			next(error)
		}
	},
}
