var taskService = angular.module('taskSvc', []).factory('taskService', ['$http', '$rootScope', '$q', '$cordovaFileTransfer', function ($http, $rootScope, $q, $cordovaFileTransfer) {
    

    /*
    task:{
        type:'data' / 'img',
        method:'',
        url:'',
        data:{},
        subTask:{}
    }
    */
    var guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
        }
        return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
    };

    var saveTaskList = function () {
        saveToLocalStorage('tasklist', this.tasklist);
    };

    var addTask = function (task) {
        if (!this.tasklist)
        {
            this.tasklist = [];
        }
        this.tasklist.push(task);
        saveTaskList();
    };

    var doTask = function (i) {
        var defer = $q.defer();
        if (this.tasklist[i]) {
            if (this.tasklist[i].type == 'data')
                this.doDataTask(i).then(function (data) {
                    defer.resolve(data);
                });
            else {
                this.doImgTask(i).then(function (data) {
                    defer.resolve(data);
                });
            }
        }
        return defer.promise;
    };

    var doDataTask = function (i) {
        var defer = $q.defer();

        var reqPF = {
            method: this.tasklist[i].method,
            url: $rootScope.baseURL + this.tasklist[i].url,
            headers: $rootScope.headers,
            data: this.tasklist[i].data
        };

        var curThis = this;

        $http(reqPF)
        .success(function (data, status, headers, config) {
            if (curThis.tasklist[i].subTask)
                if (curThis.tasklist[i].subTask.type == "img") {
                    curThis.tasklist.push(curThis.tasklist[i].subTask);
                }
                else {
                    if (curThis.tasklist[i].subTask.length > 1) {
                        for (var k = 0; k < curThis.tasklist[i].subTask.length; k++)
                            curThis.tasklist.push(curThis.tasklist[i].subTask[k]);
                    }
                    else if (curThis.tasklist[i].subTask.length == 1) {
                        curThis.tasklist.push(curThis.tasklist[i].subTask);
                    }
                }
            curThis.tasklist[i] = null;
            curThis.save();
            defer.resolve(data);
        })
        .error(function (data, status, headers, config) {
            //if (status == 0) $rootScope.showAlertPopup("Check your Internet connection", false);
            //else if (status == 400) $rootScope.showAlertPopup("Bad Request", false);
            //else if (status == 401) $rootScope.showAlertPopup("Authorization Problem", false);
            //else if (status == 500) $rootScope.showAlertPopup('Internal Server Error', false);
            //else $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
            defer.reject({ status: status, answer: data });
        });

        return defer.promise;
    };

    var doImgTask = function (i) {
        var options = new FileUploadOptions();
        
        var curThis = this;
        var defer = $q.defer();

        if (this.tasklist[i].length && this.tasklist[i].length > 0) {
            for (var j = 0; j < this.tasklist[i].length; j++) {
                options.headers = $rootScope.headers;
                options.fileName = this.tasklist[i][j].data.fillename;
                $cordovaFileTransfer.upload($rootScope.baseURL + this.tasklist[i][j].url, this.tasklist[i][j].data.filepath, options).then(function (result) {
                    if (curThis.tasklist[i][j])
                        if (curThis.tasklist[i][j].subTask)
                        for (var k = 0; k < curThis.tasklist.subTask.length; k++)
                            curThis.tasklist.push(curThis.tasklist[i][j].subTask[k]);
                    curThis.tasklist[i][j] = null;
                    curThis.save();
                    defer.resolve(result);
                }, function (err) {
                    console.log('error, photo was not uploaded:');
                    console.log(JSON.stringify(err));
                    defer.reject({ success: false, index: i });
                }, function (progress) {
                    // constant progress updates
                });
            }
        }
        else {
            options.headers = $rootScope.headers;
            options.fileName = this.tasklist[i].data.fillename;
            $cordovaFileTransfer.upload($rootScope.baseURL + this.tasklist[i].url, this.tasklist[i].data.filepath, options).then(function (result) {
                if (curThis.tasklist[i].subTask)
                    for (var k = 0; k < curThis.tasklist.subTask.length; k++)
                        curThis.tasklist.push(curThis.tasklist[i].subTask[k]);
                curThis.tasklist[i] = null;
                curThis.save();
                defer.resolve(result);
            }, function (err) {
                console.log('error, photo was not uploaded:');
                console.log(JSON.stringify(err));
                defer.reject({ success: false, index: i });
            }, function (progress) {
                // constant progress updates
            });
        }

        return defer.promise;
    };

    var createDataTask = function (method, url, data) {
        var task = {
            type: 'data',
            method: method,
            url: url,
            data: data,
            subTask: null
        }
        return task;
    };

    var createImgTask = function (url, filename, filepath) {
        var task = {
            type: 'img',
            url: url,
            data: {
                fillename: filename,
                filepath: filepath
            },
            subTask: null
        }
        return task;
    };

    return {

        tasklist: [],

        temporalData: {},

        guid: guid,

        doTask: doTask,

        addTask: addTask,

        save: saveTaskList,

        doDataTask: doDataTask,

        doImgTask:doImgTask,

        createDataTask: createDataTask,

        createImgTask: createImgTask

    }
}])