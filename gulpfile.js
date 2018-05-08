var gulp = require('gulp');
var less = require('gulp-less');
var connect = require('gulp-connect');
var proxy = require('http-proxy-middleware');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var inject = require('gulp-inject');
var babel = require("gulp-babel");    // 用于ES6转化ES5
var spritesmith = require('gulp.spritesmith');

var srcPath = './src';
var buildPath = './build';
var tempPath = './temp';
var port = 3000;
var host = 'joe.text.ximalaya.com';

/**
 * 编译less文件
 */
gulp.task('less', ['clean:css'], function () {
    return gulp.src([srcPath + '/less/**'])//多个文件以数组形式传入
        .pipe(less())
        .pipe(gulp.dest(buildPath + '/css'))
        .pipe(connect.reload());
});
/**
 * 拷贝image
 */
gulp.task('image', ['clean:image'], function () {
    return gulp.src(srcPath + '/image/**')
        .pipe(gulp.dest(buildPath + '/image'))
        .pipe(connect.reload());
});

/**
 * js处理
 */
gulp.task('js', ['clean:js'], function () {
    return gulp.src([
        // './polyfills.js',//天加es6-promise polyfill
        srcPath + '/js/lib/jquery.js',
        srcPath + '/js/lib/weixin.js',
        srcPath + '/js/lib/ya.js',
        srcPath + '/js/lib/pending.js',
        srcPath + '/js/lib/popup.js',
        srcPath + '/js/lib/xm_util_toast.js',
        srcPath + '/js/lib/helper.js',
        srcPath + '/js/lib/login.page.js',
        srcPath + '/js/lib/payment.js',
        srcPath + '/js/index.js'
    ])
        .pipe(concat('libs.js'))
        // .pipe(babel())
        // .pipe(uglify())
        .pipe(gulp.dest(buildPath + '/js'))
        .pipe(connect.reload());
});
gulp.task('clean:js', function () {
    return gulp.src(buildPath + '/js/')
        .pipe(clean({ force: true }));
});
gulp.task('clean:css', function () {
    return gulp.src(buildPath + '/css')
        .pipe(clean({ force: true }));
});
gulp.task('clean:image', function () {
    return gulp.src(buildPath + '/image')
        .pipe(clean({ force: true }));
});
gulp.task('clean:html', function () {
    return gulp.src(buildPath + '/page')
        .pipe(clean({ force: true }));
});
gulp.task('clean:temp', function () {
    return gulp.src(tempPath + '/')
        .pipe(clean({ force: true }));
});

gulp.task('serve', ['image', 'less', 'js', 'inject'], function () {
    connect.server({
        root: [buildPath],
        port: port,
        livereload: true,
        middleware: function (connect, opt) {
            return [
                proxy('/api', {
                    target: 'http://a.ximalaya.com',
                    changeOrigin: true
                }),
                proxy('/test', {
                    target: 'http://joe.test.ximalaya.com:3000',
                    changeOrigin: true,
                    pathRewrite: {
                        '^/test/detail': '/page/detail.html',
                        '^/test/fail': '/page/fail.html',
                        '^/test/launch': '/page/launch.html',
                        '^/test/my-group': '/page/my-group.html',
                        '^/test/pay': '/page/pay.html',
                        '^/test/prelaunch': '/page/prelaunch.html',
                    }
                })
            ]
        }
    });
});

gulp.task('inject', ['htmlIntoTemp'], function () {
    var target = gulp.src(tempPath + '/page/*.html');
    // It's not necessary to read the files (will speed up things), we're only after their paths:
    var sources = gulp.src([buildPath + '/js/*.js', buildPath + '/css/*.css'], { read: false });

    return target.pipe(inject(sources, { ignorePath: 'build' }))
        .pipe(gulp.dest(buildPath + "/page"));
});

/**
 * 拷贝html
 */
gulp.task('htmlIntoTemp', ['clean:temp', 'clean:html'], function () {
    return gulp.src(srcPath + '/page/*.html')
        .pipe(gulp.dest(tempPath + '/page'))
        .pipe(connect.reload());
});

gulp.task('clean:sprit:css', function () {
    return gulp.src(buildPath + '/css/sprite.css')
        .pipe(clean({ force: true }));
});
gulp.task('clean:sprit:image', function () {
    return gulp.src(buildPath + '/image/sprit/')
        .pipe(clean({ force: true }));
});
gulp.task('imageSprit', ['clean:sprit:image', 'clean:sprit:css'], function () {
    return gulp.src(srcPath + '/image/icons/*.png')//需要合并的图片地址
        .pipe(spritesmith({
            imgName: 'sprite.png',
            cssName: 'sprite.css',

            padding: 15,//合并时两个图片的间距
            algorithm: 'binary-tree',
            cssTemplate: srcPath + "/less/spriteTemplate.css"
        }))
        .pipe(gulp.dest(buildPath + "/image/sprit"));
});

gulp.task('default', ['serve']);

/**
 * 文件监听
 */
var watcherArr = [
    gulp.watch([srcPath + '/css/*.css', srcPath + '/less/*.less'], ['less']),//css,less监听
    gulp.watch(srcPath + '/js/index.js', ['js']),//js监听
    gulp.watch(srcPath + '/page/*.html', ['inject']),//html监听
];
watcherArr.forEach((watcher) => {
    watcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});