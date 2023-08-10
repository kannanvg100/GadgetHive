const express = require('express')
const productController = require('../controllers/productController')
const auth = require('../middlewares/auth')
const upload = require('../config/multer')
const { preventCache } = require('../middlewares/preventCache')

const router = express.Router()

// Routes accessible to all users
router.get('/shop/:id', productController.getProductByID)
router.get('/shop/:category/p/:page', productController.getAllListedProducts)
router.get('/search/p/:page',productController.getAllfilteredProducts)
// End of public routes


// Routes accessible to admin users only
router.get('/products/:category/p/:page/',preventCache, auth.isAdminAuthorized, productController.getAllProducts)              
router.get('/products/add', preventCache, auth.isAdminAuthorized, productController.getAddProductForm)                         
router.get('/products/edit', preventCache, auth.isAdminAuthorized, productController.getEditProductForm)                       
router.post('/products/add', preventCache, auth.isAdminAuthorized, upload.array('images', 10), productController.addProduct)   
router.post('/products/edit', preventCache, auth.isAdminAuthorized, upload.array('images', 10), productController.editProduct) 
router.delete('/products/delete', preventCache, auth.isAdminAuthorized, productController.deleteProduct)                       
router.delete('/products/delete-image', preventCache, auth.isAdminAuthorized, productController.deleteImage)                   
// End of admin routes

module.exports = router
