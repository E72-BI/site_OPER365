(function () {
    function getStickyOffset() {
        let offset = 0;
        try {
            const rootStyle = getComputedStyle(document.documentElement);
            const menuOffset = parseInt(rootStyle.getPropertyValue('--menu-fixed-offset'), 10);
            if (!Number.isNaN(menuOffset)) {
                offset = menuOffset;
            }
        } catch (_) {
            offset = 0;
        }
        return offset;
    }

    function initScrollTopHelper() {
        if (window.__scrollTopHelperInitialized) {
            return;
        }

        const buttons = document.querySelectorAll('[data-scroll-top]');
        const floatingContainer = document.querySelector('.scroll-top-float');
        const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (buttons.length) {
            buttons.forEach((button) => {
                button.addEventListener('click', () => {
                    const behavior = prefersReducedMotionQuery.matches ? 'auto' : 'smooth';
                    window.scrollTo({ top: 0, behavior });
                });
            });
        }

        if (floatingContainer) {
            const updateVisibility = () => {
                const threshold = getStickyOffset() + 24;
                if (window.scrollY > threshold) {
                    floatingContainer.classList.add('is-visible');
                } else {
                    floatingContainer.classList.remove('is-visible');
                }
            };

            window.addEventListener('scroll', updateVisibility, { passive: true });
            window.addEventListener('resize', updateVisibility);
            updateVisibility();
        }

        window.__scrollTopHelperInitialized = true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollTopHelper, { once: true });
    } else {
        initScrollTopHelper();
    }
})();
