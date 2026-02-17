# md_to_js_ALL_V2.ps1
# Converts all V55 Markdown tables to JS data files for the quiz engine.

$dir = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d"
$outDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content"

$mappings = @{
    "V55_QUIZ_bio7_full.md" = @{ Var = "QUIZ_DATA"; Out = "bio_7.js" }
    "V55_QUIZ_geo5_full.md" = @{ Var = "GEO_DATA"; Out = "geo_5.js" }
    "V55_QUIZ_geo7_full.md" = @{ Var = "GEO_7_DATA"; Out = "geo_7.js" }
    "V55_QUIZ_eng5_full.md" = @{ Var = "ENG_DATA"; Out = "eng_5.js" }
    "V55_QUIZ_eng7.md"      = @{ Var = "ENG_7_DATA"; Out = "eng_7.js" }
    "V55_QUIZ_ger5_full.md" = @{ Var = "GER_DATA"; Out = "ger_5.js" }
    "V55_QUIZ_ger7.md"      = @{ Var = "GER_7_DATA"; Out = "ger_7.js" }
    "V55_QUIZ_his5.md"      = @{ Var = "HIS_5_DATA"; Out = "his_5.js" }
    "V55_QUIZ_his7.md"      = @{ Var = "HIS_DATA"; Out = "his_7.js" }
    "V55_QUIZ_hrv5.md"      = @{ Var = "HRV_5_DATA"; Out = "hrv_5.js" }
    "V55_QUIZ_hrv7.md"      = @{ Var = "HRV_7_DATA"; Out = "hrv_7.js" }
    "V55_QUIZ_kem7.md"      = @{ Var = "KEM_DATA"; Out = "kem_7.js" }
    "V55_QUIZ_fiz7.md"      = @{ Var = "FIZ_DATA"; Out = "fiz_7.js" }
    "V55_QUIZ_mat5.md"      = @{ Var = "MAT_DATA"; Out = "mat_5.js" }
    "V55_QUIZ_mat7.md"      = @{ Var = "MAT_7_DATA"; Out = "mat_7.js" }
    "V55_QUIZ_pri5.md"      = @{ Var = "PRI_5_DATA"; Out = "pri_5.js" }
}

foreach ($item in $mappings.GetEnumerator()) {
    $inFile = Join-Path $dir $item.Key
    $outFile = Join-Path $outDir $item.Value.Out
    $varName = $item.Value.Var

    if (Test-Path $inFile) {
        Write-Host "Converting $($item.Key) -> $($item.Value.Out) ($varName)"
        $lines = Get-Content $inFile -Encoding UTF8
        $jsData = @()

        foreach ($line in $lines) {
            if ($line -match "^\|\s*\d+\s*\|") {
                $p = $line.Split('|')
                if ($p.Count -ge 11) {
                    $id = $p[1].Trim()
                    $q = $p[2].Trim() -replace '"', '\"'
                    $a = $p[3].Trim() -replace '"', '\"'
                    $b = $p[4].Trim() -replace '"', '\"'
                    $c = $p[5].Trim() -replace '"', '\"'
                    $d = $p[6].Trim() -replace '"', '\"'
                    $correct = $p[7].Trim()
                    $exp = $p[9].Trim() -replace '"', '\"'
                    $sem = $p[10].Trim()

                    $obj = "    { `"id`": $id, `"semester`": $sem, `"pitanje`": `"$q`", `"opcije`": [`"$a`", `"$b`", `"$c`", `"$d`"], `"tocan_odgovor`": $correct, `"obasnjenje`": `"$exp`" }"
                    $jsData += $obj
                }
            }
        }

        $jsContent = "const $varName = [`n" + ($jsData -join ",`n") + "`n];"
        $jsContent | Out-File $outFile -Encoding UTF8 -Force
    }
    else {
        Write-Warning "File not found: $inFile"
    }
}

Write-Host "All conversions complete!"
