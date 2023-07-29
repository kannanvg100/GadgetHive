const express = require('express')
const categoryController = require('../controllers/categoryController')
const auth = require('../middlewares/auth')
const { preventCache } = require('../middlewares/preventCache')

const router = express.Router()

// Routes accessible to admin users only
router.get('/categories',preventCache, auth.isAdminAuthorized, categoryController.getCategories)         
router.get('/category/add',preventCache, auth.isAdminAuthorized, categoryController.getAddCategoryForm)  
router.post('/category/add',preventCache, auth.isAdminAuthorized, categoryController.addCategory)        
router.get('/category/edit',preventCache, auth.isAdminAuthorized, categoryController.getEditCategoryForm)
router.post('/category/edit',preventCache, auth.isAdminAuthorized, categoryController.editCategory)      
router.delete('/category/delete',preventCache, auth.isAdminAuthorized, categoryController.deleteCategory)
// End of admin routes

module.exports = router