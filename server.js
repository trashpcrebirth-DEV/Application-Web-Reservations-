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
            activePage: 'accueil'
        });
    });
});

// Route pour la page de réservation
app.get("/reservation", (req, res) => {
    res.render("pages/reservation", { activePage: 'reservation' }); // Render le fichier reservation.ejs
});

// Route pour la page de profile
app.get("/profile", (req, res) => {
    const userId = 1; // ID de l'utilisateur

    const query = "SELECT * FROM utilisateurs WHERE id = ?";
    
    con.query(query, [userId], (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
            const user = result[0];
            res.render("pages/profile", {
                activePage: 'profile',
                user: user
            });
        } else {
            res.status(404).send("Utilisateur non trouvé");
        }
    });
});


// Route pour la page de contact
app.get("/contact", (req, res) => {
    res.render("pages/contact", { activePage: 'contact' }); // Render le fichier contact.ejs
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
            avis: results
        });
    });
});

// Route pour la page à propos des événements
app.get("/AProposEvenement", (req, res) => {
<<<<<<< HEAD

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
            evenementsParMois
        });
    });
});



=======
    res.render("pages/AProposEvenement", {
        activePage: 'accueil'
    });
});
>>>>>>> aeb2602607010ceabb187aad0d1f246221f12cad

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/inscription', function (req, res) {

    const requete = "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)";
    const parametres = [
        req.body.nom,
        req.body.prenom,
        req.body.email,
        req.body.mot_de_passe
    ];

    con.query(requete, parametres, function (err, result) {
        if (err) throw err;
        res.redirect("/");
    });
});

app.post('/connexion', function (req, res) {
    const requete = "SELECT * FROM utilisateurs WHERE email = ? AND mot_de_passe = ?";
    const parametres = [req.body.email, req.body.mot_de_passe];

    con.query(requete, parametres, function (err, result) {
        if (err) {
            console.error("Erreur lors de la connexion :", err);
            return res.status(500).send('Erreur serveur');
        }

        if (result.length > 0) {
            // Utilisateur trouvé, connexion réussie
            console.log("Utilisateur connecté :", result[0]);
            res.redirect("/profile"); // Redirigez vers la page de profil ou une autre page appropriée
        } else {
            // Utilisateur non trouvé, connexion échouée
            console.log("Échec de la connexion : utilisateur non trouvé");
            res.status(401).send('Adresse courriel ou mot de passe incorrect');
        }
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

/*
Permettre l'utilisation de body lors des POST request
*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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

app.get("/reservation", function (req, res) {
    res.render("pages/reservation");  
});
