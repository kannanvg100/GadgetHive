module.exports = {
	count: function (data) {
		return data.length
	},
	sumAmount: function (items) {
		let sum = 0
		items.forEach((item) => {
			sum += item.price
		})
		return sum
	},
	sumOfPrices: function (items) {
		let sum = 0
		items.forEach((item) => {
			sum += item.amount
		})
		return sum
	},
	sumOfCounts: function (items) {
		let sum = 0
		items.forEach((item) => {
			sum += item.count
		})
		return sum
	},
	add: function (data, count) {
		return data + count
	},
	firstLetter: function (name) {
		return name[0].toUpperCase()
	},
	checkna: function (msg) {
		return msg === 'Not Found'
	},
	checkArrow: function (index) {
		return index != 0
	},
	getDiscountPercentage: function (price, mrp) {
		let discount = Math.trunc(((mrp - price) * 100) / mrp)
		return discount
	},
	formatPrice: function (price) {
		return '₹' + Number(price).toLocaleString('en-IN', { maximumFractionDigits: 2 })
	},
	getRandomNumber: function (n) {
		return Math.floor(Math.random(n) * 100)
	},
	getImageUrl: function (name) {
		return `/assets/${name}`
	},
	getFirstImageUrl: function (name) {
		return `/assets/${name[0]}`
	},
	isNull: function (data) {
		return data.length < 1
	},
	isNullString: function (data) {
		return data == ''
	},
	isActive: function (tab, currentTab) {
		return tab == currentTab
	},
	loop: function (n, options) {
		let result = ''
		for (let i = 1; i <= n; i++) {
			result += options.fn(i)
		}
		return result
	},
	capitalize: function (string) {
		if (string && typeof string === 'string') {
			return string.charAt(0).toUpperCase() + string.slice(1)
		}
		return ''
	},
	activeOrBlocked: function (status) {
		if (status) return 'Active'
		return 'Blocked'
	},
	hideDiv: function (status) {
		if (status) return 'invisible'
		return 'd-block'
	},
	isVisible: function (status) {
		if (status) return ''
		else return 'hidden'
	},
	size: function (item) {
		return item.length
	},
	getCount: function (arr, item) {
		for (let i = 0; i < arr.length; i++) {
			if (arr[i]._id.equals(item)) return arr[i].count
		}
		return 0
	},
	getDate: function (date) {
		const options = {
			month: 'short',
			day: 'numeric',
		}
		return date.toLocaleString(undefined, options)
	},
	getDateWithYear: function (date) {
		const options = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		}
		return date.toLocaleString(undefined, options)
	},
	getTime: function (date) {
		const options = {
			hour: 'numeric',
			minute: 'numeric',
			hour12: true,
		}
		return date.toLocaleString(undefined, options).toUpperCase()
	},
	getRandomRating: function () {
		return (Math.floor(Math.random() * 50) + 10) / 10
	},
	getStarColor: function (rating) {
		if (rating > 3.5) return 'green'
		else if (rating > 2.5) return 'orange'
		else return 'red'
	},
	product: function (n1, n2) {
		return n1 * n2
	},
	getFirstProductImgUrl: function (data) {
		return data.items[0].productId.images[0]
	},
	getFirstProductTitle: function (data) {
		let str = data.items[0].productId.title
		return str
	},
	getFirstProductTitleExt: function (data) {
		let str = ' '
		if (data.items.length == 2) str += 'and 1 other item'
		else if (data.items.length > 2) str += `and ${data.items.length - 1} other items`
		return str
	},
	json: function (data) {
		return JSON.stringify(data) || null
	},
	eq: function (status, check) {
		return status == check
	},
	array: function (...args) {
		return args
	},
	isIn: function (target, items) {
		return items.includes(target)
	},
	formatOrderStatus: function (status) {
		if (status == 'cancelled_by_user') return 'Order cancelled by you'
		else if (status === 'cancelled_by_admin') return 'Order cancelled by seller'
		else if (status === 'processing') return 'Your order is in processing by seller'
		else return status
	},
	replaceUnderscore: function (text) {
		return text == '' ? '' : text.replace(/_/g, ' ')
	},
	checkText: function (text, defaultText) {
		return text ? `${text}` : defaultText
	},
	avgOfPrices: function (items) {
		let sum = 0,
			count = 0
		items.forEach((item) => (sum += item.amount))
		items.forEach((item) => (count += item.count))
		return sum / count
	},
	getStatusCount: function (orders, status) {
		for (const order of orders) {
			if (order._id == status) return order.count
		}
		return 0
	},
}
