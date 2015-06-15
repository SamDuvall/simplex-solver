var _ = require('underscore');
var path = require('path');
var combine = require('stream-combiner');
var runSequence = require('run-sequence');
var config = require('./config');

var gulp = require('gulp');
var shell = require('gulp-shell');
var rimraf = require('gulp-rimraf');
var useref = require('gulp-useref');
var bower = require('gulp-bower');
var changed = require('gulp-changed');
var less = require('gulp-less');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var tap = require('gulp-tap');
var through = require('through2');
var gulpif = require('gulp-if');
var filter = require('gulp-filter');
var livereload = require('gulp-livereload');
var templateCache = require('gulp-angular-templatecache');

function combineWatch(streams) {
  var combined = combine(streams);
  combined.on('error', function(err) {
    console.warn(err.message)
  });
  return combined;
}

// Clean
gulp.task('clean', function (cb) {
  return gulp.src('dist', { read: false })
  .pipe(rimraf({ force: true }))
});

// Bower
gulp.task('bower', function() {
  return bower();
});

// Javascript
gulp.task('js', function() {
  var appConfig = _.pick(config, 'env');
  return combineWatch([
    gulp.src(['assets/js/application.js']),
    browserify({
      debug: config.env.development,
      insertGlobals: true,
      insertGlobalVars: {
        config: function () {
          return JSON.stringify(appConfig);
        }
      }
    }),
    gulp.dest('dist/js')
  ]);
});

// CSS
gulp.task('css', function () {
  return combineWatch([
    gulp.src(['assets/css/application.less']),
    less(),
    gulp.dest('dist/css')
  ]);
});

// IMG
var extensions = ['jpg', 'jpeg', 'png', 'gif', 'svg'];
var images = _.map(extensions, function(extension) {
  return 'assets/**/*.' + extension;
});
gulp.task('img', function() {
  var src = images;
  var dst = 'dist';

  return gulp.src(src)
  .pipe(changed(dst))
  .pipe(gulp.dest(dst));
});

// Assets
gulp.task('assets', function() {
  var src = 'assets/*';
  var dst = 'dist';

  return gulp.src(src)
    .pipe(changed(dst))
    .pipe(gulp.dest(dst));
});

// Views
gulp.task('views', function() {
  var src = ['app/common/**/*.html', 'app/shared/**/*.html', 'app/components/**/*.html'];
  var dst = 'dist/js';

  return gulp.src(src)
    .pipe(changed(dst))
    .pipe(templateCache({
      standalone: true
    }))
  .pipe(gulp.dest(dst));
});

// Assets
gulp.task('html', function() {
  var html = 'app/*.html'
  var dst = 'dist';
  var views = 'dist';

  var streams = gulp.src(html);
  if (config.env.production) {
    var assets = useref.assets({searchPath: dst});
    streams = streams.pipe(assets)
      .pipe(rev())
      .pipe(gulpif('*.js', uglify({mangle: false})))
      .pipe(gulpif('*.css', minifyCss()))
      .pipe(assets.restore())
      .pipe(useref())
      .pipe(revReplace())
  }

  var assets = filter('assets/*');
  var html = filter('*.html');
  return streams
    .pipe(assets)
    .pipe(gulp.dest(dst))
    .pipe(assets.restore())

    .pipe(html)
    .pipe(gulp.dest(views))
    .pipe(html.restore())
});

gulp.task('build', function(cb) {
  runSequence('clean', 'bower', ['css', 'js', 'img', 'assets', 'views'], 'html', cb);
});

gulp.task('watch', ['build'], function() {
  gulp.watch(['assets/js/**/*.js', 'app/**/*.js', 'src/**/*/.js'], function() {
    gulp.run('js');
  });
  gulp.watch('assets/css/**/*', function(changes) {
    gulp.run('css');
  });
  gulp.watch(images, function() {
    gulp.run('img');
  });
  gulp.watch('assets/*', function() {
    gulp.run('assets');
  });
  gulp.watch('app/**/*.html', function() {
    gulp.run('views');
  });
  gulp.watch('app/*.html', function() {
    gulp.run('html');
  });
});

gulp.task('live', ['watch'], function() {
  livereload.listen();
  gulp.watch(['dist/css/*'], livereload.changed);
});

gulp.task('default', ['build']);
