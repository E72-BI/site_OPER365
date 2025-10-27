# Utility script: converts legacy CSV blog posts into a structured JSON file.

$encodingMap = @{
    aTilde = [char]0x00E3
    eAcute = [char]0x00E9
    iAcute = [char]0x00ED
    oAcute = [char]0x00F3
    uAcute = [char]0x00FA
    cCedilha = [char]0x00E7
    aAcute = [char]0x00E1
    oTilde = [char]0x00F5
}

function Convert-WithDiacritics {
    param(
        [string]$Template
    )

    $result = $Template
    foreach ($key in $encodingMap.Keys) {
        $token = '{' + $key + '}'
        if ($result -like "*$token*") {
            $result = $result.Replace($token, [string]$encodingMap[$key])
        }
    }
    return $result
}

$metaMap = @{
    "blog_post_0.csv" = [ordered]@{
        slug        = "blog-opening"
        image       = "temp_images/teamwork.jpg"
        imageAlt    = Convert-WithDiacritics "Equipe OPER colaborando em reuni{aTilde}o"
        criticality = "low"
        tags        = @(
            Convert-WithDiacritics "Conex{aTilde}o OPER"
            Convert-WithDiacritics "Boas-vindas"
            Convert-WithDiacritics "Manuten{cCedilha}{aTilde}o"
        )
        categories  = @("Editorial")
        seoDescription = Convert-WithDiacritics "Blog OPER: novidades, dicas e hist{oAcute}rias reais para quem vive manuten{cCedilha}{aTilde}o e facilities."
        seoKeywords = @(
            Convert-WithDiacritics "Conex{aTilde}o OPER"
            Convert-WithDiacritics "Blog de manuten{cCedilha}{aTilde}o"
            "Facilities"
        )
    }
    "blog_post_1.csv" = [ordered]@{
        slug        = "blog-mtbf-mttr"
        image       = "temp_images/analytics.jpg"
        imageAlt    = Convert-WithDiacritics "Gr{aAcute}ficos de desempenho em tela"
        criticality = "high"
        tags        = @(
            Convert-WithDiacritics "Indicadores"
            Convert-WithDiacritics "Estrat{eAcute}gia"
            Convert-WithDiacritics "Manuten{cCedilha}{aTilde}o"
        )
        categories  = @("KPIs")
    }
    "blog_post_2.csv" = [ordered]@{
        slug        = "blog-criticality-level"
        image       = "temp_images/dashboard_mockup.jpg"
        imageAlt    = Convert-WithDiacritics "Dashboard de indicadores em notebook"
        criticality = "medium"
        tags        = @(
            Convert-WithDiacritics "Criticidade"
            Convert-WithDiacritics "Governan{cCedilha}a"
            "Facilities"
        )
        categories  = @("Processos")
    }
    "blog_post_3.csv" = [ordered]@{
        slug        = "blog-automatic-reports"
        image       = "temp_images/mobile_app.jpg"
        imageAlt    = Convert-WithDiacritics "Aplicativo OPER exibido em smartphone"
        criticality = "low"
        tags        = @(
            Convert-WithDiacritics "Relat{oAcute}rios"
            Convert-WithDiacritics "Automatiza{cCedilha}{aTilde}o"
            "Compliance"
        )
        categories  = @("Tecnologia")
    }
}

$culture = [System.Globalization.CultureInfo]::InvariantCulture
$posts = @()

