DROP TABLE IF EXISTS "bans" CASCADE;
DROP TABLE IF EXISTS "tokens" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "addresses" CASCADE;
DROP TABLE IF EXISTS "kitchens" CASCADE;
DROP TABLE IF EXISTS "dishes" CASCADE;
DROP TABLE IF EXISTS "menus" CASCADE;
DROP TABLE IF EXISTS "statuses" CASCADE;
DROP TABLE IF EXISTS "items" CASCADE;
DROP TABLE IF EXISTS "invitations" CASCADE;

CREATE TABLE "bans" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

INSERT INTO "bans" (reason) VALUES('No ban');
INSERT INTO "bans" (reason) VALUES('No proper personal details provided');
INSERT INTO "bans" (reason) VALUES('Spamming the service with too many requests');

CREATE TABLE "tokens" (
    "user_id" TEXT NOT NULL,
    "new_account_token" TEXT,
    "new_password_token" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id")
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" VARCHAR(10) UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "verified" BOOL DEFAULT FALSE,
    "flag" BOOL DEFAULT FALSE,
    "note" TEXT,
    "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referral_code" TEXT,
    "parent_refferal_code" TEXT,
    "ban_id" INT NOT NULL DEFAULT 1,
    "address_id" TEXT UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "flat_no" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "street_1" TEXT NOT NULL,
    "street_2" TEXT,
    "landmark" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

CREATE TABLE "invitations" (
    "id" SERIAL,
    "code" TEXT NOT NULL UNIQUE,
    "used" BOOL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

CREATE TABLE "statuses" (
    "id" INT NOT NULL,
    "message" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

INSERT INTO "statuses" VALUES('100', 'Pending');
INSERT INTO "statuses" VALUES('101', 'Pending Approval');
INSERT INTO "statuses" VALUES('200', 'Confirmed');
INSERT INTO "statuses" VALUES('201', 'Delivered');
INSERT INTO "statuses" VALUES('300', 'Ready To Ship');
INSERT INTO "statuses" VALUES('301', 'Shipped');
INSERT INTO "statuses" VALUES('400', 'Cancelled');
INSERT INTO "statuses" VALUES('500', 'Declined');

-- one order from only one kitchen and can have many menu items
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "no" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kitchen_id" TEXT NOT NULL,
    "address_id" TEXT NOT NULL,
    "invoice_no" TEXT,
    "amount" INT NOT NULL,
    "status_id" INT NOT NULL DEFAULT 200, -- CONFIRMED
    "alternative_address" TEXT,
    "user_note" TEXT,
    "admin_note" TEXT,
    "kitchen_note" TEXT,
    "delivery_date" TIMESTAMP(3) NOT NULL,
    "cancellation_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "order_id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "quantity" INT NOT NULL,
    "unit_price" INT NOT NULL,
    "total_price" INT NOT NULL,
    "discount" INT DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY("id")
);

CREATE TABLE "kitchens" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" VARCHAR(10) UNIQUE,
    "phone2" VARCHAR(10),
    "email" TEXT NOT NULL UNIQUE,
    "active" BOOL NOT NULL DEFAULT true,
    "veg" BOOL,
    "image" TEXT,
    "address_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

CREATE TABLE "menus" (
    "id" TEXT NOT NULL UNIQUE,
    "kitchen_id" TEXT NOT NULL,
    "dish_id" TEXT NOT NULL,
    "name" TEXT,
    "subtitle" TEXT,
    "description" TEXT,
    "active" BOOL NOT NULL DEFAULT true,
    "veg" BOOL NOT NULL DEFAULT true,
    "servings" TEXT,
    "recommended" BOOL NOT NULL DEFAULT false,
    "price" INT NOT NULL DEFAULT 0,
    "discount" INT NOT NULL DEFAULT 0,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("kitchen_id", "dish_id")
);

CREATE TABLE "dishes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOL NOT NULL DEFAULT true,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

-- ALTER TABLE "users" ADD CONSTRAINT "users.phone_unique" UNIQUE ("phone")

ALTER TABLE "tokens" ADD FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE SET NULL;

ALTER TABLE "users" ADD FOREIGN KEY ("ban_id") REFERENCES "bans"("id") ON DELETE SET NULL ON UPDATE SET NULL;
ALTER TABLE "users" ADD FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE SET NULL;

ALTER TABLE "addresses" ADD FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE SET NULL;

ALTER TABLE "kitchens" ADD FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE SET NULL;

ALTER TABLE "orders" ADD FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE SET NULL;
ALTER TABLE "orders" ADD FOREIGN KEY ("kitchen_id") REFERENCES "kitchens"("id") ON DELETE SET NULL ON UPDATE SET NULL;
ALTER TABLE "orders" ADD FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE SET NULL;
ALTER TABLE "orders" ADD FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE SET NULL ON UPDATE SET NULL;

ALTER TABLE "menus" ADD FOREIGN KEY ("kitchen_id") REFERENCES "kitchens"("id") ON DELETE SET NULL ON UPDATE SET NULL;
ALTER TABLE "menus" ADD FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE SET NULL ON UPDATE SET NULL;

ALTER TABLE "items" ADD FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE SET NULL;
ALTER TABLE "items" ADD FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE SET NULL;

-- CREATE OR REPLACE FUNCTION function_update_kitchens()
-- RETURNS TRIGGER
-- AS
-- $$
-- BEGIN
-- UPDATE menus M
--     SET "active" = (NEW.active AND D.active)
--     FROM dishes D
--     WHERE M.kitchen_id = NEW.id AND M.dish_id = D.id;
-- RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER  trigger_update_kitchens
-- AFTER UPDATE ON kitchens 
-- FOR EACH ROW 
-- EXECUTE PROCEDURE function_update_kitchens();

-- CREATE OR REPLACE FUNCTION function_update_dishes()
-- RETURNS TRIGGER
-- AS
-- $$
-- BEGIN
-- UPDATE menus M
--     SET "active" = (NEW.active AND K.active)
--     FROM kitchens K
--     WHERE M.dish_id = NEW.id AND M.kitchen_id = K.id;
-- RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER  trigger_update_dishes
-- AFTER UPDATE ON dishes 
-- FOR EACH ROW 
-- EXECUTE PROCEDURE function_update_dishes();

-- CREATE VIEW view_menus
-- AS 
-- SELECT M.*, ((K.active) AND (D.active)) "view_active"
-- FROM menus M 
-- INNER JOIN kitchens K on K.id = M.kitchen_id
-- INNER JOIN dishes D on D.id = M.dish_id;

create view activeness
    as
    select m.id, m.kitchen_id, m.dish_id, (m.active AND k.active AND d.active) as total_active, m.active as menu_active, k.active as kitchen_active, d.active as dishes_active
    from menus m
    join kitchens k on m.kitchen_id = k.id
    join dishes d on m.dish_id = d.id;

-- CREATE OR REPLACE FUNCTION validate_active(kitchen_id TEXT, dish_id TEXT, val BOOL) 
-- RETURNS BOOL
-- AS $$
--   DECLARE check_kitchen_active BOOL;
--   DECLARE check_dish_active BOOL;

-- BEGIN

-- SELECT active into check_kitchen_active FROM kitchens WHERE id = kitchen_id;
-- SELECT active into check_dish_active FROM dishes WHERE id = dish_id;

-- IF val
-- THEN RETURN (check_kitchen_active AND check_dish_active);
-- ELSE RETURN true;
-- END IF;

-- END;
-- $$ LANGUAGE plpgsql;

-- ALTER TABLE menus ADD CONSTRAINT constraint_menus_active CHECK(validate_active(kitchen_id, dish_id, active));