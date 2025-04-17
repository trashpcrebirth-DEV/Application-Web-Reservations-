// ...existing code...
function togglePasswordVisibility(element) {
    const input = element.previousElementSibling.previousElementSibling;
    if (input.type === "password") {
      input.type = "text";
      element.classList.remove("fa-eye");
      element.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      element.classList.remove("fa-eye-slash");
      element.classList.add("fa-eye");
    }
  }
document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('mot_de_passe');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPassword = document.getElementById('confirm_password');
    const passwordStrengthBar = document.getElementById('passwordStrengthBar');
    const passwordStrengthMessage = document.getElementById('passwordStrengthMessage');
    const passwordWeakError = document.getElementById('passwordWeakError');

    togglePassword.addEventListener('click', () => {
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye-slash');
    });

    toggleConfirmPassword.addEventListener('click', () => {
        const type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPassword.setAttribute('type', type);
        toggleConfirmPassword.classList.toggle('fa-eye-slash');
    });

    password.addEventListener('input', () => {
        const strength = getPasswordStrength(password.value);
        updatePasswordStrengthBar(strength);
        updatePasswordStrengthMessage(strength);
        passwordWeakError.style.display = 'none';
    });

    document.getElementById('inscriptionForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission

        var nom = document.getElementById('nom').value;
        var prenom = document.getElementById('prenom').value;
        var email = document.getElementById('email').value;
        var password = document.getElementById('mot_de_passe').value;
        var confirmPassword = document.getElementById('confirm_password').value;

        const strength = getPasswordStrength(password);
        if (strength <= 2) {
            passwordWeakError.style.display = 'block';
            return;
        }

        if (password !== confirmPassword) {
            document.getElementById('passwordError').style.display = 'block';
            return;
        }

        fetch('/inscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom: nom, prenom: prenom, email: email, mot_de_passe: password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/';
                } else {
                    document.getElementById('email').style.borderColor = 'red';
                    document.getElementById('mot_de_passe').style.borderColor = 'red';
                    document.getElementById('confirm_password').style.borderColor = 'red';
                    document.getElementById('emailError').style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    function getPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        return strength;
    }

    function updatePasswordStrengthBar(strength) {
        const strengthBar = passwordStrengthBar;
        strengthBar.style.width = (strength * 20) + '%';
        if (strength <= 2) {
            strengthBar.style.backgroundColor = 'red';
        } else if (strength <= 4) {
            strengthBar.style.backgroundColor = 'orange';
        } else {
            strengthBar.style.backgroundColor = 'green';
        }
    }

    function updatePasswordStrengthMessage(strength) {
        const strengthMessage = passwordStrengthMessage;
        if (strength <= 2) {
            strengthMessage.textContent = 'Faible';
            strengthMessage.style.color = 'red';
        } else if (strength <= 4) {
            strengthMessage.textContent = 'Moyen';
            strengthMessage.style.color = 'orange';
        } else {
            strengthMessage.textContent = 'Fort';
            strengthMessage.style.color = 'green';
        }
    }
});