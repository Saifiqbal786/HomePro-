const { initDb } = require('./backend/config/database');
const WorkerProfile = require('./backend/models/WorkerProfile');

async function run() {
    try {
        await initDb();
        const result = await WorkerProfile.search({});
        console.log("Total: ", result.total);
        console.log("Workers length: ", result.workers.length);
        console.log("Workers: ", result.workers);
    } catch (err) {
        console.error("Error:", err);
    } process.exit(0);
}

run();
