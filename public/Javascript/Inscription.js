document.addEventListener('DOMContentLoaded', () => {
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('mot_de_passe');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPassword = document.getElementById('confirm_password');

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

    document.getElementById('inscriptionForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission

        var nom = document.getElementById('nom').value;
        var prenom = document.getElementById('prenom').value;
        var email = document.getElementById('email').value;
        var password = document.getElementById('mot_de_passe').value;
        var confirmPassword = document.getElementById('confirm_password').value;

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
});