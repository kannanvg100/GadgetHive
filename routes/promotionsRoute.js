const express = require('express')
const promotionsController = require('../controllers/promotionsController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')
const upload = require('../config/multer')

const router = express.Router()

// Routes accessible to admin users only
router.get('/banners', preventCache, auth.isAdminAuthorized, promotionsController.getBanners)        
router.get('/banners/add', preventCache, auth.isAdminAuthorized, promotionsController.getAddBannerForm)        
router.post('/banners/add', preventCache, auth.isAdminAuthorized, upload.array('images', 1), promotionsController.addBanner)
router.get('/banners/edit', preventCache, auth.isAdminAuthorized, promotionsController.getEditBannerForm)        
router.post('/banners/edit', preventCache, auth.isAdminAuthorized, upload.array('images', 1), promotionsController.editBanner)        
router.delete('/banners/delete', preventCache, auth.isAdminAuthorized, promotionsController.deleteBanner)        


router.get('/coupons', preventCache, auth.isAdminAuthorized, promotionsController.getCoupons) 
router.get('/coupons/add', preventCache, auth.isAdminAuthorized, promotionsController.getAddCouponForm)        
router.post('/coupons/add', preventCache, auth.isAdminAuthorized, promotionsController.addCoupon)
router.get('/coupons/edit', preventCache, auth.isAdminAuthorized, promotionsController.getEditCouponForm)        
router.post('/coupons/edit', preventCache, auth.isAdminAuthorized, promotionsController.editCoupon)        
router.delete('/coupons/delete', preventCache, auth.isAdminAuthorized, promotionsController.deleteCoupon)    





// End of admin routes

module.exports = router