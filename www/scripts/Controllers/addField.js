angular.module('addFieldCtrlMd', ['ui.router'])

.controller('addFieldCtrl', function ($scope, $rootScope, $translate, $state, $filter, Camera, $cordovaFile, apiConnection, taskService, fileHelper, $ionicActionSheet) {
    //$scope.newField = {};
    //$scope.newField.Name = "";
    //$scope.newField.Note = "";
    //$scope.newField.address = "";
    //$scope.newField.Image = {};
    //$scope.newField.Image.SRC = "";

    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.fieldValuesInvalid = false;
    });

    $('#address').autocomplete({
        source: function (request, response) {
            apiConnection.autocomplete(request.term).then(function (data) {
                if (data.success) {
                    $scope.autocompleteData = data;
                    var names = [];
                    for (i = 0; i < data.length; i++) {
                        names.push(data[i].place);
                    }
                    response(names);
                }
                else
                    response([]);
            });
        },
        select: function (event, ui) {
            for (i = 0; i < $scope.autocompleteData.length; i++) {
                if ($scope.autocompleteData[i].place == ui.item.value) {
                    $scope.newField.address = ui.item.value;
                    $scope.newField.longtitude = $scope.autocompleteData[i].coord.lng;
                    $scope.newField.latitude = $scope.autocompleteData[i].coord.lat;
                    //$scope.newField.location = $scope.autocompleteData[i].coord;
                }
            }
        },
        appendTo: "#popup"
    })

    $scope.returnToDashboard = function () {
        $rootScope.form.close();
        //$state.go($state.current, {}, { reload: true });
    }

    $scope.deleteImage = function () {
        $scope.newField.Image.SRC = "";
    }

    //$scope.images = window.localStorage.getItem("images") == null ? [] : JSON.parse(window.localStorage.getItem("images"));




    //apiConnection.postField($scope.newField).then(function (data) {
    //    $scope.newField.id = data.value;
    //    $rootScope.fields.push($scope.newField);
    //    window.localStorage.setItem("fields", JSON.stringify($rootScope.fields));
    //    alert(JSON.stringify($rootScope.fields));
    //    apiConnection.uploadFieldPhotos($rootScope.urlForImage($scope.newField.defaultImage), $scope.newField.defaultImage, $scope.newField.id, 0).then(function (data) {
    //        if (!data.success) {
    //            alert("Failed photo #" + data.index);
    //        }

    //    });
    //    for (var i = 0; i < $scope.newField.images.length; i++) {
    //        apiConnection.uploadFieldPhotos($rootScope.urlForImage($scope.newField.images[i]), $scope.newField.images[i], $scope.newField.id, i+1).then(function (data) {
    //            if (!data.success) {
    //                alert("Failed photo #" + data.index);
    //            }

    //        });
    //    }
    //});

    var $trans = $filter('translate');

    // $scope.addImage = function () {

    //     var hideSheet = $ionicActionSheet.show({
    //         buttons: [
    //            { text: $trans("choose_from_galery") },
    //            { text: $trans("take_photo") }
    //         ],
    //         titleText: $trans("add_field_pic"),
    //         cancelText: $trans("dpCancel"),
    //         cancel: function () {
    //             hideSheet();
    //             // add cancel code..
    //         },
    //         buttonClicked: function (index) {
    //             var options;
    //             if (index == 0) {
    //                 options = {
    //                     sourceType: 0,
    //                     correctOrientation: true
    //                 };
    //             }
    //             else {
    //                 options = { correctOrientation: true };
    //             }
    //             hideSheet();
    //             $scope.takeImage(options);
    //         }
    //     });

    // }

    // $scope.takeImage = function (options) {
    //     // 2
    //     //var options = {
    //     //    destinationType: Camera.DestinationType.FILE_URI,
    //     //    sourceType: Camera.PictureSourceType.CAMERA, // Camera.PictureSourceType.PHOTOLIBRARY
    //     //    allowEdit: false,
    //     //    encodingType: Camera.EncodingType.JPEG,
    //     //    popoverOptions: CameraPopoverOptions,
    //     //};

    //     // 3
    //     if ($scope.newField.Image.SRC == "") {

    //         Camera.getPicture(options).then(function (imageData) {

    //             // 4
    //             onImageSuccess(imageData);

    //             function onImageSuccess(fileURI) {
    //                 createFileEntry(fileURI);
    //                 console.log(JSON.stringify(fileURI));
    //             }

    //             function createFileEntry(fileURI) {
    //                 window.resolveLocalFileSystemURL(fileURI, copyFile, fail);
    //             }

    //             // 5
    //             function copyFile(fileEntry) {
    //                 var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
    //                 var newName = makeid() + name;
    //                 console.log(JSON.stringify(fileEntry));
    //                 window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (fileSystem2) {
    //                     fileEntry.copyTo(
    //                     fileSystem2,
    //                     newName,
    //                     onCopySuccess,
    //                     fail
    //                     );
    //                 },
    //                 fail);
    //             }

    //             // 6
    //             function onCopySuccess(entry) {
    //                 $scope.$apply(function () {
    //                     // if ($scope.newField.Image.SRC == "")
    //                     $scope.newField.Image.SRC = entry.name;
    //                     //else $scope.newField.images.push(entry.name);
    //                 });
    //             }

    //             function fail(error) {
    //                 console.log("fail: " + error.code);
    //             }

    //             function makeid() {
    //                 var text = "";
    //                 var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    //                 for (var i = 0; i < 5; i++) {
    //                     text += possible.charAt(Math.floor(Math.random() * possible.length));
    //                 }

    //                 return text;
    //             }

    //         }, function (err) {
    //             console.log(err);
    //         });
    //     }

    //     else {
    //         alert("Only one cover image allowed");
    //         //$rootScope.showAlertPopup("Only one cover image allowed", false);
    //     }

    // }


        $scope.saveField = function() {
            if ($rootScope.selectedField) {

                var putFunc = function () {
                    apiConnection.putField($rootScope.selectedField).then(function (data) {

                        alert("Field successfully changed");

                        fileHelper.saveToFile($rootScope.fields, "fields.json");

                        apiConnection.getWeather($rootScope.selectedField.FieldId).then(function (result) {

                            $rootScope.selectedField.weather = result.data
                            fileHelper.saveToFile($rootScope.fields, "fields.json");

                        }, function (status, answer) {

                        });

                        /*IMAGE EDITING*/  /////////////////////////////////////////////////////////////////////////////////////////////////////
                        /*
                        if ($scope.newField.Image.SRC && $scope.newField.Image.SRC != "")
                            apiConnection.uploadFieldPhotos($rootScope.urlForImage($scope.newField.Image.SRC), $scope.newField.Image.SRC, $scope.newField.FieldId, 0).then(function (data) {
                                if (!data.success) {
                                    alert("failed photo #" + data.index);
                                }
                            });
                        */  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                        //$state.go('dashboard');
                        //$rootScope.form.close();
                    }, function (status, answer) {
                        alert("Got an error while trying to change field. Status:" + JSON.stringify(status));
                        var data = {
                            Name: $rootScope.selectedField.Name,
                            Note: $rootScope.selectedField.Note,
                            //Date: $rootScope.selectedField.Date,
                            longtitude: $rootScope.selectedField.longtitude,
                            latitude: $rootScope.selectedField.latitude,
                            Coordinates: $rootScope.selectedField.Coordinates
                        }
                        var task = taskService.createDataTask('PUT', '/api/Fields' + $rootScope.selectedField.FieldId, data);

                        /*IMAGE EDITING*/ ///////////////////////////////////////////////////////////////////////////////////////////////////
                        /*
                        if ($scope.newField.Image.SRC && $scope.newField.Image.SRC != "") {
                            var imagesSubtask = taskService.createImgTask('/api/upload/field/' + $scope.newField.FieldId, $scope.newField.Image.SRC, $rootScope.urlForImage($scope.newField.Image.SRC));
                            task.subTask = imagesSubtask;
                        }
                        */ /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                        taskService.addTask(task);
                        fileHelper.saveToFile($rootScope.fields, "fields.json");

                        //$state.go('dashboard');
                        //$rootScope.form.close();
                    });
                }

                //if ($scope.polygonLayer) {
                //    $scope.fieldCenter = $scope.polygonLayer.getBounds().getCenter();
                //    $rootScope.selectedField.Coordinates = $scope.polygonLayer.getLatLngs();
                //}
                //$scope.interactionWithDOM();

                $rootScope.selectedField.Name = $scope.field.name;
                $rootScope.selectedField.Note = $scope.field.note;
                //$rootScope.selectedField.longtitude = $scope.fieldCenter.lng;
                //$rootScope.selectedField.latitude = $scope.fieldCenter.lat;
                putFunc();
                //alert(JSON.stringify($rootScope.selectedField));


                //$scope.$apply(function () {
                //$scope.creating = false;
                //});
                //$scope.isPolygonButtonClicked = false;

            } else {
                //$scope.newField.Coordinates = $scope.polygonLayer.getLatLngs();

                $scope.newField.Name = $scope.field.name;
                $scope.newField.Note = $scope.field.note;
                //console.log($scope.fieldCenter);
                //$scope.newField.longtitude = $scope.fieldCenter.lng;
                //$scope.newField.latitude = $scope.fieldCenter.lat;
                $scope.newField.Date = (new Date()).toISOString();
                $scope.newField.FieldId = taskService.guid();
                $scope.newField.Owner = {};
                $scope.newField.Owner.UserName = $rootScope.currUser.UserName;
                $rootScope.fields.push($scope.newField);
                apiConnection.postField($scope.newField).then(function (data) {
                    fileHelper.saveToFile($rootScope.fields, "fields.json");

                    apiConnection.getWeather($scope.newField.FieldId).then(function (result) {
                        var fieldIndex = null;
                        for (var indexF = 0; indexF < $rootScope.fields.length; indexF++) {
                            if ($rootScope.fields[indexF].FieldId == result.fieldId) {
                                fieldIndex = indexF;
                                break;
                            }
                        }
                        $rootScope.fields[fieldIndex].weather = result.data
                        fileHelper.saveToFile($rootScope.fields, "fields.json");

                    }, function (status, answer) {

                        //saveToFile("fields", $rootScope.fields);
                    });
                    if ($scope.newField.Image.SRC && $scope.newField.Image.SRC != "")
                        apiConnection.uploadFieldPhotos($rootScope.urlForImage($scope.newField.Image.SRC), $scope.newField.Image.SRC, $scope.newField.FieldId, 0).then(function (data) {
                            if (!data.success) {
                                alert("failed photo #" + data.index);
                            }
                        });

                    //$state.go('dashboard');
                    //$rootScope.form.close();
                }, function (status, answer) {
                    var data = {
                        Name: $scope.newField.Name,
                        Note: $scope.newField.Note,
                        Date: $scope.newField.Date,
                        longtitude: $scope.fieldCenter.lng,
                        latitude: $scope.fieldCenter.lat,
                        Coordinates: $scope.newField.Coordinates,
                        FieldId: $scope.newField.FieldId
                    }
                    var task = taskService.createDataTask('POST', '/api/Fields', data);
                    if ($scope.newField.Image.SRC && $scope.newField.Image.SRC != "") {
                        var imagesSubtask = taskService.createImgTask('/api/upload/field/' + $scope.newField.FieldId, $scope.newField.Image.SRC, $rootScope.urlForImage($scope.newField.Image.SRC));
                        task.subTask = imagesSubtask;
                    }
                    taskService.addTask(task);

                    fileHelper.saveToFile($rootScope.fields, "fields.json");

                    //$state.go('dashboard');
                    //$rootScope.form.close();
                });
                $rootScope.selectedField = $rootScope.fields[$rootScope.fields.length - 1];
                $rootScope.selectedField.Sightings = ($rootScope.selectedField.Sightings) ? $rootScope.selectedField.Sightings : [];
                $scope.creating = false;

                $scope.drawnItems.clearLayers(); //to avoid polygons overlay when map is reloaded 
                $state.go($state.current, {}, { reload: true });
            }
        };
        //$scope.postFieldImage = function (fieldId, imageName, i) {
        //    apiConnection.uploadFieldPhotos($rootScope.urlForImage(imageName), imageName, fieldId, i).then(function (data) {
        //        if (!data.success) {
        //            alert("Failed photo #" + data.index);
        //        }

        //    });
        //}
    });