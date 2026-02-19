# Merge all question markdown files into subject-based combined artifacts
$brainDir = "C:\Users\Karlo\.gemini\antigravity\brain\90b8fd2d-b313-4708-962c-e7448ffce1b7"

# Group by subject - create per-subject combined files
$subjects = @(
    @{ name = "Matematika 8"; files = @("pitanja_mat_8.md", "pitanja_mat_8_add.md"); out = "pitanja_MATEMATIKA.md" },
    @{ name = "Fizika 8"; files = @("pitanja_fiz_8.md", "pitanja_fiz_8_add.md"); out = "pitanja_FIZIKA.md" },
    @{ name = "Kemija 8"; files = @("pitanja_kem_8.md", "pitanja_kem_8_add.md"); out = "pitanja_KEMIJA.md" },
    @{ name = "Biologija 8"; files = @("pitanja_bio_8.md", "pitanja_bio_8_add.md"); out = "pitanja_BIOLOGIJA.md" },
    @{ name = "Geografija 8"; files = @("pitanja_geo_8.md", "pitanja_geo_8_add.md"); out = "pitanja_GEOGRAFIJA.md" },
    @{ name = "Povijest 8"; files = @("pitanja_his_8.md", "pitanja_his_8_add.md"); out = "pitanja_POVIJEST.md" },
    @{ name = "Hrvatski 8"; files = @("pitanja_hrv_8.md", "pitanja_hrv_8_add.md"); out = "pitanja_HRVATSKI.md" },
    @{ name = "Njemacki 8"; files = @("pitanja_ger_8.md", "pitanja_ger_8_add.md"); out = "pitanja_NJEMACKI.md" },
    @{ name = "Engleski 8"; files = @("pitanja_eng_8.md", "pitanja_eng_8_add.md"); out = "pitanja_ENGLESKI.md" },
    @{ name = "Likovno 8"; files = @("pitanja_lik_8.md", "pitanja_lik_8_add.md"); out = "pitanja_LIKOVNO.md" },
    @{ name = "Glazbeno 8"; files = @("pitanja_gla_8.md", "pitanja_gla_8_add.md"); out = "pitanja_GLAZBENO.md" },
    @{ name = "Tehnicko 8"; files = @("pitanja_teh_8.md", "pitanja_teh_8_add.md"); out = "pitanja_TEHNICKO.md" },
    @{ name = "Vjeronauk 5-8"; files = @("pitanja_vje_5.md", "pitanja_vje_6.md", "pitanja_vje_7.md", "pitanja_vje_8.md"); out = "pitanja_VJERONAUK.md" }
)

foreach ($subj in $subjects) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("# $($subj.name)")
    [void]$sb.AppendLine("")
    
    $first = $true
    foreach ($file in $subj.files) {
        $path = Join-Path $brainDir $file
        if (Test-Path $path) {
            $content = Get-Content $path -Raw -Encoding UTF8
            # Skip the header line from each file, keep data rows
            $lines = $content -split "`n"
            foreach ($line in $lines) {
                $trimmed = $line.Trim()
                if ($trimmed -match '^\#') { continue }  # skip # headers
                if ($trimmed -eq '') { if (-not $first) { continue } }
                if ($first -and $trimmed -match '^\|') {
                    [void]$sb.AppendLine($trimmed)
                    $first = $false
                }
                elseif (-not $first -and $trimmed -match '^\|' -and $trimmed -notmatch '^\| ---') {
                    [void]$sb.AppendLine($trimmed)
                }
                elseif ($first) {
                    [void]$sb.AppendLine($trimmed)
                }
            }
        }
    }
    
    $outPath = Join-Path $brainDir $subj.out
    [System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
    Write-Host "OK: $($subj.out)"
}

Write-Host "Done!"
