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

function copyAssetsFonts() {
    return gulp.src('./src/assets/font/*')
        .pipe(gulp.dest('./dist/assets/font'));
}

function copyAssetsi18n() {
    return gulp.src('./src/assets/i18n/*')
        .pipe(gulp.dest('./dist/assets/i18n'));
}

function copyAssetsPng() {
    return gulp.src('./src/assets/**/*.png')
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
gulp.task('build:copy-assets-font', copyAssetsFonts);
gulp.task('build:copy-assets-i18n', copyAssetsi18n);
gulp.task('build:copy-assets-png', copyAssetsPng);
gulp.task('build:copy-json', copyJson);
gulp.task('build:inline-resources', inlineResource);


gulp.task('default', gulp.series(
  'build:copy-js',
  'build:copy-dts',
  'build:copy-html',
  'build:copy-css',
  'build:copy-assets-font',
  'build:copy-assets-i18n',
  'build:copy-assets-png',
  'build:copy-json',
  'build:inline-resources'
));
