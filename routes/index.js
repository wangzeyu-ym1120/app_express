const express = require('express');
const router = express.Router();

const md5 = require('blueimp-md5');
const { UserModel, ChatModel } = require('../db/models');
const filter = {password: 0};

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

/**
 * 用户注册的接口
 * path 为: /register
 * 请求方式为: POST
 * 接收 username 和 password 参数
 * admin 是已注册用户
 * 注册成功返回: {code: 0, data: {_id: 'abc', username: ‘xxx’, password:’123’}
 * 注册失败返回: {code: 1, msg: '此用户已存在'}
 * @type {Router}
 */
router.post('/register', (req, res, next) => {
    const {username, password, usertype} = req.body;
    UserModel.findOne({username}, (err, user) => {
        if (!err) {
            if (user) {
                res.send({code: 0, msg: '用户已存在'})
            } else {
                const user = {
                    username,
                    password: md5(password),
                    usertype
                };
                new UserModel(user).save((err, user) => {
                    res.cookie('userid', user._id, {maxAge: 1000 * 60 * 60 * 24 * 7});
                    const data = {username, usertype, _id: user._id};
                    res.send({code: 1, data})
                })
            }
        } else {
            console.log(err)
        }
    });
});

router.post('/login', function (req, res) {
    const {username, password} = req.body;
    UserModel.findOne({username, password: md5(password)}, filter, (err, user) => {
        if (!err) {
            if (user) {
                res.cookie('userid', user._id, {maxAge: 1000 * 60 * 60 * 24 * 7});
                res.send({code: 1, data: user})
            } else {
                res.send({code: 0, msg: '用户名或密码不正确'})
            }
        }
    });
});

router.post('/update',function (req, res) {

    const userid = req.cookies.userid

    if(!userid){
        return res.send({code:0,msg:'请先登录'})
    }

    UserModel.findByIdAndUpdate({ _id: userid }, req.body, function (err, user) {
        if (!user) { 
            res.clearCookie('userid')
            res.send({ code: 0, msg: '请先登录' })
        } else {
            const {_id, username, usertype} = user
            const data = Object.assign(req.body, { _id, username, usertype })
            
            res.send({code:1,data})    
        }
    })
})

router.get('/user', function(req, res){

    const userid = req.cookies.userid

    if(!userid){
        return res.send({code:0,msg:'请先登录'})
    }

    UserModel.findOne({_id:userid}, filter, function(err,user){
        if (!err) {
            if (!user) {
                res.clearCookie('userid')
                res.send({code:0,msg:'请先登录'})
            } else {
                res.send({code:1,data:user})
            }
        } 
    })

})

router.get('/list', function (req, res) {
    const { usertype } = req.query
    UserModel.find({ usertype }, function (err,users) {
        res.send({code:1,data:users})
    })
 })

router.get('/msglist', function (req, res) {
    
    const userid = req.cookies.userid

    UserModel.find(function (err, userDocs) {
        const users = {}

        userDocs.forEach(doc => {
            users[doc._id] = {username: doc.username, header: doc.header}
        })

        /*
            查询userid相关的所有聊天信息 
            参数1: 查询条件 
            参数2: 过滤条件 
            参数3: 回调函数
        */
        ChatModel.find({ '$or': [{ from: userid }, { to: userid }] }, filter, function (err, chatMsgs) { 
            res.send({code:1,data:{users,chatMsgs}})
        })
     })
})

router.post('/readmsg', function (req, res) {

    const from = req.body.from
    const to = req.cookies.userid

    /* 
        更新数据库中的chat数据 
        参数1: 查询条件 
        参数2: 更新为指定的数据对象 
        参数3: 是否1次更新多条, 默认只更新一条 
        参数4: 更新完成的回调函数 
    */
    ChatModel.update({ from, to, read: false }, { read: true }, { multi: true }, function (err, doc) { 
        res.send({code:1,data:doc.nModified}) // 更新的数量
    })
})

module.exports = router;
