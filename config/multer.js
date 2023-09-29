const multer = require('multer')

const storage = multer.memoryStorage()

const fileFilter = function (req, file, cb) {
	if (file.mimetype.startsWith('image/')) {
		cb(null, true)
	} else {
		cb(null, false)
	}
}

module.exports = multer({ storage, fileFilter })
