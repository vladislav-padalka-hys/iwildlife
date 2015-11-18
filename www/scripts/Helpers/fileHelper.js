var fileHelp = angular.module('fileHelp', []).factory('fileHelper', ['$http', '$rootScope', '$cordovaFile', '$ionicPlatform', '$q',
    function ($http, $rootScope, $cordovaFile, $ionicPlatform, $q) {


        function saveToFile(object, filename) {

            $ionicPlatform.ready(function () {

                try {

                    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
                        dir.getFile(filename, { create: true }, function (file) {
                            console.log("got the file for write" + JSON.stringify(file));

                            file.createWriter(function (fileWriter) {

                                fileWriter.onwriteend = function (e) {
                                    console.log('Write completed.');
                                    return true;
                                };
                                fileWriter.onerror = function (e) {
                                    console.log('Write failed: ' + e.toString());
                                    return false;
                                };
                                fileWriter.write(JSON.stringify(object));

                            }, fail);
                        },fail);
                    });

                    function fail(error) {
                        console.log(error.code);
                        defer.reject(error);
                    }


                    /*

                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

                    function gotFS(fileSystem) {
                        fileSystem.root.getFile(filename, { create: true }, gotFileEntry, fail);
                    }

                    function gotFileEntry(fileEntry) {
                        fileEntry.createWriter(gotFileWriter, fail);
                    }

                    function gotFileWriter(writer) {
                        writer.onwriteend = function (e) {                            
                            console.log('Write completed.');
                            return true;
                        };
                        writer.onerror = function (e) {
                            console.log('Write failed: ' + e.toString());
                            return false;
                        };
                        writer.write(JSON.stringify(object));
                    }

                    function fail(error) {
                        console.log(error.code);
                    }

                    */
                }
                catch (e) {
                    console.log(e.toString());
                    return false;
                }
            })
        }

        function readFromFile(filename) {

            var defer = $q.defer();

            $ionicPlatform.ready(function () {

                try {

                    window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
                        dir.getFile(filename, null, function (file) {
                            console.log("got the file for read" + JSON.stringify(file));

                            file.file(function (file) {
                                var reader = new FileReader();

                                reader.onloadend = function (e) {
                                    console.log("got result from file");
                                    defer.resolve(this.result);
                                };

                                reader.readAsText(file);

                            }, fail);
                        },fail);
                    });

                   function fail(error) {
                        console.log(error.code);
                        defer.reject(error);
                    }

                    /*

                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

                    function gotFS(fileSystem) {
                        fileSystem.root.getFile(filename, {}, gotFileEntry, fail);
                    }

                    function gotFileEntry(fileEntry) {
                        fileEntry.file(function (file) {
                            var reader = new FileReader();

                            reader.onloadend = function (e) {
                                console.log(this.result);

                                defer.resolve(this.result);
                            };

                            reader.readAsText(file);
                        })
                    }

                    function fail(error) {
                        console.log(error.code);
                        defer.reject(error);
                    }

                    */
                }
                catch (e) {
                    console.log(e.toString());
                    defer.reject(e);
                }
            });

            return defer.promise;
        }

        return {
            readFromFile: readFromFile,
            saveToFile: saveToFile
        }

    }])