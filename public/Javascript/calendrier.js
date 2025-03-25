const currentDate = new Date()

function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

function showReservationBox(day, month, year) {
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]
  const listeReservations = document.getElementById("listeReservations")
  const dateSelectionnee = document.getElementById("dateSelectionnee")
  const reservationList = document.getElementById("reservationList")

  const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  const sport = document.getElementById("sportFilter").value

  dateSelectionnee.textContent = sport
    ? `${day} ${months[month]} ${year} (${sport})`
    : `${day} ${months[month]} ${year} (Tous les sports)`

  reservationList.innerHTML = ""

  let apiUrl = `/api/reservation?date=${formattedDate}`
  if (sport) apiUrl += `&sport=${sport}`

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (!data.reservations || data.reservations.length === 0) {
        reservationList.innerHTML = "<p class='aucune-reservation'>Aucune réservation pour cette date.</p>"
      } else {
        data.reservations.forEach((res) => {
          const resItem = document.createElement("div")
          resItem.classList.add("reservation-item")

          resItem.innerHTML = `
            <div class="reservation-details">
              <span><strong>Heures:<br></strong> ${formatTime(res.date_time)} - ${formatTime(res.date_time_fin)}</span>
              <span><strong>Prix:</strong> ${res.prix}$</span>
              <span><strong>Statut:</strong> ${res.statut}</span>
              <span><strong>Sport:</strong> ${res.categorie_sport}</span>
            </div>
          `

          const reserveButton = document.createElement("button")
          reserveButton.textContent = res.statut === "Réservé" ? "Réservé" : "Réserver"
          reserveButton.classList.add("reserver")
          reserveButton.setAttribute("data-id", res.id_reservation)

          if (res.statut === "Réservé") {
            reserveButton.disabled = true
            reserveButton.style.backgroundColor = "grey"

            /*
            const annulerButton = document.createElement("button")
            annulerButton.textContent = "Annuler"
            annulerButton.classList.add("annuler")
            annulerButton.setAttribute("data-id", res.id_reservation)

            // Passer la bonne date de réservation ici
            const reservationDate = new Date(res.date_time)
            annulerButton.onclick = () => annulerReservation(res.id_reservation, reservationDate)
            */

            resItem.appendChild(reserveButton)
          } else {
            reserveButton.onclick = () => reserver(res.id_reservation)
            resItem.appendChild(reserveButton)
          }

          reservationList.appendChild(resItem)
        })
      }
    })
    .catch(() => {
      reservationList.innerHTML = "<p class='aucune-reservation'>Erreur de chargement</p>"
    })
}


/*
function annulerReservation(reservationId, reservationDate) {
  fetch("/api/annuler", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: reservationId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const reservationItem = document
          .querySelector(`.reservation-item button[data-id="${reservationId}"]`)
          .closest(".reservation-item");
        const statusElement = reservationItem.querySelector(".reservation-details span:nth-child(4)");
        const reserveButton = reservationItem.querySelector(".reserver");

        statusElement.innerHTML = "<strong>Statut:</strong> Disponible";
        reserveButton.textContent = "Réserver";
        reserveButton.disabled = false;
        reserveButton.style.backgroundColor = "#007bff";
        reservationItem.querySelector(".annuler").remove();

        // Décrémenter dynamiquement le compteur du panier
        const cartCountElement = document.querySelector(".cart-count");
        if (cartCountElement) {
          let currentCount = parseInt(cartCountElement.textContent, 10) || 0;
          cartCountElement.textContent = Math.max(0, currentCount - 1); // Assurez-vous que le compteur ne descend pas en dessous de 0
        }

        // Rafraîchir la liste des réservations avec la date de la réservation originale
        const selectedDate = reservationDate.getDate();
        const selectedMonth = reservationDate.getMonth();
        const selectedYear = reservationDate.getFullYear();
        showReservationBox(selectedDate, selectedMonth, selectedYear);
      } else {
        alert("Erreur : l'annulation n'a pas pu être effectuée.");
      }
    })
    .catch(() => {
      alert("Une erreur est survenue, veuillez réessayer.");
    });
}
*/


function reserver(idReservation) {
  /*
  fetch(`/reservation-information/${idReservation}`, {
    method: "POST",
  })
    .then((response) => {
      if (response.ok) {
        // Incrémenter dynamiquement le compteur du panier
        const cartCountElement = document.querySelector(".cart-count");
        if (cartCountElement) {
          let currentCount = parseInt(cartCountElement.textContent, 10) || 0;
          cartCountElement.textContent = currentCount + 1;
        }

        // Rediriger vers la page de confirmation ou actualiser la liste
      } else {
        alert("Erreur : la réservation n'a pas pu être effectuée.");
      }
    })
    .catch(() => {
      alert("Une erreur est survenue, veuillez réessayer.");
    });
    */

    window.location.href = `/reservation-information/${idReservation}`;

}

function highlightReservedDays() {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const formattedMonth = String(month + 1).padStart(2, "0");
  
  fetch(`/api/reservation?month=${formattedMonth}&year=${year}`)
    .then(response => response.json())
    .then(data => {
      const reservedDays = new Set(data.reservations.map(res => new Date(res.date_time).getDate()));

      document.querySelectorAll(".day").forEach(dayElement => {
        const day = parseInt(dayElement.textContent);
        if (reservedDays.has(day)) {
          dayElement.style.backgroundColor = "blue";
          dayElement.style.color = "white";
        } else {
          dayElement.style.backgroundColor = "";
          dayElement.style.color = "";
        }
      });
    })
    .catch(() => console.error("Erreur lors de la récupération des réservations."));
}

function updateCalendar() {
  const monthYearText = document.getElementById("monthYear")
  const daysGrid = document.getElementById("daysGrid")
  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ]
  monthYearText.textContent = `${months[month]} ${year}`

  const firstDayOfMonth = new Date(year, month, 1)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()

  daysGrid.innerHTML = ""

  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.innerHTML += '<div class="day empty"></div>'
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div")
    dayElement.classList.add("day")
    dayElement.textContent = day
    dayElement.addEventListener("click", () => showReservationBox(day, month, year))
    daysGrid.appendChild(dayElement)
  }
  highlightReservedDays(); // Ajout pour colorer les jours réservés
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1)
  updateCalendar()
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1)
  updateCalendar()
}

document.getElementById("nextMonth").addEventListener("click", nextMonth)
document.getElementById("prevMonth").addEventListener("click", prevMonth)
document.getElementById("sportFilter").addEventListener("change", () => {
  const selectedDate = currentDate.getDate()
  const selectedMonth = currentDate.getMonth()
  const selectedYear = currentDate.getFullYear()
  showReservationBox(selectedDate, selectedMonth, selectedYear)
})

updateCalendar()
