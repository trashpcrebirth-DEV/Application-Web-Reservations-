// Fonction pour ajouter un élément au panier
function addToCart(itemId) {
    fetch(`/api/items/${itemId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const cartCountElement = document.getElementById('cart-count');
            cartCountElement.textContent = data.cartCount; // Mettre à jour le compteur
        } else {
            alert('Erreur lors de l\'ajout au panier.');
        }
    })
    .catch(err => console.error(err));
}

// Fonction pour supprimer un élément du panier
function removeFromCart(itemId) {
    fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const cartCountElement = document.getElementById('cart-count');
            cartCountElement.textContent = data.cartCount; // Mettre à jour le compteur
            location.reload(); // Rafraîchir la page pour mettre à jour la liste
        } else {
            alert('Erreur lors de la suppression du panier.');
        }
    })
    .catch(err => console.error(err));
}

