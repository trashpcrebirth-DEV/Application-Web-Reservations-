# application_web_transactionnelle
Avant de commencer, assurez-vous d'avoir installer Node.js et de le vérifier avec la commande "node --version " dans le terminal

1. Clonez le dépôt sur votre machine locale
git clone https://github.com/votre-utilisateur/application_web_transactionnelle.git

2. Installez un conteneur MySQL sous Docker et creez-vous une base de données

3. Roulez le script dans la base de données qui se trouve dans NOS TABLES.txt

4. Installer un conteneur mongodb dont le port est 27017

5. Ouvrez votre mongoDB compass, sous la connexion "mongodb://localhost:27017, créez une base de données en l'appellant "mongodb".
   Ensuite, créez une collection "avis". Ouvrez MongoDB shell et roulez le script de la création des documents de la collection d'avis, située dans NOS COLLECTIONS.TXT. On a une autre collection "paiements", mais elle est automatiquement créée lors d'un paiement d'une réservation par exemple.

4. Accédez au répertoire du projet application_web_transactionnelle et démarrer le serveur, qui se trouve dans le répertoire, avec la commande "node server.js". On indique le fonctionnement du serveur avec un message à la suite de la commande.

5. Une fois connecté au serveur, rendez vous sur localhost:4000 dans votre navigateur afin de voir l'application

6. Commencez par vous inscrire en fournissant votre nom, prénom, adresse courriel ainsi qu'un mot de passe. La barre pour le mot de passe indique le niveau sécurité (faible, moyen ou fort).

7. Une fois inscrite sur le site, il faudra se connecter en donnant votre adresse courriel et votre mot de passe afin de débuter une session.

8. Lorsque que vous êtes connecté sur le site web, vous aurez la permission de faire des rendez-vous dans la catégorie "Réservation". On appuyant sur une date, le site affichera les informations de la réservation disponible ce jour-là et pourrez soit réservé ou annulé la réservation si elle a été déjà faite.

9. Vous aurez aussi droit à modifier vos informations personnelles dans la catégorie "Profile".

