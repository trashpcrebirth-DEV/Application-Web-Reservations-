document.getElementById('inscriptionForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    var password = document.getElementById('mot_de_passe').value;
    var confirmPassword = document.getElementById('confirm_password').value;
    var email = document.getElementById('email').value;

    if (password !== confirmPassword) {
        document.getElementById('mot_de_passe').style.borderColor = 'red';
        document.getElementById('confirm_password').style.borderColor = 'red';
        document.getElementById('passwordError').style.display = 'block';
    } else {
        document.getElementById('mot_de_passe').style.borderColor = '';
        document.getElementById('confirm_password').style.borderColor = '';
        document.getElementById('passwordError').style.display = 'none';

        // Perform AJAX request to check email and submit form
        fetch('/inscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nom: document.getElementById('nom').value,
                prenom: document.getElementById('prenom').value,
                email: email,
                mot_de_passe: password
            })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => { throw new Error(data.error); });
                }
                return response.json();
            })
            .then(data => {
                window.location.href = '/accueil';
            })
            .catch(error => {
                document.getElementById('email').style.borderColor = 'red';
                document.getElementById('emailError').innerText = error.message;
                document.getElementById('emailError').style.display = 'block';
            });
    }
});

document.getElementById('email').addEventListener('input', function () {
    document.getElementById('email').style.borderColor = '';
    document.getElementById('emailError').style.display = 'none';
});