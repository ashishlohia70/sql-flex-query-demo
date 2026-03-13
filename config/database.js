const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = new sqlite3.Database(':memory:');
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this.db;

    return new Promise((resolve, reject) => {
      const fs = require('fs');
      const schemaPath = path.join(__dirname, '..', 'database.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error executing schema:', err.message);
          reject(err);
        } else {
          console.log('Database initialized with sample data.');
          this.initialized = true;
          resolve(this.db);
        }
      });
    });
  }

  getDb() {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();