-- Catálogo global
CREATE TABLE ingredient (
  id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(80)   NOT NULL UNIQUE,
  unit  VARCHAR(10)   NOT NULL,
  price DECIMAL(10,4) NOT NULL            -- precio por unidad (ej. 0.0050 €/ml)
);

CREATE TABLE coffee (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80) NOT NULL UNIQUE,
  predefined BOOLEAN NOT NULL DEFAULT FALSE      -- el precio se calcula, no se guarda
);

CREATE TABLE recipe_item (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  coffee_id     BIGINT NOT NULL,
  ingredient_id BIGINT NOT NULL,
  quantity      DECIMAL(10,2) NOT NULL,
  UNIQUE (coffee_id, ingredient_id),
  FOREIGN KEY (coffee_id)     REFERENCES coffee(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredient(id)
);

-- Cafeteras y su stock
CREATE TABLE machine (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(8)  NOT NULL UNIQUE,
  name       VARCHAR(80) NOT NULL,
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE TABLE machine_stock (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  machine_id    BIGINT NOT NULL,
  ingredient_id BIGINT NOT NULL,
  stock         DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock     DECIMAL(10,2) NOT NULL DEFAULT 0,
  UNIQUE (machine_id, ingredient_id),
  CHECK (stock >= 0),
  FOREIGN KEY (machine_id)    REFERENCES machine(id)    ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredient(id)
);

-- Historial (con copias de nombre y precio, para que no cambie si se edita el catálogo)
CREATE TABLE serving (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  machine_id  BIGINT        NOT NULL,
  coffee_id   BIGINT        NULL,
  coffee_name VARCHAR(80)   NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  customized  BOOLEAN       NOT NULL DEFAULT FALSE,
  served_at   DATETIME(6)   NOT NULL,
  INDEX idx_serving_machine_date (machine_id, served_at),
  FOREIGN KEY (machine_id) REFERENCES machine(id),
  FOREIGN KEY (coffee_id)  REFERENCES coffee(id) ON DELETE SET NULL
);

CREATE TABLE serving_item (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  serving_id      BIGINT        NOT NULL,
  ingredient_id   BIGINT        NULL,
  ingredient_name VARCHAR(80)   NOT NULL,
  unit            VARCHAR(10)   NOT NULL,
  quantity        DECIMAL(10,2) NOT NULL,
  unit_price      DECIMAL(10,4) NOT NULL,
  FOREIGN KEY (serving_id)    REFERENCES serving(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredient(id) ON DELETE SET NULL
);

-- Usuarios
CREATE TABLE app_user (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL,
  active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE TABLE user_machine (
  user_id    BIGINT NOT NULL,
  machine_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, machine_id),
  FOREIGN KEY (user_id)    REFERENCES app_user(id) ON DELETE CASCADE,
  FOREIGN KEY (machine_id) REFERENCES machine(id)  ON DELETE CASCADE
);

CREATE TABLE restock_log (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  machine_id    BIGINT        NOT NULL,
  ingredient_id BIGINT        NOT NULL,
  user_id       BIGINT        NULL,
  quantity      DECIMAL(10,2) NOT NULL,
  restocked_at  DATETIME(6)   NOT NULL,
  INDEX idx_restock_machine (machine_id, restocked_at),
  FOREIGN KEY (machine_id)    REFERENCES machine(id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredient(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)       REFERENCES app_user(id) ON DELETE SET NULL
);
