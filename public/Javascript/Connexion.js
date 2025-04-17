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
document.addEventListener('DOMContentLoaded', function () {
    const particlesContainer = document.getElementById('particles');
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const posX = Math.random() * window.innerWidth;
        const posY = Math.random() * window.innerHeight;

        const size = Math.random() * 4 + 1;
        const speedX = (Math.random() - 0.5) * 1;
        const speedY = (Math.random() - 0.5) * 1;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.opacity = Math.random() * 0.5 + 0.2;

        particlesContainer.appendChild(particle);

        let x = posX;
        let y = posY;

        function animate() {
            x += speedX;
            y += speedY;

            if (x < 0 || x > window.innerWidth) x = Math.max(0, Math.min(x, window.innerWidth));
            if (y < 0 || y > window.innerHeight) y = Math.max(0, Math.min(y, window.innerHeight));

            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;

            if (Math.random() < 0.002 || x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
                particle.remove();
            } else {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }

    for (let i = 0; i < 40; i++) createParticle();

    setInterval(() => {
        if (particlesContainer.children.length < 80) createParticle();
    }, 500);

    const images = [
        "/images/images-connexion/Badminton.jpg",
        "/images/images-connexion/Hockey.jpg",
        "/images/images-connexion/salle-musculation.png",
        "/images/images-connexion/Volleyball.jpg"
    ];
    let currentIndex = 0;

    function initializeImage() {
        const imgElement = document.querySelector('.slideshow-image');
        if (imgElement) {
            imgElement.src = images[currentIndex];
            imgElement.classList.add('show');
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
            }, 700);
        }
    }

    initializeImage();
    setInterval(changeImage, 5000);

    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('mot_de_passe');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    const inputFields = document.querySelectorAll('.champ');

    inputFields.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (input.value === '') {
                input.parentElement.classList.remove('focused');
            }
        });

        if (input.value !== '') {
            input.parentElement.classList.add('focused');
        }
    });

    const form = document.getElementById('connexionForm');
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('mot_de_passe').value;

            fetch('/connexion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, mot_de_passe: password })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = '/';
                    } else {
                        document.getElementById('email').style.borderColor = 'red';
                        document.getElementById('mot_de_passe').style.borderColor = 'red';
                        document.getElementById('loginError').style.display = 'block';
                    }
                })
                .catch(error => console.error('Erreur:', error));
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const alertMessage = urlParams.get('alertConnexion');
    if (alertMessage === 'success') {
        alert("Vous devez vous connecter tout d'abord!");
    }
});
