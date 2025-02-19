//     <!--Généré par ChatGPT à revoir-->

// Initialisation des variables
let currentDate = new Date();

// Fonction pour afficher la boîte de réservation
function showReservationBox(day, month, year) {
    
    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const reservationBox = document.getElementById('reservationBox');
    const selectedDate = document.getElementById('selectedDate');
    
    const formattedDate = `${year}-${month + 1}-${day}`; // Format de la date pour la requête
    selectedDate.textContent = `Réservations pour le ${day} ${months[month]} ${year}`;
    
    // Ouvrir la boîte de réservation
    reservationBox.classList.remove('hidden');
    reservationBox.style.display = "block";
    
    // Charger les réservations pour cette date
    window.location.href = `/reservation?date=${formattedDate}`;
 
   
}


// Fonction pour fermer la boîte de réservation
function closeReservationBox() {
    const reservationBox = document.getElementById('reservationBox');
    reservationBox.classList.add('hidden');
    reservationBox.style.display = "none"; // Cacher la boîte
}

// Fonction pour mettre à jour le calendrier
function updateCalendar() {
    const monthYearText = document.getElementById('monthYear');
    const daysGrid = document.getElementById('daysGrid');

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    monthYearText.textContent = `${months[month]} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    daysGrid.innerHTML = '';

    for (let i = 0; i < firstDayOfWeek; i++) {
        daysGrid.innerHTML += '<div class="day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('day');
        dayElement.textContent = day;
        dayElement.addEventListener('click', () => {
            showReservationBox(day, month, year);
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