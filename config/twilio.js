// require("dotenv").config()

const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

module.exports.sendOtp = async phone => {
	try {
		const verification = await client.verify.v2
			.services(process.env.TWILIO_VERIFY_SID)
			.verifications.create({ to: phone, channel: 'whatsapp' })
		return verification.status
	} catch (error) {
		throw new Error(error.message)
	}
}

module.exports.verifyOtp = async (phone, otpCode) => {
    try {
      const verification_check = await client.verify.v2.services(process.env.TWILIO_VERIFY_SID).verificationChecks.create({ to: phone, code: otpCode });
      return verification_check.status;
    } catch (error) {
      return error.status;
    }
  };