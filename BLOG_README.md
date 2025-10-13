# Blog OPER - Documentação

## Estrutura do Blog

O blog do OPER consiste nos seguintes arquivos e diretórios:

- `blog.html` - Página principal do blog que lista todos os artigos
- `conexao-oper.html` - Página principal da Conexão OPER (destaque especial)
- `blog-*.html` - Páginas individuais para cada artigo do blog
- `blog_post_*.csv` - Arquivos CSV contendo os dados dos artigos
- `css/blog-styles.css` - Estilos específicos para o blog
- `js/blog-loader.js` - Script para carregar e exibir os artigos do blog

## Como Adicionar um Novo Artigo

### 1. Criar o Arquivo CSV

Crie um novo arquivo CSV no formato `blog_post_N.csv` onde N é o próximo número disponível.

A estrutura do arquivo CSV deve ser:
```
DATA_HORA,TÍTULO
CONTEÚDO
```

Exemplo:
```
2025-10-15 14:00:00,Novo Título do Artigo
Conteúdo do artigo em formato de texto...
```

### 2. Adicionar Dados ao Script

No arquivo `blog.html`, adicione uma nova entrada ao array `blogPostData`:

```javascript
{
    file: "blog_post_N.csv",
    image: "caminho/para/imagem.jpg",
    criticality: "high|medium|low",
    link: "blog-novo-artigo.html"
}
```

### 3. Criar a Página Individual do Artigo

Crie um novo arquivo HTML para o artigo com o nome `blog-novo-artigo.html` baseando-se em um dos arquivos existentes.

## Estilos de Criticidade

Os artigos são categorizados por níveis de criticidade que afetam sua aparência visual:

- `high` - Borda vermelha (itens críticos)
- `medium` - Borda amarela (itens importantes)
- `low` - Borda verde (itens informativos)

## Imagens

As imagens devem ser colocadas no diretório `temp_images` ou outro diretório apropriado. O sistema tentará primeiro carregar a imagem especificada e, em caso de falha, usará uma imagem padrão.

## Manutenção

Para manter o blog funcionando corretamente:

1. Certifique-se de que os arquivos CSV estão no formato correto
2. Verifique se todas as imagens especificadas existem
3. Mantenha os links atualizados quando renomear arquivos
4. Atualize o array `blogPostData` quando adicionar ou remover artigos

## Artigos Atuais

1. `blog_post_0.csv` - Inauguração do Blog OPER (15/10/2025)
2. `blog_post_1.csv` - MTBF e MTTR: Suas Armas Estratégicas na Manutenção (13/10/2025)
3. `blog_post_2.csv` - Nível de Criticidade: Sua Bússola na Manutenção (10/10/2025)
4. `blog_post_3.csv` - Relatórios Automáticos: Sua Estratégia de Manutenção (08/10/2025)

## Página Principal - Conexão OPER

A página `conexao-oper.html` é a página principal da comunidade Conexão OPER, com layout especializado que inclui:

- Barra superior com links de navegação
- Seção hero com call-to-action principal
- Layout de duas colunas (conteúdo principal + sidebar)
- Seção de FAQ com acordeão interativo
- Widgets de sidebar (busca, posts recentes, tópicos populares, newsletter)

## Solução de Problemas

Se os artigos não estiverem carregando:

1. Verifique se o caminho para o arquivo CSV está correto
2. Confirme se o arquivo CSV existe e está formatado corretamente
3. Verifique o console do navegador para mensagens de erro
4. Certifique-se de que o servidor permite acesso a arquivos CSV (necessário para leitura via JavaScript)