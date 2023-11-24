DROP TABLE IF EXISTS order_line;
DROP TABLE IF EXISTS customer_order;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS product_category;

CREATE TABLE product_category (
category_name VARCHAR(255) NOT NULL PRIMARY KEY,
category_description VARCHAR(500)
);

CREATE TABLE product (
id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
product_name VARCHAR(255) NOT NULL,
price DECIMAL(10,2),
image_url VARCHAR(255),
category VARCHAR(255),
product_description VARCHAR(1000),
units_stored INT,
FOREIGN KEY (category) REFERENCES product_category(category_name)
);

CREATE TABLE user (
id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
first_name VARCHAR(255),
last_name VARCHAR(255),
username VARCHAR(255) UNIQUE,
pw VARCHAR(255),
user_permissions TINYINT(1) DEFAULT 0
);

CREATE TABLE customer_order (
id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
order_date DATETIME NOT NULL,
customer_id INT,
FOREIGN KEY (customer_id) REFERENCES user(id)
);

CREATE TABLE order_line (
order_id INT,
product_id INT,
quantity INT,
PRIMARY KEY (order_id, product_id),
FOREIGN KEY (order_id) REFERENCES customer_order(id),
FOREIGN KEY (product_id) REFERENCES product(id)
);

INSERT INTO 
    product_category 
VALUES 
    ('Tattooing', 'Laptop and desktop computers'),
    ('Miniatures', 'Sport equipment'),
    ('Bikes', 'City and MTB bikes'),
    ('Music', 'Guitars, drums and other instruments'),
    ('Kuvaus', 'Kamerart ja videolaitteet');

INSERT INTO 
    product (product_name, price, image_url, category, product_description, units_stored) 
VALUES 
    ('Macbook Pro 13', 1200, 'https://big.kapsi.fi/products/tattoo_pen_duct_tape.jpg', 'Tattooing','So cool!', 12),
    ('iPhone 13', 700, 'https://big.kapsi.fi/products/camera_nightvision_02.jpg', 'Phones', 'Oh wow!', 44), 
    ('Umbro football', 25, 'https://big.kapsi.fi/products/scale_model_what.jpg', 'Miniatures', 'Much happiness!', 304),
    ('Fender Stratocaster', 1550, 'https://big.kapsi.fi/products/moustache_and_eyebrows.jpg', 'Music', "For your neighbors's pleasure", 6), 
    ('Gibson Les Paul', 2100, 'https://big.kapsi.fi/products/moustache_rainbow.jpg', 'Music', "Olden gold.", 7 ), 
    ('Google Pixel', 780, 'https://big.kapsi.fi/products/camera_retro.jpg', 'Phones', "Has more than one pixel!", 54);
