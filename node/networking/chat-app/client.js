import * as net from 'node:net'
import * as readline from 'readline/promises'
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const clearLine = (dir) => {
    return new Promise((resolve, reject) => {
        process.stdout.clearLine(dir, () => {
            resolve();
        });
    });
};

const moveCursor = (dx, dy) => {
    return new Promise((resolve, reject) => {
        process.stdout.moveCursor(dx, dy, () => {
            resolve();
        });
    });
};

const socket = net.createConnection(
    { host: "13.126.223.52", port: 3003 },
    async () => {
        console.log("Connected to the server!");

        const ask = async () => {
            const message = await rl.question("Enter a message > ");
            // move the cursor one line up
            await moveCursor(0, -1);
            // clear the current line that the cursor is in
            await clearLine(0);
            socket.write(JSON.stringify({ type: 'msg', msg: message }) + '\n');
        };

        ask();

        let buffer = ''
        socket.on("data", async (data) => {
            buffer += data.toString('utf8');
            const lines = buffer.split('\n')

            // log an empty line
            console.log()
            // move the cursor one line up
            await moveCursor(0, -1);
            // clear that line that cursor just moved into
            await clearLine(0);


            while (lines.length > 1) {
                const raw = lines.shift();
                const msg = JSON.parse(raw);
                if (msg.type === 'joined') {
                    console.log('you are are joined as ' + msg.id)
                }
                if (msg.type === 'msg') {
                    console.log(msg.msg)
                }
                if (msg.type === 'info') {
                    console.log(msg.msg)
                }
            }
            buffer = lines[0]

            ask();
        });

        socket.on('end', async () => {
            await moveCursor(0, 0)
            console.log('connection ended')
        })

        socket.on('error', async () => {
            await moveCursor(0, 0)
            console.log('something went wrong')
        })

    }
);


