# Blog OPER – Guia de Administração

## Visão Geral

O blog da Conexão OPER agora é totalmente abastecido por um único arquivo JSON (`data/blog-posts.json`). A página pública `conexao-oper.html` e a seção “Blog Conexão” da home (`index.html`) carregam esse arquivo via JavaScript para renderizar busca, posts recentes e o conteúdo completo de cada matéria — tudo sem páginas estáticas individuais.

Para cadastrar novas matérias ou editar existentes, utilize o painel administrativo disponível em `admin/index.html`. Ele funciona 100% no front-end e permite importar/exportar o JSON atualizado, além de gerar pré-visualizações em tempo real.

---

## Estrutura Principal

- `data/blog-posts.json` – Base de dados com metadados e conteúdo das matérias.
- `conexao-oper.html` – Hub do blog com leitura inline, busca e navegação sem trocar de página.
- `index.html` (seção “Blog Conexão”) – Mostra automaticamente as três matérias mais recentes.
- `js/blog-data-service.js` – Serviço responsável por buscar e normalizar os dados do blog.
- `js/blog-loader.js` – Funções utilitárias de renderização (conteúdo, snippets, datas etc.).
- `js/conexao-oper.js` – Script que alimenta e controla a página `conexao-oper.html`.
- `js/home-blog.js` – Script que injeta os cards dinâmicos na home.
- `admin/index.html` + `js/blog-admin.js` + `css/blog-admin.css` – Painel administrativo.

---

## Painel Administrativo

- **URL:** `admin/index.html`
- **Usuário:** `admin`
- **Senha:** `oper@365`

### Recursos disponíveis

1. **Listagem e busca** das matérias existentes (por título, tag ou categoria).  
2. **Cadastro/edição** com suporte a:
   - Título, slug, status (`published` ou `draft`), criticidade e tempo de leitura
   - Resumo, conteúdo (Markdown básico), tags, categorias
   - SEO (descrição e palavras-chave)
   - FAQ (perguntas e respostas dinâmicas)
   - Imagem de destaque (caminho/alt)
3. **Importação** de um `blog-posts.json` já existente (para atualizar a lista).
4. **Exportação** do JSON atualizado (substitua `data/blog-posts.json` após baixar).
5. Indicação visual de alterações pendentes e toasts de feedback.

> **Observação:** o painel não grava direto no arquivo do projeto. Após salvar ou excluir matérias, clique em **Baixar JSON** e substitua o arquivo `data/blog-posts.json` no repositório.

---

## Fluxo para criar/editar uma matéria

1. Acesse `admin/index.html` e faça login.  
2. Clique em **“Nova matéria”** ou selecione uma existente na lista.  
3. Preencha os campos necessários. Use o campo *Conteúdo* com Markdown básico (`#`, `##`, listas com `-` ou `1.`).  
4. Adicione perguntas na seção **FAQ** apenas se forem exibidas na matéria.  
5. Salve a matéria.  
6. Clique em **“Baixar JSON”** e substitua `data/blog-posts.json` pelo arquivo baixado.  
7. Faça commit das alterações no repositório.

---

## Estrutura do JSON

```jsonc
{
  "meta": {
    "version": 1,
    "generatedAt": "2025-10-21T17:53:24.002Z",
    "locale": "pt-BR"
  },
  "posts": [
    {
      "id": "blog-automatic-reports",
      "slug": "blog-automatic-reports",
      "title": "Relatórios Automáticos: Sua Estratégia de Manutenção",
      "status": "published",
      "createdAt": "2025-10-08T09:15:00-03:00",
      "updatedAt": "2025-10-08T09:15:00-03:00",
      "publishedAt": "2025-10-08T09:15:00-03:00",
      "readingTimeMinutes": 6,
      "author": "Equipe OPER",
      "criticality": "low",
      "tags": ["Relatórios", "Automatização", "Compliance"],
      "categories": ["Tecnologia"],
      "summary": "Relatórios automáticos do OPER economizam tempo, garantem conformidade e aumentam a precisão das decisões.",
      "content": "Texto completo em Markdown com parágrafos, títulos (##) e listas (-).",
      "heroImage": {
        "src": "temp_images/mobile_app.jpg",
        "alt": "Aplicativo móvel de manutenção"
      },
      "seo": {
        "description": "Veja como relatórios automáticos da OPER reduzem retrabalho e aceleram decisões em manutenção.",
        "keywords": ["relatórios automáticos", "gestão de manutenção", "compliance", "dados em tempo real"]
      },
      "faq": [
        { "question": "O que são relatórios automáticos?", "answer": "Relatórios gerados automaticamente a partir de ordens de serviço, checklists e indicadores." },
        { "question": "Quais os benefícios?", "answer": "Economia de tempo, precisão dos dados, conformidade e decisões rápidas." }
      ],
      "legacy": {
        "sourceCsv": "blog_post_3.csv",
        "legacyLink": "blog-automatic-reports.html"
      }
    }
  ]
}
```

- `summary` é gerado automaticamente se ficar em branco.  
- `readingTimeMinutes` pode ser calculado pelo painel (1 min/200 palavras).  
- `legacy` é opcional; mantém referência a URLs anteriores. Novas matérias podem ignorar esse campo.

---

## Boas Práticas

1. **Slug único:** o painel evita duplicidade, mas revise antes de exportar.  
2. **Conteúdo com Markdown simples:** use `#` ou `##` para títulos e `-` para listas.  
3. **Tags/Categorias:** separe por vírgula e mantenha capitalização consistente.  
4. **Imagem destacada:** garanta que o arquivo exista na pasta indicada (ex.: `temp_images/`).  
5. **SEO:** escreva descrições objetivas (até ~160 caracteres) e palavras-chave relevantes.  
6. **FAQ:** utilize apenas perguntas que serão exibidas na matéria; evite deixar perguntas vazias.  
7. **Controle de versão:** sempre exporte e confirme o commit do `blog-posts.json` após mudanças.

---

## Troubleshooting

- **Matéria não aparece na listagem:** verifique se o JSON foi exportado e substituído no diretório correto.  
- **Slug duplicado:** edite a matéria pelo painel e ajuste o slug manualmente.  
- **Erro ao importar JSON:** confirme se o arquivo contém as chaves `meta` e `posts` e se o JSON é válido.  
- **Imagens quebradas:** confira o caminho informado no campo “Imagem destacada” e se o arquivo foi adicionado ao projeto.

Com isso, o blog fica centralizado em um único arquivo de dados, gerenciado de forma amigável pelo painel administrativo. Boas publicações! 🚀

