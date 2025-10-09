// Top-level: dynamic viewport height for mobile browsers
(function () {
    function setViewportHeightVar() {
        // Mede a altura real da viewport (considera barras de endereço)
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // Inicializa ao carregar
    setViewportHeightVar();

    // Atualiza em eventos comuns que afetam a viewport
    window.addEventListener('resize', setViewportHeightVar, { passive: true });
    window.addEventListener('orientationchange', setViewportHeightVar);
    window.addEventListener('pageshow', setViewportHeightVar);
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) setViewportHeightVar();
    });
})();

// Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Ripple effect para elementos com .ripple-effect
    document.querySelectorAll('.ripple-effect').forEach(el => {
        el.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;
    
    // Check if we're on mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger menu
            const spans = menuToggle.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'rotate(0) translate(0, 0)';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'rotate(0) translate(0, 0)';
            }
            
            // Prevent body scroll when menu is open on mobile
            if (isMobile()) {
                if (navMenu.classList.contains('active')) {
                    body.style.overflow = 'hidden';
                    body.style.position = 'fixed';
                    body.style.width = '100%';
                } else {
                    body.style.overflow = '';
                    body.style.position = '';
                    body.style.width = '';
                }
            }
        });
        
        // Close menu when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (isMobile() && navMenu.classList.contains('active')) {
                if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    body.style.overflow = '';
                    body.style.position = '';
                    body.style.width = '';
                    
                    // Reset hamburger menu
                    const spans = menuToggle.querySelectorAll('span');
                    spans[0].style.transform = 'rotate(0) translate(0, 0)';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'rotate(0) translate(0, 0)';
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
                
                // Reset hamburger menu
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'rotate(0) translate(0, 0)';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'rotate(0) translate(0, 0)';
            }
        });
    }
    
    // Accordion Functionality
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        if (header.dataset.bound === '1') return; // evita bind duplicado
        header.dataset.bound = '1';

        const content = header.nextElementSibling;
        if (content) {
            content.style.maxHeight = 0;
            content.setAttribute('aria-hidden', 'true');
        }
        header.setAttribute('aria-expanded', 'false');
        
        header.addEventListener('click', function() {
            const isActive = header.classList.contains('active');
            const currentContent = header.nextElementSibling;

            // Fecha todos os outros
            accordionHeaders.forEach(h => {
                if (h !== header) {
                    h.classList.remove('active');
                    h.setAttribute('aria-expanded', 'false');
                    const c = h.nextElementSibling;
                    if (c) {
                        c.classList.remove('active');
                        c.style.maxHeight = 0;
                        c.setAttribute('aria-hidden', 'true');
                    }
                }
            });

            // Alterna atual com altura dinâmica
            header.classList.toggle('active');
            header.setAttribute('aria-expanded', header.classList.contains('active') ? 'true' : 'false');
            if (currentContent) {
                currentContent.classList.toggle('active');
                currentContent.style.maxHeight = header.classList.contains('active')
                    ? currentContent.scrollHeight + 'px'
                    : 0;
                currentContent.setAttribute('aria-hidden', header.classList.contains('active') ? 'false' : 'true');
            }
        });
    });
    
    // Animated Counter for Statistics
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            // Format the number based on the original text
            const originalText = element.getAttribute('data-original');
            if (originalText.includes('%')) {
                element.textContent = Math.round(current) + '%';
            } else if (originalText.includes('x')) {
                element.textContent = '+' + Math.round(current) + 'x';
            } else if (originalText.includes('+')) {
                element.textContent = '+' + Math.round(current) + '%';
            } else if (originalText.includes('-')) {
                element.textContent = '-' + Math.round(current) + '%';
            } else {
                element.textContent = Math.round(current) + '%';
            }
        }, 16);
    }
    
    // Intersection Observer for triggering animations
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statValues = entry.target.querySelectorAll('.stat-value');
                
                statValues.forEach((statValue, index) => {
                    // Store original text and extract number
                    const originalText = statValue.textContent;
                    statValue.setAttribute('data-original', originalText);
                    
                    // Extract number from text
                    const numberMatch = originalText.match(/\d+/);
                    const targetNumber = numberMatch ? parseInt(numberMatch[0]) : 0;
                    
                    // Add animation class and start counter
                    setTimeout(() => {
                        statValue.classList.add('animate');
                        animateCounter(statValue, targetNumber, 2000 + (index * 200));
                    }, index * 300);
                });
                
                // Stop observing this element
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all testimonial cards
    const testimonialCards = document.querySelectorAll('.testimonial-card-no-photo');
    testimonialCards.forEach(card => {
        observer.observe(card);
    });
    
    // Animate numbers in stats section
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const animateNumbers = () => {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateNumber = () => {
                current += increment;
                if (current < target) {
                    stat.textContent = Math.floor(current);
                    requestAnimationFrame(updateNumber);
                } else {
                    stat.textContent = target;
                }
            };
            
            // Start animation when element is in viewport
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateNumber();
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            observer.observe(stat);
        });
    };
    
    // Start number animation
    animateNumbers();
    
    // Animate compliance cards on scroll
    const complianceCards = document.querySelectorAll('.compliance-card');
    
    const animateCards = () => {
        complianceCards.forEach(card => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        card.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(card);
        });
    };
    
    // Start card animation
    animateCards();
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add hover effect to cards (only on desktop)
    const cards = document.querySelectorAll('.feature-card-enhanced, .compliance-card, .testimonial-card-no-photo, .stat-card, .news-card');
    
    if (!isMobile()) {
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }
    
    // Add parallax effect to hero image (only on desktop)
    const heroImage = document.querySelector('.hero-image img');
    
    if (heroImage && !isMobile()) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = scrolled * 0.5;
            heroImage.style.transform = `translateY(${parallax}px) scale(1.05)`;
        });
    }
    
    // Form validation (if any forms exist)
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            });
            
            if (isValid) {
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Formulário enviado com sucesso!';
                successMessage.style.cssText = `
                    background-color: #4CAF50;
                    color: white;
                    padding: 15px;
                    border-radius: 5px;
                    margin-top: 20px;
                    text-align: center;
                `;
                
                form.appendChild(successMessage);
                
                // Reset form
                form.reset();
                
                // Remove message after 5 seconds
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);
            }
        });
    });
    
    // Add loading state to buttons
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                
                // Add loading state
                const originalText = this.innerHTML;
                this.innerHTML = '<span>Carregando...</span>';
                this.disabled = true;
                
                // Simulate loading
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 2000);
            }
        });
    });
    
    // Enhanced mobile-specific interactions
    if (isMobile()) {
        // Add touch feedback to buttons
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
    }
});