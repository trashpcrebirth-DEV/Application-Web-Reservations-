/*
    Importing the required modules
*/

import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2";
import { body, validationResult } from "express-validator";
import dateFormat from "dateformat";
import multer from "multer";

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
    const dateReservation = req.query.date; // Date sélectionnée
    con.query("SELECT * FROM reservations WHERE DATE(date_time) = ?", [dateReservation], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json({ reservations: results });
    });
});

app.post('/api/reserver', async (req, res) => {
    const { id } = req.body;
    
    try {
        // Utiliser con.promise() pour gérer correctement await
        await con.promise().query("UPDATE reservations SET statut = 'Réservé' WHERE id_reservation = ?", [id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la réservation :", error);
        res.json({ success: false });
    }
});

app.post('/api/annuler', async (req, res) => {
    const { id } = req.body;
    
    try {
        // Utiliser con.promise() pour gérer correctement await
        await con.promise().query("UPDATE reservations SET statut = 'Disponible' WHERE id_reservation = ?", [id]);
        
        res.json({ success: true });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la réservation :", error);
        res.json({ success: false });
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

app.post('/modifier', (req, res) => {
    const { id, nom, prenom, mot_de_passe, date_naissance, telephone, langue, email, adresse } = req.body;
    console.log(req.body);
    // Assuming you are updating the user in the database using an SQL query
    const query = `
        UPDATE utilisateurs 
        SET nom = ?, prenom = ?, mot_de_passe = ?, date_naissance = ?, 
            telephone = ?, langue = ?, email = ?, adresse = ? 
        WHERE id = ?
    `;

    con.query(query, [nom, prenom, mot_de_passe, date_naissance, telephone, langue, email, adresse, id], (err, result) => {
        if (err) {
            console.error("Error updating user:", err);
            return res.status(500).send("Error updating user information");
        }

        if (result.affectedRows > 0) {
            // If update is successful, redirect to the profile page of the updated user
            res.redirect(`/profile?id=${id}`);
        } else {
            res.status(404).send("User not found or no changes made");
        }
    });
});

// Route pour la page de contact
app.get("/contact", (req, res) => {
    res.render("pages/contact", { activePage: 'contact',
        user: req.session.user
    }); // Render le fichier contact.ejs
});

//Prend l'image uploadée et l'ajoute à la base de données
const upload = multer({ dest: "./public/images/images-evenement" });

// Route pour l'ajout d'événement
app.post("/ajouter-evenement", upload.single("image_url"), (req, res) => {
    const { nom, date_evenement, lieu, type, description, participants } = req.body;
    const image_url = `/images/images-evenement/${req.file.filename}`;

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

app.post('/inscription', function (req, res) {
    const { nom, prenom, email, mot_de_passe } = req.body;

    // Check if email already exists
    const checkEmailQuery = "SELECT * FROM utilisateurs WHERE email = ?";
    con.query(checkEmailQuery, [email], function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
            // Email already exists
            res.status(400).json({ success: false, error: "Adresse courriel existe déjà" });
        } else {
            // Insert new user
            const requete = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)";
            const parametres = [nom, prenom, email, mot_de_passe];

            con.query(requete, parametres, function (err, result) {
                if (err) throw err;
                res.json({ success: true });
            });
        }
    });
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/connexion', function (req, res) {
    const requete = "SELECT * FROM utilisateurs WHERE email = ? AND mot_de_passe = ?";
    const parametres = [req.body.email, req.body.mot_de_passe];

    con.query(requete, parametres, function (err, result) {
        if (err) {
            console.error("Erreur lors de la connexion :", err);
            return res.status(500).json({ success: false, message: "Erreur serveur" });
        }

        if (result.length > 0) {
            // Connexion réussie
            console.log("Connexion réussie pour l'utilisateur:", result[0]);
            req.session.user = result[0]; // Sauvegarder l'utilisateur dans la session
            return res.json({ success: true });

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


