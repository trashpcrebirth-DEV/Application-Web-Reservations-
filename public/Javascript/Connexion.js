const images = [
    "Images/1-f079d3ff.jpg",
    "Images/bf29a9d2-cfc5-42f0-a6e9-9e1fe83b91a7.jpg"
];

let currentIndex = 0;

function initializeImage() {
    const imgElement = document.querySelector('.slideshow-image');
    if (imgElement) {
        imgElement.src = images[currentIndex];
        imgElement.classList.add('show');
    } else {
        console.error('Image element not found');
    }
}

function changeImage() {
    const imgElement = document.querySelector('.slideshow-image');
    if (imgElement) {
        imgElement.classList.remove('show');
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % images.length;
            imgElement.src = images[currentIndex];
            imgElement.classList.add('show');
            console.log(`Image changed to: ${imgElement.src}`);
        }, 700); // Wait for the fade-out transition to complete
    } else {
        console.error('Image element not found');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeImage();
    setInterval(changeImage, 5000);
});