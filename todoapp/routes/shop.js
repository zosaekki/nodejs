const router = require('express').Router();

// 미들웨어 제작
function islogin(req, res, next) {
    if(req.user) { // req.user = 로그인 후 세션이 있으면 존재함
        next(); // next() = 통과
    } else {
        res.send('로그인 하셔야죠?');
    }
}

router.use('/shirts', islogin); // 모든 URL에 적용할 수 있는 미들웨어, 특정 URL에만 적용하는 미들웨어


router.get('/shirts', (req, res) => {
    res.send('셔츠');
})

router.get('/pants', (req, res) => {
    res.send('바지');
})

module.exports = router;