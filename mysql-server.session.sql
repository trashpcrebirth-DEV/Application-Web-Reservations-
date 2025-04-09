CREATE TABLE liste_attente (
    id_attente INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    id_reservation INT NOT NULL,
    nombreJoueur INT NOT NULL, 
    prix DECIMAL(10,2) NOT NULL, 
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id),
    FOREIGN KEY (id_reservation) REFERENCES reservations(id_reservation)
);