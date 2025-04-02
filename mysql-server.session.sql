CREATE TABLE items (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT,
    id_reservation INT,  
    nombreJoueur INT NOT NULL, 
    prix DECIMAL(10,2) NOT NULL, 
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_reservation) REFERENCES reservations(id_reservation) ON DELETE CASCADE
);