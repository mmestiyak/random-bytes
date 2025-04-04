import { Readable } from "node:stream";
import * as fs from 'node:fs'


class FileReadStream extends Readable {

    constructor(highWaterMark, fileName) {
        super({ highWaterMark })

        this.fileName = fileName
        this.fd = null
    }

    _construct(cb) {
        fs.open(this.fileName, 'r', (err, fd) => {
            if (err) cb(err)
            this.fd = fd
            cb()
        })

    }

    _read(size) {
        const buffer = Buffer.alloc(size)
        fs.read(this.fd, buffer, 0, size, null, (err, bytesRead) => {
            if (err) this.destroy(err)
            this.push(bytesRead > 0 ? buffer.subarray(0, bytesRead) : null)
        })

    }

    _destroy(error, cb) {
        if (error) cb(error)
        if (this.fd) {

            fs.close(this.fd, (err) => {
                if (err) cb(err)
            })
        }

    }
}

const dir = import.meta.dirname + '/'
const readStream = new FileReadStream(16000, dir + 'test.txt')

readStream.on('data', (chunk) => {

    console.log(chunk.toString('utf8'))
})

readStream.on('end', () => {
    console.log('ended reading')
})
