const canvas = document.getElementById("canvas");
const imageCanvas = document.getElementById("image-canvas");
const backupCanvas = document.getElementById("backup-canvas");
const ctx = canvas.getContext("2d");
const imageCtx = imageCanvas.getContext("2d");
const backupCtx = backupCanvas.getContext("2d");
const actionList = [
    "CheckBox",
    "HandWrite",
    "Crop",
    "Match Template",
    "Data Exist",
    "Table",
    "Text Extractor",
    "Page Indexer",
];

let isClicked = false;
let isFunction = false;

let currentScale = 1;

let startX = 0;
let startY = 0;

let workingHistories = [];
let backupWorkingHistories = [];
let currentWorkingIndex = -1;
let canvasObjects = [];
let backupCanvasObjects = [];
let canvasRects = [];
let rectActions = [];
let backupCanvasRects = [];
let alreadyUsedColors = [];

let isObjectClick = false;
let selectedObject;

let isAttach = false;
let isDetach = false;

function dataConverter() {
    let data = [];
    let rect;
    let templateImage;
    let service;
    canvasRects.forEach(function (v, idx) {
        rect = Object.values(v)[0].split(",");

        let cropData = imageCtx.getImageData(
            rect[0],
            rect[1],
            rect[2],
            rect[3]
        );
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = cropData.width;
        tmpCanvas.height = cropData.height;

        const tmpCtx = tmpCanvas.getContext("2d");
        tmpCtx.putImageData(cropData, 0, 0);

        templateImage = tmpCanvas
            .toDataURL()
            .replace("data:image/png;base64,", "");
        service = rectActions[idx];

        let tmpObj = {
            TemplateImage: templateImage,
            BoundRect: rect.join(","),
            ServiceType: service,
        };
        data.push(tmpObj);
    });

    return data;
}

function actionSelect(text) {
    canvasRects.forEach(function (v) {
        if (Object.values(v) == selectedObject.join(",")) {
            const idx = canvasRects.indexOf(v);
            rectActions[idx] = text;
            const thisTarget = document.querySelector(
                'select[data-target="' + idx + '"]'
            );
            thisTarget
                .querySelector('option[selected="true"]')
                .removeAttribute("selected");
            thisTarget
                .querySelector('option[value="' + text + '"]')
                .setAttribute("selected", true);

            ctx.putImageData(
                workingHistories[currentWorkingIndex]["canvasObject"],
                0,
                0
            );
            let clickLocation = selectedObject;
            let x =
                clickLocation[2] > -1
                    ? clickLocation[0]
                    : parseInt(clickLocation[0]) + parseInt(clickLocation[2]);
            let y =
                clickLocation[3] > -1
                    ? parseInt(clickLocation[1]) + parseInt(clickLocation[3])
                    : clickLocation[1];
            let w = Math.abs(clickLocation[2]);

            ctx.strokeStyle = "red";
            ctx.strokeRect(
                clickLocation[0],
                clickLocation[1],
                clickLocation[2],
                clickLocation[3]
            );
            ctx.fillStyle = "black";
            ctx.fillRect(x, y, w, 20);
            ctx.fillStyle = "white";
            ctx.font = "15px Arial";
            ctx.fillText(
                text,
                parseInt(x) + 3.5,
                parseInt(y) + 15,
                parseInt(w) - 7
            );
            ctx.font = "10px sans-serif";

            workingHistories.splice(currentWorkingIndex + 1, 0, {
                canvasObject:
                    workingHistories[currentWorkingIndex]["canvasObject"],
                canvasRect: canvasRects.slice(),
                rectAction: rectActions.slice(),
            });

            backupWorkingHistories.splice(currentWorkingIndex + 1, 0, {
                canvasObject: backupCtx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                ),
                canvasRect: backupCanvasRects.slice(),
            });

            currentWorkingIndex++;
        }
    });
}

