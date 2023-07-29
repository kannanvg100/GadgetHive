const express = require('express')
const cartController = require('../controllers/cartController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')

const router = express.Router()

// Routes accessible to authenticated users only
router.post('/cart/add', preventCache, auth.isAuthenticatedUser, cartController.addToCart)                 
router.get('/cart', preventCache, auth.isAuthenticatedUser, cartController.getCart)                       
router.delete('/cart/delete', preventCache, auth.isAuthenticatedUser, cartController.deleteCartItem)       
router.patch('/cart/update-qty', preventCache, auth.isAuthenticatedUser, cartController.updateCartQuantity)
// End authenticated users routes


module.exports = router