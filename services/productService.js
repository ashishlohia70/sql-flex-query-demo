const { buildQueries, dialectHelpers } = require('sql-flex-query');
const db = require('../config/databaseHelper');
const config = require('../config/appConfig');

class ProductService {
  constructor() {
    this.dialect = config.dialect;
  }

  async getProducts(queryConfig = {}) {
    const BASE = `
      SELECT /*SELECT_COLUMNS*/
      FROM products
      /*WHERE_CLAUSE*/
      /*ORDER_BY*/
      /*LIMIT_CLAUSE*/
    `;

    // Use client-provided configuration with defaults
    const {
      selectColumns = ['id', 'name', 'description', 'price', 'status', 'created_at'],
      whereParams = [],
      textSearchParams = [],
      sortBy = [{ key: 'id', direction: 'DESC' }],
      page = 1,
      size = 10,
      columnMapper = {}
    } = queryConfig;

    const result = buildQueries({
      baseQueryTemplate: BASE,
      whereParams,
      textSearchParams,
      sortBy,
      page: parseInt(page),
      size: parseInt(size),
      columnMapper,
      selectColumns,
      dialect: this.dialect
    });

    const rows = await db.all(result.searchQuery, result.params);
    const countResult = await db.get(result.countQuery, result.params);
    
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
    
    return await db.get(query, [id]);
  }

  async createProduct(productData) {
    const h = dialectHelpers(this.dialect);
    const columnMapper = { name: 'name', description: 'description', price: 'price', status: 'status' };
    
    const { columns, placeholders, params } = h.buildInsertValues(productData, columnMapper);
    
    const query = `INSERT INTO products (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
    
    return await db.run(query, params);
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
    
    return await db.run(query, params);
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
    
    return await db.run(query, params);
  }
}

module.exports = new ProductService();