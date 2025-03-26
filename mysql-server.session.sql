CREATE TABLE utilisateurs_reservations (
    id_utilisateur INT,
    id_reservation INT,
    nombreJoueur INT NOT NULL, 
    statut VARCHAR(50) NOT NULL DEFAULT 'Réservé',
    PRIMARY KEY (id_utilisateur, id_reservation),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_reservation) REFERENCES reservations(id_reservation) ON DELETE CASCADE
);

CREATE TABLE items (
    id_panier INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT,
    id_reservation INT,  
    nombreJoueur INT NOT NULL, 
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_reservation) REFERENCES reservations(id_reservation) ON DELETE CASCADE
);