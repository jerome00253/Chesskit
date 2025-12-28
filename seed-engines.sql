-- Script SQL pour peupler la table engines avec les moteurs Stockfish existants
-- Exécutez ce script dans phpMyAdmin ou MySQL Workbench

-- Stockfish 17 Lite (Par défaut)
INSERT INTO engines (name, identifier, version, type, filePath, isActive, isDefault, createdAt, updatedAt)
VALUES 
('Stockfish 17 Lite', 'stockfish_17_lite', '17', 'lite', '/engines/stockfish-17/stockfish-17-lite.js', 1, 1, NOW(), NOW());

-- Stockfish 17 Standard
INSERT INTO engines (name, identifier, version, type, filePath, isActive, isDefault, createdAt, updatedAt)
VALUES 
('Stockfish 17', 'stockfish_17', '17', 'standard', '/engines/stockfish-17/stockfish-17.js', 1, 0, NOW(), NOW());

-- Stockfish 16.1 Lite
INSERT INTO engines (name, identifier, version, type, filePath, isActive, isDefault, createdAt, updatedAt)
VALUES 
('Stockfish 16.1 Lite', 'stockfish_16_1_lite', '16.1', 'lite', '/engines/stockfish-16.1/stockfish-16.1-lite.js', 1, 0, NOW(), NOW());

-- Stockfish 16.1 Standard
INSERT INTO engines (name, identifier, version, type, filePath, isActive, isDefault, createdAt, updatedAt)
VALUES 
('Stockfish 16.1', 'stockfish_16_1', '16.1', 'standard', '/engines/stockfish-16.1/stockfish-16.1.js', 1, 0, NOW(), NOW());

-- Stockfish 16 NNUE
INSERT INTO engines (name, identifier, version, type, filePath, isActive, isDefault, createdAt, updatedAt)
VALUES 
('Stockfish 16 NNUE', 'stockfish_16_nnue', '16', 'nnue', '/engines/stockfish-16/stockfish-nnue-16.js', 1, 0, NOW(), NOW());

-- Stockfish 11 (Désactivé par défaut car ancien)
INSERT INTO engines (name, identifier, version, type, filePath, isActive, isDefault, createdAt, updatedAt)
VALUES 
('Stockfish 11', 'stockfish_11', '11', 'standard', '/engines/stockfish-11.js', 1, 0, NOW(), NOW());

-- Vérifier que tout a été inséré
SELECT * FROM engines ORDER BY isDefault DESC, version DESC;
