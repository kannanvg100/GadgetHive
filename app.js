const express = require('express')
const cookieParser = require('cookie-parser')
const path = require('path')
const logger = require('morgan')
const session = require('express-session')
const exphbs = require('express-handlebars')

const hbs = exphbs.create({
	extname: '.hbs',
	defaultLayout: 'layout',
	layoutsDir: path.join(__dirname, 'views'),
	partialsDir: path.join(__dirname, 'views/partials'),
	helpers: require('./helpers/handlebarHelpers'),
	runtimeOptions: { allowProtoPropertiesByDefault: true, allowedProtoMethodsByDefault: true },
})

const app = express()

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

//Route Imports
const product = require('./routes/productRoute')
const user = require('./routes/userRoute')
const cart = require('./routes/cartRoute')
const order = require('./routes/orderRoute')
const category = require('./routes/categoryRoute')

app.use(
	session({
		secret: 'NCDIDMDICMSC',
		resave: true,
		saveUninitialized: true,
	})
)

app.use((req, res, next) => {
	res.setHeader('Cache-Control', 'no-store, no-cache')
	next()
})

app.use('/', user)
app.use('/', product)
app.use('/', cart)
app.use('/', order)
app.use('/', category)

app.use(function (req, res, next) {
	res.status(404).render('error-404')
})

module.exports = app
