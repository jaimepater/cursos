const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    Product.findAll().then(products => {
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products'
        });
    });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findByPk(prodId).then(product => {
        res.render('shop/product-detail', {
            product: product,
            pageTitle: product.title,
            path: '/products'
        });
    }).catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
    Product.findAll().then(products => {
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/'
        });
    });
};

exports.getCart = (req, res, next) => {
    req.user.getCart()
        .then(cart => cart.getProducts())
        .then(products => {
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products
            });
        })
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    let cartFetched
    req.user.getCart()
        .then(cart => {
            cartFetched = cart;
            return cart.getProducts({where: {id: prodId}})
        })
        .then(([product]) => {
            if (product) {
              const oldQ = product.cartItem.quantity
              return cartFetched.addProduct(product, {through: {quantity: oldQ +1 }})
            } else {
                return Product.findByPk(prodId)
                    .then(product => {
                        return cartFetched.addProduct(product, {through: {quantity: 1}})
                    })
            }
        }).then(result => {
            res.redirect('/cart');
        }
    );
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.getCart()
        .then(cart => cart.getProducts({ where: { id : prodId}}))
        .then(([product]) => product.cartItem.destroy())
        .then(result => res.redirect('/cart'))
};

exports.postOrder = (req, res, next) => {
    req.user.getCart()
        .then(cart => {
            return cart.getProducts();
        })
        .then(products => {
           return  req.user
               .createOrder()
               .then(order => {
                    return order.addProducts(
                       products.map( product => {
                           product.orderItem = { quantity: product.cartItem.quantity}
                           return product
                       })
                   )
               })
        })
        .then( result => {
            res.redirect("/orders")
        })

}

exports.getOrders = (req, res, next) => {
    res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders'
    });
};

exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout'
    });
};
