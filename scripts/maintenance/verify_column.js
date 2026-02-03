
import { createClient } from '@supabase/supabase-js'

const url = 'https://brisqelgoxwsdqkltseo.supabase.co'
const key = 'sb_publishable_L1wb2Ya95fZXlr5DIyFHjw_rzeLGh3U'

const supabase = createClient(url, key)

async function run() {
    console.log('Testing marketing_source column...');

    // Try to insert a row with marketing_source
    const testData = {
        child_name: 'TEST_CHILD_AUTO',
        child_birth_date: '2020-01-01',
        child_gender: 'male',
        guardian_name: 'TEST_GUARDIAN',
        guardian_phone: '010-0000-0000',
        marketing_source: 'TEST_SOURCE_VERIFICATION' // This is the column we are testing
    }

    const { data, error } = await supabase
        .from('consultations')
        .insert(testData)
        .select()
        .single()

    if (error) {
        console.error('INSERT FAILED:', error)
        if (error.code === '42703') {
            console.error('DIAGNOSIS: Column likely missing or schema cache stale.')
        }
    } else {
        console.log('INSERT SUCCESS:', data)
        console.log('Marketing Source Value:', data.marketing_source)

        // Clean up
        await supabase.from('consultations').delete().eq('id', data.id)
    }
}

run()
