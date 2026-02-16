$inputFile = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\bulk_ger5_full.md"
$outputFile = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\bulk_ger5_refined.md"

$lines = Get-Content $inputFile -Encoding UTF8
$newLines = @()

foreach ($line in $lines) {
    if ($line -match "^\|\s*\d+\s*\|") {
        $p = $line.Split('|')
        if ($p.Count -ge 11) {
            $id = $p[1].Trim()
            $q = $p[2].Trim()
            $a = $p[3].Trim()
            $b = $p[4].Trim()
            $c = $p[5].Trim()
            $d = $p[6].Trim()
            $correct = $p[7].Trim()
            $sem = $p[10].Trim()

            # 1. Remove Croatian hints in parentheses from the question
            $q = $q -replace ' \([^)]*\)', ''
            $q = $q -replace ' -> .*$', '' # Remove things like "-> neodređeni član"

            # 2. Assign Explanation based on content
            $exp = ""
            if ($q -match "bist|sind|ist|bin|seid") { $exp = "Konjugacija glagola 'sein' (biti)." }
            elseif ($q -match "haben|habt|hast|hat|habe") { $exp = "Konjugacija glagola 'haben' (imati)." }
            elseif ($q -match "der|die|das|den") { $exp = "Određeni članovi (der, die, das) u nominativu ili akuzativu." }
            elseif ($q -match "ein|eine|einen") { $exp = "Neodređeni članovi (ein, eine) u nominativu ili akuzativu." }
            elseif ($q -match "spielen|gehe|lerne|wohne|singe|schreibe|trinke") { $exp = "Pravilna konjugacija glagola (prezent)." }
            elseif ($q -match "mag|kann|muss|darf|soll") { $exp = "Modalni glagoli (mögen, können, müssen)." }
            elseif ($q -match "Wer|Was|Wo|Wie") { $exp = "W-pitanja (upitne zamjenice)." }
            elseif ($q -match "Zamjenica") { $exp = "Osobne zamjenice (ich, du, er, sie, es...)." }
            elseif ($q -match "boja|crvena|žuta|plava") { $exp = "Njemački pridjevi i boje." }
            elseif ($index -ge 50) { $exp = "Njemački vokabular: životinje, namještaj, škola, hrana." }
            else { $exp = "Njemačka gramatika i vokabular za 5. razred." }

            # Rebuild line
            $newLines += "| $id | $q | $a | $b | $c | $d | $correct | | $exp | $sem |"
        }
    }
    else {
        $newLines += $line
    }
}

$newLines | Out-File $outputFile -Encoding UTF8 -Force
Write-Host "Refined file saved to $outputFile"
