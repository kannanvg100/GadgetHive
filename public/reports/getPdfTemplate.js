function generatePdfTemplate(props){
    const template = `
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
            .text-center {
                text-align: center;
            }

            .text-end {
                text-align: end;
            }

            .table-container {

                width: 80%;
                margin: 0 auto;
                margin-top: 1.5rem;
                border-radius: 5px;
            }

            table {
                caption-side: bottom;
                border-collapse: collapse;
                margin-bottom: 1rem;
                vertical-align: top;
                border-color: #dee2e6;
                border: 1px solid #ccc;
                border-bottom: 1px solid #444;
                width: 80%;
                margin: 0 auto;
                margin-top: 1.5rem;
                border-radius: 10px;
            }

            thead {
                border-color: inherit;
                border-style: solid;
                border-width: 0;
                vertical-align: bottom;
            }

            tr {
                font-size: 12px;
                border-color: inherit;
                border-style: solid;
                border-width: 0;
            }

            td {
                border-color: inherit;
                border-style: solid;
                border-width: 0;
                padding: .5rem .5rem;
                background-color: transparent;
                border-bottom-width: 1px;
                box-shadow: inset 0 0 0 9999px #fff;
                max-width: 100px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .d-flex-column {
                display: flex;
                flex-direction: column;
            }

            .fw-bold {
                font-weight: bold;
            }

            * {
                font-size: 14px;
                color: #444;
            }
        </style>
    </head>

    <body>
        <div>
            <div class="text-center">
                <h6>Sales reports</span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th scope="col">SL. No</th>
                        <th scope="col">Date</th>
                        <th scope="col">Order ID</th>
                        <th scope="col">User ID</th>
                        <th scope="col">Total Price</th>
                        <th scope="col">Discount</th>
                        <th scope="col">Final Price</th>
                        <th scope="col">Payment Mode</th>
                    </tr>
                </thead>
                <tbody>

                    ${props.orders
                        .map(
                            (order, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${order.createdAt.toISOString().split('T')[0]}</td>
                        <td>${order._id.toString().replace(/"/g, '')}</td>
                        <td>${order.user.email}</td>
                        <td>${order.totalAmount}</td>
                        <td>${order.discount}</td>
                        <td>${order.finalAmount}</td>
                        <td>${order.paymentMode}</td>
                    </tr>`
                        )
                        .join('')}

                    <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>
                            <div class="d-flex-column text-end">
                                <br>
                                <span>Net Total Price:</span>
                                <span>Net Discount:</span>
                                <span class="fw-bold">Net Final Price:</span>
                            </div>
                        </td>
                        <td class="">
                            <div class="d-flex-column">
                                <br>
                                <span>${props.netTotalAmount}</span>
                                <span>${props.netDiscount}</span>
                                <span class="fw-bold">${props.netFinalAmount}</span>
                            </div>
                        </td>
                    </tr>

                </tbody>
            </table>

        </div>
    </body>

    </html>`

    return template
}

module.exports =  generatePdfTemplate