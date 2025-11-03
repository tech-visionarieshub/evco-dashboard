-- Insertar clientes desde los datos existentes
INSERT INTO clientes (cust_id, name) VALUES
('CUST001', 'Acme Corporation'),
('CUST002', 'Global Industries Ltd.'),
('CUST003', 'Tech Solutions Inc.'),
('CUST004', 'Manufacturing Co.'),
('CUST005', 'Retail Partners LLC'),
('CUST006', 'Distribution Network'),
('CUST007', 'Supply Chain Masters'),
('CUST008', 'Industrial Equipment Co.'),
('CUST009', 'Commercial Enterprises'),
('CUST010', 'Business Solutions Group')
ON CONFLICT (cust_id) DO NOTHING;
