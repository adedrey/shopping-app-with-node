const express = require('express');
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');
const router = express.Router();

router.get('/products',shopController.getProducts);
router.get('/product/:productId', shopController.getProduct);
router.get('/cart', isAuth, shopController.getCart);
router.post('/cart', isAuth, shopController.postCart);
router.post('/cart-delete-product', isAuth, shopController.postCartProductDelete)
router.post('/create-order', isAuth, shopController.postOrders);
router.get('/orders', isAuth, shopController.getOrders);
router.get('/orders/:orderId', isAuth, shopController.getInvoice);
// router.get('/checkout', shopController.getCheckout);
router.get('/',shopController.getIndex);


module.exports = router;
