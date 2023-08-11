const express = require('express')
const userController = require('../controllers/userController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')

const router = express.Router()

//test route
router.get('/test/p/:page', userController.test)

// Routes accessible to all users
router.post('/instant-search', userController.instantSearch)
router.get('/', preventCache, userController.getHomePage)
router.get('/login', preventCache, userController.getLoginForm)
router.get('/home', preventCache, userController.goToHomePage)
router.get('/signup', preventCache, userController.getSignupForm)
router.post('/signup', preventCache, userController.registerUser)
router.post('/login', preventCache, userController.loginUser)
router.post('/otp-login', preventCache, userController.OtpLoginUser)
router.get('/register', preventCache, userController.registerUser)
router.post('/check-email', preventCache, userController.checkEmail)
router.post('/send-otp', preventCache, userController.sendOtp)
router.get('/logout', preventCache, userController.logoutUser)
router.post('/verify-otp', preventCache, userController.verifyUserOtp)
router.get('/get-user', preventCache, userController.getUser)
router.get('/reset', preventCache, userController.resetPasswordForm)
router.post('/reset', preventCache, userController.checkOtpAndResetPassword)

router.get('/admin',preventCache, userController.getAdminLoginForm)
router.get('/admin/login',preventCache, userController.getAdminLoginForm)
router.post('/admin/login',preventCache, userController.loginAdmin)
router.get('/admin/logout',preventCache, userController.logoutAdmin)
// End of public routes

// Routes accessible to authenticated users only
router.get('/account', preventCache, auth.isAuthenticatedUser, userController.account)
router.post('/addresses/add', preventCache, auth.isAuthenticatedUser, userController.addAddress)
router.post('/addresses/edit', preventCache, auth.isAuthenticatedUser, userController.editAddress)
router.post('/addresses/delete', preventCache, auth.isAuthenticatedUser, userController.deleteAddress)
router.get('/wishlist', preventCache, auth.isAuthenticatedUser, userController.wishlist)
router.get('/wishlist/update', preventCache, auth.isAuthenticatedUser, userController.updateWishlist)
router.get('/wishlist', preventCache, auth.isAuthenticatedUser, userController.wishlist)
router.get('/wallet', preventCache, auth.isAuthenticatedUser, userController.wallet)
// End authenticated users routes

// Routes accessible to admin users only
router.get('/admin/dashboard', preventCache, auth.isAdminAuthorized, userController.adminHome)
router.get('/users/p/:page', preventCache, auth.isAdminAuthorized, userController.getAllUsers)
router.get('/users/add', preventCache, auth.isAdminAuthorized, userController.getAddUserForm)
router.post('/users/add', preventCache, auth.isAdminAuthorized, userController.addUser)
router.get('/users/edit', preventCache, auth.isAdminAuthorized, userController.getEditUserForm)
router.post('/users/edit', preventCache, auth.isAdminAuthorized, userController.editUser)
router.delete('/users/delete', preventCache, auth.isAdminAuthorized, userController.deleteUser)
// End of admin routes

module.exports = router
