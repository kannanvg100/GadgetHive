const os = require('os');
/* eslint-disable no-undef */
require('dotenv').config()

// initialing MongoDB
const db = require('./config/db')
db.init()

// const razorpay = require('./config/razorpay');

const app = require('./app')

//Handling Uncaught Exception
process.on('uncaughtException', err => {
    console.log(`Error:${err}`)
	console.log(`Shutting down the server due to Uncaught Exception `)
	process.exit(1)
})

const server = app.listen(process.env.PORT, () => {
	const address = server.address();
    const ipAddress = getIpAddress();
    console.log(`Server is running at http://${ipAddress}:${address.port}`);
})

function getIpAddress() {
    const ifaces = os.networkInterfaces();
    for (const iface in ifaces) {
        for (const entry of ifaces[iface]) {
            if (entry.family === 'IPv4' && !entry.internal) {
                return entry.address;
            }
        }
    }
    return '127.0.0.1';
}

//Unhandled Promise Rejection
process.on('unhandledRejection', err => {
	console.log(`Error:${err}`)
	console.log(`Shutting down the server due to Unhandled Promise Rejection`)
	server.close(() => {
		process.exit(1)
	})
})

