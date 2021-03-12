const { ChatModel } = require('./db/models')

module.exports = function (server) {
    
    const io = require('socket.io')(server)

    io.on('connection', function (socket) {
        console.log('有一个客户端连接')

        // 绑定监听, 接收客户端发送的消息
        socket.on('sendMsg', function ({ from, to, content }) {
            
            const chat_id = [from, to].sort().join('_')
            const create_time = Date.now()

            new ChatModel({ from, to, chat_id, content, create_time }).save((err,chatMsg)=> {
                io.emit('receiveMsg', chatMsg)
            })
            
        
         })
     })
 }