function enableEdit() {
    const editables = document.querySelectorAll('.editable');
    editables.forEach(input => input.disabled = false);

    // Masquer le bouton "Modifier" et afficher le bouton "Sauvegarder"
    document.querySelector('.btn.btn-primary').style.display = 'none'; // Masque le bouton "Modifier"
    document.getElementById('saveButton').style.display = 'inline-block'; // Affiche le bouton "Sauvegarder"

    // Affiche les champs pour l'ancien et la confirmation du mot de passe
    document.getElementById('currentPasswordGroup').style.display = 'block';
    document.getElementById('confirmPasswordGroup').style.display = 'block';
}


function togglePasswordVisibility(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('fa-eye-slash', isPassword);
    }
}

function validateForm() {
    const newPassword = document.getElementById('passwordField').value;
    const currentPassword = document.querySelector('[name="ancien_mot_de_passe"]').value;
    const confirmPassword = document.querySelector('[name="confirmation_mot_de_passe"]').value;

    // Vérifie si tous les champs sont remplis
    if (newPassword || currentPassword || confirmPassword) {
        if (!newPassword || !currentPassword || !confirmPassword) {
            alert("Tous les champs de mot de passe doivent être remplis.");
            return false;
        }
        // Vérifie si les nouveaux mots de passe correspondent
        if (newPassword !== confirmPassword) {
            alert("Les nouveaux mots de passe ne correspondent pas.");
            return false;
        }
    }
    return true;
}

const passwordField = document.getElementById('passwordField');
const strengthBar = document.getElementById('passwordStrengthBar');
const strengthMessage = document.getElementById('passwordStrengthMessage');

if (passwordField) {
    passwordField.addEventListener('input', function () {
        const password = passwordField.value;
        let strength = 0;
    
        // Affiche la barre uniquement quand il y a du texte
        const container = document.getElementById('passwordStrengthContainer');
        container.style.display = password.length > 0 ? 'block' : 'none';
    
        // Calcul de la force du mot de passe
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
    
        // Met à jour la barre de force du mot de passe
        strengthBar.style.width = `${(strength / 5) * 100}%`;
    
        const colors = ['#ff4d4d', '#ff944d', '#ffff4d', '#99e600', '#33cc33'];
        strengthBar.style.backgroundColor = colors[strength - 1] || 'transparent';
    
        const messages = ['Très faible', 'Faible', 'Moyenne', 'Bonne', 'Excellente'];
        strengthMessage.textContent = messages[strength - 1] || '';
        
        // Empêcher l'envoi du formulaire si le mot de passe est trop faible
        if (strength < 3) {
            document.getElementById('saveButton').disabled = true;
            
        } else {
            document.getElementById('saveButton').disabled = false;
        }
 
    });
}

function togglePasswordVisibility(fieldId, iconElement) {
    const passwordInput = document.getElementById(fieldId);

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        iconElement.classList.remove('fa-eye');
        iconElement.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        iconElement.classList.remove('fa-eye-slash');
        iconElement.classList.add('fa-eye');
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
