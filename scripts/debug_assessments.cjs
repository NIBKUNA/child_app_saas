const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAssessmentData() {
    console.log('--- Checking counseling_logs ---');
    const { data: logs, error: logsError } = await supabase
        .from('counseling_logs')
        .select('id, schedule_id, child_id, therapist_id, session_date, created_at')
        .limit(5);

    if (logsError) {
        console.error('Error fetching logs:', logsError);
    } else {
        console.log('Logs found:', logs.length);
        console.table(logs);
    }

    console.log('\n--- Checking development_assessments ---');
    const { data: assessments, error: assessError } = await supabase
        .from('development_assessments')
        .select('*')
        .limit(5);

    if (assessError) {
        console.error('Error fetching assessments:', assessError);
    } else {
        console.log('Assessments found:', assessments.length);
        console.table(assessments);
    }

    if (logs && assessments) {
        console.log('\n--- Checking Relationship (Join) ---');
        const { data: joined, error: joinError } = await supabase
            .from('counseling_logs')
            .select('id, development_assessments(*)')
            .limit(5);

        if (joinError) {
            console.error('Error joining logs and assessments:', joinError);
        } else {
            console.log('Joined records found:', joined.length);
            joined.forEach(j => {
                console.log(`Log ID: ${j.id}, Assessments: ${JSON.stringify(j.development_assessments)}`);
            });
        }
    }
}

checkAssessmentData();
