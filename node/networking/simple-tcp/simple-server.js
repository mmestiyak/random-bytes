import * as net from 'node:net'

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        console.log(data.toString('utf8'))
        console.log(data)
    })
})

server.listen(3003, "127.0.0.1", () => {
    console.log('server started on', server.address())
})