function actionTemplate(idx) {
    const select = document.createElement("select");
    select.classList.add("form-select");
    select.setAttribute("data-target", idx);

    actionList.forEach(function (v, i) {
        const option = document.createElement("option");
        option.value = v;
        option.textContent = v;

        if (rectActions[idx] && rectActions[idx] == v) {
            option.setAttribute("selected", true);
        } else {
            if (i == 0) {
                option.setAttribute("selected", true);
            }
        }

        select.appendChild(option);
    });
    return select.outerHTML;
}

function randColor() {
    let r = Math.floor(Math.random() * (255 - 0 + 1) + 0);
    let g = Math.floor(Math.random() * (255 - 0 + 1) + 0);
    let b = Math.floor(Math.random() * (255 - 0 + 1) + 0);

    let colorString = r + "," + g + "," + b;

    if (alreadyUsedColors.indexOf("rgb(" + colorString + ")") == -1) {
        return colorString;
    } else {
        randColor();
    }
}

function redraw() {
    document.getElementById("draw-object").innerHTML = "";
    canvasRects.forEach(function (v, idx) {
        ctx.strokeStyle = "orange";
        backupCtx.fillStyle = Object.keys(v)[0];

        let loc = Object.values(v)[0].split(",");
        let endX =
            loc[2] > -1
                ? parseInt(loc[0]) + parseInt(loc[2])
                : parseInt(loc[0]);
        let endY =
            loc[3] > -1
                ? parseInt(loc[1]) + parseInt(loc[3])
                : parseInt(loc[1]);

        ctx.strokeRect(loc[0], loc[1], loc[2], loc[3]);
        ctx.fillStyle = "gray";
        ctx.fillRect(endX, endY, -15, -15);
        ctx.fillStyle = "white";
        ctx.fillText(
            idx,
            endX - (10 + (idx.toString().length - 1) * 2.5),
            endY - 3.5
        );

        backupCtx.fillRect(loc[0], loc[1], loc[2], loc[3]);

        document.getElementById("draw-object").innerHTML +=
            "<tr>" +
            "<td>" +
            idx +
            "</td>" +
            "<td>" +
            loc[0] +
            "," +
            loc[1] +
            "," +
            loc[2] +
            "," +
            loc[3] +
            "</td>";
        "<td>" + actionTemplate(idx) + "</td>" + "</tr>";
    });
}

function draw(e, isEnd) {
    ctx.putImageData(canvasObjects[canvasObjects.length - 1], 0, 0);
    backupCtx.putImageData(
        backupCanvasObjects[backupCanvasObjects.length - 1],
        0,
        0
    );
    let endX = e.offsetX;
    let endY = e.offsetY;

    let width = endX - startX;
    let height = endY - startY;

    let endXX = width > -1 ? endX : startX;
    let endYY = height > -1 ? endY : startY;

    if (width != 0 && height != 0) {
        ctx.strokeStyle = "orange";
        ctx.strokeRect(startX, startY, width, height);
        ctx.fillStyle = "gray";
        ctx.fillRect(endXX, endYY, -15, -15);
        ctx.fillStyle = "white";
        ctx.fillText(
            canvasRects.length,
            endXX - (10 + (canvasRects.length.toString().length - 1) * 2.5),
            endYY - 3.5
        );

        let randomColor = "rgb(" + randColor() + ")";

        backupCtx.fillStyle = randomColor;
        backupCtx.fillRect(startX, startY, width, height);
        if (isEnd) {
            canvasRects.push(
                JSON.parse(
                    '{"' +
                        randomColor +
                        '" : "' +
                        startX +
                        "," +
                        startY +
                        "," +
                        width +
                        "," +
                        height +
                        '"}'
                )
            );
            alreadyUsedColors.splice(currentWorkingIndex, 0, randomColor);
            document.getElementById("draw-object").innerHTML +=
                "<tr><td>" +
                (canvasRects.length - 1) +
                "</td><td>" +
                startX +
                "," +
                startY +
                "," +
                width +
                "," +
                height +
                "</td><td>" +
                actionTemplate(canvasRects.length - 1) +
                "</td></tr>";
            rectActions.push(actionList[0]);
        }
    } else {
        return false;
    }
}

