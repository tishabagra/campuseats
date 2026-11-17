CREATE DATABASE accounts;

USE accounts;
CREATE TABLE `USER` (
         user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(100) NOT NULL,
         email VARCHAR(150) NOT NULL UNIQUE,
         phone VARCHAR(20),
         password VARCHAR(255) NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
CREATE TABLE ADDRESS (
         address_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         user_id BIGINT NOT NULL,
         address_line1 VARCHAR(255) NOT NULL,
         address_line2 VARCHAR(255),
         city VARCHAR(100) NOT NULL,
         pincode VARCHAR(10) NOT NULL,
         is_default BOOLEAN DEFAULT FALSE,
    
         CONSTRAINT fk_address_user
             FOREIGN KEY (user_id)
             REFERENCES `USER`(user_id)
     );

CREATE DATABASE payments;

USE payments;
CREATE TABLE TRANSACTIONS (
         transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         order_id BIGINT NOT NULL,
         amount DECIMAL(10,2) NOT NULL,
         payment_method VARCHAR(50) NOT NULL,
         status VARCHAR(30) NOT NULL,
         paid_at TIMESTAMP NULL
     );
CREATE TABLE REFUNDS (
         refund_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         transaction_id BIGINT NOT NULL,
         refund_amount DECIMAL(10,2) NOT NULL,
         refunded_at TIMESTAMP NULL,
         reason VARCHAR(255),
    
         CONSTRAINT fk_refund_transaction
             FOREIGN KEY (transaction_id)
             REFERENCES TRANSACTIONS(transaction_id)
     );

CREATE DATABASE delivery;

USE delivery;
CREATE TABLE RIDERS (
         rider_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(100) NOT NULL,
         phone VARCHAR(20) NOT NULL,
         vehicle_type VARCHAR(50),
         is_active BOOLEAN DEFAULT TRUE
     );
CREATE TABLE ASSIGNMENT (
         assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         rider_id BIGINT NOT NULL,
         order_id BIGINT NOT NULL,
         status VARCHAR(30) NOT NULL,
         assigned_at TIMESTAMP NULL,
         picked_up_at TIMESTAMP NULL,
         delivered_at TIMESTAMP NULL,
    
         CONSTRAINT fk_assignment_rider
             FOREIGN KEY (rider_id)
             REFERENCES RIDERS(rider_id)
     );

CREATE DATABASE catalogue;

USE catalogue;
CREATE TABLE RESTAURANT (
         restaurant_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(150) NOT NULL,
         location VARCHAR(255),
         is_active BOOLEAN DEFAULT TRUE
     );
CREATE TABLE MENU (
         item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         restaurant_id BIGINT NOT NULL,
         item_name VARCHAR(150) NOT NULL,
         price DECIMAL(10,2) NOT NULL,
         is_available BOOLEAN DEFAULT TRUE,
    
         CONSTRAINT fk_menu_restaurant
             FOREIGN KEY (restaurant_id)
             REFERENCES RESTAURANT(restaurant_id)
     );

CREATE DATABASE notifications;

USE notifications;
CREATE TABLE MESSAGE_LOG (
         message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         user_id BIGINT NOT NULL,
         order_id BIGINT NOT NULL,
         way VARCHAR(30) NOT NULL,
         sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         status VARCHAR(30) NOT NULL,
         message TEXT
     );

CREATE DATABASE orders;

USE orders;
CREATE TABLE ORDERS (
         order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
         user_id BIGINT NOT NULL,
         address_id BIGINT NOT NULL,
         order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         status VARCHAR(30) NOT NULL,
         estimated_time INT,
         amount DECIMAL(10,2) NOT NULL
     );
CREATE TABLE `ORDER ITEMS` (
         order_item BIGINT AUTO_INCREMENT PRIMARY KEY,
         order_id BIGINT NOT NULL,
         item_id BIGINT NOT NULL,
         quantity INT NOT NULL,
         unit_price DECIMAL(10,2) NOT NULL,
         subtotal DECIMAL(10,2) NOT NULL,
    
         CONSTRAINT fk_order_item_order
             FOREIGN KEY (order_id)
             REFERENCES ORDERS(order_id)
     );
