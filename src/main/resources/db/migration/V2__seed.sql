INSERT INTO ingredient (name, unit, price) VALUES
  ('Café molido',     'g',  0.1500),
  ('Agua',            'ml', 0.0010),
  ('Leche',           'ml', 0.0050),
  ('Espuma de leche', 'ml', 0.0060),
  ('Chocolate',       'g',  0.0300);

INSERT INTO coffee (name, predefined) VALUES
  ('Espresso', TRUE), ('Americano', TRUE), ('Cortado', TRUE), ('Capuchino', TRUE), ('Mocca', TRUE);

INSERT INTO recipe_item (coffee_id, ingredient_id, quantity)
SELECT c.id, i.id, r.q FROM (
    SELECT 'Espresso' c, 'Café molido' i, 8 q UNION ALL SELECT 'Espresso','Agua',30
    UNION ALL SELECT 'Americano','Café molido',8 UNION ALL SELECT 'Americano','Agua',120
    UNION ALL SELECT 'Cortado','Café molido',8 UNION ALL SELECT 'Cortado','Agua',30
    UNION ALL SELECT 'Cortado','Leche',30
    UNION ALL SELECT 'Capuchino','Café molido',8 UNION ALL SELECT 'Capuchino','Agua',30
    UNION ALL SELECT 'Capuchino','Leche',60 UNION ALL SELECT 'Capuchino','Espuma de leche',60
    UNION ALL SELECT 'Mocca','Café molido',8 UNION ALL SELECT 'Mocca','Agua',30
    UNION ALL SELECT 'Mocca','Leche',100 UNION ALL SELECT 'Mocca','Chocolate',20
) r JOIN coffee c ON c.name = r.c JOIN ingredient i ON i.name = r.i;

-- Cafetera de demo con stock inicial
INSERT INTO machine (code, name) VALUES ('CAFE2345', 'Cafetera de demo');

INSERT INTO machine_stock (machine_id, ingredient_id, stock, min_stock)
SELECT m.id, i.id, s.stock, s.min_stock
FROM machine m
JOIN (
    SELECT 'Café molido' n, 1000 stock, 200 min_stock
    UNION ALL SELECT 'Agua', 5000, 1000
    UNION ALL SELECT 'Leche', 3000, 500
    UNION ALL SELECT 'Espuma de leche', 2000, 300
    UNION ALL SELECT 'Chocolate', 500, 100
) s
JOIN ingredient i ON i.name = s.n
WHERE m.code = 'CAFE2345';