function addWorkingHistories() {
    workingHistories.splice(currentWorkingIndex + 1, 0, {
        canvasObject: ctx.getImageData(0, 0, canvas.width, canvas.height),
        canvasRect: canvasRects.slice(),
        rectAction: rectActions.slice(),
    });

    backupWorkingHistories.splice(currentWorkingIndex + 1, 0, {
        canvasObject: backupCtx.getImageData(0, 0, canvas.width, canvas.height),
        canvasRect: backupCanvasRects.slice(),
    });

    currentWorkingIndex++;
}

function clearFunctionKeyHandler(e) {
    if (e.key.toUpperCase() == "CONTROL") {
        isFunction = false;
    } else if (e.key.toUpperCase() == "A") {
        isAttach = false;
    } else if (e.key.toUpperCase() == "S") {
        isDetach = false;
    }
}

function functionKeyHandler(e) {
    if (e.key.toUpperCase() == "CONTROL") {
        isFunction = true;
    }

    if (isFunction) {
        if (e.key.toUpperCase() == "Z") {
            if (workingHistories[currentWorkingIndex - 1]) {
                currentWorkingIndex--;
                canvasObjects.push(
                    workingHistories[currentWorkingIndex]["canvasObject"]
                );
                canvasRects =
                    workingHistories[currentWorkingIndex]["canvasRect"];
                rectActions =
                    workingHistories[currentWorkingIndex]["rectAction"];
                ctx.putImageData(
                    workingHistories[currentWorkingIndex]["canvasObject"],
                    0,
                    0
                );

                backupCanvasObjects.push(
                    backupWorkingHistories[currentWorkingIndex]["canvasObject"]
                );
                backupCanvasRects =
                    backupWorkingHistories[currentWorkingIndex]["canvasRect"];
                backupCtx.putImageData(
                    backupWorkingHistories[currentWorkingIndex]["canvasObject"],
                    0,
                    0
                );

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                backupCtx.clearRect(
                    0,
                    0,
                    backupCanvas.width,
                    backupCanvas.height
                );
                redraw();
            }
        } else if (e.key.toUpperCase() == "Y") {
            if (workingHistories[currentWorkingIndex + 1]) {
                currentWorkingIndex++;
                canvasObjects.push(
                    workingHistories[currentWorkingIndex]["canvasObject"]
                );
                canvasRects =
                    workingHistories[currentWorkingIndex]["canvasRect"];
                rectActions =
                    workingHistories[currentWorkingIndex]["rectAction"];
                ctx.putImageData(
                    workingHistories[currentWorkingIndex]["canvasObject"],
                    0,
                    0
                );

                backupCanvasObjects.push(
                    backupWorkingHistories[currentWorkingIndex]["canvasObject"]
                );
                backupCanvasRects =
                    backupWorkingHistories[currentWorkingIndex]["canvasRect"];
                backupCtx.putImageData(
                    backupWorkingHistories[currentWorkingIndex]["canvasObject"],
                    0,
                    0
                );

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                backupCtx.clearRect(
                    0,
                    0,
                    backupCanvas.width,
                    backupCanvas.height
                );
                redraw();
            }
        } else if (e.key == "0") {
            currentScale = 1;
            ctx.scale(currentScale, currentScale);
            imageCtx.scale(currentScale, currentScale);
            backupCtx.scale(currentScale, currentScale);
            render();
        }
    } else {
        if (isObjectClick) {
            if (e.key.toUpperCase() == "Q") {
                let text = actionList[0];
                actionSelect(text);
            } else if (e.key.toUpperCase() == "W") {
                let text = actionList[1];
                actionSelect(text);
            } else if (e.key.toUpperCase() == "E") {
                let text = actionList[2];
                actionSelect(text);
            } else if (e.key.toUpperCase() == "R") {
                let text = actionList[3];
                actionSelect(text);
            } else if (e.key.toUpperCase() == "T") {
                let text = actionList[4];
                actionSelect(text);
            } else if (e.key.toUpperCase() == "Y") {
                let text = actionList[5];
                actionSelect(text);
            } else if (e.key.toUpperCase() == "U") {
                let text = actionList[6];
                actionSelect(text);
            } else if (e.key.toUpperCase() == "P") {
                let text = actionList[7];
                actionSelect(text);
            } else if (e.key.toUpperCase() == "A") {
                isAttach = true;
            } else if (e.key.toUpperCase() == "S") {
                isDetach = false;
            } else if (e.key.toUpperCase() == "DELETE") {
                canvasRects.forEach(function (v) {
                    if (Object.values(v) == selectedObject.join(",")) {
                        canvasRects.splice(canvasRects.indexOf(v), 1);
                        rectActions.splice(canvasRects.indexOf(v), 1);
                        alreadyUsedColors.splice(
                            alreadyUsedColors.indexOf(Object.keys(v)[0]),
                            1
                        );
                    }
                });

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                backupCtx.clearRect(
                    0,
                    0,
                    backupCanvas.width,
                    backupCanvas.height
                );

                redraw();
                addWorkingHistories();
            }
        }
    }
}

