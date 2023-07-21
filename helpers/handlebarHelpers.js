module.exports = {
	count: function (data) {
		return data.length
	},
	sumAmount: function (items) {
		let sum = 0
		items.forEach((item) => {
			sum += item.product.price
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
		return '₹' + Number(price).toLocaleString()
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
		return data == ""
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
	getFirstItem: function (item) {
		return item[0]
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
		return date.toLocaleString()
	},
	getTime: function (date) {
		return date.toLocaleTimeString()
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
		return data.items[0].product._id.images[0]
	},
	getFirstProductTitle: function (data) {
		let str = data.items[0].product._id.title
		return str
	},
	getFirstProductTitleExt: function (data) {
		let str = ' '
		if (data.items.length == 2) str += 'and 1 other item'
		else if (data.items.length > 2) str += `and ${data.items.length - 1} other items`
		return str
	},
	json: function (data) {
		return JSON.stringify(data)
	},
	eq: function (status, check) {
		return status == check
	},
	formatOrderStatus: function (status) {
		console.log('📄 > file: handlebarHelpers.js:114 > status:', status)
		if (status == 'cancelled_by_user') return 'Order cancelled by you'
		else if (status === 'cancelled_by_admin') return 'Order cancelled by seller'
		else if (status === 'processing') return 'Your order is in processing by seller'
	},
	replaceUnderscore: function (text) {
		return text.replace(/_/g, ' ')
	},
}
