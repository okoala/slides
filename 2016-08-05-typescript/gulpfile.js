const path = require('path')

const gulp = require('gulp')
const del = require('del')
const ncp = require('ncp')
const gutil = require('gulp-util')
const debug = require('gulp-debug')
const tslint = require('gulp-tslint')
const ts = require('gulp-typescript')
const rename = require('gulp-rename')
const notify = require('gulp-notify')
const postcss = require('gulp-postcss')
const nodemon = require('gulp-nodemon')
const sequence = require('gulp-sequence')
const sourcemaps = require('gulp-sourcemaps')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

const tsProject = ts.createProject('tsconfig.json', {
  typescript: require('typescript')
})

const paths = {
  dist: './dist',
  entry: './index',
  server: [
    '**/*.ts',
    '!typings/**/*',
    '!node_modules/**/*'
  ],
  public: './server/public',
  publicFiles: [
    'server/public/**.js',
    'server/public/index.html'
  ],
  publicCssFiles: [
    'server/public/**/*.css'
  ],
  publicDist: './dist/public',
  nodemonWatchExtensions: 'html css json js'
}

let isWatching = false

/**
 * 错误处理显示
 */
const handleError = (cmdName, isJustAWarning) => {
  return function (err) {
    if (isJustAWarning) {
      gutil.log(gutil.colors.bgYellow(' Task succeeded but raised some warnings '))
    } else {
      if (!err.length) { err = [err] }
      notify.onError({ message: '{ ಠ_ಠ }! Build failed... check the logs.', sound: true })(err[0])
      console.log('\n\n')
      gutil.log(gutil.colors.bgYellow(`############### ${cmdName} ERROR: #################`))
      err.forEach(function (e) { gutil.log(gutil.colors.bgYellow('Error: '), gutil.colors.red(e)) })
      err.forEach(function (e) { gutil.log(gutil.colors.red(e.stack)) })
      gutil.log(gutil.colors.bgYellow(`############### ${cmdName} ########################`))
      console.log('\n\n\n')
    }
    tasks.jobFinisher()()
  }
}

const tasks = {
  clean (cb) {
    return del(paths.dist, cb)
  },

  copy () {
    setTimeout(() => {
      ncp(
        paths.public,
        paths.publicDist,
        { filter: file => file.lastIndexOf('.css') === -1 },
        () => {}
      )
    }, 2000)
  },

  css () {
    const processors = [
      autoprefixer({browsers: ['last 2 version']}),
      cssnano()
    ]
    return gulp.src(paths.publicCssFiles)
      .pipe(postcss(processors))
      .pipe(gulp.dest(paths.publicDist))
  },

  compile (cb) {
    var tsResult = gulp.src(paths.server)
      .pipe(debug())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(ts(tsProject))
      .on('error', handleError('build'))

    return tsResult.js
      .pipe(rename((path) => {
        path.dirname = path.dirname.replace(/^server/i, '')
        return path
      }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(paths.dist))
      .on('error', handleError('build'))
  },

  jobFinisher (cb) {
    return function () {
      if (!isWatching) {
        if (cb) { cb() }
        process.exit()
      }
    }
  },

  tslint (cb) {
    return gulp.src(paths.server)
      .pipe(tslint())
      .pipe(tslint.report('prose'))
      .on('error', handleError('tslint'))
  },

  watch () {
    isWatching = true
    gulp.watch(paths.server, ['compile'])
      .on('error', handleError('watch:server'))

    gulp.watch(paths.publicFiles, ['copy'])
      .on('error', handleError('watch:public:js'))

    gulp.watch(paths.publicCssFiles, ['css'])
      .on('error', handleError('watch:public:js'))
  },

  nodemon (cb) {
    let started = false
    nodemon({
      script: path.resolve(paths.dist, paths.entry),
      delay: 2000,
      nodemonWatch: [paths.dist],
      ext: paths.nodemonWatchExtensions,
      env: { 'NODE_ENV': 'development' }
    }).on('start', function () {
      isWatching = true
      if (!started) {
        cb()
        started = true
      }
      console.log('nodemon start')
    }).on('error', handleError('nodemon'))
  }
}

/* *********** 注册Gulp任务 *********** */

/* *********** Mixin Task *********** */
gulp.task('clean', tasks.clean)
gulp.task('copy', tasks.copy)
gulp.task('css', tasks.css)
gulp.task('compile', tasks.compile)
gulp.task('tslint', tasks.tslint)
gulp.task('watch', tasks.watch)
gulp.task('nodemon', tasks.nodemon)

/* *********** Main Task *********** */
gulp.task('build', (cb) => { sequence('clean', 'copy', 'css', 'tslint', 'compile', cb) })
gulp.task('dev', (cb) => { sequence('build', 'watch', 'nodemon', cb) })
