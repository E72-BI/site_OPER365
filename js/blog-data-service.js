/**
 * BlogDataService
 * Camada de acesso aos dados de matérias do blog a partir de data/blog-posts.json
 */
(function () {
    const DATA_URL = 'data/blog-posts.json';
    let cachePromise = null;

    async function fetchData() {
        if (cachePromise) {
            return cachePromise;
        }

        cachePromise = fetch(DATA_URL, { cache: 'no-cache' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Falha ao carregar ${DATA_URL}: ${response.status}`);
                }
                return response.json();
            })
            .then((payload) => normalizePayload(payload))
            .catch((error) => {
                console.error('[BlogDataService] Erro ao buscar dados:', error);
                cachePromise = null;
                throw error;
            });

        return cachePromise;
    }

    function normalizePayload(payload) {
        if (!payload || !Array.isArray(payload.posts)) {
            throw new Error('Formato de dados de blog inválido.');
        }

        const posts = payload.posts
            .map((post) => normalizePost(post))
            .sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());

        return {
            meta: payload.meta || {},
            posts,
        };
    }

    function normalizePost(rawPost) {
        const safePost = Object.assign(
            {
                tags: [],
                categories: [],
                faq: [],
                heroImage: {},
            },
            rawPost || {}
        );

        const publishedAt = safePost.publishedAt || safePost.createdAt || new Date().toISOString();
        const publishedDate = new Date(publishedAt);
        const updatedAt = safePost.updatedAt ? new Date(safePost.updatedAt) : publishedDate;

        const displayDate = publishedDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });

        const summary =
            typeof safePost.summary === 'string' && safePost.summary.trim().length > 0
                ? safePost.summary.trim()
                : createExcerpt(safePost.content || '', 220);

        return Object.assign({}, safePost, {
            summary,
            publishedAt,
            publishedDate,
            updatedAt,
            updatedAtIso: updatedAt.toISOString(),
            displayDate,
            readingTimeMinutes: Number(safePost.readingTimeMinutes) || estimateReadingTime(safePost.content || ''),
            tags: Array.isArray(safePost.tags) ? safePost.tags : [],
            categories: Array.isArray(safePost.categories) ? safePost.categories : [],
            faq: Array.isArray(safePost.faq) ? safePost.faq : [],
            heroImage: safePost.heroImage || {},
        });
    }

    function createExcerpt(content, maxLength) {
        if (!content) {
            return '';
        }
        const clean = String(content).replace(/\s+/g, ' ').trim();
        if (clean.length <= maxLength) {
            return clean;
        }
        return `${clean.substring(0, maxLength - 1).trim()}…`;
    }

    function estimateReadingTime(content) {
        if (!content) {
            return 1;
        }
        const words = String(content)
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        return Math.max(1, Math.ceil(words.length / 200));
    }

    async function getAllPosts() {
        const data = await fetchData();
        return data.posts;
    }

    async function getPostBySlug(slug) {
        if (!slug) {
            throw new Error('Slug obrigatório para localizar matéria.');
        }
        const posts = await getAllPosts();
        return posts.find((post) => post.slug === slug || post.id === slug) || null;
    }

    async function getRecentPosts(limit = 3) {
        const posts = await getAllPosts();
        return posts.slice(0, Math.max(0, limit));
    }

    async function searchPosts(query, { limit = null, category = null, tag = null } = {}) {
        const trimmedQuery = (query || '').trim().toLowerCase();
        const posts = await getAllPosts();

        const filtered = posts.filter((post) => {
            const matchesQuery =
                !trimmedQuery ||
                [
                    post.title,
                    post.summary,
                    post.content,
                    (post.tags || []).join(' '),
                    (post.categories || []).join(' '),
                ]
                    .filter(Boolean)
                    .some((field) => field.toLowerCase().includes(trimmedQuery));

            const matchesCategory = !category || (post.categories || []).includes(category);
            const matchesTag = !tag || (post.tags || []).includes(tag);

            return matchesQuery && matchesCategory && matchesTag;
        });

        return typeof limit === 'number' && limit > 0 ? filtered.slice(0, limit) : filtered;
    }

    window.BlogDataService = {
        getAllPosts,
        getPostBySlug,
        getRecentPosts,
        searchPosts,
    };
})();
