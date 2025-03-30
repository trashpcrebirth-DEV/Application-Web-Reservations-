
function enableEdit() {
    console.log("Activation du mode édition");
    const editables = document.querySelectorAll('.editable');

    editables.forEach(function (element) {
        element.disabled = false;
        element.style.backgroundColor = "#f7f7f7";
        element.removeAttribute('readonly');
    });

    document.getElementById('saveButton').style.display = 'inline-block';
    document.querySelector('.modifier').style.display = 'none';
}

function validateForm() {
    console.log("Validation du formulaire");
    const nom = document.getElementsByName('nom')[0].value;
    const prenom = document.getElementsByName('prenom')[0].value;
    const email = document.getElementsByName('email')[0].value;

    if (!nom || !prenom || !email) {
        alert('Nom, prénom et email sont obligatoires');
        return false;
    }

    if (email.indexOf('@') === -1) {
        alert('Veuillez entrer un email valide (doit contenir @)');
        return false;
    }

    return true;
}

function togglePasswordVisibility() {
    const passwordField = document.getElementById('passwordField');
    const icon = document.querySelector('.toggle-password');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Si vous avez besoin d'initialiser quelque chose au chargement
});