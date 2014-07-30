var source = require('vinyl-source-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var preprocess = require('gulp-preprocess');
var argv = require('yargs').argv;
var watchify = require('watchify');
var browserify = require('browserify');

var defaults = require('./env.json');
var env = argv.env ? require('./' + argv.env) : defaults;

var paths = {
  scripts: ['src/js/**/*.js', '!src/js/vendor/**/*.js']
};

var localVendorLibs = [
  'chessground',
  'zepto'
].map(function(path) {
  return require.resolve('./src/js/vendor/' + path);
});

var allVendorLibs = localVendorLibs.concat(['lodash', 'q']);

gulp.task('html', function() {
  return gulp.src('src/index.html')
    .pipe(preprocess({context: env}))
    .pipe(gulp.dest('www/'));
});

gulp.task('lint', function() {
  return gulp.src(paths.scripts)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', function() {
  var bundleStream = browserify('./src/js/main.js').bundle({debug: true});

  return bundleStream
    .on('error', function(error) { gutil.log(gutil.colors.red(error.message)); })
    .pipe(source('app.js'))
    .pipe(gulp.dest('./www'));
});

gulp.task('watch-scripts', function() {
  var bundleStream = watchify({
    entries: './src/js/main.js',
    noParse: allVendorLibs
  });

  function rebundle() {
    return bundleStream.bundle({debug: true})
      .on('error', function(error) { gutil.log(gutil.colors.red(error.message)); })
      .pipe(source('app.js'))
      .pipe(gulp.dest('./www'));
  }

  bundleStream.on('update', rebundle);
  bundleStream.on('log', gutil.log);

  return rebundle();
});

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['lint']);
  gulp.watch('src/index.html', ['html']);
});

gulp.task('dev', ['html', 'lint', 'scripts']);
gulp.task('dev-watch', ['html', 'lint', 'watch-scripts', 'watch']);
gulp.task('android', ['html', 'scripts']);

// Default Task
gulp.task('default', ['dev-watch']);
