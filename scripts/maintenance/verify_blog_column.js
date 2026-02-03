
import { createClient } from '@supabase/supabase-js'

const url = 'https://brisqelgoxwsdqkltseo.supabase.co'
const key = 'sb_publishable_L1wb2Ya95fZXlr5DIyFHjw_rzeLGh3U'

const supabase = createClient(url, key)

async function run() {
    console.log('Testing blog_posts cover_image_url column...');

    const testData = {
        title: 'TEST_IMG_COL',
        content: 'TEST',
        slug: 'test-img-col-' + Date.now(),
        cover_image_url: 'https://placehold.co/600x400'
    }

    const { data, error } = await supabase
        .from('blog_posts')
        .insert(testData)
        .select()
        .single()

    if (error) {
        console.error('INSERT FAILED:', error)
    } else {
        console.log('INSERT SUCCESS:', data.id)
        await supabase.from('blog_posts').delete().eq('id', data.id)
    }
}

run()
