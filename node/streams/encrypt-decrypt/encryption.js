import { Transform } from "node:stream";
import * as fs from "node:fs/promises";
import { finished } from "node:stream/promises";

class Cryptor extends Transform {
    constructor(action) {
        super();
        this.action = action;
        console.log(action);
    }

    _transform(chunk, enc, cb) {
        for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] !== 255) {
                chunk[i] += this.action === "encrypt" ? 1 : -1;
            }
        }
        cb(null, chunk);
    }
}

const encrypt = new Cryptor("encrypt");
const decrypt = new Cryptor("decrypt");
const dir = import.meta.dirname + "/";

(async () => {
    const normalFd = await fs.open(dir + "normal.txt", "r");
    const encryptionFd = await fs.open(dir + "encrypted.txt", "w+");
    const decryptionFd = await fs.open(dir + "decrypted.txt", "w");

    const normalFileStream = await normalFd.createReadStream();
    const encryptionStream = await encryptionFd.createWriteStream();

    // Encrypt the normal file
    await finished(normalFileStream.pipe(encrypt).pipe(encryptionStream));
    console.log("✅ Encryption complete");

    // Close the encryptionFd after writing, then reopen it for reading
    await encryptionFd.close();
    const encryptionReadStream = await fs.open(dir + "encrypted.txt", "r");
    const decryptionWriteStream = await decryptionFd.createWriteStream();

    // Decrypt the encrypted file
    const encryptedReadStream = await encryptionReadStream.createReadStream();
    await finished(encryptedReadStream.pipe(decrypt).pipe(decryptionWriteStream));
    console.log("✅ Decryption complete");

    // Close all file descriptors
    await normalFd.close();
    await encryptionReadStream.close();
    await decryptionFd.close();
})();
