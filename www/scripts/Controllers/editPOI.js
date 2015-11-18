angular.module('editPOICtrlMd', ['ui.router'])

.controller('editPOICtrl', function ($rootScope, $timeout, $scope, $state, $filter, taskService, apiConnection, Camera, fileHelper, $ionicActionSheet) {
    var $trans = $filter('translate');

    $scope.currentPOI = JSON.parse(JSON.stringify($rootScope.selectedPOI));

    $scope.oldPOI = $rootScope.selectedPOI;

        $scope.poiInvalid = false;

    $scope.savePOI = function () {

        $rootScope.$broadcast('loading:show');
        $rootScope.imagesChanged($scope.currentPOI.Images, $scope.oldPOI.Images);

        if ($scope.currentPOI.Name !== $scope.oldPOI.Name ||
            $scope.currentPOI.Note !== $scope.oldPOI.Note || $rootScope.delArray.length > 0 || $rootScope.addArray.length > 0) {
            $rootScope.selectedPOI = JSON.parse(JSON.stringify($scope.currentPOI));
            for (var i = 0; i < $rootScope.selectedField.POIs.length; i++)
                if ($rootScope.selectedField.POIs[i].POIId == $scope.currentPOI.POIId)
                    $rootScope.selectedField.POIs[i] = JSON.parse(JSON.stringify($scope.currentPOI));
            fileHelper.saveToFile($rootScope.fields, "fields.json");

            apiConnection.putPOI($scope.currentPOI).then(function (data) {


                $rootScope.modal.remove();
                for (var i = 0; i < $rootScope.delArray.length; i++)
                    apiConnection.deletePOIPhotos($rootScope.selectedPOI, $rootScope.delArray[i]).then(function (data) {

                    }, function (error) {

                    });
                for (var i = 0; i < $rootScope.addArray.length; i++)
                    apiConnection.uploadPOIImage($rootScope.urlForImage($rootScope.addArray[i]), $rootScope.addArray[i], $rootScope.selectedField.FieldId, $rootScope.selectedPOI.POIId, i).then(function (data) {

                    }, function (error) {

                    });
                $rootScope.$broadcast('loading:hide');
            }, function (status, answer) {
                $rootScope.modal.remove();

                $rootScope.$broadcast('loading:hide');

                var data = JSON.stringify({
                    Name: $scope.currentPOI.Name,
                    Note: $scope.currentPOI.Note,
                    latitude: $scope.currentPOI.latitude,
                    longtitude: $scope.currentPOI.longtitude
                });
                var task = taskService.createDataTask('PUT', '/odata/POIs/' + $rootScope.selectedPOI.POIId, data);
                var imagesTasksArr = [];

                for (var i = 0; i < $rootScope.delArray.length; i++) {
                    var tmp = taskService.createDataTask('DELETE', "/odata/POIs/Photos(" + $rootScope.selectedPOI.POIId + ")/" + $rootScope.delArray[i], {});
                    imagesTasksArr.push(tmp);
                }
                for (i = 0; i < $rootScope.addArray.length; i++) {
                    var imagesSubtask = taskService.createImgTask('/api/upload/poi/' + $rootScope.selectedField.FieldId + '/' + $rootScope.selectedPOI.POIId, $rootScope.addArray[i], $rootScope.urlForImage($rootScope.addArray[i]));
                    imagesTasksArr.push(imagesSubtask);
                }

                task.subTask = imagesTasksArr;
                taskService.addTask(task);


            });
        }
        else {
            $rootScope.$broadcast('loading:hide');
        }
    }

    $scope.addImage = function () {

        var hideSheet = $ionicActionSheet.show({
            buttons: [
              { text: $trans("choose_from_galery") },
              { text: $trans("take_photo") }
            ],
            titleText: $trans("add_sight_pic"),
            cancelText: $trans("dpCancel"),
            cancel: function () {
                hideSheet();
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
                hideSheet();

            }
        });

    }

    //$scope.getBackgroundSize = function () {
    //    var w = $('.backgroundSize').width();
    //    var h = $('.backgroundSize').height();
    //    var str = w + 'px ' + h + 'px;'
    //}

    $scope.takeImage = function (options) {

        navigator.camera.getPicture(function (imageData) {
            var a = apiConnection.saveToDevice(imageData).then(function (data) {
                $scope.currentPOI.Images.push({ SRC: data });
            });
        }, function (err) {
            console.log(err);
        }, options);

        //Camera.getPicture(options).then(function (imageData) {
        //    var a = apiConnection.saveToDevice(imageData).then(function (data) {
        //        $scope.currentPOIImages.push(data);
        //        //alert('lox');
        //        // alert(JSON.strigify(data));
        //    });
        //}, function (err) {
        //    console.log(err);
        //});
    }

    $scope.deleteImage = function (index) {
        $scope.currentPOIImages.splice(index, 1);
    }

    $scope.isLocaL = function (data) {
        return isLocal(data);
    }


    var deletePOIConfirmed = function () {
        var ind = $rootScope.selectedField.POIs.indexOf($rootScope.selectedPOI);
        $rootScope.selectedField.POIs.splice(ind, 1);
        fileHelper.saveToFile($rootScope.fields, 'fields.txt');

        //$scope.changeRightCol(1);

        apiConnection.deletePOI($scope.currentPOI.POIId).then(function (data) {
            console.log('sighting delete was successful!');
        }, function (data) {
            var data = {};
            var url = '/odata/POIs(' + $scope.currentPOI.POIId + ')';
            var task = taskService.createDataTask('DELETE', url, data);
            taskService.addTask(task);
        });

        $rootScope.showAlertPopup($trans("poi_delete_success"), false);
        $rootScope.deleteSelectedMarker = true;
        $rootScope.modal.remove();
    }

    $scope.deletePOI = function () {

        $rootScope.$broadcast('loading:show');
        $rootScope.showAlertPopup($trans("delete_poi_popup_title"), true, deletePOIConfirmed);

    }


});