const { src, dest, watch, parallel, series } = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const concat = require('gulp-concat')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer') // Используем autoprefixer напрямую с postcss
const uglify = require('gulp-uglify') // Подключаем gulp-uglify
const imagemin = require('gulp-imagemin')
const rename = require('gulp-rename')
const nunjucksRender = require('gulp-nunjucks-render')
const imageminMozjpeg = require('imagemin-mozjpeg')
const del = require('del')
const browserSync = require('browser-sync').create()

function browsersync() {
	browserSync.init({
		server: {
			baseDir: 'app/',
		},
		notify: false,
	})
}

function nunjucks() {
	return src('app/*.njk')
		.pipe(nunjucksRender())
		.pipe(dest('app'))
		.pipe(browserSync.stream())
}

function styles() {
	return (
		src('app/scss/*.scss') // Убедитесь, что путь правильный
			.pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError)) // Указываем стиль и обработку ошибок
			/* .pipe(concat()) */
			.pipe(
				rename({
					suffix: '.min',
				})
			)
			.pipe(
				postcss([
					autoprefixer({
						overrideBrowserslist: ['last 10 versions'],
						grid: true,
					}),
				])
			) // Применяем autoprefixer с помощью postcss
			.pipe(dest('app/css'))
			.pipe(browserSync.stream())
	)
}

function cleanDist() {
	return del('dist')
}

function watching() {
	watch(['app/**/*.scss'], styles)
	watch(['app/*.njk'], nunjucks)
	watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts)
	watch(['app/**/*.html']).on('change', browserSync.reload)
}

function scripts() {
	return src([
		'node_modules/jquery/dist/jquery.js',
		'node_modules/slick-carousel/slick/slick.js',
		'node_modules/@fancyapps/fancybox/dist/jquery.fancybox.js',
		'node_modules/rateyo/src/jquery.rateyo.js',
		'node_modules/ion-rangeslider/js/ion.rangeSlider.js',
		'node_modules/jquery-form-styler/dist/jquery.formstyler.js',
		'app/js/main.js',
	])
		.pipe(concat('main.min.js'))
		.pipe(uglify())
		.pipe(dest('app/js'))
		.pipe(browserSync.stream())
}

function images() {
	return src('app/images/**/*.*')
		.pipe(
			imagemin([
				imagemin.gifsicle({ interlaced: true }),
				imageminMozjpeg({ quality: 75, progressive: true }),
				imagemin.optipng({ optimizationLevel: 5 }),
				imagemin.svgo({
					plugins: [
						{
							name: 'removeViewBox',
							active: true,
						},
						{
							name: 'cleanupIDs',
							active: false,
						},
					],
				}),
			])
		)
		.pipe(dest('dist/images'))
}

function build() {
	return src(['app/**/*.html', 'app/css/style.min.css', 'app/js/main.min.js'], {
		base: 'app',
	}).pipe(dest('dist'))
}

exports.styles = styles
exports.scripts = scripts
exports.browsersync = browsersync
exports.watching = watching
exports.build = series(cleanDist, images, build)
exports.images = images
exports.nunjucks = nunjucks
exports.cleanDist = cleanDist

exports.default = parallel(nunjucks, styles, scripts, browsersync, watching)
