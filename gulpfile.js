import browserSync from "browser-sync";
import fileinclude from "gulp-file-include";
import del from "del";

// CSS
import gulpSass from "gulp-sass";
import dartSass from "sass";
const scss = gulpSass(dartSass);
import autoprefixer from "autoprefixer";
import urlAdjuster from "gulp-css-replace-url";
import postCss from "gulp-postcss";

// JS
import { src, dest, series, watch } from "gulp";
import gutil from "gulp-util";
import concat from "gulp-concat";
import uglify from "gulp-uglify";
import rename from "gulp-rename";

// IMAGE
import imagemin from "gulp-imagemin";

// 소스 파일 경로
const PATH = {
    HTML: "./src/view",
    ASSETS: {
        INCLUDE: "./src/include",
        FONTS: "./src/assets/fonts",
        IMAGES: "./src/assets/images",
        VIDEO: "./src/assets/videos",
        STYLE: "./src/assets/style",
        SCRIPT: "./src/assets/script",
        LIB: "./src/assets/lib",
    },
};
// 산출물 경로
const DEST_PATH = {
    HTML: "./dist/",
    ASSETS: {
        FONTS: "./dist/assets/style/fonts",
        IMAGES: "./dist/assets/images",
        VIDEO: "./dist/assets/videos",
        STYLE: "./dist/assets/style",
        SCRIPT: "./dist/assets/script",
        LIB: "./dist/assets/lib",
    },
};

const bootstrapPath = "node_modules/bootstrap/dist/";
const bootstrapFontPath = "node_modules/bootstrap-icons/font/fonts/";
const pretendardPath = "node_modules/pretendard/dist/web/static/";
const summernotePath = "node_modules/summernote/dist/";

const library = async () => {
    await src([
        bootstrapPath + "js/bootstrap.bundle.js",
        summernotePath + "summernote-bs5.js",
    ]).pipe(dest(DEST_PATH.ASSETS.SCRIPT));
};

const video = async () =>
    await src(PATH.ASSETS.VIDEO + "/*")
        .pipe(dest(DEST_PATH.ASSETS.VIDEO))
        .pipe(browserSync.stream());

const image = async () =>
    await src(PATH.ASSETS.IMAGES + "/*.*")
        .pipe(
            imagemin([
                imagemin.gifsicle({ interlaced: false }),
                imagemin.mozjpeg({ progressive: true }),
                imagemin.optipng({ optimizationLevel: 5 }),
                imagemin.svgo({
                    plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
                }),
            ])
        )
        .pipe(dest(DEST_PATH.ASSETS.IMAGES))
        .pipe(browserSync.stream());

const clean = async () => await del.sync(DEST_PATH.HTML);

const build = async () =>
    await src(PATH.ASSETS.SCRIPT + "/*.js")
        // .pipe(concat("common.js"))
        // .pipe(dest(DEST_PATH.ASSETS.SCRIPT))
        // .pipe(
        //     uglify({
        //         mangle: true, // 알파벳 한글자 압축
        //     })
        // )
        // .pipe(rename("common.min.js"))
        .pipe(dest(DEST_PATH.ASSETS.SCRIPT))
        .pipe(browserSync.stream());

const scssCompile = async () =>
    await src(PATH.ASSETS.STYLE + "/*.scss")
        .pipe(
            scss({
                includePaths: ["node_modules"],
                outputStyle: "expanded",
            })
        )
        .pipe(postCss([autoprefixer()]))
        .pipe(dest(DEST_PATH.ASSETS.STYLE))
        .pipe(browserSync.stream());

const html = async () =>
    await src(PATH.HTML + "/*.html")
        .pipe(
            fileinclude({
                prefix: "@gridone-",
                basepath: "@file",
            })
        )
        .pipe(dest(DEST_PATH.HTML))
        .pipe(browserSync.stream());

const maps = {
    css: async () =>
        await src([summernotePath + "summernote-bs5.css.map"]).pipe(
            dest(DEST_PATH.ASSETS.STYLE)
        ),

    script: async () =>
        await src([
            summernotePath + "summernote-bs5.js.map",
            bootstrapPath + "js/bootstrap.bundle.js.map",
        ]).pipe(dest(DEST_PATH.ASSETS.SCRIPT)),
};

const fonts = {
    pretendard: async () =>
        await src([pretendardPath + "pretendard.css"])
            .pipe(urlAdjuster({ replace: ["./woff2", "./fonts"] }))
            .pipe(urlAdjuster({ replace: ["./woff", "./fonts"] }))
            .pipe(dest(DEST_PATH.ASSETS.STYLE)),

    summernote: async () =>
        await src([summernotePath + "summernote-bs5.css"])
            .pipe(urlAdjuster({ replace: ["./font", "./fonts"] }))
            .pipe(dest(DEST_PATH.ASSETS.STYLE)),

    publicFonts: async () =>
        await src([
            bootstrapFontPath + "*",
            pretendardPath + "woff2/*",
            pretendardPath + "woff/*",
            summernotePath + "font/*",
        ]).pipe(dest(DEST_PATH.ASSETS.FONTS)),
};

const watcher = () => {
    watch(PATH.HTML).on("change", (e) => {
        html();
        gutil.log(`Source Changed: ${e}`);
    });
    watch(PATH.ASSETS.INCLUDE).on("change", (e) => {
        html();
        gutil.log(`Source Changed: ${e}`);
    });
    watch(PATH.ASSETS.STYLE).on("change", (e) => {
        scssCompile();
        gutil.log(`Source Changed: ${e}`);
    });
    watch(PATH.ASSETS.SCRIPT).on("change", (e) => {
        library();
        gutil.log(`Source Changed: ${e}`);
    });
    watch(DEST_PATH.HTML).on("add", () => browserSync.reload());
};

const server = async () =>
    await browserSync.init({
        server: { baseDir: "./dist", index: "index.html" },
    });

const tasks = series(
    [clean],
    [scssCompile],
    [html],
    [build],
    [fonts.pretendard],
    [fonts.summernote],
    [fonts.publicFonts],
    [maps.css],
    [maps.script],
    [image],
    [video],
    [library],
    [server],
    [watcher]
);

exports.default = tasks;
