const Product = require('../models/product');
const Order = require('../models/order')
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const utilPath = require('../util/path');
const PDFDocument = require('pdfkit');
// const session = require('express-session');
// const Cart = require('../models/cart');
exports.getProducts = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render("shop/product-list", {
                prods: products,
                pageTitle: 'Products',
                path: '/products',

            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500
            return next(error);
        });


}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            console.log(product);
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products',

            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500
            return next(error);
        });
};

exports.getIndex = (req, res, next) => {

    Product.find()
        .then(products => {
            res.render("shop/index", {
                prods: products,
                pageTitle: 'My Shop',
                path: '/',

            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500
            return next(error);
        });
}

exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    req.user.addToCart(productId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500
            return next(error);
        });

}
exports.postCartProductDelete = (req, res, next) => {
    const productId = req.body.productId;
    req.user.removeFromCart(productId)
        .then(() => {
            res.redirect('/cart');
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500
            return next(error);
        });

}
exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            // console.log(products);
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'My Cart',
                products: products,

            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500
            return next(error);
        });


}
exports.getOrders = (req, res, next) => {

    Order.find({
            'user.userId': req.user._id
        })
        .then(orders => {

            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'My Orders',
                orders: orders,

            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500
            return next(error);
        });

}
exports.postOrders = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const productToOrder = user.cart.items.map(data => {
                return {
                    productId: {
                        ...data.productId._doc
                    },
                    quantity: data.quantity
                };
            });
            console.log(productToOrder);
            const order = new Order({
                product: productToOrder,
                user: {
                    userId: req.user,
                    name: req.user.email
                }
            });
            return order.save();

        }).then(result => {
            return req.user.clearCart();
        }).then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500
            return next(error);
        });

}
exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    const invoiceName = 'invoice' + '-' + orderId + '.pdf';
    console.log(invoiceName);
    const filePath = path.join(utilPath, 'data', 'invoices', invoiceName);
    Order.findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No permission'));
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('No permission'));
            }
            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Deposition', 'inline : filename="' +invoiceName + '"');
            pdfDoc.pipe(fs.createWriteStream(filePath));
            pdfDoc.pipe(res);
            pdfDoc.fontSize(25).text('Invoice', {
                underline : true
            });
            pdfDoc.text('----------------------------------');
            let totalPrice = 0;
            order.product.forEach(product => {
                totalPrice += product.quantity * product.productId.price;
                
                pdfDoc.text(product.productId.title + ' ' + '-' + product.quantity + ' ' + 'x' + ' ' + product.productId.price);
                
                pdfDoc.text('----------');
                
            })
            pdfDoc.text('TotalCummulativePrice : $' + totalPrice);
            pdfDoc.end();
            // fs.readFile(filePath, (err, fileContent) => {
            //     if(err){
            //         return next(err);
            //     }
            //     res.setHeader('Content-Type', 'application/pdf');
            //     res.setHeader('Content-Deposition', 'inline : filename= "'+ invoiceName + '"');
            //     res.send(fileContent);
            // })
            // const file = fs.createReadStream(filePath);
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Deposition', 'inline : filename= "' + invoiceName + '"');
            // file.pipe(res);
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })


}
// exports.getCheckout = (req,res,next) => {
//     res.render('shop/checkout', {
//         path: '/checkout', 
//         pagetitle: 'Checkout'
//     });
// }