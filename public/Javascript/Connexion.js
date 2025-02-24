const images = [
    "Images/1-f079d3ff.jpg",
    "Images/bf29a9d2-cfc5-42f0-a6e9-9e1fe83b91a7.jpg"

];

let currentIndex = 0;

function initializeImage() {
    const imgElement = document.querySelector('.slideshow-image');
    if (imgElement) {
        imgElement.src = images[currentIndex];
        imgElement.classList.add('show');
    } else {
        console.error('Image element not found');
    }
}

function changeImage() {
    const imgElement = document.querySelector('.slideshow-image');
    if (imgElement) {
        imgElement.classList.remove('show');
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % images.length;
            imgElement.src = images[currentIndex];
            imgElement.classList.add('show');
            console.log(`Image changed to: ${imgElement.src}`);
        }, 700); // Wait for the fade-out transition to complete
    } else {
        console.error('Image element not found');
    }
}

document.getElementById('connexionForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    var email = document.getElementById('email').value;
    var password = document.getElementById('mot_de_passe').value;

    // Perform AJAX request to check email and password
    fetch('/connexion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
            window.location.href = data.redirectUrl;
        })
        .catch(error => {
            document.getElementById('email').style.borderColor = 'red';
            document.getElementById('mot_de_passe').style.borderColor = 'red';
            document.getElementById('errorMessage').innerText = error.message;
            document.getElementById('errorMessage').style.display = 'block';
        });
});

document.getElementById('email').addEventListener('input', function () {
    document.getElementById('email').style.borderColor = '';
    document.getElementById('mot_de_passe').style.borderColor = '';
    document.getElementById('errorMessage').style.display = 'none';
});

document.getElementById('mot_de_passe').addEventListener('input', function () {
    document.getElementById('email').style.borderColor = '';
    document.getElementById('mot_de_passe').style.borderColor = '';
    document.getElementById('errorMessage').style.display = 'none';
});