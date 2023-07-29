require('dotenv').config()

const db = require('./config/db')
db.init()

// initialing MongoDB
const razorpay = require('./config/razorpay');

const app = require('./app')

//Handling Uncaught Exception
process.on('uncaughtException', err => {
    console.log(`Error:${err.message}`)
	console.log(`Shutting down the server due to Uncaught Exception `)
	process.exit(1)
})

const server = app.listen(process.env.PORT, () => {
	console.log(`Server running on http://localhost:${process.env.PORT}`)
})

//Unhandled Promise Rejection
process.on('unhandledRejection', err => {
	console.log(`Error:${err.message}`)
	console.log(`Shutting down the server due to Unhandled Promise Rejection`)
	server.close(() => {
		process.exit(1)
	})
})
