function saveToLocalStorage(name, variable) {
    window.localStorage[name] = JSON.stringify(variable);
}

function readFromLocalStorage(name) {
    var res = JSON.parse(window.localStorage[name] || null);
    return res;
}

function deleteFromLocalStorage(name) {
    window.localStorage[name] = null;
}

//commented because of duplicate in app.js
//function urlForImage(name) {
//    //var name = imageName.substr(imageName.lastIndexOf('/') + 1);
//    var trueOrigin = cordova.file.dataDirectory + name;
//    return trueOrigin;
//}


function dateToDateString(data) {
    var year = data.getFullYear();
    var month = data.getMonth() + 1;
    var day = data.getDate();

    var a = day + '/' + month + '/' + year;
    return a;
}

function dateToDateShortString(data) {
    var year = data.getFullYear().toString().substr(2,2);
    var month = data.getMonth() + 1;
    var day = data.getDate();

    var a = day + '/' + month + '/' + year;
    return a;
}

function dateToTimeString(data) {
    var hours = data.getHours();
    var minutes = data.getMinutes();

    var a = hours + ':' + minutes;
    return a;
}

function getNameFromUrl(data) {
    var name = data.split('/');
    return name[name.length - 1];
}

function getName(data) {
    var name = data.split('.');
    return name[0];
}
function isLocal(data) {
    if (data.split('/').length > 1)
        return false;
    else return true;
}

function makeImagesObj(images) {
    var arr = [];
    var obj = {};
    for (i = 0; i < images.length; i++) {
        obj.SRC = images[i];
        arr.push(JSON.parse(JSON.stringify(obj)));
    }
    return arr;
}

function stableSort(v) {
    var dv = [];
    for (var i = 0; i < v.length; i++)
        dv[i] = [v[i], i];
    dv.sort(function (a, b) {
        var aD = Date.parse(a[0].Date);
        var bD = Date.parse(b[0].Date)
        if (aD > bD)
            return -1
        if (aD < bD)
            return 1
        return 0
    });
    for (var i = 0; i < v.length; i++)
        v[i] = dv[i][0];
}