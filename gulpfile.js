const gulp = require('gulp');
const path = require('path');
const mergeStream = require('merge-stream');
var inlinesource = require('gulp-inline-source');

const paths = {
	src: path.join(__dirname, 'src'),
	build: path.join(__dirname, 'dist'),
	nodeHtml: path.join(__dirname, 'src/finite-state-machine-node.html'),
	copyFiles: [path.join(__dirname, 'src/statemachine.js'), path.join(__dirname, 'src/finite-state-machine-node.js')]
};

gulp.task('copy', function () {
	var jsStream = gulp.src(paths.copyFiles)
		.pipe(gulp.dest(paths.build));
	return mergeStream(jsStream);
});

gulp.task('build:html', function () {
	return gulp.src(paths.nodeHtml)
	.pipe(inlinesource({compress: 'true'}))
	.pipe(gulp.dest(paths.build));
});


gulp.task('build', gulp.series('copy', 'build:html'));

