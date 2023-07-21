const express = require('express')
const productController = require('../controllers/productController')
const auth = require('../middlewares/auth')
const upload = require('../config/multer')

const router = express.Router()

router.get('/shop/:id', productController.getProductByID)
router.get('/shop/:category/p/:page', productController.getAllListedProducts)
router.get('/search/p/:page',productController.getAllfilteredProducts)

router.get('/products/:category/p/:page', auth.isAdminAuthorized, productController.getAllProducts)                 //admin
router.get('/products/add', auth.isAdminAuthorized, productController.getAddProductForm)                            //admin
router.get('/products/edit', auth.isAdminAuthorized, productController.getEditProductForm)                          //admin
router.post('/products/add', auth.isAdminAuthorized, upload.array('images', 10), productController.addProduct)      //admin
router.post('/products/edit', auth.isAdminAuthorized, upload.array('images', 10), productController.editProduct)    //admin
router.delete('/products/delete', auth.isAdminAuthorized, productController.deleteProduct)                          //admin
router.delete('/products/delete-image', auth.isAdminAuthorized, productController.deleteImage)                      //admin

module.exports = router
