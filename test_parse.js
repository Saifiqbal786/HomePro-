const WorkerProfile = require('./backend/models/WorkerProfile');

async function debugParse() {
    const p = {
        skills: '"[\\"Plumbing\\"]"',
        services: '"[\\"HVAC\\"]"',
        credentials: '"[\\"Cert\\"]"'
    };

    const parseSafe = (str) => {
        try {
            if (!str) return [];
            let parsed = typeof str === 'string' ? JSON.parse(str) : str;
            if (typeof parsed === 'string') parsed = JSON.parse(parsed); // Double decoding
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    console.log("Skills:", parseSafe(p.skills));
    console.log("Services:", parseSafe(p.services));
    console.log("Credentials:", parseSafe(p.credentials));
}

debugParse();
