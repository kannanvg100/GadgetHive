const mongoose = require('mongoose')

module.exports = {
    init: () => {
		mongoose
			.connect(process.env.DATABASE_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			})
			.then(data => {
				console.log(`Mongodb connected with server: ${data.connection.host}`)
			})
			.catch(error => {
				console.error('Error connecting to MongoDB:', error)
			})
	},
}