function wheelHandler(e) {
    let position = e.deltaY > 0 ? "DOWN" : "UP";

    if (isFunction) {
        e.preventDefault();
        if (position == "UP") {
            if (currentScale < 2) {
                currentScale = currentScale + 0.1;
                ctx.scale(currentScale, currentScale);
                imageCtx.scale(currentScale, currentScale);
                backupCtx.scale(currentScale, currentScale);

                render();
            }
        } else {
            if (currentScale > 0.2) {
                currentScale = currentScale - 0.1;
                ctx.scale(currentScale, currentScale);
                imageCtx.scale(currentScale, currentScale);
                backupCtx.scale(currentScale, currentScale);

                render();
            }
        }
        console.log("Current Zoom : " + Math.floor(currentScale * 100) + "%");
    }
}

function upHandler(e) {
    console.log(selectedObject);

    let endX = e.offsetX;
    let endY = e.offsetY;

    let width = endX - startX;
    let height = endY - startY;

    if (width != 0 && height != 0) {
        if (isClicked) {
            draw(e, true);
            canvasObjects.push(
                ctx.getImageData(0, 0, canvas.width, canvas.height)
            );
            backupCanvasObjects.push(
                backupCtx.getImageData(0, 0, canvas.width, canvas.height)
            );
            addWorkingHistories();
            isClicked = false;
        }
    } else {
        isClicked = false;
        let rectKeys = canvasRects.map(function (v) {
            return Object.keys(v)[0];
        });

        if (isAttach || isDetach) {
            let x =
                parseInt(selectedObject[0]) + parseInt(selectedObject[2]) / 2;
            let y =
                parseInt(selectedObject[1]) + parseInt(selectedObject[3]) / 2;

            let clickData = backupCtx.getImageData(endX, endY, 1, 1).data;
            let rgbString =
                "rgb(" +
                clickData[0] +
                "," +
                clickData[1] +
                "," +
                clickData[2] +
                ")";
            if (rectKeys.indexOf(rgbString) > -1) {
                let clickLocation = Object.values(
                    canvasRects[rectKeys.indexOf(rgbString)]
                )[0].split(",");
                let xx =
                    parseInt(clickLocation[0]) + parseInt(clickLocation[2]) / 2;
                let yy =
                    parseInt(clickLocation[1]) + parseInt(clickLocation[3]) / 2;
                if (isAttach) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(xx, yy);
                    ctx.stroke();
                } else if (isDetach) {
                }
            }
        } else {
            ctx.putImageData(
                workingHistories[currentWorkingIndex]["canvasObject"],
                0,
                0
            );

            let clickData = backupCtx.getImageData(endX, endY, 1, 1).data;
            let rgbString =
                "rgb(" +
                clickData[0] +
                "," +
                clickData[1] +
                "," +
                clickData[2] +
                ")";

            const tableAction = document
                .getElementById("draw-object")
                .querySelectorAll("tr");

            if (rectKeys.indexOf(rgbString) > -1) {
                isObjectClick = true;
                let clickLocation = Object.values(
                    canvasRects[rectKeys.indexOf(rgbString)]
                )[0].split(",");

                let x =
                    clickLocation[2] > -1
                        ? clickLocation[0]
                        : parseInt(clickLocation[0]) +
                          parseInt(clickLocation[2]);
                let y =
                    clickLocation[3] > -1
                        ? parseInt(clickLocation[1]) +
                          parseInt(clickLocation[3])
                        : clickLocation[1];
                let w = Math.abs(clickLocation[2]);
                let text = rectActions[rectKeys.indexOf(rgbString)];

                selectedObject = clickLocation;
                ctx.strokeStyle = "red";
                ctx.strokeRect(
                    clickLocation[0],
                    clickLocation[1],
                    clickLocation[2],
                    clickLocation[3]
                );
                ctx.fillStyle = "black";
                ctx.fillRect(x, y, w, 20);
                ctx.fillStyle = "white";
                ctx.font = "15px Arial";
                ctx.fillText(
                    text,
                    parseInt(x) + 3.5,
                    parseInt(y) + 12.5,
                    parseInt(w) - 7
                );
                ctx.font = "10px sans-serif";
                // document.getElementById("current-location").textContent =
                //     clickLocation;

                // 각 아이템의 인덱스값이 뭘까요...
                tableAction[0].classList.add("active");
            } else {
                isObjectClick = false;
                selectedObject = null;

                for (let i = 0; i < tableAction.length; i++) {
                    tableAction[i].classList.remove("active");
                }
            }
        }
    }
}

