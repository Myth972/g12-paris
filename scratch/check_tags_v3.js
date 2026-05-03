import fs from 'fs';

const content = fs.readFileSync(process.argv[2], 'utf8');

let stack = [];
// Use [^] to match any character including newlines
const tagRegex = /<(\/?[a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;

let match;
while ((match = tagRegex.exec(content)) !== null) {
    const tagName = match[1];
    const isSelfClosing = match[2] === '/' || ['img', 'input', 'br', 'hr'].includes(tagName.toLowerCase());
    const isClosing = tagName.startsWith('/');

    // Find line number
    const offset = match.index;
    const lineNumber = content.substring(0, offset).split('\n').length;

    if (isSelfClosing) continue;

    if (isClosing) {
        const name = tagName.substring(1);
        if (stack.length === 0) {
            console.log(`Unexpected closing tag </${name}> at line ${lineNumber}`);
        } else {
            const last = stack.pop();
            if (last.name !== name) {
                console.log(`Mismatch at line ${lineNumber}: found </${name}>, but last opened was <${last.name}> from line ${last.line}`);
                // Restore stack to avoid cascading errors if it was just an extra tag
                // stack.push(last); 
            }
        }
    } else {
        stack.push({ name: tagName, line: lineNumber });
    }
}

if (stack.length > 0) {
    console.log(`Unclosed tags at end of file:`);
    stack.forEach(s => console.log(`  <${s.name}> from line ${s.line}`));
} else {
    console.log('All tags are balanced!');
}
