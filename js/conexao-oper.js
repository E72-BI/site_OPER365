(function () {
    const FALLBACK_IMAGE = 'images/news02.png';

    const state = {
        posts: [],
        sidebarSource: [],
        activeSlug: '',
        searchHighlightTimer: null,
        searchLastTrigger: null,
        searchLastQuery: '',
        isSearchPanelOpen: false,
    };

    const els = {};

    document.addEventListener('DOMContentLoaded', () => {
        cacheElements();
        initNewsletter();
        loadPosts();
        bindSearch();
        bindSearchToggle();
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
        els.searchSection = document.getElementById('blogSearchSection');
        els.searchPanel = document.querySelector('[data-search-panel]');
        els.searchBackdrop = document.querySelector('.blog-search__backdrop');
        els.searchForm = document.getElementById('blogSearchForm');
        els.searchInput = document.getElementById('blogSearchInput');
        els.searchStatus = document.querySelector('[data-search-status]');
        els.searchResultsWrapper = document.querySelector('[data-search-results]');
        els.searchResultsTitle = document.querySelector('[data-search-results-title]');
        els.searchResultsList = document.querySelector('[data-search-results-list]');
        els.searchTriggers = Array.from(document.querySelectorAll('[data-search-toggle]'));
        els.searchClosers = Array.from(document.querySelectorAll('[data-search-close]'));
        els.newsletterForm = document.getElementById('newsletterForm');
        els.newsletterFeedback = document.querySelector('[data-newsletter-feedback]');
    }

    function isMobileView() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function updateSearchExpandedState(expanded) {
        if (!Array.isArray(els.searchTriggers)) {
            return;
        }
        els.searchTriggers.forEach((trigger) => {
            trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });
    }

    function focusSearchInput() {
        if (!els.searchInput) {
            return;
        }
        requestAnimationFrame(() => {
            try {
                els.searchInput.focus({ preventScroll: true });
            } catch (_) {
                els.searchInput.focus();
            }
        });
    }

    function highlightSearch() {
        if (!els.searchSection || isMobileView()) {
            return;
        }
        els.searchSection.classList.add('is-focused');
        window.clearTimeout(state.searchHighlightTimer);
        state.searchHighlightTimer = window.setTimeout(() => {
            if (els.searchSection) {
                els.searchSection.classList.remove('is-focused');
            }
        }, 2400);
    }

    function openSearchPanel({ focusInput = true, scrollToPanel = false, sourceTrigger = null } = {}) {
        if (!els.searchSection) {
            return;
        }
        if (sourceTrigger) {
            state.searchLastTrigger = sourceTrigger;
        }

        const mobile = isMobileView();
        els.searchSection.setAttribute('aria-hidden', 'false');

        if (mobile) {
            els.searchSection.classList.add('is-open');
            document.body.classList.add('search-open');
            state.isSearchPanelOpen = true;
        } else {
            if (scrollToPanel) {
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                const behavior = prefersReducedMotion ? 'auto' : 'smooth';
                els.searchSection.scrollIntoView({ behavior, block: 'start' });
            }
            highlightSearch();
            state.isSearchPanelOpen = true;
        }

        updateSearchExpandedState(true);

        if (focusInput) {
            focusSearchInput();
        }
    }

    function closeSearchPanel({ restoreFocus = false, silent = false } = {}) {
        if (!els.searchSection) {
            return;
        }

        const mobile = isMobileView();
        if (mobile) {
            els.searchSection.classList.remove('is-open');
            els.searchSection.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('search-open');
            state.isSearchPanelOpen = false;
        } else if (!silent) {
            els.searchSection.classList.remove('is-focused');
        }

        updateSearchExpandedState(false);
        window.clearTimeout(state.searchHighlightTimer);

        if (restoreFocus && state.searchLastTrigger) {
            try {
                state.searchLastTrigger.focus();
            } catch (_) {
                // ignore focus restoration issues
            }
            state.searchLastTrigger = null;
        } else if (!restoreFocus) {
            state.searchLastTrigger = null;
        }
    }

    function renderSearchOverlayResults(matches, query) {
        if (!els.searchResultsWrapper || !els.searchResultsList) {
            return;
        }

        if (!query) {
            els.searchResultsWrapper.hidden = true;
            els.searchResultsList.innerHTML = '';
            if (els.searchResultsTitle) {
                els.searchResultsTitle.textContent = '';
            }
            return;
        }

        els.searchResultsWrapper.hidden = false;

        if (els.searchResultsTitle) {
            if (!matches.length) {
                els.searchResultsTitle.textContent = `Sem resultados para "${escapeHtml(query)}"`;
            } else {
                const label = matches.length === 1 ? 'resultado encontrado' : 'resultados encontrados';
                els.searchResultsTitle.textContent = `${matches.length} ${label}`;
            }
        }

        if (!matches.length) {
            els.searchResultsList.innerHTML = `<li class="search-results__empty">Não encontramos conteúdos para "${escapeHtml(query)}".</li>`;
            return;
        }

        const limited = matches.slice(0, 6);
        els.searchResultsList.innerHTML = limited
            .map(
                (post) => `
                <li>
                    <button type="button" class="search-results__item" data-post-trigger="${escapeAttribute(post.slug)}">
                        ${escapeHtml(post.title || '')}
                        <small>${escapeHtml(post.displayDate || '')}</small>
                    </button>
                </li>
            `
            )
            .join('');

        attachPostTriggers(els.searchResultsList, { closeSearchOnSelect: true });
    }

    function loadPosts() {
        if (els.searchStatus) {
            els.searchStatus.textContent = 'Carregando conteúdos do blog...';
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
                console.error('[Conexão OPER] Falha ao carregar posts', error);
                if (els.activeTitle) {
                    els.activeTitle.textContent = 'Não foi possível carregar as matérias.';
                }
                if (els.activeContent) {
                    els.activeContent.innerHTML = '<p class="empty-state">Tente recarregar a página em instantes.</p>';
                }
                if (els.relatedGrid) {
                    els.relatedGrid.innerHTML = '<p class="empty-state">Erro ao carregar as matérias.</p>';
                }
                if (els.searchStatus) {
                    els.searchStatus.textContent = 'Tivemos um problema ao carregar os artigos.';
                }
            });
    }

    function getStickyOffset() {
        let offset = 0;
        try {
            const rootStyle = getComputedStyle(document.documentElement);
            const menuOffset = parseInt(rootStyle.getPropertyValue('--menu-fixed-offset'), 10);
            if (!Number.isNaN(menuOffset)) {
                offset += menuOffset;
            }
        } catch (_) {
            // ignore parsing failures
        }

        const heroBar = document.querySelector('.hero-fixed-bar');
        if (heroBar) {
            offset += heroBar.getBoundingClientRect().height || 0;
        }

        return offset + 16; // breathing space for headings
    }

    function adjustScrollForStickyContext(behavior) {
        const offset = getStickyOffset();
        if (!offset) {
            return;
        }
        const scrollBehavior = behavior || (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
        window.scrollBy({ top: -offset, behavior: scrollBehavior });
    }

    function updateHeroTotal(total) {
        if (!els.heroTotal) {
            return;
        }
        if (!total) {
            els.heroTotal.textContent = 'Nenhuma publicação ainda.';
            return;
        }
        const label = total === 1 ? 'publicação' : 'publicações';
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
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const behavior = prefersReducedMotion ? 'auto' : 'smooth';
            els.activeArticle.scrollIntoView({ behavior, block: 'start' });
            window.setTimeout(() => adjustScrollForStickyContext(behavior), behavior === 'smooth' ? 320 : 0);
        }

        return true;
    }

    function renderActivePost(post) {
        if (!post || !els.activeArticle) {
            return;
        }

        if (els.activeCategory) {
            const category = (post.categories && post.categories[0]) || 'Conteúdo OPER';
            els.activeCategory.textContent = category;
        }

        if (els.activeTitle) {
            els.activeTitle.textContent = post.title || 'Matéria sem título';
        }

        if (els.activeMeta) {
            const metaParts = [];
            if (post.displayDate) {
                metaParts.push(post.displayDate);
            }
            if (post.readingTimeMinutes) {
                metaParts.push(`${post.readingTimeMinutes} min de leitura`);
            }
            els.activeMeta.textContent = metaParts.join(' • ');
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
            els.relatedGrid.innerHTML = '<p class="empty-state">Nenhuma matéria cadastrada ainda.</p>';
            return;
        }

        const others = state.posts.filter((post) => post.slug !== state.activeSlug).slice(0, 6);
        if (!others.length) {
            els.relatedGrid.innerHTML = '<p class="empty-state">Você já está visualizando a única matéria disponível.</p>';
            return;
        }

        els.relatedGrid.innerHTML = others.map((post) => createMiniCard(post)).join('');

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
        els.sidebarHeading.textContent = label || 'Posts recentes';
        els.sidebarCount.textContent = limited.length;

        if (!limited.length) {
            els.sidebarList.innerHTML = '<li class="sidebar-list-placeholder">Nenhuma matéria encontrada.</li>';
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

    function bindSearchToggle() {
        if (!els.searchSection) {
            return;
        }

        const triggers = Array.isArray(els.searchTriggers) ? els.searchTriggers : [];
        const closers = Array.isArray(els.searchClosers) ? els.searchClosers : [];
        const mediaQuery = window.matchMedia('(max-width: 768px)');

        const handleTrigger = (event) => {
            event.preventDefault();
            const trigger = event.currentTarget;
            const mobile = mediaQuery.matches;
            openSearchPanel({
                focusInput: true,
                scrollToPanel: !mobile,
                sourceTrigger: trigger,
            });
        };

        triggers.forEach((trigger) => {
            trigger.addEventListener('click', handleTrigger);
            trigger.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    handleTrigger(event);
                }
            });
        });

        closers.forEach((control) => {
            control.addEventListener('click', (event) => {
                event.preventDefault();
                closeSearchPanel({ restoreFocus: true });
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && state.isSearchPanelOpen && mediaQuery.matches) {
                closeSearchPanel({ restoreFocus: true });
            }
        });

        const applyViewportChange = (mq) => {
            if (mq.matches) {
                closeSearchPanel({ restoreFocus: false, silent: true });
                if (els.searchSection) {
                    els.searchSection.setAttribute('aria-hidden', 'true');
                }
                document.body.classList.remove('search-open');
                state.isSearchPanelOpen = false;
            } else {
                if (els.searchSection) {
                    els.searchSection.classList.remove('is-open');
                    els.searchSection.setAttribute('aria-hidden', 'false');
                }
                document.body.classList.remove('search-open');
                state.isSearchPanelOpen = false;
                updateSearchExpandedState(false);
            }
        };

        applyViewportChange(mediaQuery);
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', applyViewportChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(applyViewportChange);
        }

        if (els.searchInput) {
            els.searchInput.addEventListener('focus', () => {
                updateSearchExpandedState(true);
            });

            els.searchInput.addEventListener('blur', () => {
                if (!mediaQuery.matches) {
                    updateSearchExpandedState(false);
                }
            });
        }
    }

    function runSearch(query) {
        if (els.searchStatus) {
            els.searchStatus.textContent = `Buscando por "${query}".`;
        }

        state.searchLastQuery = query;
        openSearchPanel({ focusInput: false, scrollToPanel: !isMobileView() });

        BlogDataService.searchPosts(query)
            .then((matches) => {
                state.sidebarSource = matches;
                const label = matches.length
                    ? `Resultados para "${query}"`
                    : `Sem resultados para "${query}"`;
                updateSidebarList(matches, label);
                renderSearchOverlayResults(matches, query);

                if (els.searchStatus) {
                    if (matches.length) {
                        const plural = matches.length === 1 ? 'resultado' : 'resultados';
                        els.searchStatus.textContent = `Encontramos ${matches.length} ${plural} para "${query}".`;
                    } else {
                        els.searchStatus.textContent = `Não encontramos conteúdos para "${query}".`;
                    }
                }

                if (matches.length) {
                    selectPost(matches[0].slug, { scrollIntoView: true });
                }
            })
            .catch((error) => {
                console.error('[Conexão OPER] Erro durante a busca', error);
                if (els.searchStatus) {
                    els.searchStatus.textContent = 'Não foi possível realizar a busca agora.';
                }
                renderSearchOverlayResults([], query);
            });
    }

    function resetSearch() {
        state.sidebarSource = state.posts.slice(0, 6);
        updateSidebarList(state.sidebarSource, 'Posts recentes');
        if (els.searchStatus) {
            els.searchStatus.textContent = 'Mostrando os posts mais recentes.';
        }
        state.searchLastQuery = '';
        renderSearchOverlayResults([], '');
    }

    function attachPostTriggers(root, { closeSearchOnSelect = false } = {}) {
        root.querySelectorAll('[data-post-trigger]').forEach((element) => {
            element.addEventListener('click', () => {
                const slug = element.getAttribute('data-post-trigger');
                selectPost(slug, { scrollIntoView: true });
                if (closeSearchOnSelect && isMobileView()) {
                    closeSearchPanel({ restoreFocus: false });
                }
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
                    `<button type="button" class="tag-chip button-like" data-tag-trigger="${escapeAttribute(tag)}">${escapeHtml(tag)}</button>`
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
                els.newsletterFeedback.textContent = 'Digite um e-mail válido para receber novidades.';
                return;
            }

            event.target.reset();
            els.newsletterFeedback.hidden = false;
            els.newsletterFeedback.textContent = `Obrigado! ${email} receberá os próximos conteúdos da Conexão OPER.`;
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
