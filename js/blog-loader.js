/**
 * BlogLoader
 * Funções utilitárias para renderizar cards, listas e conteúdos completos do blog.
 */
(function () {
    const DETAIL_PAGE = 'conexao-oper.html';

    function getPostUrl(post) {
        const slug = encodeURIComponent(post.slug || post.id);
        return `${DETAIL_PAGE}#${slug}`;
    }

    function formatPostDate(post) {
        if (post.displayDate) {
            return post.displayDate;
        }
        const source = post.publishedAt || post.createdAt;
        if (!source) {
            return '';
        }
        return new Date(source).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    function createBlogCardHTML(post) {
        const imageSrc = (post.heroImage && post.heroImage.src) || 'images/news02.png';
        const imageAlt = (post.heroImage && post.heroImage.alt) || post.title || 'Matéria do blog OPER';
        const excerpt = post.summary || createExcerpt(post.content, 180);
        const postUrl = getPostUrl(post);

        return `
            <article class="blog-card criticality-${post.criticality || 'low'}" data-slug="${post.slug}">
                <img src="${imageSrc}" alt="${escapeHtml(imageAlt)}" class="blog-image" onerror="this.src='images/news02.png'">
                <div class="blog-content">
                    <div class="blog-date">${escapeHtml(formatPostDate(post))}</div>
                    <h3 class="blog-title">${escapeHtml(post.title || '')}</h3>
                    <p class="blog-excerpt">${escapeHtml(excerpt)}</p>
                    <div class="blog-meta">
                        ${renderTagPills(post.tags)}
                        <span class="reading-time">${post.readingTimeMinutes || 1} min</span>
                    </div>
                    <a href="${postUrl}" class="read-more">Ler artigo completo</a>
                </div>
            </article>
        `;
    }

    function renderTagPills(tags = []) {
        if (!tags.length) {
            return '';
        }

        return `
            <ul class="tag-list">
                ${tags
                    .slice(0, 4)
                    .map((tag) => `<li class="tag-item">${escapeHtml(tag)}</li>`)
                    .join('')}
            </ul>
        `;
    }

    function renderPostContent(content) {
        if (!content) {
            return '<p>Conteúdo em construção.</p>';
        }

        const lines = String(content).split(/\r?\n/);
        const blocks = [];
        let listBuffer = [];
        let listType = null;

        const flushList = () => {
            if (!listBuffer.length) {
                return;
            }
            const items = listBuffer.map((item) => `<li>${formatInline(item)}</li>`).join('');
            blocks.push(`<${listType}>${items}</${listType}>`);
            listBuffer = [];
            listType = null;
        };

        lines.forEach((rawLine) => {
            const line = rawLine.trim();

            if (!line) {
                flushList();
                return;
            }

            const unorderedMatch = line.match(/^[-*]\s+(.*)$/);
            if (unorderedMatch) {
                const value = unorderedMatch[1];
                if (listType !== 'ul') {
                    flushList();
                    listType = 'ul';
                }
                listBuffer.push(value);
                return;
            }

            const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
            if (orderedMatch) {
                const value = orderedMatch[1];
                if (listType !== 'ol') {
                    flushList();
                    listType = 'ol';
                }
                listBuffer.push(value);
                return;
            }

            flushList();

            const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
            if (headingMatch) {
                const level = headingMatch[1].length + 1;
                const headingText = headingMatch[2];
                blocks.push(`<h${level}>${formatInline(headingText)}</h${level}>`);
                return;
            }

            blocks.push(`<p>${formatInline(line)}</p>`);
        });

        flushList();

        return blocks.join('\n');
    }

    function createExcerpt(content, length) {
        if (!content) {
            return '';
        }
        const clean = String(content).replace(/\s+/g, ' ').trim();
        if (clean.length <= length) {
            return clean;
        }
        return `${clean.substring(0, length - 1).trim()}…`;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatInline(text) {
        let formatted = escapeHtml(text);

        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        formatted = formatted.replace(/\[([^\]]+)\]/g, '<strong>$1</strong>');

        return formatted;
    }

    window.BlogLoader = {
        getPostUrl,
        formatPostDate,
        createBlogCardHTML,
        renderPostContent,
        createExcerpt,
    };
})();
