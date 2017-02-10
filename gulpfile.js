/* global require */

var gulp = require('gulp'),
    watch = require ('gulp-watch'),
    copy = require('gulp-copy'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    cleanCSS = require('gulp-cleancss'),
    uglify = require('gulp-uglify');

gulp.task('copy-bootstrap-css', function () {
    return gulp.src([
        'bower_components/bootstrap/dist/css/bootstrap.min.css'
    ]).pipe(copy('public/styles/vendor/bootstrap/css', {
        prefix: 4
    }));
});

gulp.task('copy-bootstrap-fonts', function () {
    return gulp.src([
        'bower_components/bootstrap/dist/fonts/**/*'
    ]).pipe(copy('public/styles/vendor/bootstrap/fonts', {
        prefix: 4
    }));
});

gulp.task('copy', [
    'copy-bootstrap-css',
    'copy-bootstrap-fonts'
]);

gulp.task('scripts-vendor', function () {
    return gulp.src([
        'bower_components/jquery/dist/jquery.js',
        'bower_components/angular/angular.js',
        'bower_components/angular-ui-router/release/angular-ui-router.js',
        'bower_components/bootstrap/dist/js/bootstrap.js'
    ]).pipe(concat('vendor.min.js')).
        pipe(uglify()).
        pipe(gulp.dest('public/scripts'));
});

gulp.task('scripts', function () {
    return gulp.src([
        'public/scripts/services/*.js',
        'public/scripts/app.js'
    ]).pipe(concat('app.min.js')).
        pipe(uglify()).
        pipe(gulp.dest('public/scripts'));
});

gulp.task('scripts-debug', function () {
    return gulp.src([
        'public/scripts/services/*.js',
        'public/scripts/app.js'
    ]).pipe(concat('app.min.js')).
        pipe(gulp.dest('public/scripts'));
});

gulp.task('styles', function () {
    return gulp.src('public/styles/styles.less').
        pipe(less()).
        pipe(concat('styles.css')).
        pipe(cleanCSS()).
        pipe(gulp.dest('public/styles'));
});

gulp.task('default', [
    'copy',
    'scripts-vendor',
    'scripts',
    'styles'
]);

gulp.task('debug', [
    'copy',
    'scripts-vendor',
    'scripts-debug',
    'styles'
]);

gulp.task('develop', function() {
    gulp.watch([
        'public/styles/**/*.less'
    ], [
        'styles'
    ]);

    gulp.watch([
        'public/scripts/app.js'
    ], [
        'scripts-debug'
    ]);
});
