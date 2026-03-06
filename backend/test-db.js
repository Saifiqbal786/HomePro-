const postgres = require('postgres');

const url = "postgresql://postgres:homepro123!!@db.onzuytgfmfzprdlcvbht.supabase.co:5432/postgres";

const sql = postgres(url, {
    ssl: 'require',
});

sql`SELECT 1 as num`
    .then(res => {
        console.log("Success with direct connection on port 5432:", res);
        process.exit(0);
    })
    .catch(err => {
        console.error("Direct connection error:", err.code || err.message, err);
        process.exit(1);
    });
