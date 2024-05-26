document.addEventListener('DOMContentLoaded', function () {
    var hamburger = document.getElementById('hamburger');
    var navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        console.log('Hamburger and navMenu found');
        hamburger.addEventListener('click', function () {
            if (navMenu.style.width == '350px') {
                navMenu.style.width = '0';
                console.log('Nav menu closed');
            } else {
                navMenu.style.width = '350px';
                console.log('Nav menu opened');
            }
        });
    } else {
        console.error('Hamburger or navMenu not found');
    }
});
