import * as fs from 'node:fs/promises';

const dir = import.meta.dirname + '/';

// -----------------------------------------------
// Approach 1: Read entire file into memory at once
// -----------------------------------------------
// (async () => {
//
//    // Reads the entire file into memory
//    const read = await fs.readFile(dir + 'src.txt');
//    
//    // Writes the entire content to the destination file
//    await fs.writeFile(dir + 'dest.txt', read);
//
// })()
// 
// This approach is simple and efficient for small files but can lead to high memory usage
// when dealing with large files, as the whole file is loaded into RAM.

// ---------------------------------------------------
// Approach 2: Read and write in chunks (stream-like behavior)
// ---------------------------------------------------
// (async () => {
//
//    // Open the source file for reading
//    const fileHandleRead = await fs.open(dir + 'src.txt', 'r');
//
//    // Open the destination file for writing
//    const fileHandleWrite = await fs.open(dir + 'dest.txt', 'w+');
//
//    // Read the first chunk from the file
//    let bytes = await fileHandleRead.read();
//
//    while (bytes.bytesRead !== 0) {
//        // Write only the valid portion of the buffer to the destination file
//        await fileHandleWrite.write(bytes.buffer.slice(0, bytes.bytesRead));
//
//        // Read the next chunk
//        bytes = await fileHandleRead.read();
//    }
//
//    // Close file handles to release resources
//    await fileHandleRead.close();
//    await fileHandleWrite.close();
//
// })();

// ---------------------------------------------------
// Approach 3: Using streams for efficient file copying
// ---------------------------------------------------
(async () => {

    const fileHandleRead = await fs.open(dir + 'src.txt', 'r');
    const fileHandleWrite = await fs.open(dir + 'dest.txt', 'w+');

    const readStream = fileHandleRead.createReadStream();
    const writeStream = fileHandleWrite.createWriteStream();
    readStream.pipe(writeStream);

    readStream.on('end', async () => {
        await fileHandleRead.close();
        await fileHandleWrite.close();
    });

})();

/* Note: While `fs.copyFile(dir + 'src.txt', dir + 'dest.txt')` is the simplest and most efficient
   way to copy a file, this implementation explores low-level file operations. It demonstrates how 
   to read and write data efficiently in chunks using streams, which is suitable for larger files as 
   it minimizes memory usage by processing data incrementally. This approach provides better performance 
   and resource management compared to reading the entire file into memory. */
