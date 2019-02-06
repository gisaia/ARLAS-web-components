const gulp = require('gulp');
const inlineResources = require('./tools/inline-resources');

function copyHtml() {
    return gulp.src('src/components/**/*.html')
        .pipe(gulp.dest('./dist/components'));
}

function copyDts() {
    return gulp.src('src/components/**/*.d.ts')
        .pipe(gulp.dest('./dist/components'));
}

function copyJS() {
    return gulp.src('src/components/**/*.js')
        .pipe(gulp.dest('./dist/components'));
}

function copyJson() {
    return gulp.src('./src/components/**/*.json')
      .pipe(gulp.dest('./dist/components'));
  };

function copyAssets() {
    return gulp.src('./src/assets/**/*')
        .pipe(gulp.dest('./dist/assets'));
}
function copyScss() {
    return gulp.src('./src/components/**/*.{scss,css}')
        .pipe(gulp.dest('./dist/components'));
}

function inlineResource(done) {
    inlineResources('./dist/**');
    done();
}

gulp.task('build:copy-js', copyJS);
gulp.task('build:copy-dts', copyDts);
gulp.task('build:copy-html', copyHtml);
gulp.task('build:copy-css', copyScss);
gulp.task('build:copy-assets', copyAssets);
gulp.task('build:copy-json', copyJson);
gulp.task('build:inline-resources', inlineResource);


gulp.task('default', gulp.series(
  'build:copy-js',
  'build:copy-dts',
  'build:copy-html',
  'build:copy-css',
  'build:copy-assets',
  'build:copy-json',
  'build:inline-resources'
));
