import { Writable } from 'node:stream'
import * as fs from 'node:fs'

// Custom writable stream that buffers writes and flushes based on highWaterMark
class FileWriteStream extends Writable {
    constructor(highWaterMark, fileName) {
        // Initialize the writable stream with custom highWaterMark
        super({ highWaterMark });

        this.fileName = fileName;       // The file to write to
        this.fd = null;                 // File descriptor
        this.chunks = [];               // Buffered chunks to be written
        this.chunksSize = 0;            // Total size of buffered chunks
        this.writesCount = 0;           // Number of actual write operations to disk
    }

    // Called after constructor; good place to open files or allocate resources
    _construct(cb) {
        fs.open(this.fileName, 'w', (err, fd) => {
            if (err) return cb(err);
            this.fd = fd;
            cb();
        });
    }

    // Called whenever a chunk is written using stream.write()
    _write(chunk, enc, cb) {
        this.chunks.push(chunk);             // Buffer the chunk
        this.chunksSize += chunk.length;     // Track total size of buffered chunks

        // If buffered size exceeds threshold, flush it to disk
        if (this.chunksSize > this.writableHighWaterMark) {
            fs.write(this.fd, Buffer.concat(this.chunks), (err) => {
                if (err) return cb(err);
                this.chunks = [];            // Clear buffer after write
                this.chunksSize = 0;
                ++this.writesCount;
                cb();                        // Signal that write is done
            });
        } else {
            // If not over threshold, just acknowledge the write for now
            cb();
        }
    }

    // Called before stream is closed using stream.end()
    _final(cb) {
        // Flush remaining buffered data to disk
        fs.write(this.fd, Buffer.concat(this.chunks), (err) => {
            if (err) return cb(err);
            this.chunks = [];
            this.chunksSize = 0;
            ++this.writesCount;
            cb();
        });
    }

    // Called when stream is destroyed (either normally or with error)
    _destroy(error, cb) {
        console.log('Number of writes', this.writesCount); // Log total writes
        if (this.fd) {
            fs.close(this.fd, (err) => {
                cb(err || error);           // Clean up and propagate any errors
            });
        } else {
            if (error) cb(error);           // If file wasn't opened, still return the error
        }
    }
}

// Usage
const dir = import.meta.dirname + '/';
const stream = new FileWriteStream(1800, dir + 'test.txt');

// Writing data
stream.write(Buffer.from('hello world\n')); // first chunk
stream.end('stop it');                    // final chunk, also closes the stream
