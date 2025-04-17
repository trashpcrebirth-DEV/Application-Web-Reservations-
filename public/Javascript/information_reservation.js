document.addEventListener("DOMContentLoaded", function () {
    const nombreJoueursInput = document.getElementById("nombreJoueurs");
    const btnMoins = document.getElementById("btn-moins");
    const btnPlus = document.getElementById("btn-plus");
    const nombreParticipantsDisplay = document.getElementById("nombre-participants");
    const prixTotalDisplay = document.getElementById("prix-total");
    const listeDisplay = document.getElementById("liste-display");
    const bookingCountInput = document.getElementById("booking-count");
    const listeNbJoueur = document.getElementById("listeNbJoueur");
    const capaciteMaxElement = document.getElementById("capacite-max");
    const prixBaseElement = document.getElementById("prix-base");
    const idReservationElement = document.getElementById("id-reservation");
    const formReserver = document.getElementById("form-reserver");
    const formListeAttente = document.getElementById("form-liste-attente");

    const progressBar = document.getElementById("progressBar");
    const capaciteRestante = document.getElementById("capaciteRestante");

    const capaciteMax = capaciteMaxElement ? parseInt(capaciteMaxElement.value) || 10 : 10;
    const prixBase = prixBaseElement ? parseFloat(prixBaseElement.value, 2) || 0 : 0;
    const idReservation = idReservationElement ? idReservationElement.value : null;

    function updatePlayerCount() {
        if (!nombreJoueursInput) return;

        let count = parseInt(nombreJoueursInput.value);
        if (isNaN(count) || count < 1) {
            count = 1;
            nombreJoueursInput.value = 1;
        }
        if (count > capaciteMax) {
            count = capaciteMax;
            nombreJoueursInput.value = capaciteMax;
        }

        if (nombreParticipantsDisplay) nombreParticipantsDisplay.textContent = count;
        let prixTotal = parseFloat(count * prixBase).toFixed(2) || 0;
        if (prixTotalDisplay) prixTotalDisplay.textContent = `${prixTotal}$`;
        if (bookingCountInput) bookingCountInput.value = count;
        if (listeNbJoueur) listeNbJoueur.value = count;
        if (listeDisplay) listeDisplay.textContent = count;

        updateFormUrls(count);

        const percent = (count / capaciteMax) * 100;
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (capaciteRestante) capaciteRestante.textContent = capaciteMax - count;
    }

    function updateFormUrls(count) {
        if (!idReservation) return;

        const prixTotal = parseFloat(prixTotalDisplay.textContent).toFixed(2) || 0;

        if (formReserver) {
            formReserver.action = `/reserver/${idReservation}/${count}/${prixTotal}`;
        }

        if (formListeAttente) {
            formListeAttente.action = `/ajouter-liste-attente/${idReservation}/${count}/${prixTotal}`;
        }
    }

    if (nombreJoueursInput) {
        nombreJoueursInput.addEventListener("input", updatePlayerCount);
        nombreJoueursInput.addEventListener("change", updatePlayerCount);
    }

    if (btnMoins) {
        btnMoins.addEventListener("click", function (event) {
            event.preventDefault();
            if (nombreJoueursInput) {
                nombreJoueursInput.stepDown();
                updatePlayerCount();
            }
        });
    }

    if (btnPlus) {
        btnPlus.addEventListener("click", function (event) {
            event.preventDefault();
            if (nombreJoueursInput) {
                nombreJoueursInput.stepUp();
                updatePlayerCount();
            }
        });
    }

    updatePlayerCount();

    const onglets = document.querySelectorAll('.onglet');
    const panneaux = document.querySelectorAll('.panneau-onglet');
    onglets.forEach(onglet => {
        onglet.addEventListener('click', () => {
            onglets.forEach(o => o.classList.remove('actif'));
            panneaux.forEach(p => p.classList.remove('actif'));
            onglet.classList.add('actif');
            const ongletId = onglet.getAttribute('data-onglet');
            const panneau = document.getElementById(`${ongletId}-panneau`);
            if (panneau) panneau.classList.add('actif');
        });
    });

    const btnPartage = document.getElementById('btn-partage');
    const modalPartage = document.getElementById('modal-partage');
    const fermerModal = document.querySelector('.fermer-modal');
    const copierLienBtn = document.querySelector('.copier-lien');

    if (btnPartage && modalPartage) {
        btnPartage.addEventListener('click', () => modalPartage.style.display = 'flex');
    }

    if (fermerModal && modalPartage) {
        fermerModal.addEventListener('click', () => modalPartage.style.display = 'none');
    }

    if (modalPartage) {
        window.addEventListener('click', (e) => {
            if (e.target === modalPartage) {
                modalPartage.style.display = 'none';
            }
        });
    }

    if (copierLienBtn) {
        copierLienBtn.addEventListener('click', () => {
            const linkInput = document.querySelector('.lien-partage input');
            if (linkInput) {
                linkInput.select();
                document.execCommand('copy');
                copierLienBtn.textContent = 'Copié!';
                setTimeout(() => copierLienBtn.textContent = 'Copier', 2000);
            }
        });
    }

    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function (event) {
            if (form.id === 'form-reserver' || form.id === 'form-liste-attente') return;

            if (!form.classList.contains('annuler') && idReservation) {
                const nombreJoueurs = parseInt(nombreJoueursInput.value) || 1;
                const actionParts = form.action.split('/');
                const lastPart = actionParts[actionParts.length - 1];
                if (!isNaN(parseInt(lastPart))) {
                    actionParts[actionParts.length - 1] = nombreJoueurs;
                    form.action = actionParts.join('/');
                } else {
                    form.action = `${form.action}/${nombreJoueurs}`;
                }
            }
        });
    });
});
