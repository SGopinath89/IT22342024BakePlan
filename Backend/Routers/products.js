const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();

// Get all orders
router.get(`/`, async (req, res) => {
    try {
        const orderList = await Order.find().populate('user', 'name').sort({ 'dateOrdered': -1 });
        if (!orderList) {
            return res.status(500).json({ success: false, message: 'No orders found' });
        }
        res.send(orderList);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get order by ID
router.get(`/:id`, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name')
            .populate({
                path: 'orderItems', populate: {
                    path: 'product'
                }
            });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.send(order);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        const orderItemsIds = await Promise.all(req.body.orderItems.map(async (orderItem) => {
            let newOrderItem = new OrderItem({
                quantity: orderItem.quantity,
                product: orderItem.product
            });

            newOrderItem = await newOrderItem.save();
            return newOrderItem._id;
        }));

        const totalPrices = await Promise.all(orderItemsIds.map(async (orderItemId) => {
            const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
            const totalPrice = orderItem.product.price * orderItem.quantity;
            return totalPrice;
        }));

        const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

        let order = new Order({
            orderItems: orderItemsIds,
            address1: req.body.address1,
            phone: req.body.phone,
            status: req.body.status,
            totalPrice: totalPrice,
            user: req.body.user,
        });

        order = await order.save();

        if (!order) {
            return res.status(400).json({ success: false, message: 'The order cannot be created' });
        }

        res.send(order);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update order status
router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: req.body.status
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.send(order);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndRemove(req.params.id);
        if (order) {
            await Promise.all(order.orderItems.map(async (orderItem) => {
                await OrderItem.findByIdAndRemove(orderItem);
            }));
            return res.status(200).json({ success: true, message: 'The order is deleted' });
        } else {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get total sales
router.get('/get/totalsales', async (req, res) => {
    try {
        const totalSales = await Order.aggregate([
            { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
        ]);

        if (!totalSales.length) {
            return res.status(400).json({ success: false, message: 'The order sales cannot be generated' });
        }

        res.send({ totalsales: totalSales.pop().totalsales });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get order count
router.get(`/get/count`, async (req, res) => {
    try {
        const orderCount = await Order.countDocuments();

        if (!orderCount) {
            return res.status(500).json({ success: false, message: 'No orders found' });
        }
        res.send({ orderCount: orderCount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get orders for a specific user
router.get(`/get/userorders/:userid`, async (req, res) => {
    try {
        const userOrderList = await Order.find({ user: req.params.userid })
            .populate({
                path: 'orderItems', populate: {
                    path: 'product'
                }
            })
            .sort({ 'dateOrdered': -1 });

        if (!userOrderList) {
            return res.status(500).json({ success: false, message: 'No orders found for this user' });
        }
        res.send(userOrderList);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
