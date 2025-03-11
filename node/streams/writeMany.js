import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';

const dir = import.meta.dirname + '/';  // Define the directory path

// Utility function for measuring execution time
function getElapsedTime(startTime) {
    const elapsedTime = process.hrtime(startTime);
    const totalMilliseconds = (elapsedTime[0] * 1e3) + (elapsedTime[1] / 1e6);
    return totalMilliseconds >= 1000
        ? (totalMilliseconds / 1000).toFixed(3) + ' seconds'
        : totalMilliseconds.toFixed(3) + ' ms';
}

// Utility function to log CPU and memory usage
function logSystemUsage(startCPU, startMem) {
    const cpuUsage = process.cpuUsage(startCPU);
    const totalCpuTime = cpuUsage.user + cpuUsage.system; // Total CPU time in microseconds
    const cpuCores = os.cpus().length; // Number of CPU cores
    const cpuPercentage = ((totalCpuTime / 1000) / (process.uptime() * 1000) / cpuCores) * 100; // Percentage of CPU usage per core

    const memUsage = process.memoryUsage();
    console.log(`CPU Usage: User ${cpuUsage.user / 1000}ms, System ${cpuUsage.system / 1000}ms`);
    console.log(`CPU Percentage Usage (per core): ${cpuPercentage.toFixed(2)}%`);
    console.log(`Memory Usage: RSS ${memUsage.rss / 1024 / 1024}MB, Heap Used ${memUsage.heapUsed / 1024 / 1024}MB`);
}// ---------- METHOD 1: Async/Await File Writing (Slowest) ----------
//(async () => {
//    const fileHandle = await fsp.open(dir + 'test.txt', 'w+');
//    const startTime = process.hrtime(); // Start high-resolution timer
//    const startCPU = process.cpuUsage();
//    const startMem = process.memoryUsage();
//    for (let i = 0; i <= 1000000; i++) {
//        await fileHandle.write(`${i}\n`);
//    }
//    console.log(`Execution time: ${getElapsedTime(startTime)} seconds`);
//    logSystemUsage(startCPU, startMem);
//    console.log('Completed writing');
//    await fileHandle.close();
//})();

// ---------- METHOD 2: Synchronous File Writing (Fast but Blocks Event Loop) ----------
//(() => {
//    const startTime = process.hrtime(); // Start high-resolution timer
//    const startCPU = process.cpuUsage();
//    const startMem = process.memoryUsage();
//    console.time('timeTook');
//    fs.open(dir + 'test.txt', 'w+', (err, fd) => {
//        if (err) throw err; // Handle error
//        for (let i = 0; i <= 1000000; i++) {
//            fs.writeFileSync(fd, `${i}\n`);
//        }
//        console.timeEnd('timeTook');
//        console.log(`Execution time: ${getElapsedTime(startTime)} seconds`);
//        logSystemUsage(startCPU, startMem);
//        console.log('Completed writing');
//        fs.close(fd, (err) => {
//            if (err) throw err; // Handle error
//        });
//    });
//})();

// ---------- METHOD 3: Recursive Non-Blocking Writing ----------
//fs.open(dir + 'test.txt', 'w+', (err, fd) => {
//    if (err) throw err; // Handle error
//    const startTime = process.hrtime(); // Start high-resolution timer
//    const startCPU = process.cpuUsage();
//    const startMem = process.memoryUsage();
//    console.time('timeTook');
//
//    function write(lines, currLine) {
//        if (currLine >= lines) {
//            fs.close(fd, (err) => {
//                if (err) throw err; // Handle error
//                console.timeEnd('timeTook');
//                console.log(`Execution time: ${getElapsedTime(startTime)} seconds`);
//                logSystemUsage(startCPU, startMem);
//            });
//            return;
//        }
//        fs.write(fd, `${currLine}\n`, () => {
//            write(1000000, currLine + 1);
//        });
//    }
//
//    write(1000000, 0);
//});

// ---------- METHOD 4: Stream-Based Writing (Most Optimized) ----------
(async () => {
    const fileHandle = await fsp.open(dir + 'test.txt', 'w+'); // Open file with read/write permission
    const stream = fileHandle.createWriteStream(); // Create a writable stream

    let currentLine = 0;
    let streamLength = stream.writableHighWaterMark;
    const startTime = process.hrtime(); // Start high-resolution timer
    const startCPU = process.cpuUsage();
    const startMem = process.memoryUsage();

    function write() {
        while (currentLine <= 1000000) {
            if (currentLine === 999999) {
                stream.end(`${currentLine}\n`); // End stream at last line
                break;
            }
            if (!stream.write(`${currentLine}\n`)) { // If buffer is full, wait for drain event
                break;
            }
            currentLine++;
        }
    }

    write();

    stream.on('drain', () => {
        console.count('drain'); // Count how many times drain event occurs
        write();
    });

    stream.on('finish', async () => {
        const fileSize = (await fileHandle.stat()).size; // Get file size after writing
        console.log('Completed writing');
        console.log(`File size: ${fileSize} bytes`);
        console.log(`Execution time: ${getElapsedTime(startTime)} seconds`);
        console.log(`Buffer write cycles: ${fileSize / streamLength}`);
        logSystemUsage(startCPU, startMem); // Log final system usage
        await fileHandle.close(); // Close file handle
    });
})();
