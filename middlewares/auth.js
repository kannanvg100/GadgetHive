const User = require('../models/User')
module.exports = {
	isAuthenticatedUser: async (req, res, next) => {
		const isFetch = req.headers['x-requested-with'] === 'XMLHttpRequest'
		const retUrl = req.originalUrl
		if (req.session.user) {
            try {
                const userId = req.session.user._id
				const user = await User.findById(userId)
				if (user.isActive) {
					next()
					return
				} else delete req.session.user
			} catch (error) {
				console.error(error)
			}
		}
		if (isFetch) res.status(401).json({ success: false, message: 'Pls login to continue ' })
		else res.redirect(`/login/?ret=${retUrl}`)
	},
	isAdminAuthorized: (req, res, next) => {
        const isFetch = req.headers['x-requested-with'] === 'XMLHttpRequest'
		const retUrl = req.originalUrl
		if (req.session.admin && req.session.admin.isAdmin) next()
		else {
            if (isFetch) res.status(401).json({ success: false, message: 'Pls login with your admin account to continue ' })
            else res.redirect(`/admin/login/?ret=${retUrl}`)
        }
	},
}
