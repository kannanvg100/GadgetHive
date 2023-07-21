const express = require('express')
const orderController = require('../controllers/orderController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')

const router = express.Router()

router.get('/instant', orderController.getPaymentPage)
router.post('/getOrderId', orderController.getOrderId)

router.get('/orders/cancel/', preventCache, auth.isAuthenticatedUser, orderController.cancelOrderUser) //authenticated
router.get('/orders/:id', preventCache, auth.isAuthenticatedUser, orderController.getOrderByIdUser) //authenticated
router.get('/orders/p/:page', preventCache, auth.isAuthenticatedUser, orderController.getAllOrdersUser) //authenticated

router.get('/admin/orders/cancel/', preventCache, auth.isAdminAuthorized, orderController.cancelOrderAdmin) //authenticated
router.get('/admin/orders/p/:page', auth.isAdminAuthorized, orderController.getAllUsersOrders) //admin
router.get('/admin/orders/', preventCache, auth.isAdminAuthorized, orderController.getUsersOrdersById) //admin


module.exports = router
