const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    }
})

userSchema.methods.addToCart = function (productId) {
    const cartProductsIndex = this.cart.items.findIndex(product => {
        return product.productId.toString() === productId.toString();
    })
    let newQuantity;
    newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    if (cartProductsIndex >= 0) {
        updatedCartItems[cartProductsIndex].quantity = updatedCartItems[cartProductsIndex].quantity + newQuantity;
    } else {
        updatedCartItems.push({
            productId: productId,
            quantity: newQuantity
        });
    }

    this.cart.items = updatedCartItems
    // or
    // const updatedCart = {
    //     items : updatedCartItems
    // };
    // this.cart = updatedCart;
    return this.save();
}
userSchema.methods.clearCart = function () {
    const updateCart = {
        items: []
    };
    this.cart = updateCart;
    return this.save();
}
userSchema.methods.removeFromCart = function (productId) {
    const cartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString();
    });
    const updatedCart = {
        items: cartItems
    };
    this.cart = updatedCart;
    return this.save();
}

module.exports = mongoose.model('User', userSchema);