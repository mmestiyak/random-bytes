import * as net from 'node:net'

const server = net.createServer()

server.listen(3003, '0.0.0.0', () => {
    console.log(server.address())
    console.log(server.listening)
})

const clients = []
const broadcastExcept = (msg, excludeId) => {
    clients.filter(client => client.id !== excludeId)
        .forEach(client => client.socket.write(msg))
}

const removeclient = (id) => {
    const idx = clients.findIndex(client => client.id === id)
    if (idx !== -1) {
        clients.splice(idx, 1)
    }
}

server.on('connection', (socket) => {
    const clientId = clients.length + 1
    clients.push({ id: clientId, socket });

    socket.write(JSON.stringify({ type: 'joined', id: clientId }) + '\n')

    broadcastExcept(JSON.stringify({ type: 'info', msg: `User ${clientId} joined the chat` }) + '\n', clientId)


    let buffer = ''
    socket.on('data', (chunk) => {
        buffer += chunk.toString('utf8')
        const lines = buffer.split('\n')

        while (lines.length > 1) {

            const raw = lines.shift();
            try {
                const message = JSON.parse(raw);
                if (message.type === 'msg') {
                    clients.forEach(client => client.socket.write(JSON.stringify({ type: 'msg', msg: `user ${clientId}: ${message.msg}` }) + '\n'))
                }

            } catch (err) {
                console.log('Invalid message:', raw)
            }


        }
        buffer = lines[0]
    })

    socket.on('end', () => {
        removeclient(clientId);
        broadcastExcept(JSON.stringify({ type: 'info', msg: `User ${clientId} left the chat` }) + '\n', clientId)
    });

})
