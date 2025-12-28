-- Script SQL pour définir votre compte comme ADMIN
-- Exécutez ce script dans phpMyAdmin ou MySQL Workbench

UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'jerome0025@gmail.com';

-- Vérifier que ça a fonctionné
SELECT id, email, name, role 
FROM users 
WHERE email = 'jerome0025@gmail.com';
