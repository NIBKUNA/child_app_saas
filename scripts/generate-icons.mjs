import sharp from 'sharp';
import { resolve } from 'path';

const SOURCE = resolve('public/favicon_tree.png');
const PUBLIC = resolve('public');

async function generate() {
    await sharp(SOURCE).resize(32, 32, { fit: 'cover' }).png().toFile(resolve(PUBLIC, 'favicon.png'));
    console.log('✅ favicon.png (32x32)');

    await sharp(SOURCE).resize(32, 32, { fit: 'cover' }).png().toFile(resolve(PUBLIC, 'favicon.ico'));
    console.log('✅ favicon.ico (32x32)');

    await sharp(SOURCE).resize(192, 192, { fit: 'cover' }).png().toFile(resolve(PUBLIC, 'pwa-192x192.png'));
    console.log('✅ pwa-192x192.png (192x192)');

    await sharp(SOURCE).resize(512, 512, { fit: 'cover' }).png().toFile(resolve(PUBLIC, 'pwa-512x512.png'));
    console.log('✅ pwa-512x512.png (512x512)');

    await sharp(SOURCE).resize(180, 180, { fit: 'cover' }).png().toFile(resolve(PUBLIC, 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png (180x180)');

    console.log('\n🎉 Done!');
}

generate().catch(err => { console.error('❌', err.message); process.exit(1); });
