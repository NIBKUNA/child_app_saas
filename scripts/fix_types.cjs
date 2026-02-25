const fs = require('fs');
const path = 'd:\\child_app_saas\\src\\types\\database.types.ts';

// Read as UTF-16LE
const buf = fs.readFileSync(path);
let text = buf.toString('utf16le');

// Remove BOM if present
if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

let changed = 0;

// 1. payment_items Row: add program_id after payment_id
text = text.replace(
    /(payment_items: \{[\s\S]*?Row: \{[\s\S]*?payment_id: string \| null\r?\n)((\s*)schedule_id: string \| null)/,
    (m, before, schedLine, indent) => {
        changed++;
        return before + indent + 'program_id: string | null\n' + indent + 'schedule_id: string | null';
    }
);

// 2. payment_items Insert: add program_id after payment_id
text = text.replace(
    /(payment_items:[\s\S]*?Insert: \{[\s\S]*?payment_id\?: string \| null\r?\n)((\s*)schedule_id\?: string \| null)/,
    (m, before, schedLine, indent) => {
        changed++;
        return before + indent + 'program_id?: string | null\n' + indent + 'schedule_id?: string | null';
    }
);

// 3. payment_items Update: add program_id after payment_id
text = text.replace(
    /(payment_items:[\s\S]*?Update: \{[\s\S]*?payment_id\?: string \| null\r?\n)((\s*)schedule_id\?: string \| null)/,
    (m, before, schedLine, indent) => {
        changed++;
        return before + indent + 'program_id?: string | null\n' + indent + 'schedule_id?: string | null';
    }
);

// 4. payments Row: add program_id after payment_month
text = text.replace(
    /(payments: \{[\s\S]*?Row: \{[\s\S]*?payment_month: string\r?\n)((\s*)\})/,
    (m, before, closeBrace, indent) => {
        changed++;
        return before + indent + 'program_id: string | null\n' + indent + '}';
    }
);

// 5. payments Insert: add program_id after payment_month
text = text.replace(
    /(payments:[\s\S]*?Insert: \{[\s\S]*?payment_month: string\r?\n)((\s*)\})/,
    (m, before, closeBrace, indent) => {
        changed++;
        return before + indent + 'program_id?: string | null\n' + indent + '}';
    }
);

// 6. payments Update: add program_id after payment_month
text = text.replace(
    /(payments:[\s\S]*?Update: \{[\s\S]*?payment_month\?: string\r?\n)((\s*)\})/,
    (m, before, closeBrace, indent) => {
        changed++;
        return before + indent + 'program_id?: string | null\n' + indent + '}';
    }
);

// Write back as UTF-16LE with BOM
const output = Buffer.from('\uFEFF' + text, 'utf16le');
fs.writeFileSync(path, output);

console.log(`Done! ${changed} replacements made.`);
