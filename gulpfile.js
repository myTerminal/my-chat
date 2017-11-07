/* global require */

var gulp = require('gulp'),
    clean = require('gulp-clean'),
    copy = require('gulp-copy'),
    angularTemplateCache = require('gulp-angular-templatecache'),
    less = require('gulp-less'),
    cleanCSS = require('gulp-cleancss'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    gulpSync = require('gulp-sync')(gulp),
    watchNow = require('gulp-watch-now'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    browserify = require('browserify');

gulp.task('clean', function () {
    return gulp.src('public', { read: false })
        .pipe(clean());
});

gulp.task('copy-bootstrap-css', function () {
    return gulp.src([
        'node_modules/bootstrap/dist/css/bootstrap.min.css'
    ]).pipe(copy('public/styles/vendor/bootstrap/css', {
        prefix: 4
    }));
});

gulp.task('copy-bootstrap-fonts', function () {
    return gulp.src([
        'node_modules/bootstrap/dist/fonts/**/*'
    ]).pipe(copy('public/styles/vendor/bootstrap/fonts', {
        prefix: 4
    }));
});

gulp.task('copy-index', function () {
    return gulp.src([
        'src/client/index.html'
    ]).pipe(copy('public', {
        prefix: 4
    }));
});

gulp.task('copy', [
    'copy-bootstrap-css',
    'copy-bootstrap-fonts',
    'copy-index'
]);

gulp.task('templates', function () {
    return gulp.src('src/client/scripts/views/*.html')
        .pipe(angularTemplateCache({
            root: 'scripts/views',
            module: 'myChat'
        }))
        .pipe(gulp.dest('public/scripts'));
});

gulp.task('styles', function () {
    return gulp.src('src/client/styles/**/*.less')
        .pipe(less())
        .pipe(concat('styles.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest('public/styles'));
});

gulp.task('scripts-debug', function () {
    return browserify({
        entries: 'src/client/scripts/app.js',
        debug: true
    }).transform("babelify", { presets: ["es2015"] })
        .bundle()
        .pipe(source('scripts.js'))
        .pipe(buffer())
        .pipe(gulp.dest('public/scripts/'));
});

gulp.task('scripts', function () {
    return browserify({
        entries: 'src/client/scripts/app.js',
        debug: true
    }).transform("babelify", { presets: ["es2015"] })
        .bundle()
        .pipe(source('scripts.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('public/scripts/'));
});

gulp.task('build', gulpSync.sync([
    'clean',
    'copy',
    'templates',
    'styles',
    'scripts'
]));

gulp.task('debug', gulpSync.sync([
    'clean',
    'copy',
    'templates',
    'styles',
    'scripts-debug'
]));

gulp.task('develop', function() {
    watchNow.watch(gulp, [
        'src/client/index.html'
    ], [
        'copy'
    ]);

    watchNow.watch(gulp, [
        'src/client/scripts/views/**/*.html'
    ], [
        'templates',
        'scripts-debug'
    ]);

    watchNow.watch(gulp, [
        'src/client/styles/**/*.less'
    ], [
        'styles'
    ]);

    watchNow.watch(gulp, [
        'src/client/scripts/**/*.js'
    ], [
        'scripts-debug'
    ]);
});

gulp.task('default', ['build']);
