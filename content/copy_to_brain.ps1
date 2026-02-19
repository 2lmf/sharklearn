# Copy MD files to brain directory with PROPERLY fixed headers
$srcDir = "C:\Users\Karlo\.gemini\antigravity\scratch\edukacija-app\content\md_output"
$brainDir = "C:\Users\Karlo\.gemini\antigravity\brain\90b8fd2d-b313-4708-962c-e7448ffce1b7"

$files = @(
    "kem_8", "kem_8_add",
    "bio_8", "bio_8_add",
    "geo_8", "geo_8_add",
    "his_8", "his_8_add",
    "hrv_8", "hrv_8_add",
    "ger_8", "ger_8_add",
    "eng_8", "eng_8_add",
    "lik_8", "lik_8_add",
    "gla_8", "gla_8_add",
    "teh_8", "teh_8_add",
    "vje_5", "vje_6", "vje_7", "vje_8"
)

# Correct header with proper Croatian characters
$fixedHeader = "| ID | Pitanje | Opcija A | Opcija B | Opcija C | Opcija D | To" + [char]0x010D + "an (0-3) | URL slike | Obja" + [char]0x0161 + "njenje | Semestar |"
$separator = "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"

foreach ($f in $files) {
    $srcFile = Join-Path $srcDir "$f.md"
    $destFile = Join-Path $brainDir "tablica_$f.md"
    
    if (Test-Path $srcFile) {
        # Read file bytes and decode as UTF-8
        $bytes = [System.IO.File]::ReadAllBytes($srcFile)
        $content = [System.Text.Encoding]::UTF8.GetString($bytes)
        $lines = $content -split "`r`n|`n"
        
        # Replace first two lines with fixed header
        $lines[0] = $fixedHeader
        $lines[1] = $separator
        
        # Write with UTF-8 no BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        $newContent = $lines -join "`n"
        [System.IO.File]::WriteAllText($destFile, $newContent, $utf8NoBom)
        
        # Verify
        $verifyBytes = [System.IO.File]::ReadAllBytes($destFile)
        $verifyContent = [System.Text.Encoding]::UTF8.GetString($verifyBytes)
        $firstLine = ($verifyContent -split "`n")[0]
        $hasTocan = $firstLine.Contains("To" + [char]0x010D + "an")
        $hasObjasnjenje = $firstLine.Contains("Obja" + [char]0x0161 + "njenje")
        
        $dataRows = ($lines | Where-Object { $_ -match '^\| \d+' }).Count
        Write-Host "OK: tablica_$f.md ($dataRows rows) Header OK: $hasTocan/$hasObjasnjenje"
    }
    else {
        Write-Host "SKIP: $f.md not found"
    }
}

Write-Host "`nDone!"