function moveHandler(e) {
    if (isClicked) {
        draw(e, false);
    } else {
    }
}

function clickHandler(e) {
    isClicked = true;
    startX = e.offsetX;
    startY = e.offsetY;
}

function canvasHandler() {
    canvas.addEventListener("mousedown", clickHandler);
    canvas.addEventListener("mousemove", moveHandler);
    canvas.addEventListener("mouseup", upHandler);
    canvas.addEventListener("wheel", wheelHandler);
    document.addEventListener("keydown", functionKeyHandler);
    document.addEventListener("keyup", clearFunctionKeyHandler);
    canvasObjects.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    backupCanvasObjects.push(
        ctx.getImageData(0, 0, canvas.width, canvas.height)
    );
    addWorkingHistories();
}

function srcImage() {
    const img = new Image();
    img.src = "../assets/images/01.png";
    img.onload = function () {
        img.width = img.width * currentScale;
        img.height = img.height * currentScale;
        document.getElementById("canvas").width = img.width;
        document.getElementById("canvas").height = img.height;
        document.getElementById("image-canvas").width = img.width;
        document.getElementById("image-canvas").height = img.height;
        document.getElementById("backup-canvas").width = img.width;
        document.getElementById("backup-canvas").height = img.height;
        imageCtx.drawImage(img, 0, 0, img.width, img.height);

        canvasHandler();
    };
}

function render() {
    srcImage();
}

window.onload = function () {
    console.log("canvas init");
    render();
};

/*
 * 이미지를 업로드하면
 * 메인 canvas에 이미지 백그라운드 달아주고
 * 서브 canvas 하나 생성해서 거기다가 원본 이미지 배치
 * back 전송용 데이터 컨버팅 할 때
 * rect 좌표 따서 서브 canvas에서 이미지 crop해서 데이터 따옴.
 *
 *
 *
 *
 * canvas내부에서 레이어만 나눠서 할 순 없나 ? -> 그냥 캔버스 n개 만들어서 하는걸로..
 * Ctrl + 마우스 휠 시 Zoom In, Zoom Out 동작 -> scale 조정 할 때 마다 캔버스 크기 및 이미지 * scale 해서 다시 렌더링
 */
