const express = require('express');
const router = express.Router();
const productService = require('../services/productService');

// POST /api/products/search - List all products with flexible query configuration
router.post('/search', async (req, res, next) => {
  try {
    const queryConfig = req.body;
    const result = await productService.getProducts(queryConfig);
    
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

// GET /api/products/:id - Get a specific product
router.get('/:id', async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Create a new product
router.post('/', async (req, res, next) => {
  try {
    const { name, description, price, status } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }
    
    const product = await productService.createProduct({ 
      name, 
      description, 
      price: parseFloat(price), 
      status: status || 'ACTIVE' 
    });
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Update a product
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, price, status } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (status !== undefined) updateData.status = status;
    
    const product = await productService.updateProduct(req.params.id, updateData);
    
    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Delete a product
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);
    
    if (result.deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;