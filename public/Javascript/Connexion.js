const images = [
    "Images/1-f079d3ff.jpg",
    "Images/bf29a9d2-cfc5-42f0-a6e9-9e1fe83b91a7.jpg"
];

let currentIndex = 0;

function changeImage() {
    const imgElement = document.querySelector('.slideshow-image');
    if (imgElement) {
        currentIndex = (currentIndex + 1) % images.length;
        imgElement.src = images[currentIndex];
        console.log(`Image changed to: ${imgElement.src}`);
    } else {
        console.error('Image element not found');
    }
}

setInterval(changeImage, 5000);