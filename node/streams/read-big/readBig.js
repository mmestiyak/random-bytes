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

    let leftOver = 0;
    streamRead.on('data', (chunk) => {
        const numbers = chunk.toString('utf8').split('\n').map(Number)
        if (numbers[0] + 1 !== numbers[1]) {
            numbers[0] = Number(leftOver) + numbers[0]
        }
        if (numbers[numbers.length - 2] + 1 !== numbers[numbers.length - 1]) {
            leftOver = numbers.pop()
        }

        const evenNumbers = numbers.filter(number => number % 2 === 0)
        const ok = streamWrite.write(evenNumbers.join('\n'));
        if (!ok) {
            streamRead.pause(); // Pause reading if the write buffer is full
        }
    });

    streamWrite.on('drain', () => {
        streamRead.resume(); // Resume reading when the write buffer is drained
    });

})();

