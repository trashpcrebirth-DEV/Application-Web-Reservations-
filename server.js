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

    if (installation && installation.trim() !== "" && installation !== "Toutes les installations") {
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


app.post('/api/annuler/:id', async (req, res) => { //peut etre d'un ajout d'une table où ca enregistre le nombre de joeur lié à installation pour enlever en prenant son id
    const reservationId = req.params.id;
    const userId = req.session.user.id;

    try {
        const annulerReservationQuery = `SELECT nombreJoueur FROM utilisateurs_reservations WHERE id_reservation = ? AND id_utilisateur = ?`;

        con.query(annulerReservationQuery, [reservationId, userId], (err, results) => {
            if (err) {
                console.error('Erreur SQL lors de la récupération du nombre de joueurs:', err);
                return reject("Erreur lors de la récupération du nombre de joueurs.");
            }

            if (results.length === 0) {
                return reject("Réservation non trouvée dans la table utilisateurs_reservations.");
            }

            const nombreJoueurAnnule = results[0].nombreJoueur;

            const getCurrentCapacityQuery = `SELECT capacite FROM reservations WHERE id_reservation = ?`;

            con.query(getCurrentCapacityQuery, [reservationId], (err, results) => {
                if (err) {
                    console.error('Erreur SQL lors de la récupération de la capacité:', err);
                    return reject("Erreur lors de la récupération de la capacité.");
                }

                if (results.length === 0) {
                    return reject("Réservation non trouvée.");
                }

                const currentCapacity = results[0].capacite;

                const newCapacity = currentCapacity + nombreJoueurAnnule;

                const updateCapacityQuery = `UPDATE reservations SET capacite = ? WHERE id_reservation = ?`;

                con.query(updateCapacityQuery, [newCapacity, reservationId], (err, result) => {
                    if (err) {
                        console.error('Erreur SQL lors de la mise à jour de la capacité:', err);
                        return reject("Erreur lors de la mise à jour de la réservation.");
                    }

                    const deleteReservationQuery = `DELETE FROM utilisateurs_reservations WHERE id_reservation = ? AND id_utilisateur = ?`;

                    con.query(deleteReservationQuery, [reservationId, userId], (err, result) => {
                        if (err) {
                            console.error('Erreur SQL lors de la suppression de la réservation utilisateur:', err);
                            return reject("Erreur lors de l'annulation de la réservation.");
                        }

                        resolve("Réservation annulée et capacité mise à jour.");
                    });
                });
            });
        });

    } catch (error) {
        console.error("Erreur lors de l'annulation de la réservation :", error);
        res.json({ success: false, message: "Erreur serveur." });
    }
});

app.get("/reservation-information/:id", function (req, res) {
    if (req.session.user) {
        const reservationId = req.params.id;

        con.query("SELECT * FROM reservations WHERE id_reservation = ?", [reservationId], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Erreur serveur");
            }

            if (results.length === 0) {
                return res.status(404).send("Réservation non trouvée");
            }

            const reservation = results[0];

            con.query("SELECT * FROM utilisateurs_reservations WHERE id_reservation = ? AND id_utilisateur = ?", [reservationId, req.session.user.id], (err, reservationCheck) => {
                if (err) {
                    console.error("Erreur lors de la vérification de la réservation :", err);
                    return res.status(500).send("Erreur serveur");
                }

                const isUserHasReservation = reservationCheck.length > 0;

                const selectItemQuery = `SELECT * FROM items WHERE id_reservation = ? AND id_utilisateur = ?`;

                con.query(selectItemQuery, [reservationId, req.session.user.id], (err, dansPanier) => {
                    if (err) {
                        console.error("Erreur lors de la récupération des items :", err);
                        return res.status(500).json({ message: "Erreur serveur" });
                    }

                    const isDansPanier = dansPanier.length > 0;

                    res.render("pages/information_reservation", {
                        siteTitle: "SportZone",
                        pageTitle: "Détails de la réservation",
                        activePage: "reservation",
                        user: req.session.user,
                        reservation: reservation,
                        nombreJoueurs: 1,
                        isDansPanier: isDansPanier,
                        isDejaReserve: isUserHasReservation
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
                    user: req.session.user.id,
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

        // Supprimer les items de l'utilisateur connecté
        const deleteItemsQuery = `DELETE FROM items WHERE id_utilisateur = ?`;
        con.query(deleteItemsQuery, [userId], (err, result) => {
            if (err) {
                console.error("Erreur lors de la suppression des items :", err);
                return res.status(500).send("Erreur serveur lors de la déconnexion.");
            }

            console.log(`Items supprimés pour l'utilisateur ID: ${userId}`);

            // Détruire la session
            req.session.destroy((err) => {
                if (err) {
                    console.error("Erreur lors de la destruction de la session :", err);
                    return res.status(500).send("Erreur serveur lors de la déconnexion.");
                }

                // Rediriger vers la page d'accueil ou une autre page
                res.redirect('/');
            });
        });
    } else {
        res.redirect('/');
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

        // Associer les réservations aux items
        const itemsAvecReservation = items.map(item => {
            const reservation = reservations.find(res => res.id_reservation === item.id_reservation);
            return {
                ...item,
                prix: reservation ? reservation.prix : 0,
                categorie_sport: reservation ? reservation.categorie_sport : "Sport inconnu"
            };
        });

        const line_items = itemsAvecReservation.map((item) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.categorie_sport,
                },
                unit_amount: Math.round(item.prix * 100),
            },
            quantity: 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            mode: "payment",
            success_url: "http://localhost:4000/success",
            cancel_url: "http://localhost:4000/paiement",
        });

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

    // Récupérer les items associés à l'utilisateur dans le panier
    const [items] = await con.promise().query(
        "SELECT * FROM items WHERE id_utilisateur = ?",
        [userId]
    );

    if (items.length === 0) {
        return res.status(400).send("Aucun item trouvé pour le paiement.");
    }

    // Stocker les réservations récentes en session
    req.session.lastReservations = items;

    // Promise array pour gérer toutes les requêtes d'insertion et de suppression
    const promises = items.map(item => {
        return new Promise((resolve, reject) => {
            // Ajouter l'item dans la table utilisateurs_reservations
            const addItemQuery = `INSERT INTO utilisateurs_reservations (id_utilisateur, id_reservation, nombreJoueur, prix, statut) 
                                  VALUES (?, ?, ?, ?, 'Réservé')`;

            con.query(addItemQuery, [userId, item.id_reservation, item.nombreJoueur, item.prix], (err, result) => {
                if (err) {
                    console.error('Erreur SQL:', err);
                    reject("Erreur lors de l'ajout de la réservation.");
                } else if (result.affectedRows > 0) {
                    // Supprimer l'item du panier après l'avoir sauvegardé
                    const deleteItemQuery = "DELETE FROM items WHERE id_item = ?";
                    con.query(deleteItemQuery, [item.id_item], (err, result) => {
                        if (err) {
                            console.error('Erreur lors de la suppression de l\'item:', err);
                            reject("Erreur lors de la suppression de l'item.");
                        } else {
                            console.log("Item supprimé du panier:", item.id_item);
                            resolve();
                        }
                    });
                } else {
                    reject("Réservation non trouvée ou déjà mise à jour.");
                }
            });
        });
    });

    try {
        await Promise.all(promises);
        return res.redirect("/confirmation");
    } catch (err) {
        res.status(500).send(err);
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
            `SELECT * FROM utilisateurs_reservations WHERE id_utilisateur = ?`,
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
    const doc = new PDFDocument();

    res.setHeader('Content-Disposition', 'attachment; filename="facture.pdf"');
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Facture', { align: 'center' });
    doc.moveDown();

    reservations.forEach((resv, index) => {
        doc.fontSize(14).text(`Réservation #${index + 1}`);
        doc.text(`ID Réservation: ${resv.id_reservation}`);
        doc.text(`Nombre de joueurs: ${resv.nombreJoueur}`);
        const prix = parseFloat(resv.prix) || 0;  
        doc.text(`Prix: ${prix.toFixed(2)} $`);
        doc.text(`Statut: Réservé`);
        doc.moveDown();
    });

    doc.end();

    // Supprimer les réservations après génération de la facture
    delete req.session.lastReservations;
});