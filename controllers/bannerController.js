const Banner = require('../models/Banner')
const catchAsyncError = require('../middlewares/catchAsyncError')

module.exports = {
	getBanners: async (req, res) => {
		try {
			const banners = await Banner.find({})
			res.render('admin/banner-list', { banners})
		} catch (error) {
			console.error(error.message)
		}
	},

	getAddBannerForm: async (req, res) => {
		res.render('admin/add-edit-banner', { banner:null, editMode: false })
	},

	addBanner: catchAsyncError(async (req, res) => {
		const bannerData = JSON.parse(req.body.bannerData)
		const image = req.files[0].filename
		if (image == "") res.status(400).json({ success: false, message: 'Please select a Banner image' })
		bannerData.image = image

		await Banner.create(bannerData)
		return res.status(200).json({ success: true })
	}),

	getEditBannerForm: async (req, res) => {
		const bannerId = req.query.id
		try {
			const banner = await Banner.findById(bannerId)
			res.render('admin/add-edit-banner', { banner, editMode: true })
		} catch (error) {
			console.error(error.message)
		}
	},

	deleteBanner: catchAsyncError(async (req, res, next) => {
		const id = req.body.id
		await Banner.findByIdAndDelete(id)
		res.status(200).json({ success: true })
	}),

	editBanner: async (req, res) => {
		const data = JSON.parse(req.body.bannerData)
		try {
			const banner = await Banner.findById(data.id)
            console.log("📄 > file: bannerController.js:49 > editBanner: > req.files.:", req.files)
            if (req.files.length > 0) {
                banner.image = req.files[0].filename
            }
			banner.title = data.title
			banner.link = data.link
			banner.isActive = data.isActive
			await banner.save()
			res.status(200).json({ success: true })
		} catch (error) {
			console.error(error.message)
			res.status(500).json({ success: false, message: error.message })
		}
	},
}
