/* https://blakvghost.medium.com/cr%C3%A9er-un-carrousel-en-html-css-js-8f336b6085ed */
document.addEventListener('DOMContentLoaded', function() {
    const navigation = document.querySelector('.avis-navigation');
    const arriereButton = document.querySelector('.navigation-button.arriere');
    const avancerButton = document.querySelector('.navigation-button.avancer');
    const nombreAvis = navigation.querySelectorAll('.card-avis').length;
    let currentIndex = 0;

    function updateNavigation() {
        const itemWidth = navigation.querySelector('.card-avis').offsetWidth;
        const offset = (currentIndex % nombreAvis + nombreAvis) % nombreAvis * itemWidth;
        navigation.style.transform = `translateX(-${offset}px)`;
    }

    function moveNavigation(direction) {
        if (direction === 'arriere') {
            currentIndex = (currentIndex - 1 + nombreAvis) % nombreAvis;
        } else {
            currentIndex = (currentIndex + 1) % nombreAvis;
        }
        updateNavigation();
    }

    arriereButton.addEventListener('click', () => moveNavigation('arriere'));
    avancerButton.addEventListener('click', () => moveNavigation('avancer'));

    window.addEventListener('resize', updateNavigation);

    updateNavigation();
});