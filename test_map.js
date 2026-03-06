const workers = [
    { name: 'Awais', services: '"[\\"HVAC\\"]"' },
    { name: 'Test Worker', services: '[]' }
];
try {
    workers.map(w => JSON.parse(w.services || '[]').join(', '));
    console.log('Map success');
} catch (e) { console.error('Map threw:', e.message); }
