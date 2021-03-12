module.exports = function (server) { 
    const io = require('socket.io')(server)

    io.on('connection', function (socket) {
        console.log('soketio connected')

        socket.on('sendMsg', function (data) { 
            
            io.emit('receiveMsg',data+"_")
        })
    })
}