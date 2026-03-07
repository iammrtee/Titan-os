const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
let internalSecret;

for (const line of envLocal.split('\n')) {
    if (line.startsWith('INTERNAL_SECRET=')) {
        internalSecret = line.split('=')[1].trim().replace(/^"|"$|^'|'$/g, '');
    }
}

async function trigger() {
    console.log("Triggering live API...");
    try {
        const res = await fetch('https://titan-os-bay.vercel.app/api/distribution/process', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${internalSecret}` }
        });
        const data = await res.json();
        console.log("Response:", data);
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

trigger();
