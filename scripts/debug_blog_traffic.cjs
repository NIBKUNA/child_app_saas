
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log('--- Checking site_visits ---');
    const { data: visits, error } = await supabase.from('site_visits').select('*').limit(50);
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Total visits found:', visits.length);
    const blogVisits = visits.filter(v => v.page_url && v.page_url.includes('/blog/'));
    console.log('Blog visits found:', blogVisits.length);
    blogVisits.forEach(v => {
        console.log(`- Source: ${v.source_category}, Path: ${v.page_url}, Ref: ${v.referrer_url}`);
    });

    console.log('\n--- Checking blog_posts view counts ---');
    const { data: posts } = await supabase.from('blog_posts').select('title, view_count, slug').order('view_count', { ascending: false });
    posts?.forEach(p => console.log(`[${p.view_count}] ${p.title} (${p.slug})`));
}

test();
