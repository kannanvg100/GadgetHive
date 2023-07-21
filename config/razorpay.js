const Razorpay = require('razorpay')

let razorpayInstance = null

function createRazorpayInstance() {
	if (!razorpayInstance) {
		razorpayInstance = new Razorpay({
			key_id: process.env.RAZORPAY_KEY_ID,
			key_secret: process.env.RAZORPAY_KEY_SECRET,
		})
	}
	return razorpayInstance
}

module.exports = createRazorpayInstance()
