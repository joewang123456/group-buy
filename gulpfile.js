/**
 * 先执行 gulp imageSprit制作图片精灵，在修改代码，最后执行gulp
 */
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
var buffer = require('vinyl-buffer');
var csso = require('gulp-csso');
var imagemin = require('gulp-imagemin');
var merge = require('merge-stream');
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

/**
 * 拷贝html
 */
gulp.task('htmlIntoTemp', ['clean:temp', 'clean:html'], function () {
    return gulp.src(srcPath + '/page/*.html')
        .pipe(gulp.dest(tempPath + '/page'))
        .pipe(connect.reload());
});

gulp.task('clean:sprit', function () {
    return gulp.src(buildPath + '/sprite/')
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
                        // '^/': '/page/detail.html',
                        '^/detail': '/page/detail.html',
                        '^/fail': '/page/fail.html',
                        '^/launch': '/page/launch.html',
                        '^/my-group': '/page/my-group.html',
                        '^/pay': '/page/pay.html',
                        '^/prelaunch': '/page/prelaunch.html',
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

gulp.task('default', ['serve'], function () {
    gulp.start('clean:temp');
});

/**
 * 图片精灵合成css样式生成
 */
gulp.task('imageSprit', ['clean:sprit'], function () {
    var spriteData = gulp.src(srcPath + '/sprite/images/2x/*.png')//需要合并的图片地址
        .pipe(spritesmith({
            imgName: 'sprite.png',
            cssName: 'sprite.css',
            padding: 10,//合并时两个图片的间距
            imgPath: '../../images/sprite/sprite.png',
            algorithm: 'top-down',
            cssFormat: 'css',
            //2倍图片路径
            retinaSrcFilter: [srcPath + '/sprite/images/2x/*@2x.png'],
            //2倍图片名称
            retinaImgName: 'sprite@2x.png',
            cssTemplate: srcPath + '/sprite/handlebarsStr.css.hbs'
        }))

    var imgStream = spriteData.img
        .pipe(buffer())
        .pipe(imagemin())
        .pipe(gulp.dest(buildPath + '/sprite'));

    // Pipe CSS stream through CSS optimizer and onto disk
    var cssStream = spriteData.css
        .pipe(csso())
        .pipe(gulp.dest(buildPath + '/sprite'));

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
});

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