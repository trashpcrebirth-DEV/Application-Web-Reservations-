function enableEdit() {
    console.log("Activation du mode édition");
    const editables = document.querySelectorAll('.editable');

    editables.forEach(function(element) {
        element.disabled = false;
        element.style.backgroundColor = "#fff";
        element.style.borderColor = "#4361ee";
    });

    document.getElementById('saveButton').style.display = 'inline-flex';
    document.querySelector('[onclick="enableEdit()"]').style.display = 'none';
}

function validateForm() {
    console.log("Validation du formulaire");
    const nom = document.getElementsByName('nom')[0].value;
    const prenom = document.getElementsByName('prenom')[0].value;
    const email = document.getElementsByName('email')[0].value;
    const phone = document.getElementById('phoneInput').value;

    if (!nom || !prenom || !email) {
        alert('Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email)');
        return false;
    }

    if (!email.includes('@')) {
        alert('Veuillez entrer une adresse email valide');
        return false;
    }

    if (phone && !/^\d{3}-\d{3}-\d{4}$/.test(phone)) {
        alert('Veuillez entrer un numéro de téléphone valide (format: 514-111-1111)');
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

function formatPhoneNumber() {
    const phoneInput = document.getElementById('phoneInput');
    
    phoneInput.addEventListener('input', function(e) {
        // Enlève tout ce qui n'est pas un chiffre
        let phoneNumber = this.value.replace(/\D/g, '');
        
        // Formatage: 3-3-4
        if (phoneNumber.length > 6) {
            phoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        } else if (phoneNumber.length > 3) {
            phoneNumber = phoneNumber.replace(/(\d{3})(\d{0,3})/, '$1-$2');
        }
        
        this.value = phoneNumber;
    });

    // Permet de supprimer les tirets si l'utilisateur efface
    phoneInput.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && this.value.endsWith('-')) {
            this.value = this.value.slice(0, -1);
        }
    });
}

// Animation au chargement
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.profile-info').style.opacity = '1';
    formatPhoneNumber();
});