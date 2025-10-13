// Blog Loader for OPER Website
// This script reads blog post data from CSV files and displays them on the blog page

/**
 * Parses a CSV line into an array of values
 * @param {string} line - A line from a CSV file
 * @returns {Array} - Array of parsed values
 */
function parseCSVLine(line) {
    // Simple CSV parsing (doesn't handle quoted fields with commas)
    return line.split(',').map(field => field.trim());
}

/**
 * Reads a CSV file and extracts blog post data
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Object>} - Promise that resolves to blog post data
 */
function readBlogPostCSV(filePath) {
    return fetch(filePath)
        .then(response => response.text())
        .then(text => {
            // Split text into lines
            const lines = text.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                throw new Error('CSV file is empty');
            }
            
            // First line contains the date, title, and content
            const firstLine = parseCSVLine(lines[0]);
            const date = firstLine[0];
            const title = firstLine[1];
            
            // Join remaining lines for content
            const content = lines.slice(1).join('\n');
            
            return {
                date: date,
                title: title,
                content: content
            };
        })
        .catch(error => {
            console.error('Error reading CSV file:', error);
            // Return sample data in case of error
            return {
                date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                title: 'Erro ao carregar artigo',
                content: 'Não foi possível carregar o conteúdo deste artigo.'
            };
        });
}

/**
 * Sorts blog posts by date (newest first)
 * @param {Array} posts - Array of blog post objects
 * @returns {Array} - Sorted array of blog post objects
 */
function sortPostsByDate(posts) {
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Formats a date for display
 * @param {string} dateString - Date string in format "YYYY-MM-DD HH:MM:SS"
 * @returns {string} - Formatted date string
 */
function formatPostDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Creates an excerpt from the content
 * @param {string} content - The full content
 * @param {number} length - Maximum length of the excerpt
 * @returns {string} - Excerpt of the content
 */
function createExcerpt(content, length = 150) {
    // Remove line breaks and extra whitespace
    let cleanContent = content.replace(/\s+/g, ' ').trim();
    
    // If content is shorter than the desired length, return it
    if (cleanContent.length <= length) {
        return cleanContent;
    }
    
    // Truncate to the desired length and add ellipsis
    return cleanContent.substring(0, length) + '...';
}

/**
 * Creates HTML for a blog post card
 * @param {Object} post - Blog post data
 * @param {string} imageUrl - URL for the post image
 * @param {string} criticality - Criticality level (high, medium, low)
 * @param {string} link - Link to the full post
 * @returns {string} - HTML string for the blog card
 */
function createBlogCardHTML(post, imageUrl, criticality, link) {
    // Extract first paragraph for excerpt
    const excerpt = createExcerpt(post.content, 150);
    
    return `
        <article class="blog-card criticality-${criticality}">
            <img src="${imageUrl}" alt="${post.title}" class="blog-image" onerror="this.src='images/news02.png'">
            <div class="blog-content">
                <div class="blog-date">${formatPostDate(post.date)}</div>
                <h3 class="blog-title">${post.title}</h3>
                <p class="blog-excerpt">${excerpt}</p>
                <a href="${link}" class="read-more">Ler artigo completo</a>
            </div>
        </article>
    `;
}

// Export functions for use in other scripts
window.BlogLoader = {
    readBlogPostCSV,
    sortPostsByDate,
    formatPostDate,
    createBlogCardHTML
};