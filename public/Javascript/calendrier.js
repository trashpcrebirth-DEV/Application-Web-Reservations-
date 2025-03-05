// Initialisation de la date actuelle
let currentDate = new Date();

// Fonction pour formater l'heure
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// Fonction pour afficher la boîte de réservation
function showReservationBox(day, month, year) {
  console.log("showReservationBox appelée avec :", day, month, year); // Debug

  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const reservationBox = document.getElementById('reservationBox');
  const selectedDate = document.getElementById('selectedDate');
  const reservationList = document.getElementById('reservationList');
  const reservationButtons = document.getElementById('reservationButtons');

  const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const sport = document.getElementById('sportFilter').value; // Récupérer la catégorie de sport
  console.log("Valeur du filtre de sport :", sport); // Debug
  
  // Mettre à jour le texte de la date sélectionnée
  if (sport && sport.trim() !== "") {
      selectedDate.textContent = `Réservations pour le ${day} ${months[month]} ${year} (${sport})`;
  } else {
      selectedDate.textContent = `Réservations pour le ${day} ${months[month]} ${year} (Tous les sports)`;
  }

  // Ouvrir la boîte de réservation
  reservationBox.classList.remove('hidden');
  reservationBox.style.display = "block";

  // Vider la liste et les boutons
  reservationList.innerHTML = "";
  reservationButtons.innerHTML = `<button class="fermer" onclick="closeReservationBox()">Fermer</button>`;

  // Construire l'URL de l'API en fonction du filtre
  let apiUrl = `/api/reservation?date=${formattedDate}`;
  if (sport && sport.trim() !== "") { // Ajouter le filtre de sport si sélectionné
      apiUrl += `&sport=${sport}`;
  }

  console.log("URL de l'API :", apiUrl); // Debug

  // Charger les réservations via l'API
  fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
          console.log("Données reçues de l'API:", data); // Debug

          if (!data.reservations || data.reservations.length === 0) {
              reservationList.innerHTML = "<p>Aucune réservation pour cette date.</p>";
          } else {
              data.reservations.forEach(res => {
                  console.log("Réservation reçue :", res); // Debug

                  const resItem = document.createElement("div");
                  resItem.classList.add("reservation-item");

                  resItem.innerHTML = `
                      <div class="reservation-details">
                          <span><strong>ID:</strong> ${res.id_reservation}</span>
                          <span><strong>Heure:</strong> ${formatTime(res.date_time)}</span>
                          <span><strong>Prix:</strong> ${res.prix}€</span>
                          <span><strong>Statut:</strong> ${res.statut}</span>
                          <span><strong>Sport:</strong> ${res.categorie_sport}</span>
                      </div>
                  `;

                  const reserveButton = document.createElement("button");
                  reserveButton.textContent = res.statut === "Réservé" ? "Réservé" : "Réserver";
                  reserveButton.classList.add("reserver");
                  reserveButton.setAttribute("data-id", res.id_reservation);

                  if (res.statut === "Réservé") {
                      reserveButton.disabled = true;
                      reserveButton.style.backgroundColor = "grey";

                      // Ajouter un bouton Annuler pour cette réservation
                      const annulerButton = document.createElement("button");
                      annulerButton.textContent = "Annuler";
                      annulerButton.classList.add("annuler");
                      annulerButton.setAttribute("data-id", res.id_reservation);
                      annulerButton.onclick = function () {
                          annulerReservation(res.id_reservation);
                      };

                      // Ajouter les boutons à la réservation
                      resItem.appendChild(reserveButton);
                      resItem.appendChild(annulerButton);
                  } else {
                      reserveButton.onclick = function () {
                          reserver(res.id_reservation);
                      };
                      resItem.appendChild(reserveButton);
                  }

                  // Ajouter la réservation à la liste
                  reservationList.appendChild(resItem);
              });
          }
      })
      .catch(error => {
          console.error("Erreur lors du chargement des réservations:", error);
          reservationList.innerHTML = "<p>Erreur de chargement</p>";
      });
}

// Fonction pour annuler une réservation
function annulerReservation(reservationId) {
    fetch('/api/annuler', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: reservationId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Trouver l'élément de réservation correspondant
                const reservationItem = document.querySelector(`.reservation-item button[data-id="${reservationId}"]`).closest(".reservation-item");

                // Mettre à jour le statut affiché
                const statusElement = reservationItem.querySelector(".reservation-details span:last-child");
                statusElement.innerHTML = "<strong>Statut:</strong> Disponible";

                // Réactiver le bouton Réserver
                const reserveButton = reservationItem.querySelector(".reserver");
                reserveButton.textContent = "Réserver";
                reserveButton.disabled = false;
                reserveButton.style.backgroundColor = "#007bff";

                // Supprimer le bouton Annuler
                const annulerButton = reservationItem.querySelector(".annuler");
                annulerButton.remove();
            } else {
                alert("Erreur : l'annulation n'a pas pu être effectuée.");
            }
        })
        .catch(error => {
            console.error("Erreur lors de l'annulation :", error);
            alert("Une erreur est survenue, veuillez réessayer.");
        });
}

// Fonction pour fermer la boîte de réservation
function closeReservationBox() {
    const reservationBox = document.getElementById('reservationBox');
    reservationBox.classList.add('hidden');
    reservationBox.style.display = "none";
}

// Fonction pour réserver
function reserver(idReservation) {
    fetch('/api/reserver', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: idReservation })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Trouver le bouton et le conteneur de la réservation
                const button = document.querySelector(`button[data-id="${idReservation}"]`);
                const reservationItem = button.closest(".reservation-item");

                // Changer le statut affiché
                const statusElement = reservationItem.querySelector(".reservation-details span:last-child");
                statusElement.innerHTML = "<strong>Statut:</strong> Réservé";

                // Désactiver le bouton et changer son style
                button.textContent = "Réservé";
                button.disabled = true;
                button.style.backgroundColor = "grey";

                // Ajouter un bouton Annuler pour cette réservation
                const annulerButton = document.createElement("button");
                annulerButton.textContent = "Annuler";
                annulerButton.classList.add("annuler");
                annulerButton.setAttribute("data-id", idReservation);
                annulerButton.onclick = function () {
                    annulerReservation(idReservation);
                };

                // Ajouter le bouton Annuler à la réservation
                reservationItem.appendChild(annulerButton);
            } else {
                alert("Erreur : la réservation n'a pas pu être effectuée.");
            }
        })
        .catch(error => {
            console.error("Erreur lors de la réservation :", error);
            alert("Une erreur est survenue, veuillez réessayer.");
        });
}

// Fonction pour mettre à jour le calendrier
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

// Fonction pour passer au mois suivant
function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
}

// Fonction pour revenir au mois précédent
function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
}

// Écouteurs d'événements pour les boutons de navigation du calendrier
document.getElementById('nextMonth').addEventListener('click', nextMonth);
document.getElementById('prevMonth').addEventListener('click', prevMonth);

// Écouteur d'événement pour le filtre de sport
document.getElementById('sportFilter').addEventListener('change', function () {
    const selectedDate = currentDate.getDate();
    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();
    showReservationBox(selectedDate, selectedMonth, selectedYear);
});

// Initialisation du calendrier
updateCalendar();