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
    const reservationList = document.getElementById('reservationList');

    const formattedDate = `${year}-${month + 1}-${day}`; // Format YYYY-MM-DD
    selectedDate.textContent = `Réservations pour le ${day} ${months[month]} ${year}`;

    // Ouvrir la boîte de réservation
    reservationBox.classList.remove('hidden');
    reservationBox.style.display = "block";

    // Charger les réservations via l'API
    fetch(`/api/reservation?date=${formattedDate}`)
        .then(response => response.json())
        .then(data => {
            console.log("Données recues de l'API: ",data) //voir le format json
            reservationList.innerHTML = ""; // Vider la liste
            if (data.reservations.length === 0) {
                reservationList.innerHTML = "<p>Aucune réservation pour cette date.</p>";
            } else {
                data.reservations.forEach(res => {
                    const resItem = document.createElement("div");
                    
                    // Construction du contenu HTML pour la réservation
                    let content = `
                        <strong>ID:</strong> ${res.id_reservation}<br>
                        <strong>Date:</strong> ${res.date_time}<br>
                        <strong>Prix:</strong> ${res.prix}€<br>
                        <strong>Statut:</strong> ${res.statut}<br>
                    `;
                    
                    
                    
                    content += `<hr>`;
                    resItem.innerHTML = content;
                    reservationList.appendChild(resItem);
                });
            }
        })
        .catch(error => {
            console.error("Erreur lors du chargement des réservations:", error);
            reservationList.innerHTML = "<p>Erreur de chargement</p>";
        });
}

// Fonction pour fermer la boîte de réservation
function closeReservationBox() {
    const reservationBox = document.getElementById('reservationBox');
    reservationBox.classList.add('hidden');
    reservationBox.style.display = "none"; // Cacher la boîte
}

function reserver() {
    alert("Réservation confirmée !");
    
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

    // Création des cases vides pour les jours précédents
    for (let i = 0; i < firstDayOfWeek; i++) {
        daysGrid.innerHTML += '<div class="day empty"></div>';
    }

    // Création des cases pour chaque jour du mois
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

// Navigation dans le calendrier
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
}

// Écouteurs d'événements pour les boutons de navigation
document.getElementById('nextMonth').addEventListener('click', nextMonth);
document.getElementById('prevMonth').addEventListener('click', prevMonth);

// Initialiser le calendrier au chargement de la page
updateCalendar();
