require('dotenv').config({ path: '.env.local' });
const { processDistributionJobs } = require('./src/lib/distribution/distributionWorker');

async function triggerWorker() {
    console.log("Triggering distribution worker...");
    await processDistributionJobs();
    console.log("Worker finished.");
}

triggerWorker();
