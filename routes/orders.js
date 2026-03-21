const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

// POST /api/orders/search - List all orders with flexible query configuration
router.post('/search', async (req, res, next) => {
  try {
    const queryConfig = req.body;
    const result = await orderService.getOrders(queryConfig);
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id - Get a specific order with items
router.get('/:id', async (req, res, next) => {
  try {
    const order = await orderService.getOrderWithItems(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders - Create a new order
router.post('/', async (req, res, next) => {
  try {
    const { customer_id, status, total_amount, items } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    // Create order
    const order = await orderService.createOrder({ 
      customer_id: parseInt(customer_id), 
      status: status || 'PENDING', 
      total_amount: parseFloat(total_amount) || 0 
    });
    const orderId = order.lastID;
    // Add order items if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await orderService.addOrderItem(
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price
        );
      }
    }
    
    // Fetch the complete order with items
    const completeOrder = await orderService.getOrderWithItems(orderId);
    
    res.status(201).json({
      success: true,
      data: completeOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id - Update an order
router.put('/:id', async (req, res, next) => {
  try {
    const { status, total_amount } = req.body;
    
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (total_amount !== undefined) updateData.total_amount = parseFloat(total_amount);
    
    const order = await orderService.updateOrder(req.params.id, updateData);
    
    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/orders/:id - Delete an order
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await orderService.deleteOrder(req.params.id);
    
    if (result.deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:id/items - Add an item to an order
router.post('/:id/items', async (req, res, next) => {
  try {
    const { product_id, quantity, unit_price } = req.body;
    
    if (!product_id || !quantity || !unit_price) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, quantity, and unit price are required'
      });
    }
    
    const orderItem = await orderService.addOrderItem(
      req.params.id,
      product_id,
      quantity,
      unit_price
    );
    
    res.status(201).json({
      success: true,
      data: orderItem,
      message: 'Order item added successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id/items - Get items for an order
router.get('/:id/items', async (req, res, next) => {
  try {
    const items = await orderService.getOrderItems(req.params.id);
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;