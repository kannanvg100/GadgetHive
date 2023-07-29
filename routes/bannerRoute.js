const express = require('express')
const bannerController = require('../controllers/bannerController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')
const upload = require('../config/multer')

const router = express.Router()

// Routes accessible to admin users only
router.get('/banners', preventCache, auth.isAdminAuthorized, bannerController.getBanners)        
router.get('/banners/add', preventCache, auth.isAdminAuthorized, bannerController.getAddBannerForm)        
router.post('/banners/add', preventCache, auth.isAdminAuthorized, upload.array('images', 1), bannerController.addBanner)
router.get('/banners/edit', preventCache, auth.isAdminAuthorized, bannerController.getEditBannerForm)        
router.post('/banners/edit', preventCache, auth.isAdminAuthorized, upload.array('images', 1), bannerController.editBanner)        
router.delete('/banners/delete', preventCache, auth.isAdminAuthorized, bannerController.deleteBanner)        
// End of admin routes

module.exports = router