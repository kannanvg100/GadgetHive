const express = require('express')
const cookieParser = require('cookie-parser')
const path = require('path')
const morgan = require('morgan')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const exphbs = require('express-handlebars')
const errorHandler = require('./middlewares/errorHandler');
const cron = require('node-cron')
const orderServices = require('./services/orderServices')

const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: 'layout',
    // eslint-disable-next-line no-undef
    layoutsDir: path.join(__dirname, 'views'),
    // eslint-disable-next-line no-undef
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: require('./helpers/handlebarHelpers'),
    runtimeOptions: { allowProtoPropertiesByDefault: true, allowedProtoMethodsByDefault: true },
})

const app = express()

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')

app.use(
    morgan((tokens, req, res) => {
        const status = tokens.status(req, res)
        const statusColor = Number(status) >= 400 ? '\x1b[31m' : '\x1b[32m'
        if (Number(status) !== 304) {
            return `${statusColor}${tokens.method(req, res)} ${tokens.url(req, res)} - ${tokens.status(
                req,
                res
            )} ${tokens.res(req, res, 'content-length')} - ${tokens['response-time'](req, res)} ms\x1b[0m`
        }
        return null
    })
)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, 'public')))

//Route Imports
const product = require('./routes/productRoute')
const user = require('./routes/userRoute')
const cart = require('./routes/cartRoute')
const order = require('./routes/orderRoute')
const category = require('./routes/categoryRoute')
const promotions = require('./routes/promotionsRoute')
const brand = require('./routes/brandRoute')

app.use(session({
    secret: process.env.SESSION_KEY,
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE_URI,
        touchAfter: 24 * 3600
    })
}));

app.use('/', user)
app.use('/', product)
app.use('/', cart)
app.use('/', order)
app.use('/', category)
app.use('/', promotions)
app.use('/', brand)

// Middleware For Error Handling
app.use(errorHandler)

// Schedule to run every 5 minutes to reset stock
cron.schedule('*/5 * * * *', () => {
    orderServices.processPendingOrders()
})

app.use(function (req, res) {
    res.status(404).render('error-404')
})

module.exports = app
