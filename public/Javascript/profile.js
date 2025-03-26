// LE LIEN N'EST PAS ENCORE FAIT ENTRE LE HTML ET LE JS

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé - JavaScript externe fonctionnel"); // Pour le débogage
    
    // Éléments du DOM
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveButton');
    const saveForm = document.getElementById('saveForm');
    const historiqueBtn = document.getElementById('historiqueBtn');
    
    if (!editBtn || !saveBtn || !saveForm || !historiqueBtn) {
        console.error("Un ou plusieurs éléments n'ont pas été trouvés dans le DOM");
        return;
    }
    
    // Activer le mode édition
    editBtn.addEventListener('click', enableEdit);
    
    // Redirection vers l'historique
    historiqueBtn.addEventListener('click', function() {
        window.location.href = '/historique'; // Retirez le preventDefault
    });
    
    // Validation du formulaire
    saveForm.addEventListener('submit', validateForm);
});

function enableEdit() {
    console.log("Bouton Modifier cliqué");
    const editables = document.querySelectorAll('.editable');
    const saveButton = document.getElementById('saveButton');
    const editBtn = document.getElementById('editBtn');
    
    if (!editables.length || !saveButton || !editBtn) {
        console.error("Éléments pour l'édition non trouvés");
        return;
    }
    
    editables.forEach(function(element) {
        element.disabled = false;
        element.style.backgroundColor = "#f7f7f7";
    });
    saveButton.style.display = 'inline-block';
    editBtn.style.display = 'none';
}

function validateForm(event) {
    console.log("Validation du formulaire");
    const nom = document.getElementsByName('nom')[0]?.value;
    const prenom = document.getElementsByName('prenom')[0]?.value;
    const email = document.getElementsByName('email')[0]?.value;
    const telephone = document.getElementsByName('telephone')[0]?.value;
    
    if (!nom || !prenom || !email) {
        event.preventDefault();
        alert('Nom, prénom et email sont obligatoires');
        return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        event.preventDefault();
        alert('Veuillez entrer un email valide');
        return false;
    }
    
    if (telephone && !/^[0-9]{10}$/.test(telephone)) {
        event.preventDefault();
        alert('Le numéro de téléphone doit contenir 10 chiffres');
        return false;
    }
    
    return true;
}