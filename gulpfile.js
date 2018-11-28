const gulp = require('gulp');
const inlineResources = require('./tools/inline-resources');

function copyHtml() {
    return gulp.src('src/components/**/*.html')
        .pipe(gulp.dest('./dist')).on('end', copyAssets);
}

function copyDts() {
    return gulp.src('src/components/**/*.d.ts')
        .pipe(gulp.dest('./dist')).on('end', copyAssets);
}

function copyJS() {
    return gulp.src('src/components/**/*.js')
        .pipe(gulp.dest('./dist')).on('end', copyAssets);
}

function copyData() {
    return gulp.src('./src/components/**/*.json')
      .pipe(gulp.dest('dist/'));
  };

function copyAssets() {
    return gulp.src('./src/assets/**/*')
        .pipe(gulp.dest('./dist/assets')).on('end', copyScss);
}
function copyScss() {
    return gulp.src('./src/components/**/*.{scss,css}')
        .pipe(gulp.dest('./dist')).on('end', inlineResource);
}

function inlineResource() {
    inlineResources('./dist/**');
}

gulp.task('build:copy-and-inline-resource', copyHtml);
gulp.task('build:copy-and-inline-dts', copyDts);
gulp.task('build:copy-and-inline-js', copyJS);
gulp.task('build:copy-resources', copyData);


gulp.task('default', gulp.series(    'build:copy-and-inline-resource',
'build:copy-and-inline-dts',
'build:copy-and-inline-js',
'build:copy-resources'));
