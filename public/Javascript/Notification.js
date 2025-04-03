function triggerNotificationAnimation() {
    const bellIcon = document.querySelector(".notification-icon i"); // Sélectionne l'icône directement

    if (bellIcon) {
        bellIcon.classList.add("shake");

        setTimeout(() => {
            bellIcon.classList.remove("shake");
        }, 600);
    }
}

// Simuler une nouvelle notification après 3 secondes (remplace ceci par un vrai appel API)
setTimeout(triggerNotificationAnimation, 3000);


    async function loadNotifications() {
        try {
            const response = await fetch("/api/notifications");
            const data = await response.json();
            console.log(data); // Vérifier ce qui est retourné

            if (data.success) {
                const notificationsContainer = document.getElementById("notifications");
                const notificationCount = document.getElementById("notification-count");

                notificationsContainer.innerHTML = "";
                if (data.notifications.length > 0) {
                    notificationCount.style.display = "inline-block";
                    notificationCount.textContent = data.notifications.length;
                } else {
                    notificationCount.style.display = "none";
                }

                data.notifications.forEach(notif => {
                    const notifItem = document.createElement("div");
                    notifItem.className = "notification-item";
                    notifItem.innerHTML = `
                        <p>${notif.message}</p>
                        <button onclick="markAsRead(${notif.id})">Marquer comme lu</button>
                    `;
                    notificationsContainer.appendChild(notifItem);
                });
            }
        } catch (error) {
            console.error("Erreur lors du chargement des notifications :", error);
        }
    }

    async function markAsRead(id) {
        await fetch(`/api/notifications/${id}/lire`, { method: "POST" });
        loadNotifications(); // Recharge les notifications après marquage
    }

    function toggleNotifications() {
        const container = document.getElementById("notifications");
        container.style.display = (container.style.display === "block") ? "none" : "block";
    }

    document.addEventListener("DOMContentLoaded", loadNotifications);

    function toggleNotifications() {
        const container = document.getElementById("notifications");
    
        if (container) {
            container.classList.toggle("active"); // Ajoute ou enlève la classe "active"
        }
    }
    