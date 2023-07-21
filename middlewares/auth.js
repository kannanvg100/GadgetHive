const User = require('../models/User')
module.exports = {
	isAuthenticatedUser: async (req, res, next) => {
		const isFetch = req.headers['x-requested-with'] === 'XMLHttpRequest'
		const retUrl = req.originalUrl
		if (req.session.user) {
			const user = await User.findById(req.seesion.user._id)
			console.log("📄 > file: auth.js:8 > isAuthenticatedUser: > user:", user)
			if (user.isActive) {
				next()
                return
			} else delete req.session.user
		}
		if (isFetch) res.status(401).json({ success: false, message: 'Pls login to continue ' })
		else res.redirect(`/login/?ret=${retUrl}`)
	},
	isAdminAuthorized: (req, res, next) => {
		if (req.session.admin && req.session.admin.isAdmin) next()
		else res.redirect('/admin')
	},
}
