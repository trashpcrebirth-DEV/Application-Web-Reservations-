/*
    Importing the required modules
*/
import bcrypt from "bcrypt";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2";
import { body, validationResult } from "express-validator";
import dateFormat from "dateformat";
import multer from "multer";
import Stripe from "stripe";
import mongoose from 'mongoose';
import PDFDocument from "pdfkit";
import fs from "fs";
import moment from "moment";
import nodemailer from 'nodemailer';
import crypto from 'crypto';


// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/mongodb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connexion à MongoDB réussie");
}).catch((err) => {
    console.error("Erreur de connexion MongoDB:", err);
});



const stripe = new Stripe("sk_test_51R4MLIFZkxHTL2uBltxLNi9y1KcLf4AX5O9wCZ3BbEOhyAJFh1TDsESZcHpdtizXfr0b7kQp6YZ6j7IiAgqXNrNg00r0gp3FDe");
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*
Connect to server
*/
const server = app.listen(4000, function () {
    console.log("serveur fonctionne sur 4000... ! ");
});

/*
Configuration de EJS
*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/*
Importation de Bootstrap
*/
app.use("/js", express.static(__dirname + "/node_modules/bootstrap/dist/js"));
app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
Configuration des sessions
*/
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.use('/images', express.static('public/images'));


/*
Connection au server MySQL
*/

const con = mysql.createConnection({
    host: "localhost",
    user: "scott",
    password: "oracle",
    database: "mybd",
});
con.connect(function (err) {
    if (err) throw err;
    console.log("connected!");
});

/*
Description des routes
*/
app.get("/", function (req, res) {
    con.query("SELECT * FROM e_events ORDER BY e_start_date DESC", function (err,
        result) {
        if (err) throw err;
        res.render("pages/accueil", {
            siteTitle: "SportZone",
            pageTitle: "Accueil",
            items: result,
            activePage: 'accueil',
            user: req.session.user // Pass user session to the view
        });
    });
});


app.use(async (req, res, next) => {
    if (req.session.user) {
        try {
            const [rows] = await con.promise().query(
                "SELECT COUNT(*) AS count FROM notifications WHERE id_utilisateur = ? AND is_read = FALSE",
                [req.session.user.id]
            );
            req.session.user.notificationsCount = rows[0].count;
        } catch (err) {
            console.error("Erreur lors du comptage des notifications :", err);
            req.session.user.notificationsCount = 0;
        }
    }
    next();
});

// Route pour la page de réservation
app.get("/reservation", (req, res) => {
    const dateReservation = req.query.date; // Date sélectionnée envoyée en paramètre

    // Requête SQL pour récupérer les réservations pour cette date
    con.query("SELECT * FROM reservations WHERE DATE(date_time) = ?", [dateReservation], (err, results) => {
        if (err) throw err;

        // Rendre la vue avec les résultats des réservations
        res.render("pages/reservation", {
            activePage: 'reservation',
            reservations: results,
            user: req.session.user // Pass user session to the view
        });
    });
});

// Route API pour récupérer les réservations au format JSON
app.get("/api/reservation", (req, res) => {
    const { date, month, year, sport, installation } = req.query;

    let query = "SELECT * FROM reservations WHERE 1=1";
    let params = [];

    if (date) {
        query += " AND DATE(date_time) = ?";
        params.push(date);
    } else if (month && year) {
        query += " AND MONTH(date_time) = ? AND YEAR(date_time) = ?";
        params.push(month, year);
    }

    if (sport && sport.trim() !== "" && sport !== "Tous les sports") {
        query += " AND categorie_sport = ?";
        params.push(sport);
    }

    if (installation && installation.trim() !== "" && installation !== "Tous les installations") {
        query += " AND installation = ?";
        params.push(installation);
    }

    con.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json({ reservations: results });
    });
});



// Route pour réserver un sport
app.post('/reserver/:id/:nombreJoueurs/:prix', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Vous devez être connecté pour effectuer une réservation.");
    }

    const reservationId = req.params.id;
    const userId = req.session.user.id;
    const nombreJoueurs = parseInt(req.params.nombreJoueurs);
    const prixTape = parseFloat(req.params.prix);


    console.log("ID de l'utilisateur connecté :", userId);
    console.log("ID de la réservation :", reservationId);
    console.log("Nombre de joueurs :", nombreJoueurs); // Vérifie le nombre de joueurs


    // Requête SQL pour ajouter l'item (réservation)
    const addItemQuery = `INSERT INTO items (id_utilisateur, id_reservation, nombreJoueur, prix) VALUES (?, ?, ?, ?)`;
    con.query(addItemQuery, [userId, reservationId, nombreJoueurs, prixTape], (err, result) => {
        if (err) {
            console.error("Erreur lors de l'ajout de l'item:", err);
            return res.status(500).send("Erreur lors de la mise à jour de la réservation.");
        }

        if (result.affectedRows > 0) {
            req.session.user.cartCount = (req.session.user.cartCount || 0) + 1;
            return res.redirect(`/reservation-information/${reservationId}`);
        } else {
            return res.status(404).send("La réservation n'a pas pu être mise à jour.");
        }
    });

});


