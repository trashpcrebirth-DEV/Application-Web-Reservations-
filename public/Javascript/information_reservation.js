document.addEventListener("DOMContentLoaded", function () {
    const isRempliInformartion = document.getElementById("isRempliInformartion");
    const nombreJoueursInput = document.getElementById("nombreJoueurs");
    const listeNbJoueur = document.getElementById("listeNbJoueur");
    const prixElement = document.getElementById("prix");
    const basePrice = parseInt(prixElement.textContent);
    const maxPlayers = parseInt(document.getElementById("placeMaximale").textContent);

    function updatePrice() {
        let numberOfPlayers = parseInt(nombreJoueursInput.value, 10);  

        if (isNaN(numberOfPlayers) || numberOfPlayers < 1) {
            numberOfPlayers = 1;
        }

        if (numberOfPlayers > maxPlayers && !isRempliInformartion) {
            alert(`Le nombre de joueurs ne peut pas dépasser ${maxPlayers}.`);
            numberOfPlayers = maxPlayers; 
            nombreJoueursInput.value = maxPlayers; 
        }

        const updatedPrice = basePrice * numberOfPlayers;

        prixElement.textContent = `${updatedPrice} $`;
        listeNbJoueur.textContent = `${numberOfPlayers}`;
    }

    nombreJoueursInput.addEventListener("input", updatePrice);

    updatePrice();
});

document.addEventListener("DOMContentLoaded", function () { 
    const form = document.querySelector('form');
    const nombreJoueursInput = document.getElementById('nombreJoueurs');
    const prixInput = document.getElementById('prix');
    const id_reservation = document.getElementById('id-reservation').dataset.id;

    form.addEventListener('submit', function (event) {
        const nombreJoueurs = nombreJoueursInput.value;
        const prixValeur = prixInput.textContent.replace(/[^\d.]/g, '');
        form.action = `/reserver/${id_reservation}/${nombreJoueurs}/${prixValeur}`;
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('form-liste-attente');
    const nombreJoueursInput = document.getElementById('nombreJoueurs');
    const prixInput = document.getElementById('prix');
    const id_reservation = document.getElementById('id-reservation').dataset.id; // Utilisation du dataset de l'élément span

    const listeNbJoueur = document.getElementById('listeNbJoueur');
    listeNbJoueur.textContent = nombreJoueursInput.value;

    form.addEventListener('submit', function (event) {
        const nombreJoueurs = nombreJoueursInput.value;
        const prixValeur = prixInput.textContent.replace(/[^\d.]/g, ''); 

        form.action = `/ajouter-liste-attente/${id_reservation}/${nombreJoueurs}/${prixValeur}`;

    });
});

