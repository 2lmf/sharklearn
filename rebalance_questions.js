const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Karlo\\.gemini\\antigravity\\brain\\223b23d5-3f10-45f7-9806-53de5c111c1d';

const TARGET_FILES = [
    'bulk_pri5.md',
    'bulk_ger7.md',
    'bulk_bio7_full.md',
    'bulk_geo5_full.md',
    'bulk_eng5_full.md',
    'bulk_ger5_full.md',
    'bulk_geo7_full.md',
    'bulk_his7.md',
    'bulk_hrv5.md',
    'bulk_hrv7.md'
];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function processFile(filename) {
    const filePath = path.join(ARTIFACTS_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${filename} - not found.`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let newLines = [];
    let processingTable = false;
    let headerPassed = false;

    // Detect table columns specifically
    // Expected: ID | Pitanje | Opcija A | Opcija B | Opcija C | Opcija D | Točan (0-3) | ...

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('| ID |') || line.startsWith('|ID|')) {
            newLines.push(lines[i]); // Keep header
            processingTable = true;
            headerPassed = false;
            continue;
        }

        if (processingTable && line.startsWith('|-')) {
            newLines.push(lines[i]); // Keep separator
            headerPassed = true;
            continue;
        }

        if (processingTable && line.startsWith('|') && headerPassed) {
            // This is a data row
            // Split by pipe, but be careful of escaped pipes if any (assuming none for simplicity for now as per previous artifact generation)
            // Using split('|').slice(1, -1) to remove empty start/end logic if pipes are at ends
            const parts = lines[i].split('|').map(p => p.trim());

            // Expected indices in parts array (which includes empty string at start/end if split by |)
            // | ID | Pitanje | A | B | C | D | Correct | ...
            // 0: ""
            // 1: ID
            // 2: Pitanje
            // 3: A
            // 4: B
            // 5: C
            // 6: D
            // 7: Correct Index
            // ...

            if (parts.length >= 8) {
                const id = parts[1];
                const question = parts[2];
                const options = [parts[3], parts[4], parts[5], parts[6]];
                const correctIndexStr = parts[7];
                const rest = parts.slice(8); // Image, Explanation, Semester, empty end

                let correctIndex = parseInt(correctIndexStr);
                if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
                    // Keep as is if invalid
                    newLines.push(lines[i]);
                    continue;
                }

                const correctOptionText = options[correctIndex];

                // Shuffle options
                const shuffledOptions = shuffleArray([...options]);

                // Find new index
                const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);

                // Reconstruct line
                // Note: using the original parts[0] which is empty string usually to ensure left pipe
                let newLine = `| ${id} | ${question} | ${shuffledOptions[0]} | ${shuffledOptions[1]} | ${shuffledOptions[2]} | ${shuffledOptions[3]} | ${newCorrectIndex} | ${rest.join(' | ')}`;

                // Fix potential double pipe at end if rest had empty string at end
                // If rest.join ends with ' | ', it's fine. 
                // Let's just ensure it looks good.

                newLines.push(newLine);
            } else {
                newLines.push(lines[i]);
            }
        } else {
            newLines.push(lines[i]);
            if (line === '') processingTable = false; // Assume blank line ends table
        }
    }

    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`Processed ${filename}`);
}

TARGET_FILES.forEach(file => processFile(file));
console.log("Done rebalancing!");
