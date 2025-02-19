INSERT INTO utilisateur (nom, prenom, mot_de_passe, date_naissance, telephone, langue, email, adresse)
VALUES ('Dupont', 'Jean', 'motdepasse123', '1990-05-15', '+33612345678', 'Français', 'jean.dupont@email.com', '123 Rue de Paris, 75000 Paris');

CREATE TABLE utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,    -- ID unique pour chaque utilisateur
    nom VARCHAR(100) NOT NULL,            -- Nom de l'utilisateur
    prenom VARCHAR(100) NOT NULL,         -- Prénom de l'utilisateur
    mot_de_passe VARCHAR(255) NOT NULL,   -- Mot de passe de l'utilisateur
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP, -- Date d'inscription
    date_naissance DATE,                  -- Date de naissance de l'utilisateur
    telephone VARCHAR(20),                -- Numéro de téléphone
    langue VARCHAR(50),                   -- Langue de l'utilisateur
    email VARCHAR(255) UNIQUE NOT NULL,   -- Adresse e-mail (unique)
    adresse VARCHAR(255)                  -- Adresse de l'utilisateur
);
