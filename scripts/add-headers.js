/**
 * 🔧 Header Injection Script
 * 이 스크립트는 모든 소스 파일에 개발자 서명 헤더를 추가합니다.
 * 
 * 사용법: node scripts/add-headers.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HEADER_JS = `/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 데이터 연동 로직은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */

`;

const HEADER_CSS = `/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 * -----------------------------------------------------------
 * 이 파일의 UI/UX 설계 및 스타일링은 독자적인 기술과
 * 예술적 영감을 바탕으로 구축되었습니다.
 */

`;

const EXTENSIONS = ['.tsx', '.ts', '.js', '.jsx', '.css'];
const SRC_DIR = path.join(__dirname, '..', 'src');

function hasHeader(content) {
    return content.includes('Project: Zarada ERP') ||
        content.includes('Created by: 안욱빈');
}

function addHeader(filePath) {
    const ext = path.extname(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    // 이미 헤더가 있으면 스킵
    if (hasHeader(content)) {
        console.log(`⏭️  Skip: ${filePath} (already has header)`);
        return false;
    }

    const header = ext === '.css' ? HEADER_CSS : HEADER_JS;

    // @ts-nocheck나 eslint-disable가 있으면 그 다음에 삽입
    let newContent;
    if (content.startsWith('// @ts-nocheck') || content.startsWith('/* eslint-disable */')) {
        const lines = content.split('\n');
        let insertIndex = 0;

        // 첫 줄들이 // @ts-nocheck 또는 /* eslint-disable */인 경우 그 다음에 삽입
        for (let i = 0; i < Math.min(3, lines.length); i++) {
            if (lines[i].includes('@ts-nocheck') || lines[i].includes('eslint-disable')) {
                insertIndex = i + 1;
            }
        }

        lines.splice(insertIndex, 0, header.trim());
        newContent = lines.join('\n');
    } else {
        newContent = header + content;
    }

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Added: ${filePath}`);
    return true;
}

function walkDir(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // node_modules, dist 등 제외
            if (!['node_modules', 'dist', '.git', 'build'].includes(file)) {
                count += walkDir(filePath);
            }
        } else if (EXTENSIONS.includes(path.extname(file))) {
            if (addHeader(filePath)) {
                count++;
            }
        }
    }

    return count;
}

console.log('🎨 Zarada ERP Header Injection Script');
console.log('=====================================\n');

const added = walkDir(SRC_DIR);

console.log(`\n✨ Complete! Added headers to ${added} files.`);
