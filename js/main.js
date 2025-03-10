// Hero Video Switching
const heroVideo = document.getElementById('heroVideo');
const videoSources = [
    'assets/Videos/20250310_1835_Innovative Water Generation_simple_compose_01jp0hzhzpetzb2t027ab7kyzt.mp4',
    'assets/images/video 2.mp4'
];
let currentVideoIndex = 0;

heroVideo.addEventListener('ended', () => {
    currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
    heroVideo.src = videoSources[currentVideoIndex];
    heroVideo.play();
});

// Counter Animation
const counters = document.querySelectorAll('.counter');
const speed = 200; // Animation speed in milliseconds

const formatNumber = (number) => {
    if (number === 10000) {
        return 'up to 10.000';
    }
    if (number >= 1000000000) {
        return Math.floor(number / 1000000000) + ' billion';
    } else if (number >= 1000000) {
        return Math.floor(number / 1000000) + ' million';
    } else if (number >= 100000) {
        return Math.floor(number / 1000) + ' thousand';
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseNumber = (text) => {
    if (text.includes('up to')) {
        return 10000;
    }
    if (text.includes('billion')) {
        return parseFloat(text) * 1000000000;
    } else if (text.includes('million')) {
        return parseFloat(text) * 1000000;
    } else if (text.includes('thousand')) {
        return parseFloat(text) * 1000;
    }
    return +text.replace(/\./g, '');
};

const animateCounter = (counter) => {
    const target = +counter.getAttribute('data-target');
    const count = parseNumber(counter.innerText);
    const increment = target / speed;

    if (count < target) {
        counter.innerText = formatNumber(Math.ceil(count + increment));
        setTimeout(() => animateCounter(counter), 1);
    } else {
        counter.innerText = formatNumber(target);
    }
};

// Start counter animation when element is in viewport
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

counters.forEach(counter => observer.observe(counter));

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile navigation toggle
const mobileNavToggle = document.createElement('button');
mobileNavToggle.className = 'mobile-nav-toggle';
mobileNavToggle.innerHTML = '<i class="fas fa-bars"></i>';
document.querySelector('.nav-container').appendChild(mobileNavToggle);

const navLinks = document.querySelector('.nav-links');

mobileNavToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileNavToggle.innerHTML = navLinks.classList.contains('active') 
        ? '<i class="fas fa-times"></i>' 
        : '<i class="fas fa-bars"></i>';
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !mobileNavToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        mobileNavToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

// Scroll-based navigation highlight
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);

        if (navLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLink.classList.add('active');
        } else if (navLink) {
            navLink.classList.remove('active');
        }
    });
});
