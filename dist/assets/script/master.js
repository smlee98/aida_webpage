// 파일 현재 필드 숫자 totalCount랑 비교값
var fileCount = 0;
// 해당 숫자를 수정하여 전체 업로드 갯수를 정한다.
var totalCount = 10;
// 파일 고유넘버
var fileNum = 0;
// 첨부파일 배열
var content_files = new Array();
// 파일 사이즈
var fileSize = 0;
// 파일 총 사이즈
var totalSize = 0;

// 정규식 관련
var htmlReg = /(.*?)\.(html)$/;
var cssReg = /(.*?)\.(css)$/;
var jsReg = /(.*?)\.(js)$/;

function fileCheck(e) {
    var files = e.target.files;

    // 파일 배열 담기
    var filesArr = Array.prototype.slice.call(files);

    // 파일 개수 확인 및 제한
    if (fileCount + filesArr.length > totalCount) {
        alert("파일은 최대 " + totalCount + "개까지 업로드 할 수 있습니다.");
        return false;
    } else {
        fileCount = fileCount + filesArr.length;
    }

    // 각각의 파일 배열담기 및 기타
    filesArr.forEach(function (f) {
        var reader = new FileReader();
        reader.onload = function (e) {
            content_files.push(f);

            if (f.name.match(htmlReg)) {
                if ($("#stat-html").hasClass("bg-danger")) {
                    $("#stat-html").removeClass("bg-danger");
                    $("#stat-html").addClass("bg-success");
                }
            } else if (f.name.match(cssReg)) {
                if ($("#stat-css").hasClass("bg-danger")) {
                    $("#stat-css").removeClass("bg-danger");
                    $("#stat-css").addClass("bg-success");
                }
            } else if (f.name.match(jsReg)) {
                if ($("#stat-js").hasClass("bg-danger")) {
                    $("#stat-js").removeClass("bg-danger");
                    $("#stat-js").addClass("bg-success");
                }
            }

            if (f.size < 1024) {
                fileSize = f.size + "Byte";
            } else if (f.size < 1048576) {
                fileSize = (f.size / 1024).toFixed(2) + "KB";
            } else {
                fileSize = (f.size / 1024 / 1024).toFixed(2) + "MB";
            }

            $("#dropbox").append(
                '<li class="list-group-item" id="file' +
                    fileNum +
                    '">' +
                    '<i class="bi bi-paperclip mr-1"></i>' +
                    '<span class="attach-title">' +
                    f.name +
                    " (" +
                    fileSize +
                    ")</span>" +
                    '<i class="bi bi-x text-danger"" onclick="fileDelete(\'file' +
                    fileNum +
                    "')\"></i>" +
                    "</li>"
            );
            totalSize += f.size;
            $("span#nowsize").html((totalSize / 1024 / 1024).toFixed(2) + "MB");
            fileNum++;
        };
        reader.readAsDataURL(f);
    });

    //초기화 한다.
    $("#input-attach").val("");
}

// 파일 부분 삭제 함수
function fileDelete(fileNum) {
    var no = fileNum.replace(/[^0-9]/g, "");
    content_files[no].is_delete = true;

    var target = $("#" + fileNum);

    if (target.text().split(" ")[0].match(htmlReg)) {
        if ($("#stat-html").hasClass("bg-success")) {
            $("#stat-html").removeClass("bg-success");
            $("#stat-html").addClass("bg-danger");
        }
    } else if (target.text().split(" ")[0].match(cssReg)) {
        if ($("#stat-css").hasClass("bg-success")) {
            $("#stat-css").removeClass("bg-success");
            $("#stat-css").addClass("bg-danger");
        }
    } else if (target.text().split(" ")[0].match(jsReg)) {
        if ($("#stat-js").hasClass("bg-success")) {
            $("#stat-js").removeClass("bg-success");
            $("#stat-js").addClass("bg-danger");
        }
    }

    target.remove();

    totalSize -= content_files[no].size;
    $("span#nowsize").html((totalSize / 1024 / 1024).toFixed(2) + "MB");

    fileCount--;
    console.log(content_files);
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
