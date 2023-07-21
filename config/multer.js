const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
	destination: 'public/assets/',

	filename: function (req, file, callback) {
		const extension = path.extname(file.originalname)
		const uniqueSuffix = new Date().toISOString().replace(/[-:.]/g, '')
		callback(null, uniqueSuffix + '-' + Math.round(Math.random() * 1e9) + extension)
	},
})

const fileFilter = function (req, file, cb) {
	if (file.mimetype.startsWith('image/')) {
		cb(null, true)
	} else {
		cb(null, false);
	}
}

module.exports = multer({ storage, fileFilter })