app.post('/api/annuler/:id', async (req, res) => {
    const reservationId = req.params.id;
    const userId = req.session.user.id;

    try {
        const annulerReservationQuery = `SELECT nombreJoueur FROM utilisateurs_reservations WHERE id_reservation = ? AND id_utilisateur = ?`;

        con.query(annulerReservationQuery, [reservationId, userId], (err, results) => {
            if (err) {
                console.error('Erreur SQL lors de la récupération du nombre de joueurs:', err);
                return res.status(500).json({ success: false, message: "Erreur lors de la récupération du nombre de joueurs." });
            }

            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "Réservation non trouvée dans la table utilisateurs_reservations." });
            }

            const nombreJoueurAnnule = results[0].nombreJoueur;

            const getCurrentCapacityQuery = `SELECT capacite FROM reservations WHERE id_reservation = ?`;

            con.query(getCurrentCapacityQuery, [reservationId], (err, results) => {
                if (err) {
                    console.error('Erreur SQL lors de la récupération de la capacité:', err);
                    return res.status(500).json({ success: false, message: "Erreur lors de la récupération de la capacité." });
                }

                if (results.length === 0) {
                    return res.status(404).json({ success: false, message: "Réservation non trouvée." });
                }

                const currentCapacity = results[0].capacite;
                let newCapacity = currentCapacity + nombreJoueurAnnule;

                const updateCapacityQuery = `UPDATE reservations SET capacite = ? WHERE id_reservation = ?`;

                con.query(updateCapacityQuery, [newCapacity, reservationId], (err, result) => {
                    if (err) {
                        console.error('Erreur SQL lors de la mise à jour de la capacité:', err);
                        return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour de la capacité de la réservation." });
                    }

                    if (newCapacity > 0) {
                        const updateStatusQuery = `UPDATE reservations SET statut = 'Disponible' WHERE id_reservation = ?`;
                        con.query(updateStatusQuery, [reservationId], (err) => {
                            if (err) {
                                console.error('Erreur lors de la mise à jour du statut:', err);
                            }
                        });
                    }
                    const deleteReservationQuery = `DELETE FROM utilisateurs_reservations WHERE id_reservation = ? AND id_utilisateur = ?`;

                    con.query(deleteReservationQuery, [reservationId, userId], (err, result) => {
                        if (err) {
                            console.error('Erreur SQL lors de la suppression de la réservation utilisateur:', err);
                            return res.status(500).json({ success: false, message: "Erreur lors de l'annulation de la réservation." });
                        }

                        if (newCapacity > 0) {
                            const getListeAttenteQuery = `SELECT * FROM liste_attente WHERE id_reservation = ? ORDER BY date_ajout ASC`;

                            con.query(getListeAttenteQuery, [reservationId], (err, attenteList) => {
                                if (err) {
                                    console.error('Erreur SQL lors de la récupération de la liste d’attente:', err);
                                    return res.status(500).json({ success: false, message: "Erreur lors de la récupération de la liste d'attente." });
                                }

                                for (let i = 0; i < attenteList.length && newCapacity > 0; i++) {
                                    const utilisateur = attenteList[i];

                                    if (utilisateur.nombreJoueur <= newCapacity) {
                                        const addUserToReservationQuery = `INSERT INTO items (id_utilisateur, id_reservation, nombreJoueur, prix) VALUES (?, ?, ?, ?)`;

                                        con.query(addUserToReservationQuery, [utilisateur.id_utilisateur, reservationId, utilisateur.nombreJoueur, utilisateur.prix], (err) => {
                                            if (err) {
                                                console.error('Erreur SQL lors de l’ajout de l’utilisateur de la liste d’attente à la réservation:', err);
                                            } else {
                                                newCapacity -= utilisateur.nombreJoueur;

                                                const deleteFromAttenteQuery = `DELETE FROM liste_attente WHERE id_attente = ?`;
                                                con.query(deleteFromAttenteQuery, [utilisateur.id_attente]);
                                            }
                                        });
                                    }
                                }
                                const updateFinalCapacityQuery = `UPDATE reservations SET capacite = ? WHERE id_reservation = ?`;
                                con.query(updateFinalCapacityQuery, [newCapacity, reservationId], (err) => {
                                    if (err) {
                                        console.error('Erreur lors de la mise à jour finale de la capacité après gestion de la liste d’attente:', err);
                                    }
                                });
                            });
                        }
                        res.redirect(`/reservation-information/${reservationId}`);
                    });
                });
            });
        });
    } catch (error) {
        console.error("Erreur lors de l'annulation de la réservation :", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
});


app.post('/ajouter-liste-attente/:id_reservation/:nombreJoueurs/:prix', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Vous devez être connecté pour rejoindre la liste d'attente.");
    }

    const id_utilisateur = req.session.user.id;
    const id_reservation = req.params.id_reservation;
    const nombreJoueurs = parseInt(req.params.nombreJoueurs);
    const prixTape = parseFloat(req.params.prix);


    const insertQuery = `
        INSERT INTO liste_attente (id_utilisateur, id_reservation, nombreJoueur, prix)
        VALUES (?, ?, ?, ?)
    `;

    con.query(insertQuery, [id_utilisateur, id_reservation, nombreJoueurs, prixTape], (err, result) => {
        if (err) {
            console.error("Erreur lors de l'ajout à la liste d'attente :", err);
            return res.status(500).send("Une erreur est survenue lors de l'ajout à la liste d'attente.");
        }

        if (result.affectedRows > 0) {
            return res.redirect(`/reservation-information/${id_reservation}`);
        } else {
            return res.status(400).send("Impossible d'ajouter à la liste d'attente.");
        }
    });
});

