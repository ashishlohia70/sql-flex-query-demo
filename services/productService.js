const { buildQueries, dialectHelpers } = require('sql-flex-query');
const db = require('../config/database');

class ProductService {
  constructor() {
    this.dialect = 'sqlite';
  }

  async getProducts(filters = {}, page = 1, size = 10) {
    const BASE = `
      SELECT /*SELECT_COLUMNS*/
      FROM products
      /*WHERE_CLAUSE*/
      /*ORDER_BY*/
      /*LIMIT_CLAUSE*/
    `;

    const whereParams = [];
    
    // Build WHERE conditions from filters
    if (filters.status) {
      whereParams.push({ key: 'status', operation: 'EQ', value: filters.status });
    }
    if (filters.name) {
      whereParams.push({ key: 'name', operation: 'LIKE', value: `%${filters.name}%` });
    }
    if (filters.minPrice) {
      whereParams.push({ key: 'price', operation: 'GTE', value: parseFloat(filters.minPrice) });
    }
    if (filters.maxPrice) {
      whereParams.push({ key: 'price', operation: 'LTE', value: parseFloat(filters.maxPrice) });
    }

    const result = buildQueries({
      baseQueryTemplate: BASE,
      whereParams,
      textSearchParams: [],
      sortBy: filters.sortBy ? [{ key: filters.sortBy, direction: filters.sortDir || 'ASC' }] : [{ key: 'id', direction: 'DESC' }],
      page: parseInt(page),
      size: parseInt(size),
      columnMapper: {},
      selectColumns: ['id', 'name', 'description', 'price', 'status', 'created_at'],
      dialect: this.dialect
    });

    const [rows] = await db.getDb().all(result.searchQuery, result.params);
    const [countResult] = await db.getDb().get(result.countQuery, result.params);
    
    return {
      data: rows,
      total: countResult.count,
      page: parseInt(page),
      size: parseInt(size),
      totalPages: Math.ceil(countResult.count / size)
    };
  }

  async getProductById(id) {
    const query = `
      SELECT id, name, description, price, status, created_at
      FROM products
      WHERE id = ?
    `;
    
    return await db.getDb().get(query, [id]);
  }

  async createProduct(productData) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { name: 'name', description: 'description', price: 'price', status: 'status' };
    
    const { columns, placeholders, params } = h.buildInsertValues(productData, columnMapper);
    
    const query = `INSERT INTO products (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    
    return new Promise((resolve, reject) => {
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...productData });
        }
      });
    });
  }

  async updateProduct(id, productData) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { name: 'name', description: 'description', price: 'price', status: 'status' };
    
    const { setClause, params } = h.buildSetClause(productData, columnMapper);
    
    const { clause } = h.buildWhereClause(
      [{ key: 'id', operation: 'EQ', value: id }],
      [],
      columnMapper,
      params
    );
    
    const query = `UPDATE products SET ${setClause}${clause}`;
    
    return new Promise((resolve, reject) => {
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...productData });
        }
      });
    });
  }

  async deleteProduct(id) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { id: 'id' };
    
    const { clause, params } = h.buildWhereClause(
      [{ key: 'id', operation: 'EQ', value: id }],
      [],
      columnMapper
    );
    
    const query = `DELETE FROM products${clause}`;
    
    return new Promise((resolve, reject) => {
      db.getDb().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes });
        }
      });
    });
  }
}

module.exports = new ProductService();