foreach ($entry in $metaMap.GetEnumerator()) {
    $fileName = $entry.Key
    $meta = $entry.Value

    if (-not (Test-Path $fileName)) {
        Write-Warning "Arquivo $fileName n{aTilde}o encontrado. Pulando."
        continue
    }

    $rawBytes = [System.IO.File]::ReadAllBytes($fileName)
    $rawText = [System.Text.Encoding]::UTF8.GetString($rawBytes)

    $firstComma = $rawText.IndexOf(',')
    if ($firstComma -lt 0) {
        throw "Formato inesperado no arquivo $fileName (data ausente)."
    }

    $secondComma = $rawText.IndexOf(',', $firstComma + 1)
    if ($secondComma -lt 0) {
        throw "Formato inesperado no arquivo $fileName (t{eAcute}tulo ausente)."
    }

    $dateText = $rawText.Substring(0, $firstComma).Trim()
    $title = $rawText.Substring($firstComma + 1, $secondComma - $firstComma - 1).Trim()

    $contentSection = $rawText.Substring($secondComma + 1).Trim()
    if ($contentSection.StartsWith('"') -and $contentSection.EndsWith('"')) {
        $contentSection = $contentSection.Substring(1, $contentSection.Length - 2)
    }

    $contentSection = $contentSection -replace '""', '"'
    $contentSection = $contentSection -replace "`r`n", "`n"

    $lines = $contentSection -split "`n"
    $mainLines = New-Object System.Collections.Generic.List[string]
    $seoDescription = $null
    $seoKeywords = @()
    $faqItems = New-Object System.Collections.Generic.List[object]
    $mode = 'main'
    $currentQuestion = $null

    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        switch ($mode) {
            'main' {
                if ($trimmed -eq 'SEO Meta Description') {
                    $mode = 'seo'
                }
                elseif ($trimmed -eq 'Suggested Keywords') {
                    $mode = 'keywords'
                }
                elseif ($trimmed -eq 'FAQ') {
                    $mode = 'faq'
                }
                else {
                    $mainLines.Add($line)
                }
            }
            'seo' {
                if (-not [string]::IsNullOrWhiteSpace($trimmed)) {
                    $seoDescription = $trimmed
                    $mode = 'main'
                }
            }
            'keywords' {
                if ([string]::IsNullOrWhiteSpace($trimmed)) {
                    $mode = 'main'
                }
                else {
                    $parts = $trimmed.Split(',') | ForEach-Object { $_.Trim().Trim('.') }
                    $seoKeywords += $parts
                }
            }
            'faq' {
                if ([string]::IsNullOrWhiteSpace($trimmed)) {
                    continue
                }

                if ($trimmed -match '^\d+\.\s*(.+)$') {
                    $currentQuestion = $trimmed -replace '^\d+\.\s*', ''
                    if (-not $currentQuestion.EndsWith('?')) {
                        $currentQuestion += '?'
                    }
                }
                elseif ($currentQuestion) {
                    $faqItems.Add([ordered]@{
                        question = $currentQuestion
                        answer   = $trimmed
                    })
                    $currentQuestion = $null
                }
                elseif ($faqItems.Count -gt 0) {
                    $lastIndex = $faqItems.Count - 1
                    $faqItems[$lastIndex].answer = ($faqItems[$lastIndex].answer + " " + $trimmed).Trim()
                }
            }
        }
    }

    if (-not $seoDescription -and $meta.Contains('seoDescription')) {
        $seoDescription = $meta.seoDescription
    }

    if ($seoKeywords.Count -eq 0 -and $meta.Contains('seoKeywords')) {
        $seoKeywords = $meta.seoKeywords
    }

    $mainContent = [string]::Join("`n", $mainLines).Trim()
    $plainSummary = ($mainContent -replace '\s+', ' ').Trim()
    if ($plainSummary.Length -gt 250) {
        $plainSummary = ($plainSummary.Substring(0, 247).Trim()) + '...'
    }

    $publishDate = [datetime]::ParseExact($dateText, 'yyyy-MM-dd HH:mm:ss', $culture)
    $wordCount = (($mainContent -split '\s+') | Where-Object { $_ -ne '' }).Count
    $readingTime = [Math]::Max(1, [Math]::Ceiling($wordCount / 200.0))

    $post = [ordered]@{
        id                 = $meta.slug
        slug               = $meta.slug
        title              = $title
        status             = 'published'
        createdAt          = $publishDate.ToString('o')
        updatedAt          = $publishDate.ToString('o')
        publishedAt        = $publishDate.ToString('o')
        readingTimeMinutes = $readingTime
        author             = 'Equipe OPER'
        criticality        = $meta.criticality
        tags               = $meta.tags
        categories         = $meta.categories
        summary            = $plainSummary
        content            = $mainContent
        heroImage          = [ordered]@{
            src = $meta.image
            alt = $meta.imageAlt
        }
        seo = [ordered]@{
            description = $seoDescription
            keywords    = $seoKeywords
        }
        faq = $faqItems
        legacy = [ordered]@{
            sourceCsv  = $fileName
            legacyLink = ($meta.Contains('link') ? $meta.link : ($meta.slug + '.html'))
        }
    }

    $posts += $post
}

if (-not (Test-Path 'data')) {
    New-Item -ItemType Directory -Path 'data' | Out-Null
}

$payload = [ordered]@{
    meta = [ordered]@{
        version     = 1
        generatedAt = (Get-Date).ToString('o')
        locale      = 'pt-BR'
    }
    posts = $posts
}

$json = $payload | ConvertTo-Json -Depth 6
Set-Content -Path 'data/blog-posts.json' -Value $json -Encoding utf8

Write-Host "Arquivo data/blog-posts.json gerado com" $posts.Count "mat{eAcute}rias."
