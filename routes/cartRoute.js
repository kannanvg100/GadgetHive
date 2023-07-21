const express = require('express')
const cartController = require('../controllers/cartController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')

const router = express.Router()

// router.post('/cart/add', preventCache, auth.isAuthenticatedUser, cartController.addToCart)                  // authenticated
router.get('/cart', preventCache, auth.isAuthenticatedUser, cartController.getCart)                        // authenticated
// router.delete('/cart/delete', preventCache, auth.isAuthenticatedUser, cartController.deleteCartItem)        // authenticated
// router.post('/cart/checkout', preventCache, auth.isAuthenticatedUser, cartController.cartCheckOut)          // authenticated
// router.patch('/cart/update-qty', preventCache, auth.isAuthenticatedUser, cartController.updateCartQuantity) // authenticated

module.exports = router