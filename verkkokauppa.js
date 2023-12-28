require("dotenv").config();
const axios = require("axios");

const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

var express = require("express");

var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const PORT = process.env.PORT;

app.listen(PORT, function () {
    console.log("Server running on port " + PORT);
});

const conf = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: false,
    timezone: "+00:00",
};

/**
 * Makes all public files accessible
 */
app.use("/files", express.static("assets/public"));

/**
 * Makes product images accessible
 */
app.use("/products", express.static("assets/public/products"));


/**
 * Gets all the categories
 */
app.get("/categories", async (req, res) => {
    try {
        const connection = await mysql.createConnection(conf);

        const [rows] = await connection.execute("SELECT category_name AS categoryName, category_description AS categoryDescription, image_url AS imageUrl FROM product_category");

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/**
 * Gets the products
 * Optional category query parameter for filtering only products from that category
 */
app.get("/products", async (req, res) => {
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
 * Gets a single product by ID
 */
app.get("/products/:id", async (req, res) => {
    try {
        const id = req.params.id; // Tuotteen ID URL:sta
        const connection = await mysql.createConnection(conf);

        const [rows] = await connection.execute("SELECT id, product_name AS productName, price, units_stored AS unitsStored, product_description AS productDescription, image_url AS imageUrl, category FROM product WHERE id = ?", [id]);

        if (rows.length > 0) {
            // Lähetä ensimmäinen rivi vastauksena
            res.json(rows[0]);
        } else {
            res.status(404).send("Tuotetta ei löytynyt");
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Gets the amount of items in stock
 */

app.post("/units_stored", async (req, res) => {
    try {
        const productId = req.body.productId;
        const connection = await mysql.createConnection(conf);
        const [rows] = await connection.execute("SELECT units_stored FROM product WHERE id = ?", [productId]);

        if (rows.length > 0) {
            res.json({ units_stored: rows[0].units_stored });
        } else {
            res.status(404).send("Tuotetta ei löytynyt");
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/**
 * Checks the username and password and returns jwt authentication token if authorized. 
 * Supports urlencoded or multipart
 */
app.post('/login', upload.none(), async (req, res) => {
    const uname = req.body.username;
    const pw = req.body.pw;

    try {
        const connection = await mysql.createConnection(conf);

        // Hae käyttäjän ID ja hashattu salasana tietokannasta
        const [rows] = await connection.execute('SELECT id, pw FROM user WHERE username=?', [uname]);

        if (rows.length > 0) {
            const isAuth = await bcrypt.compare(pw, rows[0].pw);
            if (isAuth) {
                // Luo token, joka sisältää sekä käyttäjänimen että ID:n
                const token = jwt.sign({ username: uname, userId: rows[0].id }, process.env.JWT_KEY);
                res.status(200).json({ jwtToken: token });
            } else {
                res.status(401).send('User not authorized');
            }
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/personal', async (req, res) => {

    //Get the bearer token from authorization header
    const token = req.headers.authorization?.split(' ')[1];

    //Verify the token. 
    try {
        const username = jwt.verify(token, process.env.JWT_KEY).username;
        const connection = await mysql.createConnection(conf);
        const [rows] = await connection.execute('SELECT first_name fname, last_name lname, username, user_permissions FROM user WHERE username=?', [username]);
        res.status(200).json(rows[0]);
    } catch (err) {
        console.log(err.message);
        res.status(403).send('Access forbidden.');
    }
});







app.post('/order', async (req, res) => {
    let connection;

    try {
        // Autentikoi käyttäjä ja hae käyttäjän ID tokenista
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const customerId = decoded.userId;

        connection = await mysql.createConnection(conf);
        await connection.beginTransaction();

        // Lisää tilaus
        const [info] = await connection.execute("INSERT INTO customer_order (order_date, customer_id) VALUES (NOW(), ?)", [customerId]);
        const orderId = info.insertId;

        for (const product of req.body.products) {
            // Tarkista varastosaldo
            const [stock] = await connection.execute("SELECT units_stored FROM product WHERE id = ?", [product.id]);
            if (stock.length === 0 || stock[0].units_stored < product.quantity) {
                throw new Error('Tuotetta ei ole tarpeeksi varastossa');
            }

            // Lisää tilausrivi ja päivitä varastosaldo
            await connection.execute("INSERT INTO order_line (order_id, product_id, quantity) VALUES (?, ?, ?)", [orderId, product.id, product.quantity]);
            await connection.execute("UPDATE product SET units_stored = units_stored - ? WHERE id = ?", [product.quantity, product.id]);
        }

        await connection.commit();
        res.status(200).json({ orderId: orderId });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Virhe käsitellessä /order -pyyntöä:', err);
        res.status(500).json({ error: err.message });
    }
});


app.get('/myorders', async (req, res) => {
    try {
        // Tarkista ja dekoodaa token
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;

        // Haetaaan käyttäjän tilaukset
        const orders = await getUserOrders(userId);
        res.status(200).json(orders);
    } catch (error) {
        // Käsittele eri virhetilanteet asianmukaisesti
        if (error.name === "JsonWebTokenError") {
            res.status(403).send('Invalid token.');
        } else {
            console.error(error.message);
            res.status(500).send('Internal server error.');
        }
    }
});

async function getUserOrders(userId) {
    try {
        const connection = await mysql.createConnection(conf);
        const [orders] = await connection.execute(`
            SELECT customer_order.id as orderId, product_id as productId,
                customer_order.order_date, product.product_name, 
                product.price, product.image_url, product.category,
                order_line.quantity
            FROM customer_order
            JOIN order_line ON customer_order.id = order_line.order_id
            JOIN product ON order_line.product_id = product.id
            WHERE customer_order.customer_id = ?
        `, [userId]);

        // tilausten muotoilu
        return orders.map(order => ({
            orderId: order.orderId,
            productId: order.productId,
            orderDate: order.order_date,
            productName: order.product_name,
            price: order.price,
            imageUrl: order.image_url,
            category: order.category,
            quantity: order.quantity
        }));
    } catch (error) {
        console.error(error.message);
        throw new Error('Database query failed.');
    }
}




/**
 * Registers user. Supports urlencoded and multipart
 */
app.post('/personal', upload.none(), async (req, res) => {
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
app.post('/categories', async (req, res) => {

    const connection = await mysql.createConnection(conf);

    try {

        connection.beginTransaction();
        const categories = req.body;

        for (const category of categories) {
            await connection.execute("INSERT INTO product_category VALUES (?,?,?)", [category.categoryName, category.description, category.imageUrl]);
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
app.post('/products', async (req, res) => {

        const connection = await mysql.createConnection(conf);

        try {

                connection.beginTransaction();
                const products = req.body;


                for (const product of products) {
                        await connection.execute("INSERT INTO product (product_name, price, image_url, category, product_description, units_stored) VALUES (?,?,?,?,?,?)", [product.productName, product.price, product.imageUrl, product.category, product.productDescription, product.unitsStored]);
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
app.post('/order', async (req, res) => {

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