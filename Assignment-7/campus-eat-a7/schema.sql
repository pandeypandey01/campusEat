CREATE DATABASE IF NOT EXISTS campuseats;
USE campuseats;

DROP TABLE IF EXISTS dishes;
CREATE TABLE dishes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  price     DECIMAL(8,2) NOT NULL,
  available TINYINT(1)   NOT NULL DEFAULT 1
);

INSERT INTO dishes (name, price, available) VALUES
  ('Masala Dosa',  60.00, 1),
  ('Veg Burger',   80.00, 1),
  ('Cold Coffee',  50.00, 1),
  ('Chole Bhature',70.00, 0);
