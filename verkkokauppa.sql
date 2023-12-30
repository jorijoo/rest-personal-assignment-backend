DROP TABLE IF EXISTS order_line;

DROP TABLE IF EXISTS customer_order;

DROP TABLE IF EXISTS user;

DROP TABLE IF EXISTS product;

DROP TABLE IF EXISTS product_category;

CREATE TABLE
    product_category (
        category_name VARCHAR(255) NOT NULL PRIMARY KEY,
        category_description VARCHAR(500),
        image_url VARCHAR(255)
    );

CREATE TABLE
    product (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2),
        image_url VARCHAR(255),
        category VARCHAR(255),
        product_description VARCHAR(1000),
        units_stored INT,
        -- Add reputation for positive and negative
        negative_reputation INT,
        positive_reputation INT,
        FOREIGN KEY (category) REFERENCES product_category(category_name)
    );

CREATE TABLE
    user (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        username VARCHAR(255) UNIQUE,
        pw VARCHAR(255),
        user_permissions TINYINT(1) DEFAULT 0
    );

CREATE TABLE
    customer_order (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        order_date DATETIME NOT NULL,
        customer_id INT,
        FOREIGN KEY (customer_id) REFERENCES user(id)
    );

CREATE TABLE
    order_line (
        order_id INT,
        product_id INT,
        quantity INT,
        PRIMARY KEY (order_id, product_id),
        FOREIGN KEY (order_id) REFERENCES customer_order(id),
        FOREIGN KEY (product_id) REFERENCES product(id)
    );

-- Add table for customer reviews
CREATE TABLE
    customer_review (
        user_id INT,
        product_id INT,
        review VARCHAR(1000),
        PRIMARY KEY (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES user(id),
        FOREIGN KEY (product_id) REFERENCES product(id)
    )

INSERT INTO product_category
VALUES (
        "Kuvaus",
        "Kamerat ja videolaitteet",
        "http://big.kapsi.fi/categories/category_camera.png"
    ), (
        "Toimisto",
        "Tarvikkeita toimistoon",
        "http://big.kapsi.fi/categories/category_tattoo.png"
    ), (
        "Sisustus",
        "Miniatyyrejä yms.",
        "http://big.kapsi.fi/categories/category_interior.png"
    ), (
        "Muoti",
        "Asuja ja tarpeellisia asusteita",
        "http://big.kapsi.fi/categories/category_fashion.png"
    );

INSERT INTO
    product(
        product_name,
        price,
        image_url,
        category,
        product_description,
        units_stored
    )
VALUES (
        "Canon Retro 1970",
        779.99,
        "https://big.kapsi.fi/products/camera_retro.jpg",
        "Kuvaus",
        "Vanhan näköinen mutta uudella tekniikalla",
        54
    ), (
        "Minolta H66",
        1199.99,
        "https://big.kapsi.fi/products/camera_hallowild.jpg",
        "Kuvaus",
        "Tämä halloween teemalla koristeltu laatu kamera nyt edullisesti",
        9
    ), (
        "Nikon Night",
        2499.99,
        "https://big.kapsi.fi/products/camera_nightvision.jpg",
        "Kuvaus",
        "Huippu kamera yökuvauksiin",
        5
    ), (
        "Canon Bend",
        498.99,
        "https://big.kapsi.fi/products/camera_bendy.jpg",
        "Kuvaus",
        "Kieroja kuvia ottava kamera",
        7
    ), (
        "Nikon Night2",
        4998.99,
        "https://big.kapsi.fi/products/camera_nightvision_02.jpg",
        "Kuvaus",
        "Sama kuin Nikon Night mutta 3D ominaisuus",
        3
    ), (
        "Kodak Scope",
        2989.99,
        "https://big.kapsi.fi/products/camera_scoped.jpg",
        "Kuvaus",
        "Kamera ja kiikarit samassa ",
        25
    ), (
        "Minolta Multi",
        5989.99,
        "https://big.kapsi.fi/products/camera_shoggoth.jpg",
        "Kuvaus",
        "Kameralla kuvaat uskomattomat kuvat ja videot",
        4
    ), (
        "Canon RIP",
        1989.99,
        "https://big.kapsi.fi/products/camera_skulls.jpg",
        "Kuvaus",
        "Synkän kuvaajan unelma",
        11
    ), (
        "Viikset 1",
        19.99,
        "https://big.kapsi.fi/products/moustache_and_eyebrows.jpg",
        "Muoti",
        "Täydellinen valeasu",
        20
    ), (
        "Viikset 2",
        14.99,
        "https://big.kapsi.fi/products/moustache_playdoh.jpg",
        "Muoti",
        "Näyttävät viikset",
        31
    ), (
        "Viikset 3",
        9.99,
        "https://big.kapsi.fi/products/moustache_rainbow.jpg",
        "Muoti",
        "Viikset vaikka Pride tapahtumaan",
        55
    ), (
        "Viikset 4",
        4.99,
        "https://big.kapsi.fi/products/moustache_silky_black.jpg",
        "Muoti",
        "Perus pensselit",
        30
    ), (
        "Mustekala",
        22.99,
        "https://big.kapsi.fi/products/scale_model_odd_old.jpg",
        "Sisustus",
        "Mustekala talo",
        10
    ), (
        "Old man",
        16.99,
        "https://big.kapsi.fi/products/scale_model_old_oldd.jpg",
        "Sisustus",
        "Vanha mies",
        43
    ), (
        "Kuutio",
        13.99,
        "https://big.kapsi.fi/products/scale_model_skeleton_cube.jpg",
        "Sisustus",
        "Pääkallo noppa",
        78
    ), (
        "Puutalo",
        12.99,
        "https://big.kapsi.fi/products/scale_model_tree_house.jpg",
        "Sisustus",
        "Elävä talo",
        12
    ), (
        "What is this",
        33.99,
        "https://big.kapsi.fi/products/scale_model_what.jpg",
        "Sisustus",
        "Mikä ihme tämä on",
        2
    ), (
        "Waterman 1",
        24.99,
        "https://big.kapsi.fi/products/tattoo_pen_blessed.jpg",
        "Toimisto",
        "Enkeli kynä",
        22
    ), (
        "Parker 1",
        54.99,
        "https://big.kapsi.fi/products/tattoo_pen_devils_choice.jpg",
        "Toimisto",
        "Pääkallo kynä",
        45
    ), (
        "Parker 2",
        149.99,
        "https://big.kapsi.fi/products/tattoo_pen_duct_tape.jpg",
        "Toimisto",
        "Rauhansopimus kynä",
        6
    ), (
        "Parker 3",
        128.99,
        "https://big.kapsi.fi/products/tattoo_pen_hairy_evil.jpg",
        "Toimisto",
        "Piru kynä",
        10
    ), (
        "Parker 4",
        33.99,
        "https://big.kapsi.fi/products/tattoo_pen_happiness.jpg",
        "Toimisto",
        "Smile kynä",
        50
    ), (
        "Waterman 2",
        28.99,
        "https://big.kapsi.fi/products/tattoo_pen_of_misspell.jpg",
        "Toimisto",
        "Typo kynä",
        68
    ), (
        "Waterman 3",
        138.99,
        "https://big.kapsi.fi/products/tattoo_pen_red_snake.jpg",
        "Toimisto",
        "Käärme kynä",
        15
    ), (
        "Waterman 4",
        198.99,
        "https://big.kapsi.fi/products/tattoo_pen_un_undead.jpg",
        "Toimisto",
        "Kuolematon",
        3
    );
