$path = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\QUIZ_ger5_full.md"
$lines = Get-Content $path -Encoding UTF8
$newLines = @()

foreach ($l in $lines) {
    if ($l -match "^\|\s*\d+\s*\|") {
        $p = $l.Split('|')
        if ($p.Count -ge 11) {
            $id = $p[1].Trim()
            
            # Specific grammatical/typo fixes
            if ($id -eq "2") {
                $p[2] = " Du _______ fleißig. "
            }
            if ($id -eq "10") {
                $p[2] = " Sie _______ 10 Jahre alt. (ona) "
            }
            if ($id -eq "20") {
                $p[2] = " Sie _______ aus Split. (oni) "
            }
            if ($id -eq "37") {
                $p[2] = $p[2].Replace("sprecken", "sprechen")
            }
            
            # Remove explanation (Column 9)
            $p[9] = " "
            
            $newLines += $p -join "|"
        }
        else {
            $newLines += $l
        }
    }
    else {
        $newLines += $l
    }
}

$newLines | Out-File $path -Encoding UTF8 -Force
Write-Host "German 5 fixes applied successfully."
