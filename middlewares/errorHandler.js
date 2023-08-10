/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, next) => {
	let statusCode = err.statusCode || 500
	let message = err.message || 'Internal Server Error'

	// Mongoose Duplicate Key Error
	if (err.code === 11000) {
		statusCode = 409
		message = `${Object.keys(err.keyValue)} should be unique`
	}

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		statusCode = 400
        message = Object.values(err.errors).map(value => value.message);
	}

    console.error(statusCode + ': ' + message)

	const isFetch = req.headers['x-requested-with'] === 'XMLHttpRequest'
	if (isFetch)
		res.status(statusCode).json({
			success: false,
			message: message,
		})
	else res.status(statusCode).render('error-404')
}

module.exports = errorHandler
