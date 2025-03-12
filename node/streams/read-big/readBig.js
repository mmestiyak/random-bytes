import * as fs from 'node:fs/promises';

const dir = import.meta.dirname + '/';

//(async () => {
//    // This implementation does not handle backpressure correctly. When data is read from the source stream,
//    // it is immediately written to the destination stream without checking if the write operation is successful.
//    // If the write stream's internal buffer is full, this can lead to memory issues or data loss. 
//    // Proper backpressure handling is needed to ensure that data is only read when the write stream is ready.
//
//
//    const fileHandleRead = await fs.open(dir + 'src.txt', 'r');
//    const fileHandleWrite = await fs.open(dir + 'dest.txt', 'w');
//
//    const streamRead = fileHandleRead.createReadStream();
//    const streamWrite = fileHandleWrite.createWriteStream();
//
//    // Listen for 'data' events from the read stream
//    streamRead.on('data', (chunk) => {
//        streamWrite.write(chunk); // Write the chunk to the write stream without checking for backpressure
//    });
//
//    // Listen for the 'end' event to clean up resources
//    streamRead.on('end', async () => {
//        await streamWrite.end(); // Close the write stream
//        await fileHandleWrite.close(); // Close the write file handle
//        await fileHandleRead.close(); // Close the read file handle
//    });
//})();




(async () => {
    // It handles backpressure by checking if the write operation is successful.
    // If the write stream's buffer is full (i.e., write returns false), it pauses the read stream.
    // When the write stream is ready to accept more data (on 'drain' event), it resumes the read stream.

    const fileHandleRead = await fs.open(dir + 'src.txt', 'r');
    const fileHandleWrite = await fs.open(dir + 'dest.txt', 'w');

    const streamRead = fileHandleRead.createReadStream();
    const streamWrite = fileHandleWrite.createWriteStream();

    streamRead.on('data', (chunk) => {
        const ok = streamWrite.write(chunk);
        if (!ok) {
            streamRead.pause(); // Pause reading if the write buffer is full
        }
    });

    streamWrite.on('drain', () => {
        streamRead.resume(); // Resume reading when the write buffer is drained
    });

})();

