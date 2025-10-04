// Mobile Enhancements for OPER - Gestão de Manutenção
// This file enhances mobile experience without affecting desktop

document.addEventListener('DOMContentLoaded', function() {
    // Enhanced mobile menu functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;
    
    // Check if we're on mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    // Enhanced menu toggle for mobile
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Add touch feedback
            this.classList.add('touch-ripple');
            
            // Toggle menu
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                body.style.overflow = 'hidden';
                body.style.position = 'fixed';
                body.style.width = '100%';
            } else {
                body.style.overflow = '';
                body.style.position = '';
                body.style.width = '';
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (isMobile() && navMenu.classList.contains('active')) {
                if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    body.style.overflow = '';
                    body.style.position = '';
                    body.style.width = '';
                }
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                body.style.overflow = '';
                body.style.position = '';
                body.style.width = '';
            }
        });
    }
    
    // Enhanced touch interactions for buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('touch-ripple');
        });
        
        button.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('touch-ripple');
            }, 300);
        });
    });
    

    // Enhanced card interactions for mobile
    const cards = document.querySelectorAll('.compliance-card, .feature-card-enhanced, .testimonial-card-no-photo, .stat-card, .news-card');
    cards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.classList.add('touch-ripple');
        });
        
        card.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('touch-ripple');
            }, 300);
        });
    });
    
    // Enhanced mobile scrolling
    let isScrolling = false;
    window.addEventListener('scroll', function() {
        if (!isScrolling) {
            isScrolling = true;
            // Add a class to indicate scrolling
            document.body.classList.add('is-scrolling');
            
            // Remove the class after scrolling stops
            setTimeout(() => {
                isScrolling = false;
                document.body.classList.remove('is-scrolling');
            }, 250);
        }
    }, false);
    
    // Enhanced mobile form handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Add loading state to submit buttons
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.classList.add('loading');
                submitButton.disabled = true;
                
                // Remove loading state after 2 seconds (simulating submission)
                setTimeout(() => {
                    submitButton.classList.remove('loading');
                    submitButton.disabled = false;
                }, 2000);
            }
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
    
    // Enhanced mobile orientation handling
    window.addEventListener('orientationchange', function() {
        // Add a small delay to ensure the orientation change is complete
        setTimeout(function() {
            // Re-calculate any dynamic layouts
            window.dispatchEvent(new Event('resize'));
        }, 100);
    });
    
    // Enhanced mobile performance optimizations
    if ('ontouchstart' in window) {
        // Remove hover effects on touch devices to prevent double tap issues
        document.body.classList.add('touch-device');
        
        // Add touch-specific CSS
        const style = document.createElement('style');
        style.textContent = `
            .touch-device .compliance-card:hover,
            .touch-device .feature-card-enhanced:hover,
            .touch-device .testimonial-card-no-photo:hover,
            .touch-device .stat-card:hover,
            .touch-device .news-card:hover {
                transform: none;
            }
            
            .touch-device .btn:hover::before {
                transform: none;
            }
            
            .touch-device .nav-menu a:hover::after {
                width: 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Enhanced mobile accessibility
    // Add focus management for keyboard navigation
    const focusableElements = document.querySelectorAll('a, button, input, textarea, select');
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            // Ensure focused elements are visible on mobile
            if (isMobile()) {
                const rect = this.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                // If element is near the bottom of the viewport, scroll it into view
                if (rect.bottom > viewportHeight - 50) {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });
    
    // Enhanced mobile-specific interactive elements
    // Add swipe gestures for carousel-like sections
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Add touch event listeners for swipe gestures
    const swipeAreas = document.querySelectorAll('.news-grid, .testimonials-grid-no-photo, .features-grid');
    swipeAreas.forEach(area => {
        area.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        area.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe(area);
        }, false);
    });
    
    function handleSwipe(element) {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next
                element.scrollBy({ left: 300, behavior: 'smooth' });
            } else {
                // Swipe right - previous
                element.scrollBy({ left: -300, behavior: 'smooth' });
            }
        }
    }
    
    // Enhanced mobile button interactions
    const ctaButtons = document.querySelectorAll('.btn-cta, .btn-primary');
    ctaButtons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'translateY(1px)';
            this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
    
    // Enhanced mobile form validation
    const requiredInputs = document.querySelectorAll('input[required], textarea[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.style.borderColor = '#e74c3c';
                this.style.borderWidth = '2px';
            } else {
                this.style.borderColor = '';
                this.style.borderWidth = '';
            }
        });
    });
    
    // Enhanced mobile loading indicators
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(element => {
        // Add loading spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="15 60" stroke-dashoffset="0" stroke-linecap="round">
                    <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;
        element.appendChild(spinner);
    });
});