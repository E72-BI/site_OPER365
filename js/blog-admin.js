/**
 * Painel administrativo do Blog Conexão OPER
 * Permite autenticação simples, edição das matérias, importação e exportação do JSON.
 */
(function () {
    const USERNAME = 'admin';
    const PASSWORD_HASH = '9094332de239eb3878b292e07cf686c561e7ba4fc8ab47c736cca1a93ba780d9';
    const SESSION_KEY = 'OPER_BLOG_ADMIN_SESSION_V1';
    const DATA_URL = '../data/blog-posts.json';

    const state = {
        meta: {},
        posts: [],
        filteredPosts: [],
        selectedPostId: null,
        slugEditedManually: false,
        formDirty: false,
        dataDirty: false,
        searchTerm: '',
    };

    const elements = {};

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        cacheElements();
        bindEvents();
        if (sessionStorage.getItem(SESSION_KEY)) {
            showDashboard();
        } else {
            showLogin();
        }
    }

    function cacheElements() {
        elements.loginView = document.getElementById('adminLoginView');
        elements.dashboardView = document.getElementById('adminDashboardView');
        elements.loginForm = document.getElementById('loginForm');
        elements.usernameInput = document.getElementById('loginUsername');
        elements.passwordInput = document.getElementById('loginPassword');
        elements.status = document.querySelector('[data-admin-status]');
        elements.toast = document.getElementById('adminToast');

        elements.importInput = document.getElementById('importInput');
        elements.btnImport = document.getElementById('btnImportData');
        elements.btnDownload = document.getElementById('btnDownloadData');
        elements.btnNewPost = document.getElementById('btnNewPost');
        elements.btnLogout = document.getElementById('btnLogout');

        elements.postList = document.getElementById('adminPostList');
        elements.searchInput = document.getElementById('adminSearchInput');

        elements.editorTitle = document.querySelector('[data-editor-title]');
        elements.editorForm = document.getElementById('postEditorForm');
        elements.btnAddFaq = document.getElementById('btnAddFaq');
        elements.faqList = document.getElementById('faqList');
        elements.btnDeletePost = document.getElementById('btnDeletePost');
        elements.btnResetForm = document.getElementById('btnResetForm');

        elements.fieldTitle = document.getElementById('postTitle');
        elements.fieldSlug = document.getElementById('postSlug');
        elements.fieldStatus = document.getElementById('postStatus');
        elements.fieldCriticality = document.getElementById('postCriticality');
        elements.fieldPublishedAt = document.getElementById('postPublishedAt');
        elements.fieldReadingTime = document.getElementById('postReadingTime');
        elements.fieldHeroSrc = document.getElementById('postHeroImage');
        elements.fieldHeroAlt = document.getElementById('postHeroAlt');
        elements.fieldSummary = document.getElementById('postSummary');
        elements.fieldTags = document.getElementById('postTags');
        elements.fieldCategories = document.getElementById('postCategories');
        elements.fieldContent = document.getElementById('postContent');
        elements.fieldSeoDescription = document.getElementById('postSeoDescription');
        elements.fieldSeoKeywords = document.getElementById('postSeoKeywords');
    }

    function bindEvents() {
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.btnLogout.addEventListener('click', handleLogout);
        elements.btnImport.addEventListener('click', () => elements.importInput.click());
        elements.importInput.addEventListener('change', handleImport);
        elements.btnDownload.addEventListener('click', handleDownload);
        elements.btnNewPost.addEventListener('click', handleNewPost);
        elements.searchInput.addEventListener('input', handleSearch);
        elements.btnAddFaq.addEventListener('click', () => addFaqRow());
        elements.btnDeletePost.addEventListener('click', handleDeletePost);
        elements.btnResetForm.addEventListener('click', resetFormToSelected);
        elements.editorForm.addEventListener('submit', handleSavePost);
        elements.editorForm.addEventListener('input', markFormDirty);
        elements.fieldTitle.addEventListener('input', handleTitleChange);
        elements.fieldSlug.addEventListener('input', () => {
            state.slugEditedManually = true;
            state.formDirty = true;
        });
        window.addEventListener('beforeunload', (event) => {
            if (state.formDirty || state.dataDirty) {
                event.preventDefault();
                event.returnValue = '';
            }
        });
    }

    function showLogin() {
        elements.loginView.classList.remove('hidden');
        elements.dashboardView.classList.add('hidden');
        elements.usernameInput.focus();
    }

    function showDashboard() {
        elements.loginView.classList.add('hidden');
        elements.dashboardView.classList.remove('hidden');
        loadDataset();
    }

    async function handleLogin(event) {
        event.preventDefault();
        const username = elements.usernameInput.value.trim();
        const password = elements.passwordInput.value;

        if (!username || !password) {
            showToast('Informe usuário e senha.', 'error');
            return;
        }

        const valid = await verifyCredentials(username, password);
        if (!valid) {
            showToast('Credenciais inválidas.', 'error');
            elements.passwordInput.value = '';
            elements.passwordInput.focus();
            return;
        }

        sessionStorage.setItem(SESSION_KEY, 'true');
        showDashboard();
        elements.passwordInput.value = '';
    }

    function handleLogout() {
        sessionStorage.removeItem(SESSION_KEY);
        state.posts = [];
        state.filteredPosts = [];
        state.selectedPostId = null;
        state.formDirty = false;
        state.dataDirty = false;
        showLogin();
    }

    async function verifyCredentials(username, password) {
        if (username !== USERNAME) {
            return false;
        }
        const hash = await sha256(password);
        return hash === PASSWORD_HASH;
    }

    async function sha256(message) {
        if (window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const buffer = await window.crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(buffer))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
        }
        // Fallback muito simples (não recomendado, apenas para ambientes legados)
        return simpleHash(message);
    }

    function simpleHash(str) {
        let hash = 0;
        if (str.length === 0) {
            return hash.toString();
        }
        for (let i = 0; i < str.length; i += 1) {
            const chr = str.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0;
        }
        return hash.toString(16);
    }

    async function loadDataset() {
        setStatus('Carregando base de dados…');
        try {
            const response = await fetch(DATA_URL, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`Falha ao carregar ${DATA_URL}: ${response.status}`);
            }

            const payload = await response.json();
            if (!payload || !Array.isArray(payload.posts)) {
                throw new Error('Estrutura de dados inválida.');
            }

            state.meta = payload.meta || {};
            state.posts = payload.posts.map((post) => normalizePost(post));
            state.filteredPosts = state.posts.slice();

            renderPostList();
            if (state.posts.length) {
                selectPost(state.posts[0].id);
            } else {
                renderForm(createBlankPost());
            }

            state.dataDirty = false;
            setStatus(`${state.posts.length} matéria(s) carregadas.`);
        } catch (error) {
            console.error('[Admin] Erro ao carregar dados:', error);
            setStatus('Erro ao carregar dados.', 'error');
            showToast('Não foi possível carregar o arquivo JSON.', 'error');
        }
    }

    function normalizePost(post) {
        const safe = Object.assign(
            {
                id: post.slug || post.id || crypto.randomUUID(),
                slug: post.slug || post.id,
                status: 'published',
                criticality: 'low',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                publishedAt: new Date().toISOString(),
                readingTimeMinutes: 3,
                heroImage: {},
                tags: [],
                categories: [],
                summary: '',
                content: '',
                seo: {},
                faq: [],
            },
            post
        );

        if (!safe.slug) {
            safe.slug = slugify(safe.title || safe.id || '');
        }

        if (!safe.id) {
            safe.id = safe.slug;
        }

        return safe;
    }

    function renderPostList() {
        const list = elements.postList;
        list.innerHTML = '';

        const posts = applyFilter(state.posts, state.searchTerm);
        state.filteredPosts = posts;

        if (!posts.length) {
            const empty = document.createElement('li');
            empty.textContent = 'Nenhuma matéria encontrada.';
            empty.style.color = '#475467';
            list.appendChild(empty);
            return;
        }

        posts
            .slice()
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .forEach((post) => {
                const item = document.createElement('li');
                item.className = 'admin-post-item';
                item.dataset.postId = post.id;

                if (post.id === state.selectedPostId) {
                    item.classList.add('active');
                }

                const title = document.createElement('div');
                title.className = 'admin-post-title';
                title.textContent = post.title || '(Sem título)';

                const meta = document.createElement('div');
                meta.className = 'admin-post-meta';
                const date = formatDate(post.publishedAt);
                meta.innerHTML = `
                    <span>${date}</span>
                    <span class="post-status ${post.status === 'draft' ? 'draft' : 'published'}">${post.status === 'draft' ? 'Rascunho' : 'Publicado'}</span>
                `;

                item.appendChild(title);
                item.appendChild(meta);

                item.addEventListener('click', () => selectPost(post.id));
                list.appendChild(item);
            });
    }

    function applyFilter(posts, term) {
        if (!term) {
            return posts.slice();
        }
        const normalized = term.trim().toLowerCase();
        return posts.filter((post) => {
            const haystack = [
                post.title,
                post.summary,
                post.slug,
                (post.tags || []).join(' '),
                (post.categories || []).join(' '),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(normalized);
        });
    }

    function selectPost(postId) {
        const post = state.posts.find((item) => item.id === postId);
        if (!post) {
            return;
        }

        if (state.formDirty && !confirm('Existem alterações não salvas. Deseja descartá-las?')) {
            return;
        }

        state.selectedPostId = post.id;
        state.slugEditedManually = false;
        state.formDirty = false;

        document.querySelectorAll('.admin-post-item').forEach((item) => {
            item.classList.toggle('active', item.dataset.postId === post.id);
        });

        renderForm(post);
    }

    function renderForm(post) {
        elements.editorTitle.textContent = post.id ? 'Editar matéria' : 'Nova matéria';
        elements.fieldTitle.value = post.title || '';
        elements.fieldSlug.value = post.slug || '';
        elements.fieldStatus.value = post.status || 'published';
        elements.fieldCriticality.value = post.criticality || 'low';
        elements.fieldPublishedAt.value = toInputDateTime(post.publishedAt || post.createdAt);
        elements.fieldReadingTime.value = post.readingTimeMinutes || 3;
        elements.fieldHeroSrc.value = (post.heroImage && post.heroImage.src) || '';
        elements.fieldHeroAlt.value = (post.heroImage && post.heroImage.alt) || '';
        elements.fieldSummary.value = post.summary || '';
        elements.fieldTags.value = (post.tags || []).join(', ');
        elements.fieldCategories.value = (post.categories || []).join(', ');
        elements.fieldContent.value = post.content || '';
        elements.fieldSeoDescription.value = (post.seo && post.seo.description) || '';
        elements.fieldSeoKeywords.value = (post.seo && Array.isArray(post.seo.keywords) ? post.seo.keywords.join(', ') : '');

        renderFaqRows(post.faq || []);

        elements.btnDeletePost.disabled = !post.id || !state.posts.some((item) => item.id === post.id);
        elements.btnResetForm.disabled = !state.formDirty;
    }

    function renderFaqRows(items) {
        elements.faqList.innerHTML = '';
        if (!items.length) {
            addFaqRow();
            return;
        }
        items.forEach((faq) => addFaqRow(faq.question, faq.answer));
    }

    function addFaqRow(question = '', answer = '') {
        const row = document.createElement('div');
        row.className = 'faq-row';

        row.innerHTML = `
            <div class="form-group">
                <label>Pergunta</label>
                <textarea name="faqQuestion" placeholder="Ex: O que é MTBF?">${question || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Resposta</label>
                <textarea name="faqAnswer" placeholder="Explique de forma objetiva">${answer || ''}</textarea>
            </div>
            <button type="button" class="admin-btn outline">Remover</button>
        `;

        const removeButton = row.querySelector('button');
        removeButton.addEventListener('click', () => {
            row.remove();
            state.formDirty = true;
            if (!elements.faqList.querySelector('.faq-row')) {
                addFaqRow();
            }
        });

        elements.faqList.appendChild(row);
    }

    function handleSearch(event) {
        state.searchTerm = event.target.value;
        renderPostList();
    }

    function markFormDirty() {
        state.formDirty = true;
        elements.btnResetForm.disabled = false;
    }

    function handleTitleChange(event) {
        if (!state.slugEditedManually) {
            const generated = generateUniqueSlug(slugify(event.target.value || ''), state.selectedPostId);
            elements.fieldSlug.value = generated;
        }
        state.formDirty = true;
    }

    function handleNewPost() {
        if (state.formDirty && !confirm('Existem alterações não salvas. Deseja descartá-las?')) {
            return;
        }

        const blank = createBlankPost();
        state.selectedPostId = null;
        state.slugEditedManually = false;
        state.formDirty = false;
        renderForm(blank);
        document.querySelectorAll('.admin-post-item').forEach((item) => item.classList.remove('active'));
    }

    function handleSavePost(event) {
        event.preventDefault();

        const data = collectFormData();
        if (!data) {
            return;
        }

        const existingIndex = state.posts.findIndex((post) => post.id === state.selectedPostId);
        const conflict = state.posts.find(
            (post) => post.slug === data.slug && post.id !== state.selectedPostId
        );

        if (conflict) {
            showToast('Existe outra matéria com este slug. Escolha outro identificador.', 'error');
            elements.fieldSlug.focus();
            return;
        }

        if (existingIndex >= 0) {
            state.posts[existingIndex] = Object.assign({}, state.posts[existingIndex], data, {
                id: data.slug,
                slug: data.slug,
                updatedAt: new Date().toISOString(),
            });
            state.selectedPostId = data.slug;
            showToast('Matéria atualizada.', 'success');
        } else {
            const now = new Date().toISOString();
            const newPost = Object.assign({}, data, {
                id: data.slug,
                createdAt: now,
                updatedAt: now,
            });
            state.posts.push(newPost);
            state.selectedPostId = newPost.id;
            showToast('Matéria criada.', 'success');
        }

        state.dataDirty = true;
        state.formDirty = false;
        setStatus('Alterações realizadas. Baixe o JSON para publicar.');
        renderPostList();
        selectPost(state.selectedPostId);
    }

    function collectFormData() {
        const title = elements.fieldTitle.value.trim();
        const slugInput = elements.fieldSlug.value.trim();
        const slug = generateUniqueSlug(slugify(slugInput || title), state.selectedPostId);
        const content = elements.fieldContent.value.trim();

        if (!title) {
            showToast('Informe o título da matéria.', 'error');
            elements.fieldTitle.focus();
            return null;
        }

        if (!content) {
            showToast('O conteúdo não pode ficar vazio.', 'error');
            elements.fieldContent.focus();
            return null;
        }

        const publishedAt = fromInputDateTime(elements.fieldPublishedAt.value) || new Date().toISOString();
        const readingTime = parseInt(elements.fieldReadingTime.value, 10) || estimateReadingTime(content);
        const summary = elements.fieldSummary.value.trim() || createSummary(content);
        const tags = splitCommaList(elements.fieldTags.value);
        const categories = splitCommaList(elements.fieldCategories.value);
        const seoKeywords = splitCommaList(elements.fieldSeoKeywords.value);
        const faq = readFaqRows();

        return {
            title,
            slug,
            status: elements.fieldStatus.value || 'published',
            criticality: elements.fieldCriticality.value || 'low',
            publishedAt,
            readingTimeMinutes: readingTime,
            summary,
            content,
            tags,
            categories,
            heroImage: {
                src: elements.fieldHeroSrc.value.trim(),
                alt: elements.fieldHeroAlt.value.trim(),
            },
            seo: {
                description: elements.fieldSeoDescription.value.trim(),
                keywords: seoKeywords,
            },
            faq,
        };
    }

    function readFaqRows() {
        const rows = Array.from(elements.faqList.querySelectorAll('.faq-row'));
        return rows
            .map((row) => {
                const question = row.querySelector('[name="faqQuestion"]').value.trim();
                const answer = row.querySelector('[name="faqAnswer"]').value.trim();
                if (!question || !answer) {
                    return null;
                }
                return {
                    question,
                    answer,
                };
            })
            .filter(Boolean);
    }

    function handleDeletePost() {
        if (!state.selectedPostId) {
            return;
        }

        const post = state.posts.find((item) => item.id === state.selectedPostId);
        if (!post) {
            return;
        }

        const confirmed = confirm(`Tem certeza que deseja excluir "${post.title}"? Esta ação não pode ser desfeita.`);
        if (!confirmed) {
            return;
        }

        state.posts = state.posts.filter((item) => item.id !== post.id);
        state.filteredPosts = state.filteredPosts.filter((item) => item.id !== post.id);
        state.selectedPostId = null;
        state.dataDirty = true;
        state.formDirty = false;

        renderPostList();
        if (state.posts.length) {
            selectPost(state.posts[0].id);
        } else {
            renderForm(createBlankPost());
        }

        setStatus('Matéria excluída. Baixe o JSON para confirmar a alteração.');
        showToast('Matéria excluída.', 'success');
    }

    function resetFormToSelected() {
        if (!state.selectedPostId) {
            elements.editorForm.reset();
            renderFaqRows([]);
            state.formDirty = false;
            elements.btnResetForm.disabled = true;
            return;
        }

        const post = state.posts.find((item) => item.id === state.selectedPostId);
        if (!post) {
            return;
        }

        renderForm(post);
        state.formDirty = false;
        elements.btnResetForm.disabled = true;
        showToast('Alterações descartadas.', 'info');
    }

    function handleImport(event) {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            try {
                const payload = JSON.parse(loadEvent.target.result);
                if (!payload || !Array.isArray(payload.posts)) {
                    throw new Error('Arquivo inválido.');
                }

                state.meta = payload.meta || {};
                state.posts = payload.posts.map((post) => normalizePost(post));
                state.filteredPosts = state.posts.slice();
                state.selectedPostId = null;
                state.formDirty = false;
                state.dataDirty = false;
                renderPostList();
                if (state.posts.length) {
                    selectPost(state.posts[0].id);
                } else {
                    renderForm(createBlankPost());
                }
                setStatus('Arquivo importado com sucesso.');
                showToast('Base importada.', 'success');
            } catch (error) {
                console.error('[Admin] Erro ao importar JSON:', error);
                showToast('Não foi possível importar o arquivo.', 'error');
            }
        };
        reader.readAsText(file, 'utf-8');
    }

    function handleDownload() {
        if (!state.posts.length) {
            showToast('Não há dados para exportar.', 'error');
            return;
        }

        const payload = {
            meta: Object.assign({}, state.meta, {
                version: state.meta.version || 1,
                generatedAt: new Date().toISOString(),
                locale: state.meta.locale || 'pt-BR',
            }),
            posts: state.posts.map((post) => sanitizePostForExport(post)),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'blog-posts.json';
        link.click();
        URL.revokeObjectURL(url);

        state.dataDirty = false;
        setStatus('Arquivo JSON exportado. Substitua o arquivo em data/blog-posts.json.');
        showToast('JSON exportado.', 'success');
    }

    function sanitizePostForExport(post) {
        return {
            id: post.id,
            slug: post.slug,
            title: post.title,
            status: post.status,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            publishedAt: post.publishedAt,
            readingTimeMinutes: post.readingTimeMinutes,
            author: post.author || 'Equipe OPER',
            criticality: post.criticality,
            tags: post.tags || [],
            categories: post.categories || [],
            summary: post.summary,
            content: post.content,
            heroImage: post.heroImage || {},
            seo: post.seo || {},
            faq: post.faq || [],
            legacy: post.legacy || null,
        };
    }

    function setStatus(message, tone = 'info') {
        elements.status.textContent = message;
        elements.status.dataset.tone = tone;
    }

    let toastTimeout = null;
    function showToast(message, tone = 'info') {
        const toast = elements.toast;
        toast.textContent = message;
        toast.className = `admin-toast visible tone-${tone}`;
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, 3200);
    }

    function createBlankPost() {
        const now = new Date().toISOString();
        return {
            id: '',
            slug: '',
            title: '',
            status: 'draft',
            criticality: 'low',
            createdAt: now,
            updatedAt: now,
            publishedAt: now,
            readingTimeMinutes: 3,
            heroImage: {
                src: '',
                alt: '',
            },
            summary: '',
            content: '',
            tags: [],
            categories: [],
            seo: {
                description: '',
                keywords: [],
            },
            faq: [],
        };
    }

    function splitCommaList(value) {
        return (value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function slugify(value) {
        return (value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 120);
    }

    function generateUniqueSlug(baseSlug, ignoreId) {
        let slug = baseSlug || 'nova-materia';
        let suffix = 2;
        while (state.posts.some((post) => (post.id !== ignoreId) && (post.slug === slug || post.id === slug))) {
            slug = `${baseSlug}-${suffix}`;
            suffix += 1;
        }
        return slug;
    }

    function toInputDateTime(isoString) {
        if (!isoString) {
            return '';
        }
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    }

    function fromInputDateTime(value) {
        if (!value) {
            return null;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        const offset = date.getTimezoneOffset();
        const utc = new Date(date.getTime() + offset * 60000);
        return utc.toISOString();
    }

    function formatDate(value) {
        if (!value) {
            return '-';
        }
        return new Date(value).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    function estimateReadingTime(content) {
        const words = (content || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        return Math.max(1, Math.ceil(words.length / 200));
    }

    function createSummary(content) {
        const clean = (content || '').replace(/\s+/g, ' ').trim();
        if (clean.length <= 250) {
            return clean;
        }
        return `${clean.substring(0, 247).trim()}…`;
    }
})();
