-- Database schema for demo application
-- Using SQLite for simplicity

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS products;

CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'PENDING',
    total_amount DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert sample data
INSERT INTO customers (name, email, status) VALUES
('John Doe', 'john@example.com', 'ACTIVE'),
('Jane Smith', 'jane@example.com', 'ACTIVE'),
('Bob Johnson', 'bob@example.com', 'INACTIVE'),
('Alice Brown', 'alice@example.com', 'ACTIVE'),
('Charlie Wilson', 'charlie@example.com', 'ACTIVE');

INSERT INTO products (name, description, price, status) VALUES
('Laptop', 'High-performance laptop', 1200.00, 'ACTIVE'),
('Mouse', 'Wireless mouse', 25.00, 'ACTIVE'),
('Keyboard', 'Mechanical keyboard', 75.00, 'ACTIVE'),
('Monitor', '27-inch 4K monitor', 300.00, 'ACTIVE'),
('Desk Chair', 'Ergonomic office chair', 150.00, 'ACTIVE');

INSERT INTO orders (customer_id, order_date, status, total_amount) VALUES
(1, '2024-01-15 10:30:00', 'SHIPPED', 1250.00),
(1, '2024-02-20 14:15:00', 'DELIVERED', 75.00),
(2, '2024-03-05 09:00:00', 'PENDING', 1500.00),
(3, '2024-03-10 16:45:00', 'SHIPPED', 300.00),
(4, '2024-03-12 11:20:00', 'DELIVERED', 225.00),
(5, '2024-03-13 08:00:00', 'PENDING', 1200.00);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 1200.00),  -- Laptop
(1, 2, 2, 25.00),    -- 2 Mice
(2, 3, 1, 75.00),    -- Keyboard
(3, 4, 5, 300.00),   -- 5 Monitors
(4, 5, 1, 150.00),   -- Desk Chair
(5, 1, 1, 1200.00),  -- Laptop
(5, 2, 4, 25.00);    -- 4 Mice