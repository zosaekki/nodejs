const { application } = require('express');
const express = require('express'); // 설치한 라이브러리 첨부
const app = express(); // 첨부한 라이브러리를 이용해 새로운 객체
const bodyParser = require('body-parser'); // body-parser 라이브러리
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

var db;
MongoClient.connect(
    'mongodb+srv://admin:1q2w3e4r@cluster0.wmukn2x.mongodb.net/todoapp?retryWrites=true&w=majority',
    { useUnifiedTopology: true },
    (err, client) => {
        if (err) { return console.log(err) };
        db = client.db('todoapp');

        app.listen(8080, function () {
            console.log('listening on 8080');
        });
    })

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
    // sendFile() 파일 전송, __dirname 
})

app.get('/write', function (req, res) {
    res.sendFile(__dirname + '/write.html');
})

app.post('/newpost', (req, res) => {
    // 데이터 하나만 찾기
    db.collection('counter').findOne({ name: 'postNumber'}, (err, result) => {
        console.log(result.totalPost);
        var totalPost = result.totalPost;

        db.collection('post').insertOne({ _id: totalPost + 1, title: req.body.title, date: req.body.date }, (err, result) => {
            console.log('저장완료');
            db.collection('counter').updateOne({ name: 'postNumber' },{ $inc : { totalPost: 1}},(err, result) => {
                if(err) return console.log(err);
            })
            res.redirect('/list');
        });
    });
})

app.get('/list', (req, res) => {
    // 모든 데이터 찾기
    db.collection('post').find().toArray((err, result) => {
        res.render('list.ejs', { posts : result});
    });
})

app.delete('/delete', (req, res) => {
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne({ _id: req.body._id }, (err, result) => {
        console.log('삭제완료!');
        res.status(200).send({ message : '성공했습니다' });
    });
})

app.get('/detail/:id', (req, res) => {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
        console.log(result);
        res.render('detail.ejs', { data : result }) // ejs 파일로 데이터 보내는 법, { 이름 : 데이터 }
    })
})