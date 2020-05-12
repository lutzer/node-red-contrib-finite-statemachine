const gulp = require('gulp');
const path = require('path');
const htmlmin = require('gulp-htmlmin');
var inlinesource = require('gulp-inline-source');
var minifyInline = require('gulp-minify-inline');
const minify = require('gulp-minify');

const paths = {
	src: path.join(__dirname, 'src'),
	build: path.join(__dirname, 'dist'),
	nodeHtml: path.join(__dirname, 'src/finite-state-machine-node.html'),
	copyFiles: [path.join(__dirname, 'src/statemachine.js'), path.join(__dirname, 'src/finite-state-machine-node.js')]
};

function buildHtml() {
	return gulp.src(paths.nodeHtml)
	.pipe(inlinesource({compress: 'true'}))
	.pipe(htmlmin({ collapseWhitespace: false, minifyCSS: true, minifyJS: true }))
	.pipe(minifyInline())
	.pipe(gulp.dest(paths.build));
}

function buildJs() {
	return gulp.src(paths.copyFiles)
	.pipe(minify({
		noSource: true,
		ext: {
			min: '.js'
		}
	}))
	.pipe(gulp.dest(paths.build));
}


gulp.task('build', gulp.series(buildJs, buildHtml));

