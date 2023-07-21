const express = require('express')
const userController = require('../controllers/userController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')

const router = express.Router()

router.post('/instant-search', userController.instantSearch)

router.get('/', preventCache, userController.getHomePage)
router.get('/login', preventCache, userController.getLoginForm)
router.get('/home', preventCache, userController.getHomePage)
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

router.get('/admin', userController.getAdminLoginForm)
router.get('/admin/login', userController.getAdminLoginForm)
router.post('/admin/login', userController.loginAdmin)
router.get('/admin/logout', userController.logoutAdmin)

router.get('/admin/dashboard', auth.isAdminAuthorized, userController.adminHome)        // admin
router.get('/users/p/:page', auth.isAdminAuthorized, userController.getAllUsers)        // admin
router.get('/users/add', auth.isAdminAuthorized, userController.getAddUserForm)         // admin
router.post('/users/add', auth.isAdminAuthorized, userController.addUser)               // admin
router.get('/users/edit', auth.isAdminAuthorized, userController.getEditUserForm)       // admin

router.post('/users/edit', auth.isAdminAuthorized, userController.editUser)             // admin
router.delete('/users/delete', auth.isAdminAuthorized, userController.deleteUser)       // admin

module.exports = router
