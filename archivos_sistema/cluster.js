// ============================================
// 📁 cluster.js - MODO CLUSTER
// ============================================
const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;
const numWorkers = process.env.NUM_WORKERS || numCPUs;

if (cluster.isMaster || cluster.isPrimary) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 MODO CLUSTER - Master PID: ${process.pid}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`📊 CPUs disponibles: ${numCPUs}`);
    console.log(`⚙️  Workers a iniciar: ${numWorkers}`);
    console.log('');

    for (let i = 0; i < numWorkers; i++) {
        const worker = cluster.fork();
        console.log(`✓ Worker ${i + 1} iniciado (PID: ${worker.process.pid})`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Todos los workers iniciados');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    cluster.on('exit', (worker, code, signal) => {
        console.log(`\n⚠️  Worker ${worker.process.pid} murió (${signal || code})`);
        console.log('🔄 Iniciando nuevo worker...');

        const newWorker = cluster.fork();
        console.log(`✓ Nuevo worker iniciado (PID: ${newWorker.process.pid})`);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 SIGTERM recibido, cerrando cluster...');

        const workers = Object.values(cluster.workers);
        workers.forEach(worker => worker.kill());

        setTimeout(() => {
            console.log('✓ Cluster cerrado');
            process.exit(0);
        }, 5000);
    });

} else {
    require('./server.js');
    console.log(`⚡ Worker ${process.pid} listo`);
}
