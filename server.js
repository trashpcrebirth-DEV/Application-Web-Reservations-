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
    const { date, month, year, sport } = req.query;
    
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

    con.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json({ reservations: results });
    });
});


// Route pour réserver un sport
app.post('/reserver/:id', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("Vous devez être connecté pour effectuer une réservation.");
    }

    const reservationId = req.params.id; // ID de la réservation passée dans l'URL
    const userId = req.session.user.id; // ID de l'utilisateur connecté

    console.log("ID de l'utilisateur connecté :", userId); // Vérifiez si l'ID est défini
    console.log("ID de la réservation :", reservationId); // Vérifiez l'ID de la réservation

    // Requête SQL pour mettre à jour la réservation
    const query = `UPDATE reservations SET statut = ?, user_id = ? WHERE id_reservation = ?`;
    con.query(query, ["Réservé", userId, reservationId], (err, result) => {
        if (err) {
            console.error("Erreur lors de la mise à jour de la réservation :", err);
            return res.status(500).send("Erreur lors de la mise à jour de la réservation.");
        }

        if (result.affectedRows > 0) {
            // Increment the cart count in the session
            req.session.user.cartCount = (req.session.user.cartCount || 0) + 1;

            // Redirect to a confirmation page or back to the reservation page
            res.redirect(`/reservation-information/${reservationId}`);
        } else {
            res.status(404).send("Réservation non trouvée ou déjà mise à jour.");
        }
    });
});
app.post('/api/annuler', async (req, res) => {
    const { id } = req.body;

    try {
        // Requête SQL pour annuler la réservation
        const query = "UPDATE reservations SET statut = 'Disponible', user_id = NULL WHERE id_reservation = ?";
        const [result] = await con.promise().query(query, [id]);

        if (result.affectedRows > 0) {
            // Decrement the cart count in the session
            if (req.session.user && req.session.user.cartCount > 0) {
                req.session.user.cartCount -= 1;
            }

            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Réservation non trouvée." });
        }
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

            con.query("SELECT nom FROM installations WHERE id_installation = ?", [reservation.id_installation], (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Erreur serveur");
                }

                const nom_insta = results.length > 0 ? results[0].nom : "Installation inconnue";

                res.render("pages/information_reservation", {
                    siteTitle: "SportZone",
                    pageTitle: "Détails de la réservation",
                    activePage: "reservation",
                    user: req.session.user,
                    reservation: reservation,
                    nom_installation: nom_insta
                });
            });
        });
    } else {
        res.redirect("/connexion");
    }
});





// Route pour la page de profile
app.get("/profile", (req, res) => {

    const userId = req.session.user.id; // Utiliser l'ID de l'utilisateur connecté

    const query = "SELECT * FROM utilisateurs WHERE id = ?";

    con.query(query, [userId], (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
            const user = result[0];
            user.date_inscription = new Date(user.date_inscription); // Convertir en objet Date
            res.render("pages/profile", {
                activePage: 'profile',
                user: user // Pass user information to the view
            });
        } else {
            res.status(404).send("Utilisateur non trouvé");
        }
    });
});

// Update user
app.post('/modifier', (req, res) => {
    const { nom, prenom, mot_de_passe, date_naissance, telephone, langue, email, adresse } = req.body;
    console.log("Request body:", req.body);

    const userId = req.session.user.id;

    // Prepare values for the query
    const valuesToUpdate = [
        nom || null,
        prenom || null,
        mot_de_passe || null,
        date_naissance || null,
        telephone || null,
        langue || null,
        email || null,
        adresse || null
    ];

    const query = `
        UPDATE utilisateurs 
        SET nom = ?, prenom = ?, mot_de_passe = ?, date_naissance = ?, 
            telephone = ?, langue = ?, email = ?, adresse = ? 
        WHERE id = ?
    `;

    console.log("Executing query:", query);
    console.log("With values:", [...valuesToUpdate, userId]);

    // Execute the query
    con.query(query, [...valuesToUpdate, userId], (err, result) => {
        if (err) {
            console.error("Error updating user:", err);
            return res.status(500).send("Error updating user information");
        }

        if (result.affectedRows > 0) {
            res.redirect(`/profile?id=${userId}`); // Redirect to profile page
        } else {
            res.status(404).send("User not found or no changes made");
        }
    });
});







// Route pour la page de contact
app.get("/contact", (req, res) => {
    res.render("pages/contact", {
        activePage: 'contact',
        user: req.session.user
    }); // Render le fichier contact.ejs
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
    const query = "INSERT INTO Liste_Evenements (nom, date_evenement, lieu, description, participants, image_url) VALUES (?, ?, ?, ?, ?, ?)";

    con.query(query, [nom, formattedDate, lieu, description, formattedParticipants, image_url], (err, result) => {
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

    con.query("SELECT * FROM Liste_Evenements ORDER BY date_evenement", (err, results) => {
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
app.get('/deconnexion', function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.error("Erreur lors de la déconnexion :", err);
            return res.status(500).json({ success: false, message: "Erreur serveur" });
        }
        console.log("Déconnexion réussie");
        res.redirect('/'); // Rediriger vers la page d'accueil après la déconnexion
    });
});

app.get("/checkout", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/connexion"); // Redirigez si l'utilisateur n'est pas connecté
    }

    try {
        // Récupérer les réservations de l'utilisateur depuis MySQL
        const [reservations] = await con.promise().query(
            "SELECT * FROM reservations WHERE user_id = ? AND statut = 'Réservé'",
            [req.session.user.id]
        );

        if (reservations.length === 0) {
            return res.status(400).send("Aucune réservation trouvée pour le paiement.");
        }

        // Transformer les réservations en `line_items` pour Stripe
        const line_items = reservations.map((reservation) => ({
            price_data: {
                currency: "usd", // Remplacez par la devise souhaitée
                product_data: {
                    name: reservation.categorie_sport, // Nom du sport

                },
                unit_amount: Math.round(reservation.prix * 100), // Stripe attend un montant en centimes
            },
            quantity: 1, // Chaque réservation est comptée comme une unité
        }));

        // Créer une session de paiement Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            mode: "payment",
            success_url: "http://localhost:4000/success",
            cancel_url: "http://localhost:4000/paiement",
        });

        // Rediriger l'utilisateur vers la page de paiement Stripe
        res.redirect(session.url);
    } catch (error) {
        console.error("Erreur lors de la création de la session Stripe :", error);
        res.status(500).send("Erreur serveur");
    }
});

// Remplacer toute la route /paiement existante par :
app.get("/paiement", async (req, res) => {
    if (!req.session.user) return res.redirect("/connexion");

    try {
        // Récupérer les données de MySQL
        const [reservations] = await con.promise().query(
            "SELECT * FROM reservations WHERE user_id = ?",
            [req.session.user.id]
        );

        // Récupérer les paiements depuis MongoDB
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