app.get("/reservation-information/:id", function (req, res) {
    if (req.session.user) {
        const reservationId = req.params.id;
        const userId = req.session.user.id;

        con.query("SELECT * FROM reservations WHERE id_reservation = ?", [reservationId], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Erreur serveur");
            }

            if (results.length === 0) {
                return res.status(404).send("Réservation non trouvée");
            }

            const reservation = results[0];

            con.query("SELECT * FROM utilisateurs_reservations WHERE id_reservation = ? AND id_utilisateur = ?", [reservationId, userId], (err, reservationCheck) => {
                if (err) {
                    console.error("Erreur lors de la vérification de la réservation :", err);
                    return res.status(500).send("Erreur serveur");
                }

                const isUserHasReservation = reservationCheck.length > 0;
                const isCapaciteRempli = reservation.capacite <= 0 && reservationCheck.length <= 0;

                con.query("SELECT * FROM items WHERE id_reservation = ? AND id_utilisateur = ?", [reservationId, userId], (err, dansPanier) => {
                    if (err) {
                        console.error("Erreur lors de la récupération des items :", err);
                        return res.status(500).json({ message: "Erreur serveur" });
                    }

                    const isDansPanier = dansPanier.length > 0;

                    con.query("SELECT * FROM liste_attente WHERE id_reservation = ? AND id_utilisateur = ?", [reservationId, userId], (err, attenteCheck) => {
                        if (err) {
                            console.error("Erreur lors de la vérification de la liste d'attente :", err);
                            return res.status(500).send("Erreur serveur");
                        }

                        const isDansListeAttente = attenteCheck.length > 0;

                        res.render("pages/information_reservation", {
                            siteTitle: "SportZone",
                            pageTitle: "Détails de la réservation",
                            activePage: "reservation",
                            user: req.session.user,
                            reservation: reservation,
                            nombreJoueurs: 1,
                            isDansPanier: isDansPanier,
                            isDejaReserve: isUserHasReservation,
                            isRempli: isCapaciteRempli,
                            isDansListeAttente: isDansListeAttente
                        });
                    });
                });
            });
        });
    } else {
        res.redirect("/connexion");
    }
});




// Route pour la page de profile
app.get("/profile", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/connexion"); // Redirige si l'utilisateur n'est pas connecté
    }
    const userId = req.session.user.id; // ID de l'utilisateur connecté

    // Requête pour récupérer les informations de l'utilisateur
    const queryUser = "SELECT * FROM utilisateurs WHERE id = ?";

    // Requête pour compter le nombre de réservations en fonction de id_reservation
    const queryReservations = "SELECT COUNT(id_reservation) AS nombreCommandes FROM utilisateurs_reservations WHERE id_utilisateur = ?";

    con.query(queryUser, [userId], (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
            const user = result[0];
            user.date_inscription = new Date(user.date_inscription);

            // Exécuter la seconde requête pour récupérer le nombre de commandes
            con.query(queryReservations, [userId], (err, resultReservations) => {
                if (err) throw err;

                const nombreCommandes = resultReservations[0].nombreCommandes || 0;

                res.render("pages/profile", {
                    activePage: 'profile',
                    user: req.session.user,
                    utilisateur: user,
                    nombreCommandes: nombreCommandes // Passer le nombre de commandes à la vue
                });
            });

        } else {
            res.status(404).send("Utilisateur non trouvé");
        }
    });
});


// Update user
app.post('/modifier', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Unauthorized");
    }

    const userId = req.session.user.id;
    const { nom, prenom, mot_de_passe, date_naissance, telephone, langue, email, adresse } = req.body;

    // Validation
    if (!nom || !prenom || !email) {
        return res.status(400).send("Nom, prénom et email sont obligatoires");
    }

    try {
        // Construction dynamique de la requête
        let query = "UPDATE utilisateurs SET nom = ?, prenom = ?, ";
        const values = [nom, prenom];

        // Ajouter le mot de passe seulement s'il est fourni
        if (mot_de_passe && mot_de_passe.trim() !== "") {
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
            query += "mot_de_passe = ?, ";
            values.push(hashedPassword);
        }

        // Suite de la requête
        query += "date_naissance = ?, telephone = ?, langue = ?, email = ?, adresse = ? WHERE id = ?";
        values.push(
            date_naissance || null,
            telephone || null,
            langue || null,
            email,
            adresse || null,
            userId
        );

        con.query(query, values, (err, result) => {
            if (err) {
                console.error("Error updating user:", err);
                return res.status(500).send("Error updating user information");
            }

            if (result.affectedRows > 0) {
                // Mettre à jour les informations de session si nécessaire
                req.session.user.nom = nom;
                req.session.user.prenom = prenom;
                req.session.user.email = email;

                res.redirect(`/profile?id=${userId}`);
            } else {
                res.status(404).send("User not found or no changes made");
            }
        });
    } catch (error) {
        console.error("Error hashing password:", error);
        res.status(500).send("Error updating user information");
    }
});







// Route pour la page de contact
app.get("/contact", (req, res) => {
    if (req.session.user) {
        res.render("pages/contact", {
            activePage: 'contact',
            user: req.session.user
        }); // Render le fichier contact.ejs
    } else {

        res.redirect("/connexion?alertConnexion=success");
    }
});

//Prend l'image uploadée et l'ajoute à la base de données
const upload = multer({ dest: "./public/images/images-evenement" });

