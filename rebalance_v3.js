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
        console.log(`[SKIP] ${filename} not found.`);
        return;
    }

    console.log(`[START] Processing ${filename}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let newLines = [];

    // Counters for verification
    let counts = { 0: 0, 1: 0, 2: 0, 3: 0 };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Match table row with ID
        // Assuming format: | ID | ...
        if (line.match(/^\|\s*\d+\s*\|/)) {
            const parts = line.split('|');

            // Expected indices based on split('|'):
            // [0]="" [1]=ID [2]=Q [3]=A [4]=B [5]=C [6]=D [7]=Correct [8]=URL ...

            if (parts.length >= 9) {
                const id = parts[1].trim();
                const question = parts[2].trim();
                const options = [parts[3].trim(), parts[4].trim(), parts[5].trim(), parts[6].trim()];
                const correctIndexStr = parts[7].trim();

                // Parse correct index
                let correctIndex = parseInt(correctIndexStr);

                if (!isNaN(correctIndex) && correctIndex >= 0 && correctIndex <= 3) {
                    const correctOptionText = options[correctIndex];

                    // SHUFFLE
                    const shuffledOptions = shuffleArray([...options]);
                    const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);

                    // Verify shuffle worked (statistically)
                    counts[newCorrectIndex]++;

                    // Reconstruct line parts
                    parts[3] = ` ${shuffledOptions[0]} `;
                    parts[4] = ` ${shuffledOptions[1]} `;
                    parts[5] = ` ${shuffledOptions[2]} `;
                    parts[6] = ` ${shuffledOptions[3]} `;
                    parts[7] = ` ${newCorrectIndex} `;

                    newLines.push(parts.join('|'));
                } else {
                    // Invalid index, keep line
                    console.warn(`[WARN] Invalid index ${correctIndexStr} for ID ${id}`);
                    newLines.push(lines[i]);
                }
            } else {
                newLines.push(lines[i]);
            }
        } else {
            newLines.push(lines[i]);
        }
    }

    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`[DONE] ${filename} - Distribution: 0:${counts[0]} 1:${counts[1]} 2:${counts[2]} 3:${counts[3]}`);
}

TARGET_FILES.forEach(file => processFile(file));
console.log("All files rebalanced.");
