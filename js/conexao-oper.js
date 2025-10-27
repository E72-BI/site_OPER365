(function () {
    const FALLBACK_IMAGE = 'images/news02.png';
    const state = {
        posts: [],
        sidebarSource: [],
        activeSlug: '',
    };

    const els = {};

    document.addEventListener('DOMContentLoaded', () => {
        cacheElements();
        initScrollHelper();
        initNewsletter();
        loadPosts();
        bindSearch();
        bindHashWatcher();
    });

    function cacheElements() {
        els.heroTotal = document.querySelector('[data-total-posts]');
        els.activeArticle = document.querySelector('[data-active-article]');
        els.activeTitle = document.querySelector('[data-active-title]');
        els.activeMeta = document.querySelector('[data-active-meta]');
        els.activeSummary = document.querySelector('[data-active-summary]');
        els.activeContent = document.querySelector('[data-active-content]');
        els.activeTags = document.querySelector('[data-active-tags]');
        els.activeCategory = document.querySelector('[data-active-category]');
        els.activeAuthor = document.querySelector('[data-active-author]');
        els.activeHero = document.querySelector('[data-active-media]');
        els.activeHeroContainer = document.querySelector('[data-active-media-container]');
        els.relatedGrid = document.querySelector('[data-related-grid]');
        els.sidebarHeading = document.querySelector('[data-sidebar-heading]');
        els.sidebarCount = document.querySelector('[data-sidebar-count]');
        els.sidebarList = document.querySelector('[data-sidebar-posts]');
        els.tagsContainer = document.querySelector('[data-tag-chips]');
        els.searchForm = document.getElementById('blogSearchForm');
        els.searchInput = document.getElementById('blogSearchInput');
        els.searchStatus = document.querySelector('[data-search-status]');
        els.newsletterForm = document.getElementById('newsletterForm');
        els.newsletterFeedback = document.querySelector('[data-newsletter-feedback]');
    }

    function loadPosts() {
        if (els.searchStatus) {
            els.searchStatus.textContent = 'Carregando conteÃºdos do blog...';
        }

        BlogDataService.getAllPosts()
            .then((posts) => {
                state.posts = posts;
                state.sidebarSource = posts.slice(0, 6);
                updateHeroTotal(posts.length);
                populateTags(posts);

                const initialSlug = decodeURIComponent(window.location.hash.replace('#', '').trim());
                if (!selectPost(initialSlug, { updateHash: false })) {
                    selectPost(posts[0]?.slug, { updateHash: false });
                }

                updateSidebarList(state.sidebarSource, 'Posts recentes');
                updateRelatedGrid();

                if (els.searchStatus) {
                    els.searchStatus.textContent = 'Mostrando os posts mais recentes.';
                }
            })
            .catch((error) => {
                console.error('[ConexÃ£o OPER] Falha ao carregar posts', error);
                if (els.activeTitle) {
                    els.activeTitle.textContent = 'NÃ£o foi possÃ­vel carregar as matÃ©rias.';
                }
                if (els.activeContent) {
                    els.activeContent.innerHTML = '<p class="empty-state">Tente recarregar a pÃ¡gina em instantes.</p>';
                }
                if (els.relatedGrid) {
                    els.relatedGrid.innerHTML = '<p class="empty-state">Erro ao carregar as matÃ©rias.</p>';
                }
                if (els.searchStatus) {
                    els.searchStatus.textContent = 'Tivemos um problema ao carregar os artigos.';
                }
            });
    }

    function updateHeroTotal(total) {
        if (!els.heroTotal) {
            return;
        }
        if (!total) {
            els.heroTotal.textContent = 'Nenhuma matÃ©ria publicada ainda.';
            return;
        }
        const label = total === 1 ? 'matÃ©ria publicada' : 'matÃ©rias publicadas';
        els.heroTotal.textContent = `${total} ${label}`;
    }

    function selectPost(slug, { updateHash = true, scrollIntoView = false } = {}) {
        if (!state.posts.length) {
            return false;
        }

        let post = null;
        if (slug) {
            post = state.posts.find((item) => item.slug === slug || item.id === slug);
        }
        if (!post) {
            post = state.posts[0];
        }
        if (!post) {
            return false;
        }

        state.activeSlug = post.slug;
        renderActivePost(post);
        updateRelatedGrid();
        highlightSidebarEntry();

        if (updateHash) {
            const hash = `#${encodeURIComponent(post.slug)}`;
            if (window.location.hash !== hash) {
                history.replaceState(null, '', hash);
            }
        }

        if (scrollIntoView && els.activeArticle) {
            els.activeArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        return true;
    }

    function renderActivePost(post) {
        if (!post || !els.activeArticle) {
            return;
        }

        if (els.activeCategory) {
            const category = (post.categories && post.categories[0]) || 'ConteÃºdo OPER';
            els.activeCategory.textContent = category;
        }

        if (els.activeTitle) {
            els.activeTitle.textContent = post.title || 'MatÃ©ria sem tÃ­tulo';
        }

        if (els.activeMeta) {
            const metaParts = [];
            if (post.displayDate) {
                metaParts.push(post.displayDate);
            }
            if (post.readingTimeMinutes) {
                metaParts.push(`${post.readingTimeMinutes} min de leitura`);
            }
            els.activeMeta.textContent = metaParts.join(' â€¢ ');
        }

        if (els.activeSummary) {
            els.activeSummary.textContent = post.summary || BlogLoader.createExcerpt(post.content || '', 220);
        }

        if (els.activeHero) {
            const heroImage = (post.heroImage && post.heroImage.src) || FALLBACK_IMAGE;
            const heroAlt =
                (post.heroImage && post.heroImage.alt) ||
                (post.title ? `Imagem do artigo ${post.title}` : 'Imagem ilustrativa do artigo');
            els.activeHero.src = heroImage;
            els.activeHero.alt = heroAlt;
            els.activeHero.loading = 'lazy';
        }

        if (els.activeHeroContainer) {
            els.activeHeroContainer.classList.remove('is-hidden');
        }

        if (els.activeContent) {
            els.activeContent.innerHTML = BlogLoader.renderPostContent(post.content || '');
        }

        if (els.activeAuthor) {
            const author = post.author || 'Equipe OPER';
            els.activeAuthor.textContent = `Por ${author}`;
        }

        if (els.activeTags) {
            if (!post.tags || !post.tags.length) {
                els.activeTags.innerHTML = '<span class="tag-chip muted">Sem tags</span>';
            } else {
                els.activeTags.innerHTML = post.tags
                    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
                    .join('');
            }
        }
    }

    function updateRelatedGrid() {
        if (!els.relatedGrid) {
            return;
        }

        if (!state.posts.length) {
            els.relatedGrid.innerHTML = '<p class="empty-state">Nenhuma matÃ©ria cadastrada ainda.</p>';
            return;
        }

        const others = state.posts.filter((post) => post.slug !== state.activeSlug).slice(0, 6);
        if (!others.length) {
            els.relatedGrid.innerHTML = '<p class="empty-state">VocÃª jÃ¡ estÃ¡ visualizando a Ãºnica matÃ©ria disponÃ­vel.</p>';
            return;
        }

        els.relatedGrid.innerHTML = others
            .map((post) => createMiniCard(post))
            .join('');

        attachPostTriggers(els.relatedGrid);
    }

    function createMiniCard(post) {
        const imageSrc = (post.heroImage && post.heroImage.src) || FALLBACK_IMAGE;
        const excerpt = BlogLoader.createExcerpt(post.summary || post.content || '', 140);
        return `
            <article class="mini-card" data-card-slug="${escapeHtml(post.slug)}">
                <div class="mini-card-image" style="background-image:url('${escapeAttribute(imageSrc)}')"></div>
                <div class="mini-card-body">
                    <p class="mini-card-date">${escapeHtml(post.displayDate || '')}</p>
                    <h4 class="mini-card-title">${escapeHtml(post.title || '')}</h4>
                    <p class="mini-card-description">${escapeHtml(excerpt)}</p>
                    <button type="button" class="mini-card-action" data-post-trigger="${escapeAttribute(post.slug)}">
                        Ler agora
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </article>
        `;
    }

    function updateSidebarList(posts, label) {
        if (!els.sidebarList || !els.sidebarHeading || !els.sidebarCount) {
            return;
        }

        const limited = posts.slice(0, 8);
        els.sidebarHeading.textContent = label || 'Posts Recentes';
        els.sidebarCount.textContent = limited.length;

        if (!limited.length) {
            els.sidebarList.innerHTML = '<li class="sidebar-list-placeholder">Nenhuma matÃ©ria encontrada.</li>';
            return;
        }

        els.sidebarList.innerHTML = limited
            .map(
                (post) => `
                <li>
                    <button type="button" class="sidebar-link" data-post-trigger="${escapeAttribute(post.slug)}">
                        ${escapeHtml(post.title || '')}
                        <small>${escapeHtml(post.displayDate || '')}</small>
                    </button>
                </li>
            `
            )
            .join('');

        attachPostTriggers(els.sidebarList);
        highlightSidebarEntry();
    }

    function highlightSidebarEntry() {
        if (!els.sidebarList) {
            return;
        }
        els.sidebarList.querySelectorAll('.sidebar-link').forEach((button) => {
            const slug = button.getAttribute('data-post-trigger');
            button.classList.toggle('is-active', slug === state.activeSlug);
        });
    }

    function bindSearch() {
        if (!els.searchForm || !els.searchInput) {
            return;
        }

        els.searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const query = els.searchInput.value.trim();
            if (!query) {
                resetSearch();
                return;
            }
            runSearch(query);
        });

        els.searchInput.addEventListener('input', (event) => {
            if (!event.target.value.trim()) {
                resetSearch();
            }
        });
    }

    function runSearch(query) {
        if (els.searchStatus) {
            els.searchStatus.textContent = `Buscando por â€œ${query}â€â€¦`;
        }

        BlogDataService.searchPosts(query)
            .then((matches) => {
                state.sidebarSource = matches;
                const label = matches.length
                    ? `Resultados para â€œ${query}â€`
                    : `Sem resultados para â€œ${query}â€`;
                updateSidebarList(matches, label);

                if (els.searchStatus) {
                    if (matches.length) {
                        const plural = matches.length === 1 ? 'resultado' : 'resultados';
                        els.searchStatus.textContent = `Encontramos ${matches.length} ${plural} para â€œ${query}â€.`;
                    } else {
                        els.searchStatus.textContent = `NÃ£o encontramos conteÃºdos para â€œ${query}â€.`;
                    }
                }

                if (matches.length) {
                    selectPost(matches[0].slug, { scrollIntoView: true });
                }
            })
            .catch((error) => {
                console.error('[ConexÃ£o OPER] Erro durante a busca', error);
                if (els.searchStatus) {
                    els.searchStatus.textContent = 'NÃ£o foi possÃ­vel realizar a busca agora.';
                }
            });
    }

    function resetSearch() {
        state.sidebarSource = state.posts.slice(0, 6);
        updateSidebarList(state.sidebarSource, 'Posts recentes');
        if (els.searchStatus) {
            els.searchStatus.textContent = 'Mostrando os posts mais recentes.';
        }
    }

    function attachPostTriggers(root) {
        root.querySelectorAll('[data-post-trigger]').forEach((element) => {
            element.addEventListener('click', () => {
                const slug = element.getAttribute('data-post-trigger');
                selectPost(slug, { scrollIntoView: true });
            });
        });
    }

    function populateTags(posts) {
        if (!els.tagsContainer) {
            return;
        }

        const counts = new Map();
        posts.forEach((post) => {
            (post.tags || []).forEach((tag) => {
                const trimmed = tag.trim();
                if (!trimmed) {
                    return;
                }
                counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
            });
        });

        const chips = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 8);

        if (!chips.length) {
            els.tagsContainer.innerHTML = '<span class="tag-chip muted">Sem tags cadastradas</span>';
            return;
        }

        els.tagsContainer.innerHTML = chips
            .map(
                ([tag]) =>
                    `<button type="button" class="tag-chip" data-tag-trigger="${escapeAttribute(tag)}">${escapeHtml(tag)}</button>`
            )
            .join('');

        els.tagsContainer.querySelectorAll('[data-tag-trigger]').forEach((button) => {
            button.addEventListener('click', () => {
                const value = button.getAttribute('data-tag-trigger');
                if (els.searchInput) {
                    els.searchInput.value = value;
                }
                runSearch(value);
            });
        });
    }

    function initNewsletter() {
        if (!els.newsletterForm || !els.newsletterFeedback) {
            return;
        }

        els.newsletterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = event.target.newsletterEmail.value.trim();
            if (!email) {
                els.newsletterFeedback.hidden = false;
                els.newsletterFeedback.textContent = 'Digite um e-mail vÃ¡lido para receber novidades.';
                return;
            }

            event.target.reset();
            els.newsletterFeedback.hidden = false;
            els.newsletterFeedback.textContent = `Obrigado! ${email} receberÃ¡ os prÃ³ximos conteÃºdos da ConexÃ£o OPER.`;
        });
    }

    function initScrollHelper() {
        const button = document.querySelector('[data-scroll-top="posts"]');
        if (!button) {
            return;
        }
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function bindHashWatcher() {
        window.addEventListener('hashchange', () => {
            const slug = decodeURIComponent(window.location.hash.replace('#', '').trim());
            if (slug) {
                selectPost(slug, { updateHash: false, scrollIntoView: true });
            }
        });
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
        return String(value || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
})();