// Route pour l'ajout d'événement
app.post("/ajouter-evenement", upload.single("image_url"), (req, res) => {
    const { nom, date_evenement, lieu, type, description, participants } = req.body;
    const image_url = `./public/images/images-evenement/${req.file.filename}`;

    console.log("Body:", req.body);
    console.log("Fichier:", req.file);
    let formattedParticipants = participants; // Initialisation de la variable

    if (type === "Individuel") {
        formattedParticipants += " participants"; // Ajoute " participants" à la valeur existante
    } else if (type === "Equipe") {
        formattedParticipants += " équipes"; // Ajoute " équipes" à la valeur existante
    }

    if (!nom || !date_evenement || !lieu || !description || !participants || !image_url) {
        return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const formattedDate = dateFormat(date_evenement, "yyyy-mm-dd");
    const query = "INSERT INTO Liste_Evenements (nom, date_evenement, lieu, description, participants, image_url, statut) VALUES (?, ?, ?, ?, ?, ?, ?)";

    con.query(query, [nom, formattedDate, lieu, description, formattedParticipants, image_url, "En attente"], (err, result) => {
        if (err) {
            console.error("Erreur lors de l'insertion de l'événement :", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.redirect(`/contact?alertEvenement=success`);
    });
});

//Route pour ajouter un avis
app.post('/ajouter-avis', (req, res) => {
    console.log(req.body);

    const { nom, note, commentaire } = req.body;
    const dateAujourdhui = new Date(); // Récupère la date du jour
    const image_url = "/images/default-avatar.png"; //la fonctionnalité de photo de profile n'est pas encore implémentée


    if (!nom || !note || !commentaire) {
        return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const query = "INSERT INTO avis_desUtilisateurs (nom, note, commentaire, date, image) VALUES (?, ?, ?, ?, ?)";

    con.query(query, [nom, note, commentaire, dateAujourdhui, image_url], (err, result) => {
        if (err) {
            console.error("Erreur lors de l'insertion de l'avis :", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.redirect(`/contact?alertAvis=success`);

    });
});


// Route pour la page de connexion
app.get("/connexion", (req, res) => {
    res.render("pages/connexion", { activePage: 'connexion' }); // Render le fichier connexion.ejs
});

// Route pour la page de inscription
app.get("/inscription", (req, res) => {
    res.render("pages/inscription"); // Render le fichier connexion.ejs
});

// Route pour la page À propos de l'utilisateur
app.get('/AProposUtilisateur', (req, res) => {
    con.query("SELECT * FROM avis_desUtilisateurs", function (err,
        results) {
        if (err) throw err;
        res.render("pages/AProposUtilisateur", {
            siteTitle: "SportZone",
            pageTitle: "Nos utilisateurs",
            activePage: 'accueil',
            avis: results,
            user: req.session.user
        });
    });
});

app.get('/AProposInstallations', (req, res) => {
    res.render("pages/AProposInstallations", {
        activePage: 'accueil',
        user: req.session.user
    });
});

// Route pour la page à propos des événements
app.get("/AProposEvenement", (req, res) => {

    con.query(`SELECT * FROM Liste_Evenements WHERE statut = "Acceptée" ORDER BY date_evenement;`, (err, results) => {
        const evenementsParMois = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ].map((month, index) => ({
            month,
            items: results
                .filter(evenement => new Date(evenement.date_evenement).getMonth() === index) // https://stackoverflow.com/questions/52282799/how-to-create-a-query-string-filtering-the-search-by-specific-parameters
                .map(evenement => ({
                    titre: evenement.nom,
                    date: new Date(evenement.date_evenement).toLocaleDateString(),
                    lieu: evenement.lieu,
                    description: evenement.description,
                    participants: evenement.participants,
                    image: evenement.image_url
                }))
        }));

        // Envoi des données à la vue
        res.render("pages/AProposEvenement", {
            activePage: 'accueil',
            evenementsParMois,
            user: req.session.user // Pass user session to the view

        });
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/inscription', async function (req, res) {
    const { nom, prenom, email, mot_de_passe } = req.body;

    // Check if email already exists
    const checkEmailQuery = "SELECT * FROM utilisateurs WHERE email = ?";
    con.query(checkEmailQuery, [email], async function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            // Email already exists
            res.status(400).json({ success: false, error: "Adresse courriel existe déjà" });
            console.log("Adresse courriel existe déjà");
        } else {
            // Hash the password
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

            // Insert new user
            const requete = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)";
            const parametres = [nom, prenom, email, hashedPassword];

            con.query(requete, parametres, function (err, result) {
                if (err) throw err;
                res.json({ success: true });
                console.log("Nouvel utilisateur inscrit :", parametres);
            });
        }
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/connexion', function (req, res) {
    const { email, mot_de_passe } = req.body;
    const requete = "SELECT * FROM utilisateurs WHERE email = ?";
    const parametres = [email];
    con.query(requete, parametres, async function (err, result) {
        if (err) {
            console.error("Erreur lors de la connexion :", err);
            return res.status(500).json({ success: false, message: "Erreur serveur" });
        }

        if (result.length > 0) {
            const user = result[0];
            const match = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

            if (match) {
                // Connexion réussie
                console.log("Connexion réussie pour l'utilisateur:", user);
                req.session.user = user; // Sauvegarder l'utilisateur dans la session
                return res.json({ success: true });
            } else {
                // Connexion échouée
                return res.json({ success: false, message: "Adresse courriel/mot de passe invalide" });
            }
        } else {
            // Connexion échouée
            return res.json({ success: false, message: "Adresse courriel/mot de passe invalide" });
        }
    });
});

// Route pour la déconnexion
app.get('/deconnexion', (req, res) => {
    if (req.session.user) {
        const userId = req.session.user.id;

        // Supprimer les items du panier associés à l'utilisateur
        const deleteItemsQuery = "DELETE FROM items WHERE id_utilisateur = ?";
        con.query(deleteItemsQuery, [userId], (err, result) => {
            if (err) {
                console.error("Erreur lors de la suppression des items du panier :", err);
                return res.status(500).send("Erreur serveur");
            }

            console.log("Items supprimés pour l'utilisateur :", userId);

            // Détruire la session après avoir vidé les items
            req.session.destroy((err) => {
                if (err) {
                    console.error("Erreur lors de la destruction de la session :", err);
                    return res.status(500).send("Erreur serveur");
                }

                // Rediriger vers la page de connexion ou d'accueil
                res.redirect("/connexion");
            });
        });
    } else {
        // Si aucun utilisateur n'est connecté, rediriger directement
        res.redirect("/connexion");
    }
});
app.delete('/api/items/:id', (req, res) => {
    const reservationId = req.params.id;

    const query = "DELETE FROM reservations WHERE id_reservation = ?";
    con.query(query, [reservationId], (err, result) => {
        if (err) {
            console.error("Erreur lors de la suppression :", err);
            return res.status(500).json({ success: false, message: "Erreur serveur." });
        }

        if (result.affectedRows > 0) {
            // Décrémenter le compteur de réservations dans la session
            if (req.session.user && req.session.user.cartCount > 0) {
                req.session.user.cartCount -= 1;
            }
            res.json({ success: true, message: "Réservation supprimée avec succès." });
        } else {
            res.status(404).json({ success: false, message: "Réservation non trouvée." });
        }
    });
});
app.get("/checkout", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/connexion"); // Redirige si l'utilisateur n'est pas connecté
    }

    try {
        // Récupérer les items associés à l'utilisateur
        const [items] = await con.promise().query(
            "SELECT * FROM items WHERE id_utilisateur = ?",
            [req.session.user.id]
        );

        if (items.length === 0) {
            return res.status(400).send("Aucun item trouvé pour le paiement.");
        }

        // Récupérer les détails des réservations associées aux items
        const reservationIds = items.map(item => item.id_reservation);

        const [reservations] = await con.promise().query(
            "SELECT * FROM reservations WHERE id_reservation IN (?)",
            [reservationIds]
        );

        // Associer les réservations aux items et calculer le prix total
        const itemsAvecReservation = items.map(item => {
            const reservation = reservations.find(res => res.id_reservation === item.id_reservation);
            const prixUnitaire = reservation ? reservation.prix : 0;
            const nombreJoueur = item.nombreJoueur || 1;

            return {
                ...item,
                prix: prixUnitaire * nombreJoueur,
                categorie_sport: reservation ? reservation.categorie_sport : "Sport inconnu",
                date_time: reservation ? reservation.date_time : null,
                date_time_fin: reservation ? reservation.date_time_fin : null // 👈 ici
            };
        });

        // Créer les lignes de paiement avec le prix total multiplié par le nombre de joueurs
        const line_items = itemsAvecReservation.map((item) => {
            const dateDebut = item.date_time
                ? new Date(item.date_time).toLocaleString('fr-FR', {
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : "Date inconnue";
            const dateFin = item.date_time_fin
                ? new Date(item.date_time_fin).toLocaleString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : "Heure de fin inconnue";

            return {
                price_data: {
                    currency: "cad",
                    product_data: {
                        name: `${item.categorie_sport} (${item.nombreJoueur}x) - ${dateDebut} à ${dateFin}`, // 👈 Nom complet
                    },
                    unit_amount: Math.round(item.prix * 100),
                },
                quantity: 1,
            };
        });


        // Créer la session de paiement avec Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            mode: "payment",
            success_url: "http://localhost:4000/success",
            cancel_url: "http://localhost:4000/paiement",
        });

        // Rediriger l'utilisateur vers Stripe pour effectuer le paiement
        res.redirect(session.url);
    } catch (error) {
        console.error("Erreur lors de la création de la session Stripe :", error);
        res.status(500).send("Erreur serveur");
    }
});


app.get('/confirmation', (req, res) => {
    res.render('pages/confirmation', { message: "Votre réservation a bien été confirmée !" });
});

app.get('/success', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Vous devez être connecté pour effectuer une réservation.");
    }

    const userId = req.session.user.id;

    const [items] = await con.promise().query(
        "SELECT * FROM items WHERE id_utilisateur = ?",
        [userId]
    );

    if (items.length === 0) {
        return res.status(400).send("Aucun item trouvé pour le paiement.");
    }

    req.session.lastReservations = items;

    const promises = items.map(item => {
        return new Promise((resolve, reject) => {
            const getReservationQuery = `SELECT categorie_sport, date_time FROM reservations WHERE id_reservation = ?`;

            con.query(getReservationQuery, [item.id_reservation], (err, result) => {
                if (err) {
                    console.error('Erreur SQL lors de la récupération des infos de la réservation:', err);
                    return reject("Erreur lors de la récupération des infos de la réservation.");
                }

                if (result.length === 0) {
                    return reject("Réservation introuvable.");
                }

                const reservation = result[0];

                const formattedDate = reservation.date_time.toLocaleString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const addItemQuery = `INSERT INTO utilisateurs_reservations (id_utilisateur, id_reservation, nombreJoueur, prix, statut) 
                                      VALUES (?, ?, ?, ?, 'Réservé')`;

                con.query(addItemQuery, [userId, item.id_reservation, item.nombreJoueur, item.prix], (err, result) => {
                    if (err) {
                        console.error('Erreur SQL lors de l\'ajout de la réservation:', err);
                        return reject("Erreur lors de l'ajout de la réservation.");
                    }

                    const updateCapacityQuery = `UPDATE reservations 
                                                 SET capacite = capacite - ? 
                                                 WHERE id_reservation = ?`;

                    con.query(updateCapacityQuery, [item.nombreJoueur, item.id_reservation], (err, result) => {
                        if (err) {
                            console.error('Erreur SQL lors de la mise à jour de la capacité:', err);
                            return reject("Erreur lors de la mise à jour de la capacité.");
                        }

                        const checkCapacityQuery = `SELECT capacite FROM reservations WHERE id_reservation = ?`;

                        con.query(checkCapacityQuery, [item.id_reservation], (err, rows) => {
                            if (err) {
                                console.error('Erreur SQL lors de la vérification de la capacité:', err);
                                return reject("Erreur lors de la vérification de la capacité.");
                            }

                            const currentCapacity = rows[0].capacite;

                            if (currentCapacity <= 0) {
                                const updateStatutQuery = `UPDATE reservations SET statut = 'Pleine' WHERE id_reservation = ?`;

                                con.query(updateStatutQuery, [item.id_reservation], (err, result) => {
                                    if (err) {
                                        console.error("Erreur SQL lors de la mise à jour du statut à 'Pleine':", err);
                                        return reject("Erreur lors de la mise à jour du statut.");
                                    }

                                    const deleteItemQuery = "DELETE FROM items WHERE id_item = ?";
                                    con.query(deleteItemQuery, [item.id_item], (err, result) => {
                                        if (err) {
                                            console.error('Erreur lors de la suppression de l\'item:', err);
                                            return reject("Erreur lors de la suppression de l'item.");
                                        }

                                        const notificationQuery = `INSERT INTO notifications (id_utilisateur, message) VALUES (?, ?)`;
                                        const messageNotif = `Votre réservation pour ${reservation.categorie_sport} le ${formattedDate} a été confirmée. Rendez-vous à l'heure prévue !`;

                                        con.query(notificationQuery, [userId, messageNotif], (err, result) => {
                                            if (err) {
                                                console.error('Erreur lors de l\'ajout de la notification:', err);
                                            }

                                            resolve("Réservation complétée avec succès.");
                                        });
                                    });
                                });
                            } else {
                                const deleteItemQuery = "DELETE FROM items WHERE id_item = ?";
                                con.query(deleteItemQuery, [item.id_item], (err, result) => {
                                    if (err) {
                                        console.error('Erreur lors de la suppression de l\'item:', err);
                                        return reject("Erreur lors de la suppression de l'item.");
                                    }

                                    const notificationQuery = `INSERT INTO notifications (id_utilisateur, message) VALUES (?, ?)`;
                                    const messageNotif = `Votre réservation pour ${reservation.categorie_sport} le ${formattedDate} a été confirmée. Rendez-vous à l'heure prévue !`;

                                    con.query(notificationQuery, [userId, messageNotif], (err, result) => {
                                        if (err) {
                                            console.error('Erreur lors de l\'ajout de la notification:', err);
                                        }

                                        resolve("Réservation complétée avec succès.");
                                    });
                                });
                            }
                        });
                    });
                });
            });
        });
    });

    try {
        await Promise.all(promises);
        req.session.user.cartCount = 0;
        return res.redirect("/confirmation");
    } catch (err) {
        console.error("Erreur dans /success:", err);
        return res.status(500).send(err);
    }
});


// Remplacer toute la route /paiement existante par :
app.get("/paiement", async (req, res) => {
    if (!req.session.user) return res.redirect("/connexion");

    try {
        // Récupérer les items liés à l'utilisateur
        const [items] = await con.promise().query(
            "SELECT * FROM items WHERE id_utilisateur = ?",
            [req.session.user.id]
        );

        if (items.length === 0) {
            return res.render("pages/paiement", {
                user: req.session.user,
                reservations: [],
                paiements: [],
                activePage: "paiement"
            });
        }

        // Récupérer les détails des réservations associées aux items
        const reservationIds = items.map(item => item.id_reservation);


        const [reservations] = await con.promise().query(
            `SELECT reservations.*, items.prix, items.nombreJoueur FROM reservations JOIN items ON reservations.id_reservation = items.id_reservation WHERE items.id_utilisateur = ?`,
            [req.session.user.id]
        );

        const paiements = await mongoose.connection.db.collection('paiements')
            .find({ userId: req.session.user.id.toString() })
            .toArray();

        res.render("pages/paiement", {
            user: req.session.user,
            reservations: reservations,
            paiements: paiements,
            activePage: "paiement"
        });

    } catch (err) {
        console.error("Erreur :", err);
        res.status(500).send("Erreur serveur");
    }
});


app.post("/paiement", async (req, res) => {
    const { amount, currency, paymentMethodId } = req.body;

    try {
        // Créer un paiement avec Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Montant en centimes
            currency: currency,
            payment_method: paymentMethodId,
            confirm: true, // Confirme automatiquement le paiement
        });

        // Réponse en cas de succès
        res.json({ success: true, paymentIntent });
    } catch (error) {
        console.error("Erreur lors du paiement :", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/api/notifications", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: "Non connecté" });

    const userId = req.session.user.id;

    try {
        const [notifications] = await con.promise().query(
            "SELECT * FROM notifications WHERE id_utilisateur = ? AND is_read = FALSE ORDER BY created_at DESC",
            [userId]
        );

        res.json({ success: true, notifications });
    } catch (err) {
        console.error("Erreur lors de la récupération des notifications :", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

app.post("/api/notifications/:id/lire", async (req, res) => {
    const notificationId = req.params.id;

    try {
        await con.promise().query(
            "UPDATE notifications SET is_read = TRUE WHERE id = ?",
            [notificationId]
        );

        res.json({ success: true, message: "Notification marquée comme lue." });
    } catch (err) {
        console.error("Erreur lors de la mise à jour de la notification :", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});


app.get("/event/add", function (req, res) {
    con.query("SELECT * FROM e_events ORDER BY e_start_date DESC", function (err,
        result) {
        if (err) throw err;
        res.render("pages/reservation", {
            siteTitle: "Application simple",
            pageTitle: "Ajouter un nouvel événement",
            items: result
        });
    });
});


app.post("/event/add", function (req, res) {
    const requete = "INSERT INTO e_events (e_name, e_start_date, e_start_end, e_desc, e_location) VALUES (?, ?, ?, ?, ?)";
    const parametres = [
        req.body.e_name,
        dateFormat(req.body.e_start_date, "yyyy-mm-dd"),
        dateFormat(req.body.e_start_end, "yyyy-mm-dd"),
        req.body.e_desc,
        req.body.e_location
    ];
    con.query(requete, parametres, function (err, result) {
        if (err) throw err;
        res.redirect("/");
    });
});


/*
Edit un evenement
*/
app.get("/event/edit/:id", function (req, res) {
    const requete = "SELECT * FROM e_events WHERE E_ID = ?";
    const parametres = [req.params.id];
    con.query(requete, parametres, function (err, result) {
        if (err) throw err;
        result[0].E_START_DATE = dateFormat(result[0].E_START_DATE, "yyyy-mm-dd");
        result[0].E_START_END = dateFormat(result[0].E_END_DATE, "yyyy-mm-dd");
        res.render("pages/edit-event", {
            siteTitle: "Application simple",
            pageTitle: "Editer événement : " + result[0].E_NAME,
            item: result[0],
        });
    });
});

/*
Route
*/
app.post("/event/edit/:id", function (req, res) {
    const requete = "UPDATE e_events SET e_name = ?, e_start_date = ?, e_start_end = ?, e_desc = ?, e_location = ? WHERE e_id = ?";
    const parametres = [
        req.body.e_name,
        req.body.e_start_date,
        req.body.e_end_date,
        req.body.e_desc,
        req.body.e_location,
        req.body.e_id
    ];
    con.query(requete, parametres, function (err, result) {
        if (err) throw err;
        res.redirect("/");
    });
});
/*
Suppression
*/
app.get("/event/delete/:id", function (req, res) {
    const requete = "DELETE FROM e_events WHERE e_id = ?";
    con.query(requete, [req.params.id], function (err, result) {
        if (err) throw err;
        res.redirect("/");
    });
});




app.get('/historique', (req, res) => {
    try {
        // Vérifie si l'utilisateur est connecté
        if (!req.session.user) {
            return res.redirect('/connexion');
        }

        // Récupérer l'ID de l'utilisateur depuis la session
        const userId = req.session.user.id;
        console.log("ID utilisateur :", userId); // Vérifier que l'ID correspond bien

        // Exécuter la requête pour obtenir les réservations de l'utilisateur
        con.query(
            `SELECT r.id_reservation, r.categorie_sport, r.installation, ur.nombreJoueur, ur.statut, ur.prix FROM utilisateurs_reservations ur JOIN reservations r ON ur.id_reservation = r.id_reservation WHERE ur.id_utilisateur = ?`,
            [userId],
            (error, results) => {
                if (error) {
                    console.error("Erreur lors de l'exécution de la requête SQL :", error.stack);
                    return res.status(500).send(`<h1>Erreur</h1><p>${error.message}</p>`);
                }

                console.log("Résultats de la requête SQL :", results); // Affiche les résultats pour vérifier

                // Vérifier si des réservations existent
                const reservations = results && results.length > 0
                    ? results
                    : [{ message: "Aucune réservation trouvée" }];

                // Rendre la page avec les résultats des réservations
                res.render('pages/historique', {
                    siteTitle: "SportZone",
                    pageTitle: "Historique des réservations",
                    user: req.session.user,
                    reservations: reservations,
                    activePage: 'historique'
                });
            }
        );
    } catch (error) {
        console.error("Erreur lors du chargement de l'historique :", error.stack);
        res.status(500).send(`<h1>Erreur lors du chargement de l'historique</h1><p>${error.message}</p>`);
    }
});

// Route facture

app.get('/facture', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Vous devez être connecté pour télécharger une facture.");
    }

    if (!req.session.lastReservations || req.session.lastReservations.length === 0) {
        return res.status(400).send("Aucune réservation récente trouvée.");
    }

    const reservations = req.session.lastReservations;
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Disposition', 'attachment; filename="facture.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    const rectX = 40;
    const rectWidth = 520;
    let rectTopY = 180;
    const rowHeight = 20;
    const colWidths = [40, 120, 80, 80, 100];
    const tablePadding = 20;

    // Ajouter une image en haut
    const imagePath = 'public/images/Logo-noir.png';
    const imageWidth = 200;
    const imageHeight = 150;

    // Calcule la position X pour centrer l'image
    const xPos = ((doc.page.width - imageWidth) / 2); // Centrage horizontal de l'image
    const yPos = 20; // Position Y fixe

    // Ajouter l'image au document
    doc.image(imagePath, xPos, yPos, { width: imageWidth, height: imageHeight });
    doc.moveDown(6);

    // En-tête
    doc.fontSize(14).text('1234 Rue du Sport, Montréal, QC', { align: 'center' });
    doc.text('Téléphone : (514) 123-4567', { align: 'center' });
    doc.text('info@sportzone.ca', { align: 'center' });
    doc.moveDown();

    // Début du rectangle : on note la position Y
    rectTopY = doc.y;

    // Infos client et date
    doc
        .fontSize(16).text(`FACTURE`, { align: 'left' })
        .fontSize(12)
        .text(`Client : ${req.session.user.nom || 'Utilisateur inconnu'}`)
        .text(`Date : ${moment().format('DD/MM/YYYY')}`)
        .moveDown(2);

    doc.fontSize(14).text('Détails des Réservations :');
    doc.moveDown();

    const drawRow = (y, row, isHeader = false) => {
        let x = rectX + tablePadding;
        row.forEach((text, i) => {
            doc.rect(x, y, colWidths[i], rowHeight).stroke();
            doc.font(isHeader ? 'Helvetica' : 'Helvetica')
                .fontSize(12)
                .text(text, x + 5, y + 5, { width: colWidths[i] - 10 });
            x += colWidths[i];
        });
    };

    const tableTopY = doc.y;
    drawRow(tableTopY, ['N°', 'ID Réservation', 'Joueurs', 'Prix ($)', 'Statut'], true);

    let total = 0;
    let y = tableTopY + rowHeight;

    reservations.forEach((resv, index) => {
        const prix = parseFloat(resv.prix) || 0;
        total += prix;
        drawRow(y, [
            `${index + 1}`,
            `${resv.id_reservation}`,
            `${resv.nombreJoueur}`,
            `${prix.toFixed(2)}`,
            `Payé`
        ]);
        y += rowHeight;
    });

    // Total
    doc.moveDown();
    doc.fontSize(14).text(`Total : ${total.toFixed(2)} $`, 350);
    const rectBottomY = doc.y + 30;

    // Grand rectangle autour du contenu
    doc.rect(rectX, rectTopY - 10, rectWidth, rectBottomY - rectTopY + 20).stroke();

    // Pied de page
    doc.moveDown(3);
    doc.fontSize(10)
        .text('Merci pour votre réservation !', { align: 'center' })
        .text('Sportzone © ' + new Date().getFullYear(), { align: 'center' });

    doc.end();
    delete req.session.lastReservations;
});

// Définir le stockage pour les photos de profil
import cloudinaryModule from 'cloudinary';

const cloudinary = cloudinaryModule.v2;
cloudinary.config({
    cloud_name: 'dkdxwcfso',
    api_key: '779181997236279',
    api_secret: 'OEhNwZxk4Hm1paeMGae-oCZE30I'
});

// File filter for images only
const profileFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Seules les images sont autorisées.'), false);
    }
};

// Initialize multer for handling file uploads (Only once) - renamed to `imageUpload`
const imageUpload = multer({
    dest: 'uploads/',  // Temporary directory for storing files before Cloudinary upload
    fileFilter: profileFileFilter
});

app.post('/upload-profile-pic', imageUpload.single('profile_pic'), (req, res) => {
    console.log("Received file:", req.file);

    const userId = req.session.user.id;

    if (!req.file) {
        return res.status(400).send('Aucun fichier reçu.');
    }

    // Upload the image to Cloudinary
    cloudinary.uploader.upload(req.file.path, { folder: 'avatars' })
        .then((result) => {
            console.log("Cloudinary upload result:", result);

            // Get the URL of the uploaded image
            const imageUrl = result.secure_url;

            // Delete the file from the local storage after uploading to Cloudinary
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Failed to delete local file:", err);
            });

            // Update the user's profile with the image URL
            const updateQuery = "UPDATE utilisateurs SET photo_url = ? WHERE id = ?";
            con.query(updateQuery, [imageUrl, userId], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Erreur lors de la mise à jour de la photo de profil.');
                }
                res.redirect('/profile');
            });
        })
        .catch((err) => {
            console.error("Error uploading image to Cloudinary:", err);
            res.status(500).send("Erreur lors du téléchargement de l'image.");
        });
});

