# md_to_js_6th.ps1
# Converts 6th grade Markdown files (Parts 1 & 2) to JS data files.

$srcDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\md_sources_6th"
$outDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content"

# Ensure output directory exists
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }

# Mappings: Output Output JS Filename -> Input MD Parts
$mappings = @{
    "mat_6.js" = @("bulk_mat6_part1.md", "bulk_mat6_part2.md")
    "hrv_6.js" = @("bulk_hrv6_part1.md", "bulk_hrv6_part2.md")
    "eng_6.js" = @("bulk_eng6_part1.md", "bulk_eng6_part2.md")
    "ger_6.js" = @("bulk_ger6_part1.md", "bulk_ger6_part2.md")
    "geo_6.js" = @("bulk_geo6_part1.md", "bulk_geo6_part2.md")
    "pov_6.js" = @("bulk_pov6_part1.md", "bulk_pov6_part2.md")
    "pri_6.js" = @("bulk_pri6_part1.md", "bulk_pri6_part2.md")
    "gla_6.js" = @("bulk_gla6_part1.md", "bulk_gla6_part2.md")
    "lik_6.js" = @("bulk_lik6_part1.md", "bulk_lik6_part2.md")
    "teh_6.js" = @("bulk_teh6_part1.md", "bulk_teh6_part2.md")
    "inf_6.js" = @("bulk_inf6_part1.md", "bulk_inf6_part2.md")
}

foreach ($outName in $mappings.Keys) {
    $inputFiles = $mappings[$outName]
    $jsData = @()
    $varName = $outName.Replace(".js", "").ToUpper() + "_DATA" # e.g. MAT_6_DATA

    Write-Host "Processing $outName..."

    foreach ($fileName in $inputFiles) {
        $fullPath = Join-Path $srcDir $fileName
        if (Test-Path $fullPath) {
            $lines = Get-Content $fullPath -Encoding UTF8
            foreach ($line in $lines) {
                # Match lines starting with "| ID |" or similar are headers, skip them
                # Match data rows: | 1 | Question | ...
                if ($line -match "^\|\s*\d+\s*\|") {
                    $p = $line.Split('|')
                    if ($p.Count -ge 11) {
                        $id = $p[1].Trim()
                        # Escape quotes for JS string
                        $q = $p[2].Trim() -replace '"', '\"'
                        $a = $p[3].Trim() -replace '"', '\"'
                        $b = $p[4].Trim() -replace '"', '\"'
                        $c = $p[5].Trim() -replace '"', '\"'
                        $d = $p[6].Trim() -replace '"', '\"'
                        $correct = $p[7].Trim()
                        # $p[8] is URL image (skip if empty)
                        $image = $p[8].Trim()
                        $exp = $p[9].Trim() -replace '"', '\"'
                        $sem = $p[10].Trim()

                        # Construct JSON object
                        # Note: IDs in part 2 start from 101, which is fine.
                        $obj = "    { `"id`": $id, `"semester`": $sem, `"pitanje`": `"$q`", `"opcije`": [`"$a`", `"$b`", `"$c`", `"$d`"], `"tocan_odgovor`": $correct, `"obasnjenje`": `"$exp`""
                        
                        if ($image -ne "") {
                            $obj += ", `"slika`": `"$image`""
                        }
                        
                        $obj += " }"
                        $jsData += $obj
                    }
                }
            }
        }
        else {
            Write-Warning "Missing file: $fullPath"
        }
    }

    # Write JS file
    $outFile = Join-Path $outDir $outName
    $jsContent = "const $varName = [`n" + ($jsData -join ",`n") + "`n];"
    $jsContent | Out-File $outFile -Encoding UTF8 -Force
    Write-Host "Created $outFile"
}

Write-Host "All 6th grade files processed!"
