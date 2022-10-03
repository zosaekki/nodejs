const { application } = require('express');
const express = require('express'); // 설치한 라이브러리 첨부
const app = express(); // 첨부한 라이브러리를 이용해 새로운 객체
const bodyParser = require('body-parser'); // body-parser 라이브러리
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
require('dotenv').config(); // 환경변수 관리 라이브러리

app.use('/public', express.static('public')); // 미들웨어 (요청과 응답사이에 동작하는), static 파일을 보관하기 위해 public 폴더를 쓸거다.

var db;
MongoClient.connect(
    process.env.DB_URL,
    { useUnifiedTopology: true },
    (err, client) => {
        if (err) { return console.log(err) };
        db = client.db('todoapp');

        app.listen(process.env.PORT, function () {
            console.log('listening on 8080');
        });
    })

app.get('/', (req, res) => {
    res.render('index.ejs');
    // sendFile() 파일 전송, __dirname 
})

app.get('/write', function (req, res) {
    res.render('write.ejs');
})

app.get('/list', (req, res) => {
    // 모든 데이터 찾기
    db.collection('post').find().toArray((err, result) => {
        res.render('list.ejs', { posts: result });
    });
})

app.get('/detail/:id', (req, res) => {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
        // console.log(result);
        res.render('detail.ejs', { data: result }) // ejs 파일로 데이터 보내는 법, { 이름 : 데이터 }
    })
})

app.get('/edit/:id', (req, res) => {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
        // console.log(result);
        res.render('edit.ejs', { data: result }) // ejs 파일로 데이터 보내는 법, { 이름 : 데이터 }
    })
})

app.get('/login', (req, res) => {
    res.render('login.ejs');
})

app.get('/fail', (req, res) => {
    res.send('로그인 실패, 다시 로그인 해주세요.');
})

app.get('/mypage', islogin, (req, res) => {
    res.render('mypage.ejs', { user: req.user});
})

app.get('/search', (req, res) => {
    let searchCondition = [
        {
        $search: {
            index: 'titleSearch',
            text: {
                query: req.query.value,
                path: "title" // 제목, 날짜 찾고 싶으면 ['제목', '날짜']
            }
        }
    },
    // { $sort: { _id: 1 }}, // 어떤 순서로 정렬할지
    // { $limit: 10 },
    // { $project: { title: 1, _id: 0, score: { $meta: "searchScore" }}} 검색결과를 뭘 보여줄지, 필터
]
    db.collection('post').aggregate(searchCondition).toArray((err, result) => { // aggregate = 검색 조건 여러개 가능, 데이터 꺼내는 pipeline 가능
        res.render('search.ejs', { search: result });
        console.log(result);
    })
})

// 미들웨어 제작
function islogin(req, res, next) {
    if(req.user) { // req.user = 로그인 후 세션이 있으면 존재함
        next(); // next() = 통과
    } else {
        res.send('로그인 하셔야죠?');
    }
}



app.post('/register', (req, res) => {
        db.collection('login').findOne({ id: req.body.id }, (err, result) => {
            if(result) {
                return res.send('중복 ID');
            } else {
                db.collection('login').insertOne({ id: req.body.id, pw: req.body.pw });
                res.redirect('/');
            }
        })
    })


app.put('/edit', (req, res) => {
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, date: req.body.date } }, (err, result) => {
        console.log(result);
        res.redirect('/list');
    })
})

// 로그인 관련 라이브러리 선언
const passport = require('passport'); // node.js 환경에서 로그인 기능 쉽게 구현 도와줌
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// app.use 미들웨어(요청 - 응답 중간에 실행되는 코드)
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


app.post('/login', passport.authenticate('local', { // local 방식으로 인증
    failureRedirect: '/fail' // 로그인 실패하면 /fail로 이동
}), (req, res) => {
    res.redirect('/');
})

// passport.authenticate로 인해 밑에 코드 실행
passport.use(new LocalStrategy({ // 인증하는 방법
    usernameField: 'id', // form에 입력한 name
    passwordField: 'pw',
    session: true, // 로그인 후 session 저장할 것인지
    passReqToCallback: false, // 아이디/비번 말고도 다른 정보 검증하고 싶으면 true
}, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
        if (에러) return done(에러)
        // * 중요 *
        // done = 라이브러리 문법, 세개의 파라미터 가질 수 있음 (1. 서버에러, 2.일치할 경우 DB데이터, 3.에러메세지)
        if (!결과) return done(null, false, { message: '존재하지않는 아이디요' }) // db에 ID 없다
        if (입력한비번 == 결과.pw) { // db에 아이디 있으면
            return done(null, 결과)
        } else {
            return done(null, false, { message: '비번틀렸어요' })
        }
    })
}));

// session 저장시키는 코드(로그인 성공시 발동)
passport.serializeUser((user, done) => {
    done(null, user.id);
})

// 이 세션 데이터를 가진 사람을 DB에서 찾음(마이페이지 접속시 발동)
// 위에 있는 user.id랑 밑에 있는 id랑 동일
passport.deserializeUser((id, done) => {
    db.collection('login').findOne({ id : id}, (err, result) => {
        done(null, result);
    })
})

app.post('/newpost', (req, res) => {
    // 데이터 하나만 찾기
    db.collection('counter').findOne({ name: 'postNumber' }, (err, result) => {
        console.log(result.totalPost);
        var totalPost = result.totalPost;
        var insertData = { _id: totalPost + 1, title: req.body.title, date: req.body.date, writer: req.user._id };

        db.collection('post').insertOne(insertData, (err, result) => {
            console.log('저장완료');
            db.collection('counter').updateOne({ name: 'postNumber' }, { $inc: { totalPost: 1 } }, (err, result) => {
                if (err) return console.log(err);
            })
            res.redirect('/list');
        });
    });
})

app.delete('/delete', (req, res) => {
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    var deleteData = { _id: req.body._id, writer: req.user._id }
    db.collection('post').deleteOne({ deleteData }, (err, result) => {
        // console.log('삭제완료!');
        if(result) { console.log(result); }
        res.status(200).send({ message: '성공했습니다' });
    });
})