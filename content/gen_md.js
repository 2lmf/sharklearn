// Generate markdown tables from JS quiz files
const fs = require('fs');
const path = require('path');

const contentDir = __dirname;
const outDir = path.join(contentDir, 'md_output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.js') && f !== 'gen_md.js');

for (const file of files) {
    const filePath = path.join(contentDir, file);
    const code = fs.readFileSync(filePath, 'utf8');

    // Extract the array data using regex
    const match = code.match(/\[[\s\S]*\]/);
    if (!match) { console.log(`SKIP: ${file} (no array found)`); continue; }

    let data;
    try {
        data = eval(match[0]);
    } catch (e) {
        console.log(`ERROR: ${file}: ${e.message}`);
        continue;
    }

    if (!Array.isArray(data) || data.length === 0) { console.log(`SKIP: ${file} (empty)`); continue; }

    // Build markdown table with correct column order
    const lines = [];
    lines.push(`| ID | Pitanje | Opcija A | Opcija B | Opcija C | Opcija D | Točan (0-3) | URL slike | Objašnjenje | Semestar |`);
    lines.push(`| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`);

    for (const q of data) {
        const id = q.id || '';
        const pitanje = (q.pitanje || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
        const opcA = (q.opcije[0] || '').toString().replace(/\|/g, '\\|');
        const opcB = (q.opcije[1] || '').toString().replace(/\|/g, '\\|');
        const opcC = (q.opcije[2] || '').toString().replace(/\|/g, '\\|');
        const opcD = (q.opcije[3] || '').toString().replace(/\|/g, '\\|');
        const tocan = q.tocan_odgovor;
        const url = q.url_slike || '';
        const obj = (q.obasnjenje || q.objasnjenje || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
        const sem = q.semester || '';

        lines.push(`| ${id} | ${pitanje} | ${opcA} | ${opcB} | ${opcC} | ${opcD} | ${tocan} | ${url} | ${obj} | ${sem} |`);
    }

    const baseName = file.replace('.js', '');
    const outFile = path.join(outDir, `${baseName}.md`);
    fs.writeFileSync(outFile, lines.join('\n') + '\n', 'utf8');
    console.log(`OK: ${baseName}.md (${data.length} rows)`);
}

console.log('Done!');
