angular.module('editFieldCtrlMd', ['ui.router'])

.controller('editFieldCtrl', function ($scope, $rootScope,$timeout, $translate, $state, $filter, Camera, $cordovaFile, apiConnection, taskService, fileHelper, $ionicActionSheet) {

    //$scope.$on('$ionicView.loaded', function () {
    //    //$scope.fieldValuesInvalid = false;
    //    
    //});

    var $trans = $filter('translate');

    //$rootScope.setCurFieldValues = function () {
    //    $scope.field.name = $rootScope.selectedField.Name;
    //    $scope.field.note = $rootScope.selectedField.Note;
    //};



    $(document).ready(function () {
        console.log("ready!");
        $rootScope.testScope = {
            name: $rootScope.selectedField.Name,
            note: $rootScope.selectedField.Note
        };
        $scope.curImage = JSON.parse(JSON.stringify($rootScope.selectedField.Image));
        //console.log(JSON.stringify($rootScope.testScope));
        //$scope.field.name = $rootScope.selectedField.Name;
        //$scope.field.note = $rootScope.selectedField.Note;
    });

    $scope.returnToFieldDetails = function () {
        $rootScope.form.close();
        //$state.go($state.current, {}, { reload: true });
    }

    $scope.deleteImage = function () {
        $scope.curImage.SRC = "";
    }
    $scope.actionSheetShown = false;
    $scope.addImage = function () {
        if ($scope.actionSheetShown) {
            $scope.actionSheetShown = !$scope.actionSheetShown;
            $scope.actionSheet();
            return;
        }
        $scope.actionSheetShown = !$scope.actionSheetShown;
        $scope.actionSheet = $ionicActionSheet.show({
            buttons: [
              { text: $trans("choose_from_galery") },
              { text: $trans("take_photo") }
            ],
            titleText: $trans("add_field_pic"),
            cancelText: $trans("dpCancel"),
            cancel: function () {
                $scope.actionSheet();
                // add cancel code..
            },
            buttonClicked: function (index) {
                var options;
                if (index == 0) {
                    options = {
                        sourceType: 0,
                        correctOrientation: true
                    };
                }
                else {
                    options = { correctOrientation: true };
                }
                $scope.takeImage(options);
                $scope.actionSheet();
            }
        });
    }

    $scope.takeImage = function (options) {

        navigator.camera.getPicture(function (imageData) {
            var a = apiConnection.saveToDevice(imageData).then(function (data) {
                $scope.curImage = {};
                $scope.curImage.SRC = data;
            });
        }, function (err) {
            console.log(err);
        }, options);

        //Camera.getPicture(options).then(function (imageData) {
        //    var a = apiConnection.saveToDevice(imageData).then(function (data) {
        //        $scope.newPOIImages.push(data);
        //        //alert('lox');
        //        // alert(JSON.strigify(data));
        //    });
        //}, function (err) {
        //    console.log(err);
        //});
    }

    $scope.deleteField = function () {
        $rootScope.$broadcast('loading:show');

        $rootScope.showAlertPopup($trans("delete_field_popup_title"), true, deleteConfirmed);
    }

    var deleteConfirmed = function () {
        $rootScope.form.close();
        $(".custom-popup").remove();

        var ind = $rootScope.fields.indexOf($rootScope.selectedField);
        $rootScope.fields.splice(ind, 1);

        fileHelper.saveToFile($rootScope.fields, 'fields.txt');

        apiConnection.deleteField($rootScope.selectedField).then(function(data) { 
        }, function (data) {
            var data = { };
            var url = '/odata/Fields/' + $rootScope.selectedField.FieldId;
            var task = taskService.createDataTask('DELETE', url, data);
            taskService.addTask(task);
        });
        $state.go('dashboard');

        $rootScope.showAlertPopup($trans("field_delete_success"), false);
    }

    $rootScope.saveEditedField = function () {

        var putFunc = function () {
            apiConnection.putField($rootScope.selectedField).then(function (data) {

                fileHelper.saveToFile($rootScope.fields, "fields.json");

                /*IMAGE EDITING*/  /////////////////////////////////////////////////////////////////////////////////////////////////////
                //There is a new Image
                if ($scope.curImage && $scope.curImage.SRC) {
                    if (($rootScope.selectedField.Image && $rootScope.selectedField.Image.SRC != null && $scope.curImage.SRC != $rootScope.selectedField.Image.SRC) ||
                    (!$rootScope.selectedField.Image && $scope.curImage && $scope.curImage.SRC)) {
                        apiConnection.uploadFieldPhotos($rootScope.urlForImage($scope.curImage.SRC), $scope.curImage.SRC, $rootScope.selectedField.FieldId, 0).then(function (data) {
                            if (!data.success) {
                                console.log("failed to update photo");
                            }
                            else {
                                console.log("successfully changed field photo");
                        }
                    });
                }
                }
                else if ($rootScope.selectedField.Image && $rootScope.selectedField.Image.SRC && $rootScope.selectedField.Image.SRC !="") {
                    apiConnection.deleteFieldPhoto($rootScope.selectedField).then(function (data) {
                        console.log("successfully deleted field photo");
                    }, function (data) {
                        console.log("failed to delete field photo");
                });
            }
                $rootScope.selectedField.Image = JSON.parse(JSON.stringify($scope.curImage));
                ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            }, function (status, answer) {
                    console.log("Got an error while trying to change field. Status:" +JSON.stringify(status));
                    var data = {
                            Name: $rootScope.selectedField.Name,
                            Note: $rootScope.selectedField.Note,
                            Date: $rootScope.selectedField.Date,
                            latitude: $rootScope.selectedField.latitude,
                            longtitude: $rootScope.selectedField.longtitude,
                            Coordinates: $rootScope.selectedField.Coordinates,
                            FieldId: $rootScope.selectedField.FieldId
            }
                var task = taskService.createDataTask('PUT', '/api/Fields/' +$rootScope.selectedField.FieldId, JSON.stringify(data));

                /*IMAGE EDITING*/ ///////////////////////////////////////////////////////////////////////////////////////////////////
                    if ($scope.curImage && $scope.curImage.SRC) {
                        if (($rootScope.selectedField.Image && $rootScope.selectedField.Image.SRC != null && $scope.curImage.SRC != $rootScope.selectedField.Image.SRC) ||
                        (!$rootScope.selectedField.Image && $scope.curImage && $scope.curImage.SRC)) {
                            var imagesSubtask = taskService.createImgTask('/api/upload/field/' +$rootScope.selectedField.FieldId, $scope.curImage.SRC, $rootScope.urlForImage($scope.curImage.SRC));
                            task.subTask = imagesSubtask;
                    }
                    }
                    else if ($rootScope.selectedField.Image && $rootScope.selectedField.Image.SRC && $rootScope.selectedField.Image.SRC != "") {
                        var sub = taskService.createDataTask('DELETE', '/api/Fields/Photo/' +$rootScope.selectedField.FieldId);
                        task.subTask = sub;
            }
                $rootScope.selectedField.Image = JSON.parse(JSON.stringify($scope.curImage));
                /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                taskService.addTask(task);
                fileHelper.saveToFile($rootScope.fields, "fields.json");

                //$state.go('dashboard');
                //$rootScope.form.close();
        });
    }

$rootScope.selectedField.Name = $rootScope.testScope.name;
$rootScope.selectedField.Note = $rootScope.testScope.note;

        putFunc();

        $scope.returnToFieldDetails();
        //alert(JSON.stringify($rootScope.selectedField));

};
});