//     <!--Généré par ChatGPT à revoir-->

// Initialisation des variables
let currentDate = new Date();

// Fonction pour mettre à jour le calendrier
function updateCalendar() {
    const monthYearText = document.getElementById('monthYear');
    const daysGrid = document.getElementById('daysGrid');

    // Récupérer le mois et l'année
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    // Afficher le mois et l'année en haut du calendrier
    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    monthYearText.textContent = `${months[month]} ${year}`;

    // Calculer le premier jour du mois
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // Dimanche = 0, Lundi = 1, etc.

    // Nombre de jours dans le mois
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Réinitialiser la grille des jours
    daysGrid.innerHTML = '';

    // Ajouter les cases vides avant le premier jour
    for (let i = 0; i < firstDayOfWeek; i++) {
        daysGrid.innerHTML += '<div class="day empty"></div>';
    }

    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        dayElement.textContent = day;
        dayElement.addEventListener('click', () => {
            alert(`Vous avez sélectionné le ${day} ${months[month]} ${year}`);
        });
        daysGrid.appendChild(dayElement);
    }
}

// Fonction pour aller au mois suivant
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
}

// Fonction pour aller au mois précédent
function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
}

// Écouteurs d'événements pour les boutons de navigation
document.getElementById('nextMonth').addEventListener('click', nextMonth);
document.getElementById('prevMonth').addEventListener('click', prevMonth);

// Initialiser le calendrier au chargement de la page
updateCalendar();