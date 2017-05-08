/**
 * © Copyright IBM Corp. 2016 All Rights Reserved
 *   Project name: JSONata
 *   This project is licensed under the MIT License, see LICENSE
 */

'use strict';

var babel = require('gulp-babel');
var concat = require('gulp-concat');
var eslint = require('gulp-eslint');
var gulp = require('gulp');
var istanbul = require('gulp-istanbul');
var jsdoc = require('gulp-jsdoc');
var mocha = require('gulp-mocha-co');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var output = 'jsonata.js';
var source = 'src/**/*.js';

gulp.task('default', ['lint', 'test', 'package']);

gulp.task('lint', function() {
    return gulp.src(
        [
            '**/*.js', // All JavaScript
            '!lib/', // Except generated JavaScript
            '!dist/',
            '!coverage/',
            '!node_modules/' // Except pre-reqs
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// Note, we test on the source before it has been through babel.
// This allows us to ensure 100% code coverage (babel inserts extra
// code which isn't tested), but it means that we are not testing
// exactly what we are shipping.  With some work this might be fixable
// with sourcemaps.
gulp.task('test', function(done) {
    gulp.src('src/**/*.js')
        .pipe(istanbul({includeUntested: true}))
        .pipe(istanbul.hookRequire())
        .on('finish', () => {
            gulp.src('test/**/*.js')
                .pipe(mocha({reporter: 'spec'}))
                .pipe(istanbul.writeReports({
                    reporters: ['text-summary', 'html', 'lcov']
                }))
                .pipe(istanbul.enforceThresholds({thresholds: {global: 100}}))
                .on('end', done);
        });
});

gulp.task('package', ['package:CommonJS', 'package:UMD', 'package:jsdoc']);

// A CommonJS version for use as a nodejs library
gulp.task('package:CommonJS', function() {
    return gulp.src(source)
      .pipe(concat(output))
      .pipe(babel({presets: ['es2015']}))
      .pipe(gulp.dest('lib'));
});

// A Universal Module Definition version for use in the browser
gulp.task('package:UMD', function() {
    return gulp.src(source)
      .pipe(concat(output))
      .pipe(babel({
          presets: ['es2015'],
          plugins: ['transform-es2015-modules-umd']
      }))
      .pipe(gulp.dest('dist'))
      .pipe(gulp.dest('.')) // For backwards compatability
      .pipe(rename({suffix: '.min'}))
      .pipe(uglify())
      .pipe(gulp.dest('dist'))
      .pipe(gulp.dest('.')); // For backwards compatability
});

gulp.task('package:jsdoc', function() {
    return gulp.src(source)
        .pipe(jsdoc('doc'));
});
