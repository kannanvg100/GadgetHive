const express = require('express')
const categoryController = require('../controllers/categoryController')
const auth = require('../middlewares/auth')

const router = express.Router()

router.get('/categories', auth.isAdminAuthorized, categoryController.getCategories)             // admin
router.get('/category/add', auth.isAdminAuthorized, categoryController.getAddCategoryForm)      // admin
router.post('/category/add', auth.isAdminAuthorized, categoryController.addCategory)            // admin
router.get('/category/edit', auth.isAdminAuthorized, categoryController.getEditCategoryForm)    // admin
router.post('/category/edit', auth.isAdminAuthorized, categoryController.editCategory)          // admin
router.delete('/category/delete', auth.isAdminAuthorized, categoryController.deleteCategory)    // admin

module.exports = router