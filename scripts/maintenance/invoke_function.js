
async function run() {
    const url = 'https://brisqelgoxwsdqkltseo.supabase.co/functions/v1/generate-blog-post';
    const key = 'sb_publishable_L1wb2Ya95fZXlr5DIyFHjw_rzeLGh3U';

    console.log('Invoking function...');
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', res.status);
        const json = await res.json();

        if (json.diagnostic) {
            console.log("--- AVAILABLE MODELS ---");
            try {
                const data = JSON.parse(json.diagnostic);
                if (data.models) {
                    // Sort and print names
                    const names = data.models.map(m => m.name).sort();
                    names.forEach(n => console.log(n));
                } else {
                    console.log("No models found in diagnostic info structure");
                }
            } catch (e) {
                console.log("Could not parse diagnostic info string");
            }
        } else {
            console.log('Response:', JSON.stringify(json, null, 2));
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
