angular.module('addPointOfInterestMd', ['ui.router'])

.controller('addPointOfInterestCtrl', function ($rootScope, $timeout, $scope, $state, $filter, taskService, apiConnection, Camera, fileHelper, $ionicActionSheet) {
    //$scope.showMap = function () {
    //    $state.go('map');
    //}
    $scope.gradient = function (selectedField) {
        if (selectedField && selectedField.Image && selectedField.Image.SRC)
            return {
                //'background': 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 59%, rgba(0, 0, 0, 0.65) 100%),url(' + $scope.getImage(selectedField) + ')'
                'background-image': 'url(' + $rootScope.urlForImage(selectedField.Image.SRC) + ')'
            };
        else return "";
    }

    $scope.gradientImg = function (selectedImg) {
        return {
            //'background': 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 59%, rgba(0, 0, 0, 0.65) 100%),url(' + selectedImg + ')'
            'background-image': 'url(' + selectedImg + ')'
        };
    }

    var $trans = $filter('translate');



    $scope.newPOIImages = [];// ['http://www.hdwallpapersimages.com/wp-content/uploads/2014/01/Winter-Tiger-Wild-Cat-Images.jpg', 'http://si.wsj.net/public/resources/images/BN-IB385_0424hu_J_20150423202238.jpg', 'http://si.wsj.net/public/resources/images/BN-IB385_0424hu_J_20150423202238.jpg', 'http://si.wsj.net/public/resources/images/BN-IB385_0424hu_J_20150423202238.jpg'];

    $scope.newPOI = {
        name: '',
        note: ''
    };

    $(document).ready(function () { //ionicView.enter
        //console.log('on document reday');

        $scope.poiInvalid = false;

        for (i = 0; i < $rootScope.selectedField.POIs.length; i++) {
            if ($rootScope.selectedField.POIs[i].Image)
                if ($rootScope.selectedField.POIs[i].Image.SRC)
                    $rootScope.selectedField.POIs[i].Image.SRC = getNameFromUrl($rootScope.selectedField.POIs[i].Image.SRC).replace('.jpg', '') + '.jpg';
        }

        //$rootScope.selectedField.Image.SRC = getNameFromUrl($rootScope.selectedField.Image.SRC) + '.jpg';
        $scope.rightColState = 1;
    });

  
  

    $scope.returnToDashboard = function () {
        $rootScope.selectedField = null;
        $state.go('dashboard');
    }

    $scope.rightCol = function (state) {
        if ($scope.rightColState == state) {//state of right col (1 - top menu expanded,2 - bottom menu expanded,3 - sight details)
            return true;
        }
    }

   
    $scope.changeRightCol = function (state) {
        $scope.rightColState = state;
    }

    $scope.createPOI = function () {
        //$scope.enter();

        $rootScope.$broadcast('loading:show');
        //$timeout(function () {
            $scope.poiInvalid = false;
            $scope.$apply();
            if ((!$scope.newPOI.name && $scope.newPOI.name == "")) {
                $scope.poiInvalid = true;
                $rootScope.$broadcast('loading:hide');
            } else {
                var poi = {};
                poi.POIId = taskService.guid();
                poi.Field_Id = $rootScope.selectedField.FieldId;
                poi.latitude = $rootScope.markerCoordianates.lat;
                poi.longtitude = $rootScope.markerCoordianates.lng;
                poi.Note = $scope.newPOI.note;
                poi.Name = $scope.newPOI.name;
                poi.Hunter = {};
                poi.Hunter.UserName = $rootScope.currUser.UserName;
                poi.Weather = {};
                console.log('Starts creating sighting:' + JSON.stringify(poi));

                var tmpImage = {};
                tmpImage.SRC = $scope.newPOIImages[0];

                var imagesObjArr = makeImagesObj($scope.newPOIImages);

                if ($scope.newPOIImages.length > 0) {
                    poi.Image = tmpImage;
                    poi.Images = imagesObjArr;
                }

                var index = -1;
                for (var i = 0, len = $rootScope.selectedField.POIs.length; i < len; i++) {
                    if ($rootScope.selectedField.POIs[i].POIId === poi.POIId) {
                        index = i;
                        break;
                    }
                }

                if (index == -1) {

                    console.log('Adding POI with ID:' + poi.POIId + ' to local array');

                    $rootScope.selectedField.POIs.push(poi);
                    stableSort($rootScope.selectedField.POIs);

                    fileHelper.saveToFile($rootScope.fields, "fields.txt");

                    apiConnection.postPOI(poi).then(function (data) {
                        $rootScope.$broadcast('loading:hide');

                        $scope.newPOI = {
                            name: '',
                            note: '',
                            latitude: '',
                            longtitude: ''
                        };

                        for (var i = 0; i < $scope.newPOIImages.length; i++)
                            apiConnection.uploadPOIImage($rootScope.urlForImage($scope.newPOIImages[i]), $scope.newPOIImages[i], poi.Field_Id, poi.POIId, i).then(function (data) {
                                var ta = 1;
                            }, function (data) {

                            });
                        $scope.newPOIImages = [];

                        $rootScope.isPoiSaved = true;
                        $rootScope.modal.remove(); //removes modal popup window
                        $scope.$apply();

                    }, function (status, answer) {
                        $rootScope.$broadcast('loading:hide');

                        var task = taskService.createDataTask('POST', '/odata/POIs', poi);
                        var imagesTasksArr = [];
                        for (i = 0; i < $scope.newPOIImages.length; i++) {
                            var imagesSubtask = taskService.createImgTask('/api/upload/poi/' + poi.Field_Id + '/' + poi.POIId, $scope.newPOIImages[i], $rootScope.urlForImage($scope.newPOIImages[i]));
                            imagesTasksArr.push(imagesSubtask);
                        }
                        if (imagesTasksArr.length > 0)
                            task.subTask = imagesTasksArr;

                        taskService.addTask(task);

                        $scope.newPOIImages = [];
                        $scope.newPOI = {
                            name: '',
                            latitude: '',
                            longtitude: ''
                        };

                        $rootScope.isPoiSaved = true;
                        $rootScope.modal.remove(); //removes modal popup window
                        $scope.$apply();
                    });
                }
            }
        //}, 500);

    }

    $scope.addImage = function () {

        var hideSheet = $ionicActionSheet.show({
            buttons: [
              { text: $trans("choose_from_galery") },
              { text: $trans("take_photo") }
            ],
            titleText: $trans("add_poi_pic"),
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
            }
        });

    }

    $scope.getBackgroundSize = function () {
        var w = $('.backgroundSize').width();
        var h = $('.backgroundSize').height();
        var str = w + 'px ' + h + 'px;'
    }

    $scope.takeImage = function (options) {

        navigator.camera.getPicture(function (imageData) {
            var a = apiConnection.saveToDevice(imageData).then(function (data) {
                $scope.newPOIImages.push(data);
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

    //function getOffsetRect(id) {
    //    var elem = document.getElementById(id);
    //    var box = elem.getBoundingClientRect()
    //    var body = document.body
    //    var docElem = document.documentElement
    //    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
    //    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
    //    var clientLeft = docElem.clientLeft || body.clientLeft || 0
    //    var top = box.top + scrollTop - clientTop
    //    var left = box.left + scrollLeft - clientLeft
    //    return { top: Math.round(top), left: Math.round(left) }
    //}

    $scope.deleteImage = function (index) {
        $scope.newPOIImages.splice(index, 1);
    }

});