document.addEventListener("DOMContentLoaded", function () {
    const isRempliInformartion = document.getElementById("isRempliInformartion");
    const nombreJoueursInput = document.getElementById("nombreJoueurs");
    const prixElement = document.getElementById("prix");
    const basePrice = parseInt(prixElement.textContent);
    const maxPlayers = parseInt(document.getElementById("placeMaximale").textContent);

    function updatePrice() {
        if (isRempliInformartion) return;

        let numberOfPlayers = parseInt(nombreJoueursInput.value, 10);  

        if (isNaN(numberOfPlayers) || numberOfPlayers < 1) {
            numberOfPlayers = 1;
        }

        if (numberOfPlayers > maxPlayers) {
            alert(`Le nombre de joueurs ne peut pas dépasser ${maxPlayers}.`);
            numberOfPlayers = maxPlayers; 
            nombreJoueursInput.value = maxPlayers; 
        }

        const updatedPrice = basePrice * numberOfPlayers;

        prixElement.textContent = `${updatedPrice} $`;
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
