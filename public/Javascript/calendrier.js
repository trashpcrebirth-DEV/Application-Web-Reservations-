// Initialisation de la date actuelle
let currentDate = new Date();

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function showReservationBox(day, month, year) {
  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const reservationBox = document.getElementById('reservationBox');
  const selectedDate = document.getElementById('selectedDate');
  const reservationList = document.getElementById('reservationList');
  const reservationButtons = document.getElementById('reservationButtons');

  const formattedDate = `${year}-${month + 1}-${day}`; // Format YYYY-MM-DD
  selectedDate.textContent = `Réservations pour le ${day} ${months[month]} ${year}`;

  // Ouvrir la boîte de réservation
  reservationBox.classList.remove('hidden');
  reservationBox.style.display = "block";

  // Vider la liste
  reservationList.innerHTML = "";
  // Toujours conserver le bouton Fermer dans le conteneur
  reservationButtons.innerHTML = `<button class="fermer" onclick="closeReservationBox()">Fermer</button>`;

  // Charger les réservations via l'API
  fetch(`/api/reservation?date=${formattedDate}`)
    .then(response => response.json())
    .then(data => {
      console.log("Données reçues de l'API:", data);
      if (!data.reservations || data.reservations.length === 0) {
        reservationList.innerHTML = "<p>Aucune réservation pour cette date.</p>";
      } else {
        // Pour chaque réservation, créer un conteneur en ligne
        data.reservations.forEach(res => {
          const resItem = document.createElement("div");
          resItem.classList.add("reservation-item"); // Utilisez cette classe pour appliquer un style horizontal

          // Construire le contenu horizontalement
          resItem.innerHTML = `
    <div class="reservation-details">
        <span><strong>ID:</strong> ${res.id_reservation}</span>
        <span><strong>Heure:</strong> ${formatTime(res.date_time)}</span>
        <span><strong>Prix:</strong> ${res.prix}€</span>
        <span><strong>Statut:</strong> ${res.statut}</span>
    </div>
`;


          // Créer un bouton "Réserver" spécifique à cette réservation
          const reserveButton = document.createElement("button");
          reserveButton.textContent = "Réserver";
          reserveButton.classList.add("reserver");
          // Vous pouvez personnaliser l'action ici, par exemple en passant l'ID
          reserveButton.onclick = function() {
            reserver(res.id_reservation);
          };

          // Ajouter le bouton à la fin du conteneur de réservation
          resItem.appendChild(reserveButton);
          // Ajouter ce conteneur à la liste
          reservationList.appendChild(resItem);
        });
      }
    })
    .catch(error => {
      console.error("Erreur lors du chargement des réservations:", error);
      reservationList.innerHTML = "<p>Erreur de chargement</p>";
    });
}



function closeReservationBox() {
  const reservationBox = document.getElementById('reservationBox');
  reservationBox.classList.add('hidden');
  reservationBox.style.display = "none";
}

function reserver(idReservation) {
  alert("Réservation confirmée pour l'ID: " + idReservation);
  // Ajoutez ici la logique d'envoi au serveur via fetch POST, si nécessaire.
}

function updateCalendar() {
  const monthYearText = document.getElementById('monthYear');
  const daysGrid = document.getElementById('daysGrid');
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  monthYearText.textContent = `${months[month]} ${year}`;
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  daysGrid.innerHTML = "";

  // Cases vides pour les jours précédents
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.innerHTML += '<div class="day empty"></div>';
  }
  // Créer une case pour chaque jour
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

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendar();
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendar();
}

document.getElementById('nextMonth').addEventListener('click', nextMonth);
document.getElementById('prevMonth').addEventListener('click', prevMonth);



updateCalendar();
