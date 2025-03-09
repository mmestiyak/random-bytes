import { log } from "console";
import * as fs from 'node:fs/promises'
import { Buffer } from "node:buffer";

const dir = import.meta.dirname;

async function readCommandFile() {
    const handler = await fs.open(dir + '/command.txt', 'r')
    const size = (await handler.stat()).size;
    const buffer = Buffer.alloc(size)
    const offset = 0;
    const position = 0;

    await handler.read(buffer, offset, size, position)
    handler.close();
    return buffer.toString('utf8')

}
async function createFile(command) {
    const [action, fileName] = command.split('::');
    await fs.writeFile(`${dir}/${fileName.trim()}`, '');
}


async function deleteFile(command) {
    const [action, fileName] = command.split('::');
    await fs.rm(`${dir}/${fileName.trim()}`, { force: true })
}

async function renameFile(command) {
    const [action, fileName, newFileName] = command.split('::');
    const oldPath = dir + '/' + fileName.trim();
    const newPath = dir + '/' + newFileName.trim();
    if (oldPath && newPath && oldPath !== newPath) {
        await fs.rename(oldPath, newPath)
    }
}

async function appendToFile(command) {

    const [action, fileName, fileContent] = command.split('::');
    await fs.appendFile(dir + '/' + fileName.trim(), fileContent, { flush: true })
}

async function executeCommand() {
    try {
        const command = await readCommandFile();
        const action = command.split(" ")[0]; // Extract first word

        switch (action) {
            case 'create':
                createFile(command);
                break;
            case 'delete':
                deleteFile(command);
                break;
            case 'rename':
                renameFile(command);
                break;
            case 'append':
                appendToFile(command);
                break;
            default:
                log('Invalid command, try one of: create, delete, rename, append');
        }
    } catch (error) {
        log('Error processing command:', error);
    }

}
async function init() {

    const commandWatcher = fs.watch(dir + '/')
    for await (const event of commandWatcher) {
        event?.eventType === 'rename' && event?.filename === 'command.txt' && await executeCommand()
    }
}

init()
