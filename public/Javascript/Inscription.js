document.getElementById('inscriptionForm').addEventListener('submit', function (event) {
    var password = document.getElementById('mot_de_passe').value;
    var confirmPassword = document.getElementById('confirm_password').value;

    if (password !== confirmPassword) {
        event.preventDefault(); // Prevent form submission
        document.getElementById('mot_de_passe').style.borderColor = 'red';
        document.getElementById('confirm_password').style.borderColor = 'red';
        document.getElementById('passwordError').style.display = 'block';
    } else {
        document.getElementById('mot_de_passe').style.borderColor = '';
        document.getElementById('confirm_password').style.borderColor = '';
        document.getElementById('passwordError').style.display = 'none';
    }
});