const cluster = require("cluster");
if (cluster.isMaster) {
    console.log(`
        ██╗  ██╗ █████╗ ███╗   ███╗ █████╗ ██╗████████╗ █████╗  ██████╗██╗  ██╗██╗     ██╗ █████╗ ██████╗ ██╗██╗ 
        ██║ ██╔╝██╔══██╗████╗ ████║██╔══██╗██║╚══██╔══╝██╔══██╗██╔════╝██║  ██║██║    ██╔╝██╔══██╗██╔══██╗██║╚██╗
        █████╔╝ ███████║██╔████╔██║███████║██║   ██║   ███████║██║     ███████║██║    ██║ ███████║██████╔╝██║ ██║
        ██╔═██╗ ██╔══██║██║╚██╔╝██║██╔══██║██║   ██║   ██╔══██║██║     ██╔══██║██║    ██║ ██╔══██║██╔═══╝ ██║ ██║
        ██║  ██╗██║  ██║██║ ╚═╝ ██║██║  ██║██║   ██║   ██║  ██║╚██████╗██║  ██║██║    ╚██╗██║  ██║██║     ██║██╔╝
        ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝
    `);

    console.log(`Running in env: ${process.env.NODE_ENV}`);

    let cpuCount = require("os").cpus().length;

    console.log(`Running with ${cpuCount} CPUs, spawning ${cpuCount} servers.`);

    for (let i = 0; i < cpuCount; i++) {
        cluster.fork();
    }
} else {
    const app = require("./server.js");
    app.listen(8081);
}