// Revert profile picture
app.post('/revert-profile-pic', async (req, res) => {
    try {
        const userId = req.session.user.id;
        await con.promise().query('UPDATE utilisateurs SET photo_url = NULL WHERE id = ?', [userId]);
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur serveur.");
    }
});


const transporter = nodemailer.createTransport({
    host: 'mail.smtp2go.com',
    port: 587, // You can also use ports 25, 2525, 8025, or 80
    secure: false, // Set to true if using port 465
    auth: {
      user: 'bdeb.qc.ca',
      pass: 'F7IaLlYeAIkIxwKc'
    }
  });
  
  
  // GET: affiche la page de mot de passe oublié
  app.get("/mot_de_passe_oublie", (req, res) => {
      res.render("pages/mot_de_passe_oublie", {
          activePage: 'mot_de_passe_oublie',
          user: req.session.user
      });
  });
  
  // POST: traite le formulaire de réinitialisation
  app.post("/mot_de_passe_oublie", (req, res) => {
      const email = req.body.email;
  
      con.query("SELECT * FROM utilisateurs WHERE email = ?", [email], (err, results) => {
          if (err) throw err;
  
          if (results.length > 0) {
              const token = crypto.randomBytes(32).toString('hex');
  
              con.query("UPDATE utilisateurs SET reset_token = ? WHERE email = ?", [token, email], (err) => {
                  if (err) throw err;
  
                  const resetLink = `http://localhost:4000/reset_password?token=${token}`;
  
                  const mailOptions = {
                      from: 'sportzone950@outlook.com',  // Adresse expéditeur
                      to: email,
                      subject: 'Réinitialisation du mot de passe',
                      html: `<p>Voici votre lien pour réinitialiser votre mot de passe : <a href="${resetLink}">${resetLink}</a></p>`
                  };
  
                  transporter.sendMail(mailOptions, (err, info) => {
                      if (err) {
                          console.error("Erreur lors de l'envoi du mail :", err);
                          return res.status(500).send("Erreur d'envoi du courriel.");
                      }
  
                      res.send("Un courriel a été envoyé avec un lien de réinitialisation.");
                  });
              });
          } else {
              res.send("Aucun compte associé à cette adresse.");
          }
      });
  });
  
  app.get("/reset_password", (req, res) => {
      const token = req.query.token;
      if (!token) return res.status(400).send("Token manquant.");
      res.render("pages/reset_password", { token });
  });
  
  app.post("/reset_password", async (req, res) => {
      const { token, password } = req.body;
      con.query("SELECT * FROM utilisateurs WHERE reset_token = ?", [token], async (err, results) => {
          if (err) throw err;
          if (results.length === 0) {
              return res.status(400).send("Lien invalide ou expiré.");
          }
          const user = results[0];
          const hashedPassword = await bcrypt.hash(password, 10);
          con.query("UPDATE utilisateurs SET mot_de_passe = ?, reset_token = NULL WHERE id = ?", [hashedPassword, user.id], (err) => {
              if (err) throw err;
              res.send("Mot de passe mis à jour avec succès. Vous pouvez maintenant vous reconnecter.");
          });
      });
  });





