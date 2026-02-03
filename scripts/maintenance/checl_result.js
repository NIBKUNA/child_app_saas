
import { createClient } from '@supabase/supabase-js'

const url = 'https://brisqelgoxwsdqkltseo.supabase.co'
const key = 'sb_publishable_L1wb2Ya95fZXlr5DIyFHjw_rzeLGh3U'

const supabase = createClient(url, key)

async function run() {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('title, created_at, content')
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Result:', JSON.stringify(data, null, 2))
    }
}

run()
