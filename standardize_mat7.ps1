# standardize_mat7.ps1
$f = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\V55_QUIZ_mat7.md"
$lines = Get-Content $f -Encoding UTF8
$newLines = @("# Matematika 7 - Baza Pitanja (100)", "| ID | Pitanje | Opcija A | Opcija B | Opcija C | Opcija D | Točan (0-3) | URL slike | Objašnjenje | Semestar |", "|----|---------|----------|----------|----------|----------|-------------|-----------|-------------|----------|")
foreach ($l in $lines) {
    if ($l -match "^\|\s*\d+\s*\|") {
        $p = $l.Split('|')
        if ($p.Count -ge 11) {
            $id = $p[1].Trim()
            $q = $p[2].Trim()
            $oldC = $p[3].Trim()
            $oldA = $p[4].Trim()
            $oldD = $p[5].Trim()
            $oldB = $p[6].Trim()
            $oldCorrect = [int]($p[7].Trim())
            $url = $p[8].Trim()
            $exp = $p[9].Trim()
            $sem = $p[10].Trim()
            
            # Identify correct answer string based on the strange Mat 7 header:
            # Index 3=C, 4=A, 5=D, 6=B
            $correctStr = ""
            if ($oldCorrect -eq 0) { $correctStr = $oldC }
            elseif ($oldCorrect -eq 1) { $correctStr = $oldA }
            elseif ($oldCorrect -eq 2) { $oldCorrect_is_D = $true; $correctStr = $oldD }
            elseif ($oldCorrect -eq 3) { $oldCorrect_is_B = $true; $correctStr = $oldB }
            
            # Re-map to standard A, B, C, D order
            $newA = $oldA
            $newB = $oldB
            $newC = $oldC
            $newD = $oldD
            
            # Find new correct index (0=A, 1=B, 2=C, 3=D)
            $newCorrect = -1
            if ($correctStr -eq $newA) { $newCorrect = 0 }
            elseif ($correctStr -eq $newB) { $newCorrect = 1 }
            elseif ($correctStr -eq $newC) { $newCorrect = 2 }
            elseif ($correctStr -eq $newD) { $newCorrect = 3 }
            
            $newLines += "| $id | $q | $newA | $newB | $newC | $newD | $newCorrect | $url | $exp | $sem |"
        }
    }
}
$newLines | Out-File $f -Encoding UTF8 -Force
Write-Host "V55_QUIZ_mat7.md standardized!"
