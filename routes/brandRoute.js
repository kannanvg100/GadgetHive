const express = require('express')
const brandController = require('../controllers/brandController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')
const upload = require('../config/multer')

const router = express.Router()

// Routes accessible to admin users only
router.get('/brands',preventCache, auth.isAdminAuthorized, brandController.getBrands)         
router.get('/brand/add',preventCache, auth.isAdminAuthorized, brandController.getAddBrandForm)  
router.post('/brands/add',preventCache, auth.isAdminAuthorized, upload.single('image'), brandController.addBrand)
router.get('/brand/edit',preventCache, auth.isAdminAuthorized, brandController.getEditBrandForm)
router.post('/brands/edit',preventCache, auth.isAdminAuthorized, upload.single('image'), brandController.editBrand)
router.delete('/brand/delete',preventCache, auth.isAdminAuthorized, brandController.deleteBrand)
// End of admin routes

module.exports = router