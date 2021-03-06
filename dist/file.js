"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path = __importStar(require("path"));
function GetFileList(dir) {
    var filelist = [];
    var files = fs_1.default.readdirSync(dir);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var name = files_1[_i];
        var fullname = path.join(dir, name);
        var fi = void 0;
        try {
            fi = fs_1.default.statSync(fullname);
        }
        catch (_a) {
            continue;
        }
        if (fi.isFile() || fi.isDirectory()) {
            var url = name;
            if (fi.isDirectory())
                url += "/";
            filelist.push(url);
        }
    }
    return filelist;
}
exports.GetFileList = GetFileList;
function ReadDir(path) {
    var info = { is_dir: true, name: path, subs: [] };
    var dirs = fs_1.default.readdirSync(path, { withFileTypes: true });
    var subs = info.subs;
    for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
        var dir = dirs_1[_i];
        if (dir.isDirectory()) {
            subs.push(ReadDir(path + "/" + dir.name));
        }
        else if (dir.isFile()) {
            subs.push({ is_dir: false, name: dir.name });
        }
    }
    return info;
}
exports.ReadDir = ReadDir;
function ReplaceByFunction(src, replaceFunc, dest) {
    if (dest === void 0) { dest = src; }
    var content = fs_1.default.readFileSync(src).toString();
    var newContent = replaceFunc(content);
    if (src == dest && newContent == content) {
        return;
    }
    fs_1.default.writeFileSync(dest, newContent);
}
exports.ReplaceByFunction = ReplaceByFunction;
/**
 * 保留文件内容中搜索出的部分
 * @param src
 * @param regExp
 * @param separatorChars
 * @param dest
 */
function Remain(src, regExp, separatorChars, dest) {
    if (separatorChars === void 0) { separatorChars = "\n"; }
    if (dest === void 0) { dest = src; }
    var re = new RegExp(regExp, "mg");
    ReplaceByFunction(src, function (content) {
        var results = content.match(re);
        return results ? results.join(separatorChars) : content;
    }, dest);
}
exports.Remain = Remain;
/**
 * 替代文件中搜索出的文本内容
 * @param file 原始文件
 * @param searchValue 搜索的字符串或正则
 * @param replaceValue 替换的内容
 * @param destFile 替换后存储的文件位置,默认是源文件
 */
function Replace(file, searchValue, replaceValue, destFile) {
    if (destFile === void 0) { destFile = file; }
    ReplaceByFunction(file, function (content) {
        return content.replace(searchValue, replaceValue);
    });
}
exports.Replace = Replace;
var TAIL_TOKEN = 399246574;
/**
 * 合并两个文件
 * @param file1
 * @param file2
 * @param destFile 合并后文件的存储位置,默认是文件1
 * @param withTail 写入额外长度信息,方便分离合并后的文件
 */
function Merge(file1, file2, destFile, withTail) {
    if (destFile === void 0) { destFile = file1; }
    if (withTail === void 0) { withTail = true; }
    if (destFile == file2) {
        return false;
    }
    if (destFile != file1) {
        fs_1.default.copyFileSync(file1, destFile);
    }
    var data = fs_1.default.readFileSync(file2);
    fs_1.default.appendFileSync(destFile, data);
    if (withTail) {
        var tail = new Int32Array(2);
        tail[0] = TAIL_TOKEN;
        tail[1] = fs_1.default.statSync(file1).size;
        fs_1.default.appendFileSync(destFile, tail);
    }
    return true;
}
exports.Merge = Merge;
function UnMerge(file, file1, file2) {
    if (file == file1 || file == file2)
        return -1;
    var fd = fs_1.default.openSync(file, "r");
    var sizes = getUnMergeSize(fd);
    var ret = 0;
    if (sizes.length == 2) {
        copyFd(fd, 0, sizes[0], file1);
        copyFd(fd, sizes[0], sizes[1], file2);
    }
    else {
        ret = -2;
    }
    fs_1.default.closeSync(fd);
    return ret;
}
exports.UnMerge = UnMerge;
function getUnMergeSize(fd) {
    var sizes = [];
    var size = fs_1.default.fstatSync(fd).size;
    if (size < 2 * 4) {
        return sizes;
    }
    var buff = new Int32Array(2);
    fs_1.default.readSync(fd, buff, 0, 2 * 4, size - 2 * 4);
    if (buff[0] != TAIL_TOKEN) {
        return sizes;
    }
    var file1Len = buff[1];
    if (file1Len < 0 || file1Len > size - 2 * 4) {
        return sizes;
    }
    return [file1Len, size - 2 * 4 - file1Len];
}
function copyFd(fd, offset, length, file) {
    var buff = new Uint8Array(length);
    fs_1.default.readSync(fd, buff, 0, length, offset);
    fs_1.default.writeFileSync(file, buff);
}
function test1() {
    Remain("e:/1.txt", "^module (A1|B1){[\\s\\S]*?^}$", "e:/2.txt");
}
function test2() {
    Merge("e:/1.txt", "e:/2.txt", "e:/3.m");
    UnMerge("e:/3.m", "e:/1_.txt", "e:/2_.txt");
}
//test1();
//test2();
//ReadDir('e:/docs/2018')
//# sourceMappingURL=file.js.map