const nodemailer = require('nodemailer')

const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString()
}

let config = {
	service: 'gmail',
	auth: {
		user: process.env.GMAIL_USERNAME,
		pass: process.env.GMAIL_PASSWORD,
	},
}

let transporter = nodemailer.createTransport(config)

module.exports.sendOtp = async (email) => {
	try {
		const otp = generateOTP()
		let message = {
			from: process.env.GMAIL_USERNAME,
			to: email,
			subject: `GadgetHive verification code: ${otp}`,
			text: `Your GadgetHive verification code: ${otp}`,
		}

		await transporter.sendMail(message)
		return otp
	} catch (error) {
		throw new Error(error.message)
	}
}
