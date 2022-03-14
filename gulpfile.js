var sourcemaps = require("gulp-sourcemaps");
var nodemon = require("gulp-nodemon");
var browserSync = require("browser-sync");
var fileinclude = require("gulp-file-include");
var del = require("del");

// CSS
var scss = require("gulp-sass")(require("sass"));
var urlAdjuster = require("gulp-css-replace-url");

// JS
var gulp = require("gulp");
concat = require("gulp-concat");
uglify = require("gulp-uglify");
rename = require("gulp-rename");

// IMAGE
var imagemin = require("gulp-imagemin");

// 소스 파일 경로
https: var PATH = {
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
    },
    // 산출물 경로
    DEST_PATH = {
        HTML: "./dist/",
        ASSETS: {
            MAIN: "./dist/assets",
            FONTS: "./dist/assets/style/fonts",
            IMAGES: "./dist/assets/images",
            VIDEO: "./dist/assets/videos",
            STYLE: "./dist/assets/style",
            SCRIPT: "./dist/assets/script",
            LIB: "./dist/assets/lib",
        },
    };

gulp.task("library", () => {
    return new Promise((resolve) => {
        // Bootstrap
        const bootstrapPath =
            "node_modules/bootstrap/dist/js/bootstrap.bundle.js";

        gulp.src(bootstrapPath).pipe(gulp.dest(DEST_PATH.ASSETS.SCRIPT));
        resolve();
    });
});

gulp.task("video", () => {
    return new Promise((resolve) => {
        gulp.src(PATH.ASSETS.VIDEO + "/*").pipe(
            gulp.dest(DEST_PATH.ASSETS.VIDEO)
        );
        resolve();
    });
});

gulp.task("imagemin", () => {
    return new Promise((resolve) => {
        gulp.src(PATH.ASSETS.IMAGES + "/*.*")
            .pipe(
                imagemin([
                    imagemin.gifsicle({ interlaced: false }),
                    // imagemin.jpegtran({ progressive: true }),
                    imagemin.optipng({ optimizationLevel: 5 }),
                    imagemin.svgo({
                        plugins: [
                            { removeViewBox: true },
                            { cleanupIDs: false },
                        ],
                    }),
                ])
            )
            .pipe(gulp.dest(DEST_PATH.ASSETS.IMAGES))
            .pipe(browserSync.reload({ stream: true }));
        resolve();
    });
});

https: gulp.task("clean", () => {
    return new Promise((resolve) => {
        del.sync(DEST_PATH.HTML);

        resolve();
    });
});

https: gulp.task("script:build", () => {
    return new Promise((resolve) => {
        gulp.src(PATH.ASSETS.SCRIPT + "/*.js")
            .pipe(concat("common.js"))
            .pipe(gulp.dest(DEST_PATH.ASSETS.SCRIPT))
            .pipe(
                uglify({
                    mangle: true, // 알파벳 한글자 압축
                })
            )
            .pipe(rename("common.min.js"))
            .pipe(gulp.dest(DEST_PATH.ASSETS.SCRIPT))
            .pipe(browserSync.reload({ stream: true }));

        resolve();
    });
});

gulp.task("scss:compile", () => {
    return new Promise((resolve) => {
        var options = {
            outputStyle: "expanded", // nested, expanded, compact, compressed
            indentType: "space", // space, tab
            indentWidth: 4, //
            precision: 8,
            sourceComments: true, // 코멘트 제거 여부
        };
        gulp.src(PATH.ASSETS.STYLE + "/*.scss")
            .pipe(
                scss({
                    includePaths: ["node_modules"],
                })
            )
            .pipe(sourcemaps.init())
            .pipe(scss(options))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(DEST_PATH.ASSETS.STYLE))
            .pipe(browserSync.reload({ stream: true }));

        resolve();
    });
});

gulp.task("html", () => {
    return new Promise((resolve) => {
        gulp.src(PATH.HTML + "/*.html")
            .pipe(
                fileinclude({
                    prefix: "@gridone-",
                    basepath: "@file",
                })
            )
            .pipe(gulp.dest(DEST_PATH.HTML))
            .pipe(browserSync.reload({ stream: true }));

        resolve();
    });
});

gulp.task("fonts", () => {
    return new Promise((resolve) => {
        // Bootstrap Icons
        const bootstrapPath = "node_modules/bootstrap-icons/font/fonts/";

        gulp.src(bootstrapPath + "*").pipe(gulp.dest(DEST_PATH.ASSETS.FONTS));

        // Pretendard Fonts
        const pretendardPath = "node_modules/pretendard/dist/web/static/";

        gulp.src(pretendardPath + "pretendard.css")
            .pipe(
                urlAdjuster({
                    replace: ["./woff2", "./fonts"],
                })
            )
            .pipe(
                urlAdjuster({
                    replace: ["./woff", "./fonts"],
                })
            )
            .pipe(gulp.dest(DEST_PATH.ASSETS.STYLE));
        gulp.src(pretendardPath + "woff2/*").pipe(
            gulp.dest(DEST_PATH.ASSETS.FONTS)
        );
        gulp.src(pretendardPath + "woff/*").pipe(
            gulp.dest(DEST_PATH.ASSETS.FONTS)
        );

        resolve();
    });
});

https: gulp.task("nodemon:start", () => {
    return new Promise((resolve) => {
        nodemon({
            script: "src/app.js",
            watch: DEST_PATH.HTML,
        });

        resolve();
    });
});

gulp.task("watch", () => {
    return new Promise((resolve) => {
        gulp.watch(PATH.HTML + "/**/*.html", gulp.series(["html"]));
        gulp.watch(PATH.ASSETS.INCLUDE + "/**/*.html", gulp.series(["html"]));
        gulp.watch(
            PATH.ASSETS.STYLE + "/**/*.scss",
            gulp.series(["scss:compile"])
        );
        gulp.watch(
            PATH.ASSETS.SCRIPT + "/**/*.js",
            gulp.series(["script:build"])
        );
        gulp.watch(PATH.ASSETS.IMAGES + "/**/*.*", gulp.series(["imagemin"]));

        https: resolve();
    });
});

https: gulp.task("browserSync", () => {
    return new Promise((resolve) => {
        browserSync.init(null, { proxy: "http://localhost:8011", port: 8012 });
        resolve();
    });
});

https: gulp.task(
    "default",
    gulp.series([
        "clean",
        "scss:compile",
        "html",
        "script:build",
        "imagemin",
        "fonts",
        "video",
        "library",
        "nodemon:start",
        "browserSync",
        "watch",
    ])
);
