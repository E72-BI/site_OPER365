(function () {
    const FALLBACK_IMAGE = 'images/news02.png';

    document.addEventListener('DOMContentLoaded', () => {
        const grid = document.querySelector('[data-home-blog-grid]');
        if (!grid || !window.BlogDataService) {
            return;
        }

        renderPlaceholder(grid, 'Carregando conteúdos…');

        BlogDataService.getRecentPosts(3)
            .then((posts) => {
                if (!posts.length) {
                    renderPlaceholder(grid, 'Ainda não há matérias cadastradas.');
                    return;
                }
                grid.innerHTML = posts.map((post) => createNewsCard(post)).join('');
            })
            .catch((error) => {
                console.error('[Home Blog] Erro ao buscar posts', error);
                renderPlaceholder(grid, 'Não foi possível carregar as matérias agora.');
            });
    });

    function renderPlaceholder(grid, message) {
        grid.innerHTML = `
            <div class="news-card news-card--placeholder">
                <div class="news-overlay">
                    <h3 class="news-title">${escapeHtml(message)}</h3>
                    <p class="news-description">Tente novamente em instantes.</p>
                </div>
            </div>
        `;
    }

    function createNewsCard(post) {
        const imageSrc = (post.heroImage && post.heroImage.src) || FALLBACK_IMAGE;
        const imageAlt = (post.heroImage && post.heroImage.alt) || post.title || 'Matéria do blog OPER';
        const excerpt = excerptText(post.summary || post.content || '', 110);
        const target = `conexao-oper.html#${encodeURIComponent(post.slug || post.id)}`;

        return `
            <div class="news-card">
                <div class="news-image">
                    <img src="${escapeAttribute(imageSrc)}" alt="${escapeAttribute(imageAlt)}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
                </div>
                <div class="news-overlay">
                    <h3 class="news-title">${escapeHtml(post.title || '')}</h3>
                    <p class="news-description">${escapeHtml(excerpt)}</p>
                    <span class="news-link"><a href="${target}">Ler agora</a></span>
                </div>
            </div>
        `;
    }

    function excerptText(text, maxLength) {
        const clean = String(text || '')
            .replace(/\r?\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!clean) {
            return 'Conteúdo em breve.';
        }
        if (clean.length <= maxLength) {
            return clean;
        }
        return `${clean.substring(0, maxLength).trim()}…`;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }
})();
