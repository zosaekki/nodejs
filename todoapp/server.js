const { application } = require('express');
const express = require('express'); // 설치한 라이브러리 첨부
const app = express(); // 첨부한 라이브러리를 이용해 새로운 객체

app.listen(8080, function() {
    console.log('listening on 8080');
});

app.get('/pet', function(req, res) {
    res.send('펫 용품 쇼핑 페이지');
})

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html'); 
    // sendFile() 파일 전송, __dirname 
})

app.get('/write', function(req, res) {
    res.sendFile(__dirname + '/write.html');
})