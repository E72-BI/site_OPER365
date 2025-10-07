// Função para carregar o menu dinamicamente
async function loadMenu() {
  const placeholder = document.getElementById('menu-placeholder');
  if (!placeholder) {
    console.error('Menu placeholder não encontrado');
    return;
  }

  try {
    const response = await fetch('menu.html');
    if (!response.ok) throw new Error(`Menu não encontrado: ${response.status}`);
    
    const menuHTML = await response.text();
    placeholder.innerHTML = menuHTML;

    // Após inserir, ative o toggle do menu
    initMenuToggle();
    
    // Marcar link ativo
    markActiveLink();
    
    // Adicionar comportamento de scroll
    initScrollBehavior();
    
    console.log('Menu carregado com sucesso');
  } catch (error) {
    console.error('Erro ao carregar o menu:', error);
    placeholder.innerHTML = `
      <div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 10px 0;">
        ⚠️ Erro ao carregar o menu. Verifique se está rodando em um servidor local.
      </div>
    `;
  }
}

// Função para inicializar o comportamento do menu mobile
function initMenuToggle() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const overlay = document.querySelector('[data-menu-overlay]');

  if (toggle && menu) {
    // Garantir estado inicial
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    if (overlay) overlay.style.display = 'none';

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isExpanded);
      menu.classList.toggle('is-open');
      
      if (overlay) {
        overlay.style.display = !isExpanded ? 'block' : 'none';
      }
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        overlay.style.display = 'none';
      });
    }

    // Fechar menu com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        if (overlay) overlay.style.display = 'none';
      }
    });
  }
}

// Função para marcar o link ativo
function markActiveLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.site-menu__link');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// Função para adicionar comportamento de scroll
function initScrollBehavior() {
  const menu = document.querySelector('.site-menu');
  if (menu) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        menu.classList.add('scrolled');
      } else {
        menu.classList.remove('scrolled');
      }
    });
  }
}

// Carrega o menu assim que a página estiver pronta
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadMenu);
} else {
  loadMenu();
}