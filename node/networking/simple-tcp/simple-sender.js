import * as net from 'node:net'

const socket = net.createConnection({ host: '127.0.0.1', port: 3003 }, () => {
    socket.write('hello world')


})
