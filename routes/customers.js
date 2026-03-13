const express = require('express');
const router = express.Router();
const customerService = require('../services/customerService');

// POST /api/customers/search - List all customers with flexible query configuration
router.post('/search', async (req, res, next) => {
  try {
    const queryConfig = req.body;
    const result = await customerService.getCustomers(queryConfig);
    
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
    console.error('Error in GET /api/customers:', error);
    next(error);
  }
});

// GET /api/customers/:id - Get a specific customer
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/customers - Create a new customer
router.post('/', async (req, res, next) => {
  try {
    const { name, email, status } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }
    
    const customer = await customerService.createCustomer({ name, email, status: status || 'ACTIVE' });
    
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id - Update a customer
router.put('/:id', async (req, res, next) => {
  try {
    const { name, email, status } = req.body;
    
    const customer = await customerService.updateCustomer(req.params.id, { name, email, status });
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/customers/:id - Delete a customer
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id);
    
    if (result.deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;