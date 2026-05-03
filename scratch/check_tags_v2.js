import fs from 'fs';

const content = fs.readFileSync(process.argv[2], 'utf8');
const lines = content.split('\n');

let stack = [];
const tagRegex = /<(\/?[a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let match;
    while ((match = tagRegex.exec(line)) !== null) {
        const tagName = match[1];
        const isSelfClosing = match[2] === '/' || ['img', 'input', 'br', 'hr'].includes(tagName.toLowerCase());
        const isClosing = tagName.startsWith('/');

        if (isSelfClosing) continue;

        if (isClosing) {
            const name = tagName.substring(1);
            if (stack.length === 0) {
                console.log(`Unexpected closing tag </${name}> at line ${i + 1}`);
            } else {
                const last = stack.pop();
                if (last.name !== name) {
                    console.log(`Mismatch at line ${i + 1}: found </${name}>, but last opened was <${last.name}> from line ${last.line}`);
                }
            }
        } else {
            stack.push({ name: tagName, line: i + 1 });
        }
    }
}

if (stack.length > 0) {
    console.log(`Unclosed tags at end of file:`);
    stack.forEach(s => console.log(`  <${s.name}> from line ${s.line}`));
} else {
    console.log('All tags are balanced!');
}
