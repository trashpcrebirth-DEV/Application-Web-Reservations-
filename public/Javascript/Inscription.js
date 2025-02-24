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
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    document.getElementById('email').style.borderColor = 'red';
                    document.getElementById('emailError').innerText = data.error;
                    document.getElementById('emailError').style.display = 'block';
                } else {
                    window.location.href = '/';
                }
            })
            .catch(error => console.error('Error:', error));
    }
});