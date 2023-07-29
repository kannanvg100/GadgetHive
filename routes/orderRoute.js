const express = require('express')
const orderController = require('../controllers/orderController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')

const router = express.Router()

// Routes accessible to authenticated users only
router.get('/orders/cancel/', preventCache, auth.isAuthenticatedUser, orderController.cancelOrder)
router.get('/orders/return/', preventCache, auth.isAuthenticatedUser, orderController.returnOrder)
router.get('/orders/p/:page', preventCache, auth.isAuthenticatedUser, orderController.getAllOrders)
router.post('/orders/checkout', preventCache, auth.isAuthenticatedUser, orderController.checkOut)          
router.get('/orders/payment', preventCache, auth.isAuthenticatedUser, orderController.payment)          
router.post('/orders/check-payment', preventCache, auth.isAuthenticatedUser, orderController.checkPayment)          
router.get('/orders/:id', preventCache, auth.isAuthenticatedUser, orderController.getOrderById)
// End authenticated users routes


// Routes accessible to admin users only
router.get('/admin/orders/cancel/', preventCache, auth.isAdminAuthorized, orderController.cancelOrderAdmin)
router.get('/admin/orders/p/:page', preventCache, auth.isAdminAuthorized, orderController.getAllOrdersAdmin)
router.get('/admin/orders/', preventCache, auth.isAdminAuthorized, orderController.getOrderByIdAdmin)
router.get('/admin/orders/update-status', preventCache, auth.isAdminAuthorized, orderController.updateStatusAdmin)
// End of admin routes

module.exports = router
