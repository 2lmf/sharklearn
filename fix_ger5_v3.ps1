$inputFile = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\bulk_ger5_full.md"
$outputFile = "C:\Users\Karlo\.gemini\antigravity\brain\223b23d5-3f10-45f7-9806-53de5c111c1d\bulk_ger5_refined_v3.md"

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
            $correctIdxStr = $p[7].Trim()
            $correctIdx = [int]$correctIdxStr
            $options = @($a, $b, $c, $d)
            $correctValue = $options[$correctIdx]
            $sem = $p[10].Trim()

            # 1. CLEAN QUESTION: Remove Croatian hints in parentheses or after arrows
            $cleanQ = $q -replace ' \([^)]*\)', ''
            $cleanQ = $cleanQ -replace ' -> .*$', ''

            # 2. GENERATE EDUCATIONAL EXPLANATION
            $exp = ""
            
            # Categories based on correct answer and question context
            if ($correctValue -eq "bin") { $exp = "Uz zamjenicu 'Ich' uvijek koristimo 'bin' (ja sam)." }
            elseif ($correctValue -eq "bist") { $exp = "Uz 'Du' (ti) koristimo 'bist' (ti si)." }
            elseif ($correctValue -eq "ist") { $exp = "Za on/ona/ono (Er/Sie/Es) koristimo 'ist' (je)." }
            elseif ($correctValue -eq "sind") { $exp = "Glagol 'sind' koristimo za mi (Wir) ili oni (Sie)." }
            elseif ($correctValue -eq "seid") { $exp = "Glagol 'seid' koristimo za vi (Ihr)." }
            
            elseif ($correctValue -eq "habe") { $exp = "Uz 'Ich' (ja) koristimo 'habe' (imam)." }
            elseif ($correctValue -eq "hast") { $exp = "Uz 'Du' (ti) koristimo 'hast' (imaš)." }
            elseif ($correctValue -eq "hat") { $exp = "Za treće lice (on/ona/ono) koristimo 'hat' (ima)." }
            elseif ($correctValue -eq "haben") { $exp = "Za množinu (Wir/Sie/svi) koristimo 'haben' (imamo/imaju)." }
            elseif ($correctValue -eq "habt") { $exp = "Za 'Ihr' (vi) koristimo 'habt' (imate)." }
            
            elseif ($correctValue -eq "der") { $exp = "Određeni član 'der' koristimo za muški rod (npr. Tisch)." }
            elseif ($correctValue -eq "die") { $exp = "Određeni član 'die' koristimo za ženski rod ili množinu." }
            elseif ($correctValue -eq "das") { $exp = "Određeni član 'das' koristimo za srednji rod (npr. Buch)." }
            elseif ($correctValue -eq "den") { $exp = "U akuzativu 'der' postaje 'den' (objekt radnje)." }
            
            elseif ($correctValue -eq "ein") { $exp = "Neodređeni član 'ein' koristimo za muški ili srednji rod." }
            elseif ($correctValue -eq "eine") { $exp = "Neodređeni član 'eine' koristimo za ženski rod." }
            elseif ($correctValue -eq "einen") { $exp = "U akuzativu (objekt) muški član 'ein' postaje 'einen'." }
            
            elseif ($q -match "Wie heißt") { $exp = "Pitanje 'Kako se zoveš?' ide s 'Wie heißt du?'" }
            elseif ($q -match "Wer") { $exp = "Upitna zamjenica 'Wer' znači 'Tko'." }
            elseif ($q -match "Was") { $exp = "Upitna zamjenica 'Was' znači 'Što'." }
            elseif ($q -match "Wo") { $exp = "Upitna zamjenica 'Wo' znači 'Gdje'." }
            
            elseif ($correctValue -match "st$") { $exp = "U prezentu uz 'du' glagoli dobivaju nastavak -st." }
            elseif ($correctValue -match "t$") { $exp = "U prezentu uz 'er/sie/es' glagoli dobivaju nastavak -t." }
            elseif ($correctValue -match "en$") { $exp = "Za 'wir' ili 'sie' (oni) glagoli ostaju u infinitivu (-en)." }
            
            elseif ([int]$id -ge 50) { 
                # Vocabulary section
                if ($correctValue -eq "Pferd") { $exp = "Pferd na njemačkom znači konj." }
                elseif ($correctValue -eq "Tisch") { $exp = "Tisch znači stol." }
                elseif ($correctValue -eq "Karotte") { $exp = "Karotte znači mrkva." }
                elseif ($correctValue -eq "Lehrer") { $exp = "Lehrer je učitelj." }
                elseif ($correctValue -eq "Schultasche") { $exp = "Schultasche je školska torba." }
                elseif ($correctValue -eq "Wohnzimmer") { $exp = "Wohnzimmer je dnevni boravak." }
                elseif ($correctValue -eq "Rot") { $exp = "Rot je crvena boja." }
                elseif ($correctValue -eq "Löwe") { $exp = "Löwe je lav." }
                elseif ($correctValue -eq "Computer") { $exp = "Computer je računalo." }
                elseif ($correctValue -eq "Schwimmen") { $exp = "Schwimmen znači plivati." }
                elseif ($correctValue -eq "Bibliothek") { $exp = "Bibliothek je knjižnica." }
                elseif ($correctValue -eq "Glücklich") { $exp = "Glücklich znači sretan." }
                elseif ($correctValue -eq "Schuhe") { $exp = "Schuhe su cipele." }
                elseif ($correctValue -eq "Milch") { $exp = "Milch znači mlijeko." }
                elseif ($correctValue -eq "Fenster") { $exp = "Fenster znači prozor." }
                elseif ($correctValue -eq "Bleistift") { $exp = "Bleistift je olovka." }
                elseif ($correctValue -eq "Cousin") { $exp = "Cousin je bratić." }
                elseif ($correctValue -eq "Küche") { $exp = "Küche je kuhinja." }
                elseif ($correctValue -eq "Kino") { $exp = "Kino je dvorana za filmove." }
                elseif ($correctValue -eq "Groß") { $exp = "Groß znači velik." }
                elseif ($correctValue -eq "Brot") { $exp = "Brot znači kruh." }
                elseif ($correctValue -eq "Grün") { $exp = "Grün je zelena boja." }
                elseif ($correctValue -eq "Badezimmer") { $exp = "Badezimmer je kupaonica." }
                elseif ($correctValue -eq "Kranken") { $exp = "Krank znači bolestan." }
                elseif ($correctValue -eq "Räder") { $exp = "Räder su kotači." }
                elseif ($correctValue -eq "Orange") { $exp = "Orange je narančasta boja." }
                elseif ($correctValue -eq "Bett") { $exp = "Bett je krevet." }
                elseif ($correctValue -eq "Park") { $exp = "U parku se djeca igraju." }
                elseif ($correctValue -eq "Miau") { $exp = "Mačke mijauču (miau)." }
                elseif ($correctValue -eq "Kalt") { $exp = "Kalt znači hladno." }
                elseif ($correctValue -eq "Heiß") { $exp = "Heiß znači vruće." }
                elseif ($correctValue -eq "Hut") { $exp = "Hut je šešir." }
                elseif ($correctValue -eq "Buch") { $exp = "Buch znači knjiga." }
                elseif ($correctValue -eq "Mädchen") { $exp = "Mädchen znači djevojčica." }
                elseif ($correctValue -eq "Gelb") { $exp = "Gelb je žuta boja." }
                elseif ($correctValue -eq "Stuhl") { $exp = "Stuhl je stolica." }
                elseif ($correctValue -eq "Fliegen") { $exp = "Fliegen znači letjeti." }
                elseif ($correctValue -eq "Straße") { $exp = "Straße je ulica." }
                elseif ($correctValue -eq "Sport") { $exp = "Sport je aktivnost poput nogometa." }
                elseif ($correctValue -eq "Regen") { $exp = "Regen znači kiša." }
                elseif ($correctValue -eq "Süß") { $exp = "Süß znači slatko." }
                elseif ($correctValue -eq "Wuff") { $exp = "Psi kažu 'Wuff' (vau-vau)." }
                elseif ($correctValue -eq "Kleidung") { $exp = "Kleidung je odjeća." }
                elseif ($correctValue -eq "Schreibtisch") { $exp = "Schreibtisch je radni stol." }
                else { $exp = "Njemački vokabular: $correctValue je točan odgovor." }
            }
            
            if ($exp -eq "") { $exp = "Pravilna gramatika i vokabular za 5. razred." }

            # Rebuild line using -f operator for better safety
            $newLine = "| {0} | {1} | {2} | {3} | {4} | {5} | {6} | | {7} | {8} |" -f $id, $cleanQ, $a, $b, $c, $d, $correctIdx, $exp, $sem
            $newLines += $newLine
        }
    }
    else {
        $newLines += $line
    }
}

$newLines | Out-File $outputFile -Encoding UTF8 -Force
Write-Host "Refined file v3 saved to $outputFile"
