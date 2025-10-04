// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const body = document.body;

// Check if we're on mobile
function isMobile() {
    return window.innerWidth <= 768;
}

function toggleMenu() {
    const isActive = navMenu.classList.contains('active');
    
    if (isActive) {
        closeMenu();
    } else {
        openMenu();
    }
}

function openMenu() {
    navMenu.classList.add('active');
    // Prevent body scroll on mobile
    if (isMobile()) {
        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.width = '100%';
    }
}

function closeMenu() {
    navMenu.classList.remove('active');
    // Restore body scroll on mobile
    if (isMobile()) {
        body.style.overflow = '';
        body.style.position = '';
        body.style.width = '';
    }
}

if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
}

// Close menu when clicking on a nav link
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        closeMenu();
    });
});

// Close menu when clicking outside
document.addEventListener('click', (event) => {
    const isClickInsideNav = navMenu && (navMenu.contains(event.target) || menuToggle.contains(event.target));
    
    if (!isClickInsideNav && navMenu && navMenu.classList.contains('active')) {
        closeMenu();
    }
});

// Close menu on escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
        closeMenu();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && navMenu && navMenu.classList.contains('active')) {
        closeMenu();
    }
});

// FAQ Accordion
const accordionHeaders = document.querySelectorAll('.accordion-header');

accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        // Close all other accordions
        accordionHeaders.forEach(otherHeader => {
            if (otherHeader !== header) {
                otherHeader.classList.remove('active');
                const otherContent = otherHeader.nextElementSibling;
                if (otherContent) {
                    otherContent.classList.remove('active');
                }
            }
        });
        
        // Toggle current accordion
        header.classList.toggle('active');
        const accordionContent = header.nextElementSibling;
        
        if (header.classList.contains('active')) {
            accordionContent.classList.add('active');
        } else {
            accordionContent.classList.remove('active');
        }
    });
});

// Smooth scroll for anchor links
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

// Counter animation for stats numbers
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        let current = 0;
        const increment = target / 60; // 60 frames for smooth animation
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = target;
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current);
            }
        }, 30); // 30ms interval for smooth animation
    });
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const statsSection = document.querySelector('.stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Enhanced mobile interactions
if (isMobile()) {
    // Add touch feedback to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'translateY(1px)';
            this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
    
    // Add touch feedback to accordion headers
    accordionHeaders.forEach(header => {
        header.addEventListener('touchstart', function() {
            this.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        });
        
        header.addEventListener('touchend', function() {
            this.style.backgroundColor = '';
        });
    });
    
    // Enhanced mobile image loading
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Add lazy loading for better performance
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Add loaded class when image is loaded
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });
        }
    });
}