
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  console.log('--- Supabase Storage Check ---');
  
  // 1. Check if 'images' bucket exists
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.error('Error fetching buckets:', bucketError.message);
    return;
  }
  
  const imagesBucket = buckets.find(b => b.name === 'images');
  if (imagesBucket) {
    console.log('✅ Bucket "images" exists.');
    console.log(`   Public: ${imagesBucket.public}`);
  } else {
    console.log('❌ Bucket "images" NOT found.');
    console.log('   Available buckets:', buckets.map(b => b.name));
  }
  
  // 2. Check if there are other relevant buckets
  const otherBuckets = buckets.filter(b => b.name !== 'images');
  if (otherBuckets.length > 0) {
    console.log('ℹ️ Other buckets found:', otherBuckets.map(b => b.name));
  }

  // 3. Check sample folder structure (if images bucket exists)
  if (imagesBucket) {
    const { data: files, error: fileError } = await supabase.storage.from('images').list('', { limit: 5 });
    if (!fileError && files) {
      console.log('ℹ️ Root folders/files in "images":', files.map(f => f.name));
    }
  }
}

checkStorage();
