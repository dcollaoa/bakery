from flask import Flask, request, jsonify, send_from_directory, render_template
import sqlite3
import os
import json # Import json module

app = Flask(__name__, static_folder='static', static_url_path='/static')
DATABASE = 'main.db' # Renamed to main.db to be more generic

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Check if the database file exists and delete it to start fresh
    # if os.path.exists(DATABASE):
    #     os.remove(DATABASE)
    
    with app.app_context():
        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                price REAL NOT NULL
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT UNIQUE
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                event_date TEXT,
                delivery_date TEXT,
                delivery_time TEXT,
                is_delivery_enabled INTEGER,
                delivery_address TEXT,
                observations TEXT,
                products_json TEXT,
                subtotal REAL,
                shipping REAL,
                total_net REAL,
                deposit REAL,
                balance REAL,
                anticipo_pagado INTEGER DEFAULT 0,
                pendiente_pagado INTEGER DEFAULT 0,
                order_date TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients (id)
            );
        """)
        db.commit()
        db.close()

# Initialize the database when the app starts
init_db()

# Serve static files
@app.route('/')
def serve_wizard_index(): # Renamed function
    return render_template('index.html', active_page='wizard') # New index.html for wizard

@app.route('/orders.html') # New route for orders.html
def serve_orders():
    return render_template('orders.html', active_page='orders')

@app.route('/productos.html')
def serve_productos():
    return render_template('productos.html', active_page='productos')

@app.route('/clientes.html')
def serve_clientes():
    return render_template('clientes.html', active_page='clientes')

# API Endpoints for Products
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return jsonify([dict(product) for product in products])

@app.route('/api/products', methods=['POST'])
def add_product():
    new_product = request.json
    name = new_product['name']
    price = new_product['price']

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO products (name, price) VALUES (?, ?)', (name, price))
        conn.commit()
        new_product_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': new_product_id, 'name': name, 'price': price}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Product with this name already exists'}), 409
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    updated_data = request.json
    name = updated_data['name']
    price = updated_data['price']

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('UPDATE products SET name = ?, price = ? WHERE id = ?', (name, price, product_id))
        conn.commit()
        conn.close()
        if cursor.rowcount == 0:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify({'message': 'Product updated successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Product with this name already exists'}), 409
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify({'message': 'Product deleted successfully'})

# API Endpoints for Clients
@app.route('/api/clients', methods=['GET'])
def get_clients():
    conn = get_db_connection()
    clients = conn.execute('SELECT * FROM clients').fetchall()
    conn.close()
    return jsonify([dict(client) for client in clients])

@app.route('/api/clients', methods=['POST'])
def add_client():
    new_client = request.json
    name = new_client['name']
    phone = new_client.get('phone')
    email = new_client.get('email')

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO clients (name, phone, email) VALUES (?, ?, ?)', (name, phone, email))
        conn.commit()
        new_client_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': new_client_id, 'name': name, 'phone': phone, 'email': email}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Client with this email already exists'}), 409
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<int:client_id>', methods=['PUT'])
def update_client(client_id):
    updated_data = request.json
    name = updated_data['name']
    phone = updated_data.get('phone')
    email = updated_data.get('email')

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('UPDATE clients SET name = ?, phone = ?, email = ? WHERE id = ?', (name, phone, email, client_id))
        conn.commit()
        conn.close()
        if cursor.rowcount == 0:
            return jsonify({'error': 'Client not found'}), 404
        return jsonify({'message': 'Client updated successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Client with this email already exists'}), 409
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/clients/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM clients WHERE id = ?', (client_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        return jsonify({'error': 'Client not found'}), 404
    return jsonify({'message': 'Client deleted successfully'})

# API Endpoints for Orders
@app.route('/api/orders', methods=['GET'])
def get_orders():
    conn = get_db_connection()
    orders = conn.execute(
        'SELECT o.*, c.name as client_name, c.phone as client_phone, c.email as client_email FROM orders o JOIN clients c ON o.client_id = c.id'
    ).fetchall()
    conn.close()
    return jsonify([dict(order) for order in orders])

@app.route('/api/orders', methods=['POST'])
def add_order():
    order_data = request.json
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO orders (client_id, event_date, delivery_date, delivery_time, is_delivery_enabled, delivery_address, observations, products_json, subtotal, shipping, total_net, deposit, balance, anticipo_pagado, pendiente_pagado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            (
                order_data['client_id'],
                order_data['event_date'],
                order_data['delivery_date'],
                order_data['delivery_time'],
                order_data['is_delivery_enabled'],
                order_data['delivery_address'],
                json.dumps(order_data['observations']),
                json.dumps(order_data['products_json']),
                order_data['subtotal'],
                order_data['shipping'],
                order_data['total_net'],
                order_data['deposit'],
                order_data['balance'],
                order_data.get('anticipo_pagado', 0),
                order_data.get('pendiente_pagado', 0)
            )
        )
        conn.commit()
        new_order_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': new_order_id, 'message': 'Order added successfully'}), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    conn = get_db_connection()
    order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
    conn.close()
    if order is None:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify(dict(order))

@app.route('/api/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    updated_data = request.json
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE orders SET client_id = ?, event_date = ?, delivery_date = ?, delivery_time = ?, is_delivery_enabled = ?, delivery_address = ?, observations = ?, products_json = ?, subtotal = ?, shipping = ?, total_net = ?, deposit = ?, balance = ? WHERE id = ?',
            (
                updated_data['client_id'],
                updated_data['event_date'],
                updated_data['delivery_date'],
                updated_data['delivery_time'],
                updated_data['is_delivery_enabled'],
                updated_data['delivery_address'],
                json.dumps(updated_data['observations']),
                json.dumps(updated_data['products_json']),
                updated_data['subtotal'],
                updated_data['shipping'],
                updated_data['total_net'],
                updated_data['deposit'],
                updated_data['balance'],
                order_id
            )
        )
        conn.commit()
        conn.close()
        if cursor.rowcount == 0:
            return jsonify({'error': 'Order not found'}), 404
        return jsonify({'message': 'Order updated successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Client with this email already exists'}), 409
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>/payment', methods=['PUT'])
def update_order_payment_status(order_id):
    updated_data = request.json
    anticipo_pagado = updated_data.get('anticipo_pagado')
    pendiente_pagado = updated_data.get('pendiente_pagado')

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if anticipo_pagado is not None and pendiente_pagado is not None:
            cursor.execute('UPDATE orders SET anticipo_pagado = ?, pendiente_pagado = ? WHERE id = ?', (anticipo_pagado, pendiente_pagado, order_id))
        elif anticipo_pagado is not None:
            cursor.execute('UPDATE orders SET anticipo_pagado = ? WHERE id = ?', (anticipo_pagado, order_id))
        elif pendiente_pagado is not None:
            cursor.execute('UPDATE orders SET pendiente_pagado = ? WHERE id = ?', (pendiente_pagado, order_id))
        else:
            return jsonify({'error': 'No payment status provided'}), 400

        conn.commit()
        conn.close()
        if cursor.rowcount == 0:
            return jsonify({'error': 'Order not found'}), 404
        return jsonify({'message': 'Order payment status updated successfully'})
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM orders WHERE id = ?', (order_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify({'message': 'Order deleted successfully'})

if __name__ == '__main__':
    app.run(debug=True, port=8000)

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM orders WHERE id = ?', (order_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        return jsonify({'error': 'Order not found'}), 404
    return jsonify({'message': 'Order deleted successfully'})

if __name__ == '__main__':
    app.run(debug=True, port=8000)
