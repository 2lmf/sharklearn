# md_to_js_ALL_V2.ps1
# Converts all V55 Markdown tables to JS data files for the quiz engine.

$dir = "C:\Users\Karlo\.gemini\antigravity\brain\bd5895eb-bf2b-4f7a-ad08-034d1e3999d3"
$outDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content"

$mappings = @{
    "V55_QUIZ_bio7_full.md"   = @{ Var = "QUIZ_DATA"; Out = "bio_7.js" }
    "V55_QUIZ_geo5_full.md"   = @{ Var = "GEO_DATA"; Out = "geo_5.js" }
    "V55_QUIZ_geo7_full.md"   = @{ Var = "GEO_7_DATA"; Out = "geo_7.js" }
    "V55_QUIZ_eng5_full.md"   = @{ Var = "ENG_DATA"; Out = "eng_5.js" }
    "V55_QUIZ_eng7.md"        = @{ Var = "ENG_7_DATA"; Out = "eng_7.js" }
    "V55_QUIZ_ger5_full.md"   = @{ Var = "GER_DATA"; Out = "ger_5.js" }
    "V55_QUIZ_ger7.md"        = @{ Var = "GER_7_DATA"; Out = "ger_7.js" }
    "V55_QUIZ_his5.md"        = @{ Var = "HIS_5_DATA"; Out = "his_5.js" }
    "V55_QUIZ_his7.md"        = @{ Var = "HIS_DATA"; Out = "his_7.js" }
    "V55_QUIZ_hrv5.md"        = @{ Var = "HRV_5_DATA"; Out = "hrv_5.js" }
    "V55_QUIZ_hrv7.md"        = @{ Var = "HRV_7_DATA"; Out = "hrv_7.js" }
    "V55_QUIZ_kem7.md"        = @{ Var = "KEM_DATA"; Out = "kem_7.js" }
    "V55_QUIZ_fiz7.md"        = @{ Var = "FIZ_DATA"; Out = "fiz_7.js" }
    "V55_QUIZ_mat5.md"        = @{ Var = "MAT_DATA"; Out = "mat_5.js" }
    "V55_QUIZ_mat7.md"        = @{ Var = "MAT_7_DATA"; Out = "mat_7.js" }
    "V55_QUIZ_pri5.md"        = @{ Var = "PRI_5_DATA"; Out = "pri_5.js" }

    # 5. RAZRED ADDITIONS
    "bulk_glaz5.md"           = @{ Var = "GLA_5_DATA"; Out = "gla_5.js" }
    "bulk_lik5.md"            = @{ Var = "LIK_5_DATA"; Out = "lik_5.js" }
    "bulk_inf5_part1.md"      = @{ Var = "INF_5_P1_DATA"; Out = "inf_5_p1.js" }
    "bulk_inf5_part2.md"      = @{ Var = "INF_5_P2_DATA"; Out = "inf_5_p2.js" }
    "bulk_teh5.md"            = @{ Var = "TEH_5_DATA"; Out = "teh_5.js" }

    # 7. RAZRED ADDITIONS
    "bulk_lik7.md"            = @{ Var = "LIK_7_DATA"; Out = "lik_7.js" }
    "bulk_glaz7.md"           = @{ Var = "GLA_7_DATA"; Out = "gla_7.js" }
    "bulk_bio7_additional.md" = @{ Var = "BIO_7_PART2_DATA"; Out = "bio_7_p2.js" }
    "bulk_eng7_part1.md"      = @{ Var = "ENG_7_P1_DATA"; Out = "eng_7_p1.js" }
    "bulk_eng7_part2.md"      = @{ Var = "ENG_7_P2_DATA"; Out = "eng_7_p2.js" }
    "bulk_fiz7_additional.md" = @{ Var = "FIZ_7_ADD_DATA"; Out = "fiz_7_add.js" }
    "bulk_geo7_additional.md" = @{ Var = "GEO_7_ADD_DATA"; Out = "geo_7_add.js" }
    "bulk_ger7_additional.md" = @{ Var = "GER_7_ADD_DATA"; Out = "ger_7_add.js" }
    "bulk_his7_additional.md" = @{ Var = "HIS_7_ADD_DATA"; Out = "his_7_add.js" }
    "bulk_hrv7_additional.md" = @{ Var = "HRV_7_ADD_DATA"; Out = "hrv_7_add.js" }
    "bulk_kem7_additional.md" = @{ Var = "KEM_7_ADD_DATA"; Out = "kem_7_add.js" }
    "bulk_mat7_additional.md" = @{ Var = "MAT_7_ADD_DATA"; Out = "mat_7_add.js" }
    "bulk_teh7_part1.md"      = @{ Var = "TEH_7_P1_DATA"; Out = "teh_7_p1.js" }
    "bulk_teh7_part2.md"      = @{ Var = "TEH_7_P2_DATA"; Out = "teh_7_p2.js" }
    "bulk_inf7_part1.md"      = @{ Var = "INF_7_P1_DATA"; Out = "inf_7_p1.js" }
    "bulk_inf7_part2.md"      = @{ Var = "INF_7_P2_DATA"; Out = "inf_7_p2.js" }

    # 6. RAZRED (COMPLETE)
    "bulk_mat6_part1.md"      = @{ Var = "MAT_6_P1_DATA"; Out = "mat_6_p1.js" }
    "bulk_mat6_part2.md"      = @{ Var = "MAT_6_P2_DATA"; Out = "mat_6_p2.js" }
    "bulk_hrv6_part1.md"      = @{ Var = "HRV_6_P1_DATA"; Out = "hrv_6_p1.js" }
    "bulk_hrv6_part2.md"      = @{ Var = "HRV_6_P2_DATA"; Out = "hrv_6_p2.js" }
    "bulk_eng6_part1.md"      = @{ Var = "ENG_6_P1_DATA"; Out = "eng_6_p1.js" }
    "bulk_eng6_part2.md"      = @{ Var = "ENG_6_P2_DATA"; Out = "eng_6_p2.js" }
    "bulk_ger6_part1.md"      = @{ Var = "GER_6_P1_DATA"; Out = "ger_6_p1.js" }
    "bulk_ger6_part2.md"      = @{ Var = "GER_6_P2_DATA"; Out = "ger_6_p2.js" }
    "bulk_geo6_part1.md"      = @{ Var = "GEO_6_P1_DATA"; Out = "geo_6_p1.js" }
    "bulk_geo6_part2.md"      = @{ Var = "GEO_6_P2_DATA"; Out = "geo_6_p2.js" }
    "bulk_pov6_part1.md"      = @{ Var = "HIS_6_P1_DATA"; Out = "his_6_p1.js" }
    "bulk_pov6_part2.md"      = @{ Var = "HIS_6_P2_DATA"; Out = "his_6_p2.js" }
    "bulk_pri6_part1.md"      = @{ Var = "PRI_6_P1_DATA"; Out = "pri_6_p1.js" }
    "bulk_pri6_part2.md"      = @{ Var = "PRI_6_P2_DATA"; Out = "pri_6_p2.js" }
    "bulk_gla6_part1.md"      = @{ Var = "GLA_6_P1_DATA"; Out = "gla_6_p1.js" }
    "bulk_gla6_part2.md"      = @{ Var = "GLA_6_P2_DATA"; Out = "gla_6_p2.js" }
    "bulk_lik6_part1.md"      = @{ Var = "LIK_6_P1_DATA"; Out = "lik_6_p1.js" }
    "bulk_lik6_part2.md"      = @{ Var = "LIK_6_P2_DATA"; Out = "lik_6_p2.js" }
    "bulk_teh6_part1.md"      = @{ Var = "TEH_6_P1_DATA"; Out = "teh_6_p1.js" }
    "bulk_teh6_part2.md"      = @{ Var = "TEH_6_P2_DATA"; Out = "teh_6_p2.js" }
    "bulk_inf6_part1.md"      = @{ Var = "INF_6_P1_DATA"; Out = "inf_6_p1.js" }
    "bulk_inf6_part2.md"      = @{ Var = "INF_6_P2_DATA"; Out = "inf_6_p2.js" }
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
                    $q = [string]$p[2].Trim() -replace '"', '\"'
                    $a = [string]$p[3].Trim() -replace '"', '\"'
                    $b = [string]$p[4].Trim() -replace '"', '\"'
                    $c = [string]$p[5].Trim() -replace '"', '\"'
                    $d = [string]$p[6].Trim() -replace '"', '\"'
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
