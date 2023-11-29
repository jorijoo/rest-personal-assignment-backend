require('dotenv').config()
const axios = require('axios');


const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const cors = require('cors');

const multer = require('multer');
const upload = multer({ dest: "uploads/" });

var express = require('express');

var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(express.static('public'));


const PORT = process.env.PORT;

app.listen(PORT, function () {
    console.log('Server running on port ' + PORT);
});

const conf = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: false,
    timezone: '+00:00'
}


/**
 * Makes all public files accessible
 */

app.use('/files', express.static('assets/public'));

/**
 * Makes product images accessible
 */

app.use('/products', express.static('assets/public/products'));

/**
 * Gets the products
 * Optional category query parameter for filtering only products from that category
 */
app.get('/products', async (req, res) => {
    try {
        const connection = await mysql.createConnection(conf);

        const category = req.query.category;

        const result = (category)
            ? await connection.execute("SELECT id, product_name AS productName, price, units_stored AS unitsStored, product_description AS productDescription, image_url AS imageUrl, category FROM product WHERE category=?", [category])
            : await connection.execute("SELECT id, product_name AS productName, price, units_stored AS unitsStored, product_description AS productDescription, image_url AS imageUrl, category FROM product")

        //First index in the result contains the rows in an array
        res.json(result[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/**
 * Gets all the categories
 */
app.get('/categories', async (req, res) => {

    try {
        const connection = await mysql.createConnection(conf);

        const [rows] = await connection.execute("SELECT category_name AS categoryName, category_description AS categoryDescription FROM product_category");

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/personal', async (req, res) => {

    //Get the bearer token from authorization header
    const token = authExists(req.headers.authorization);

    //Verify the token. Verified token contains username
    try {
        const username = token && jwt.verify(token, process.env.JWT_KEY).username;
        const connection = await mysql.createConnection(conf);
        const [rows] = await connection.execute('SELECT first_name fname, last_name lname, username, user_permissions FROM user WHERE username=?', [username]);
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err.message);
        res.status(403).send('Access forbidden.');
    }
});

/**
 * Registers user. Supports urlencoded and multipart
 */
/*app.post('/personal', upload.none(), async (req, res) => {
    const fname = req.body.fname;
    const lname = req.body.lname;
    const uname = req.body.username;
    const pw = req.body.pw;

    try {
        const connection = await mysql.createConnection(conf);

        const pwHash = await bcrypt.hash(pw, 10);

        const [rows] = await connection.execute('INSERT INTO user(first_name,last_name,username,pw,user_permissions) VALUES (?,?,?,?,?)', [fname, lname, uname, pwHash, 0]);

        res.status(200).end();

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

});

/**
 * Adds new product categories
 */
/*app.post('/categories', async (req, res) => {

    const connection = await mysql.createConnection(conf);

    try {

        connection.beginTransaction();
        const categories = req.body;

        for (const category of categories) {
            await connection.execute("INSERT INTO product_category VALUES (?,?)", [category.categoryName, category.description]);
        }

        connection.commit();
        res.status(200).send("Categories added!");

    } catch (err) {
        connection.rollback();
        res.status(500).json({ error: err.message });
    }
});

/**
 * Adds new products 
 */
/*app.post('/products', async (req, res) => {

    const connection = await mysql.createConnection(conf);

    try {

        connection.beginTransaction();
        const products = req.body;


        for (const product of products) {
            await connection.execute("INSERT INTO product (product_name, price, image_url,category) VALUES (?,?,?,?)", [product.productName, product.price, product.imageUrl, product.category]);
        }

        connection.commit();
        res.status(200).send("Products added!");

    } catch (err) {
        connection.rollback();
        res.status(500).json({ error: err.message });
    }
});

/**
 * Place an order. 
 */
/*app.post('/order', async (req, res) => {

    let connection;

    try {
        connection = await mysql.createConnection(conf);
        connection.beginTransaction();

        const order = req.body;

        const [info] = await connection.execute("INSERT INTO customer_order (order_date, customer_id) VALUES (NOW(),?)", [order.customerId]);

        const orderId = info.insertId;

        for (const product of order.products) {
            await connection.execute("INSERT INTO order_line (order_id, product_id, quantity) VALUES (?,?,?)", [orderId, product.id, product.quantity]);
        }

        connection.commit();
        res.status(200).json({ orderId: orderId });

    } catch (err) {
        connection.rollback();
        res.status(500).json({ error: err.message });
    }
});

/**
 * Checks the username and password and returns jwt authentication token if authorized. 
 * Supports urlencoded or multipart
 */
/*app.post('/login', upload.none(), async (req, res) => {
    const uname = req.body.username;
    const pw = req.body.pw;


    try {
        const connection = await mysql.createConnection(conf);

        const [rows] = await connection.execute('SELECT pw FROM user WHERE username=?', [uname]);

        if (rows.length > 0) {
            const isAuth = await bcrypt.compare(pw, rows[0].pw);
            if (isAuth) {
                const token = jwt.sign({ username: uname }, process.env.JWT_KEY);
                res.status(200).json({ jwtToken: token });
            } else {
                res.status(401).end('User not authorized');
            }
        } else {
            res.status(404).send('User not found');
        }

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Gets orders of the user
 */
/* app.get('/orders', async (req, res) => {

    //Get the bearer token from authorization header
    const token = authExists(req.headers.authorization);

    //Verify the token. Verified token contains username
    try {
        const username = jwt.verify(token, process.env.JWT_KEY).username;
        const orders = await getOrders(username);
        res.status(200).json(orders);
    } catch (err) {
        console.log(err.message);
        res.status(403).send('Access forbidden.');
    }
});

async function getOrders(username) {
    try {
        const connection = await mysql.createConnection(conf);
        const [rows] = await connection.execute('SELECT customer_order.order_date AS date, customer_order.id AS orderId FROM customer_order INNER JOIN user ON user.id = customer_order.customer_id WHERE user.username=?', [username]);

        let result = [];

        for (const row of rows) {
            const [products] = await connection.execute("SELECT id,product_name productName,price,image_url imageUrl, category, quantity  FROM product INNER JOIN order_line ON order_line.product_id = product.id WHERE order_line.order_id=?", [row.orderId]);

            let order = {
                orderDate: row.date,
                orderId: row.orderId,
                products: products
            }

            result.push(order);
        }


        return result;
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: err.message });
    }
}
* /

/**
 * Check if authorization header exists
 * @param {string} token  - authorization header
 * @returns {string | boolean}  - token or false
 */
function authExists(token) { return token && token.split(' ')[1]; }