-- ============== UserService ==============
CREATE TABLE Users (
    user_id         INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'STUDENT', -- STUDENT | STAFF | VENDOR_ADMIN
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Addresses (
    address_id      INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL,
    label           VARCHAR(30),                 -- "Hostel", "Dept Block"
    line1           VARCHAR(150) NOT NULL,
    line2           VARCHAR(150),
    city_zone       VARCHAR(50)  NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- ============== CatalogueService ==============
CREATE TABLE Vendors (
    vendor_id       INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(120) NOT NULL,
    campus_zone     VARCHAR(50)  NOT NULL,
    rating          DECIMAL(2,1) DEFAULT 0.0,
    is_open         BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE MenuItems (
    item_id         INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id       INT NOT NULL,
    name            VARCHAR(120) NOT NULL,
    category        VARCHAR(50),
    price           DECIMAL(8,2) NOT NULL,
    available_qty   INT NOT NULL DEFAULT 0,
    FOREIGN KEY (vendor_id) REFERENCES Vendors(vendor_id)
);

-- ============== OrderService ==============
CREATE TABLE Orders (
    order_id              INT PRIMARY KEY AUTO_INCREMENT,
    user_id               INT NOT NULL,           -- ref only: UserService.Users
    vendor_id             INT NOT NULL,           -- ref only: CatalogueService.Vendors
    delivery_address_id   INT NOT NULL,           -- ref only: UserService.Addresses
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                           -- PENDING | CONFIRMED | PREPARING | OUT_FOR_DELIVERY | DELIVERED | CANCELLED
    total_amount          DECIMAL(10,2) NOT NULL,
    created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE OrderItems (
    order_item_id         INT PRIMARY KEY AUTO_INCREMENT,
    order_id              INT NOT NULL,
    item_id               INT NOT NULL,           -- ref only: CatalogueService.MenuItems
    item_name_snapshot    VARCHAR(120) NOT NULL,  -- copied at order time (Catalogue may change later)
    unit_price_snapshot   DECIMAL(8,2) NOT NULL,
    quantity              INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

CREATE TABLE OrderStatusHistory (
    history_id      INT PRIMARY KEY AUTO_INCREMENT,
    order_id        INT NOT NULL,
    status          VARCHAR(20) NOT NULL,
    changed_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

-- ============== PaymentService ==============
CREATE TABLE Wallets (
    wallet_id       INT PRIMARY KEY AUTO_INCREMENT,
    user_id         INT NOT NULL UNIQUE,          -- ref only: UserService.Users
    balance         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Transactions (
    transaction_id  INT PRIMARY KEY AUTO_INCREMENT,
    wallet_id       INT NOT NULL,
    order_id        INT NOT NULL,                 -- ref only: OrderService.Orders
    amount          DECIMAL(10,2) NOT NULL,
    status          VARCHAR(20) NOT NULL,          -- SUCCESS | FAILED | REFUNDED
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES Wallets(wallet_id)
);

-- ============== DeliveryService ==============
CREATE TABLE Riders (
    rider_id        INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20)  NOT NULL,
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    current_zone    VARCHAR(50)
);

CREATE TABLE Deliveries (
    delivery_id       INT PRIMARY KEY AUTO_INCREMENT,
    rider_id          INT NOT NULL,
    order_id          INT NOT NULL,                -- ref only: OrderService.Orders
    pickup_vendor_id  INT NOT NULL,                -- ref only: CatalogueService.Vendors
    drop_address_id   INT NOT NULL,                -- ref only: UserService.Addresses
    status            VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
                       -- ASSIGNED | PICKED_UP | EN_ROUTE | DELIVERED | FAILED
    assigned_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at      DATETIME,
    FOREIGN KEY (rider_id) REFERENCES Riders(rider_id)
);

-- ============== NotificationService ==============
CREATE TABLE Notifications (
    notification_id  INT PRIMARY KEY AUTO_INCREMENT,
    user_id          INT NOT NULL,                 -- ref only: UserService.Users
    type             VARCHAR(30) NOT NULL,          -- ORDER_CONFIRMED | PAYMENT_RECEIPT | DELIVERY_UPDATE ...
    payload          TEXT,
    status            VARCHAR(20) NOT NULL DEFAULT 'SENT',
    sent_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
