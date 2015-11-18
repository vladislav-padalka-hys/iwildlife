angular.module('addSightingCtrlMd', ['ui.router'])

.controller('addSightingCtrl', function ($rootScope, $timeout, $scope, $state, $filter, taskService, apiConnection, Camera, fileHelper, $ionicActionSheet) {
    $scope.showMap = function () {
        $state.go('map');
    }
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

    // $scope.$on('$ionicView.beforeEnter', function () {
    //     $scope.sightingInvalid = false;
    // });
    // //$scope.dpCancel = $trans('dpCancel');
    // //$scope.dpOk = $trans('dpOk');
    // //$scope.dpNow = $trans('dpNow');
    // //$scope.dpToday = $trans('dpToday');
    // //$scope.dpDone = $trans('dpDone');


    $scope.newSightingImages = [];// ['http://www.hdwallpapersimages.com/wp-content/uploads/2014/01/Winter-Tiger-Wild-Cat-Images.jpg', 'http://si.wsj.net/public/resources/images/BN-IB385_0424hu_J_20150423202238.jpg', 'http://si.wsj.net/public/resources/images/BN-IB385_0424hu_J_20150423202238.jpg', 'http://si.wsj.net/public/resources/images/BN-IB385_0424hu_J_20150423202238.jpg'];

    $scope.newSighting = {
        animal: '',
        type: '',
        age: '',
        state: '',
        note: '',
        date: new Date().toISOString(),
    };

    $(document).ready(function () { //ionicView.enter
        //console.log('on document reday');

        $scope.sightingInvalid = false;

        for (i = 0; i < $rootScope.selectedField.Sightings.length; i++) {
            if ($rootScope.selectedField.Sightings[i].Image)
                if ($rootScope.selectedField.Sightings[i].Image.SRC)
                    $rootScope.selectedField.Sightings[i].Image.SRC = getNameFromUrl($rootScope.selectedField.Sightings[i].Image.SRC).replace('.jpg', '') + '.jpg';
        }

        $scope.animalsForFields = getAnimalsForField($rootScope.selectedField);
        if ($scope.animalsForFields.length == 0) {
            saveToLocalStorage('fieldsAnimals', []);
            $scope.animalsForFields = [];
            $scope.currFieldAnimals = [];
            $scope.currTypes = [];
            $scope.newSighting.type = '';
        } else {
            $scope.currFieldAnimals = $scope.animalsForFields; //$scope.animalsForFields[$rootScope.selectedField.FieldId];
            //$scope.currFieldAnimals = [{ name: 'wolf', types: ['lox', 'poc'] }, { name: 'olen', types: [] }];
            $scope.currTypes = [];
            $scope.newSighting.type = '';
        }

        //$rootScope.selectedField.Image.SRC = getNameFromUrl($rootScope.selectedField.Image.SRC) + '.jpg';
        $scope.rightColState = 1;
    });

    $scope.selectAmimal = function (val) {
        $scope.newSighting.animal = val;
        $("#menuSightDetails" + $scope.lastIndex).hide("fast");
        for (i = 0; i < $scope.currFieldAnimals.length; i++) {
            if ($scope.currFieldAnimals[i].name == val) {
                $scope.newSighting.type = '';
                $scope.currTypes = $scope.currFieldAnimals[i].types;
                //$scope.$apply();
            }
        }
    }

    $scope.selectType = function (val) {
        $scope.newSighting.type = val;
        $("#menuSightDetails" + $scope.lastIndex).hide("fast");
    }

    $scope.selectAge = function (val) {
        $scope.newSighting.age = val;
        $("#menuSightDetails" + $scope.lastIndex).hide("fast");
    }

    $scope.selectState = function (val) {
        $scope.newSighting.state = val;
        $("#menuSightDetails" + $scope.lastIndex).hide("fast");
    }

    $scope.returnToDashboard = function () {
        $rootScope.selectedField = null;
        $state.go('dashboard');
    }

    $scope.rightCol = function (state) {
        if ($scope.rightColState == state) {//state of right col (1 - top menu expanded,2 - bottom menu expanded,3 - sight details)
            return true;
        }
    }

    $scope.toggleSightDetails = function (index) {
        if ($scope.lastIndex && index != $scope.lastIndex)
            $("#menuSightDetails" + $scope.lastIndex).hide("fast");
        $scope.lastIndex = index;//to toggle last opened menu
        $("#menuSightDetails" + index).fadeToggle("fast");
    }

    $scope.changeRightCol = function (state) {
        $scope.rightColState = state;
    }

    $scope.addSightingImage = function () {

    }

    function addAnimal(val) {
        var found = false;
        if (!$scope.currFieldAnimals)
            $scope.currFieldAnimals = [];
        for (i = 0; i < $scope.currFieldAnimals.length; i++) {
            if ($scope.currFieldAnimals[i].name == val) {
                found = true;
                addType(val, $scope.newSighting.type);
            }
        }
        if (!found) {
            $scope.currFieldAnimals.push({ name: val, types: [$scope.newSighting.type] });
            $scope.animalsForFields[$rootScope.selectedField.FieldId] = $scope.currFieldAnimals;
            saveToLocalStorage('fieldsAnimals', $scope.animalsForFields);
        }
    }

    function addType(animal, val) {
        var found = false;
        if (!$scope.currFieldAnimals)
            $scope.currFieldAnimals = [];
        for (i = 0; i < $scope.currFieldAnimals.length; i++) {
            if ($scope.currFieldAnimals[i].name == animal) {
                for (j = 0; j < $scope.currFieldAnimals[i].types.length; j++) {
                    if ($scope.currFieldAnimals[i].types[j] == val) {
                        found == true;
                    }
                }
            }
        }
        if (!found) {
            for (i = 0; i < $scope.currFieldAnimals.length; i++) {
                if ($scope.currFieldAnimals[i].name == animal) {
                    $scope.currFieldAnimals[i].types.push(val);
                    $scope.animalsForFields[$rootScope.selectedField.FieldId] = $scope.currFieldAnimals;
                    saveToLocalStorage('fieldsAnimals', $scope.animalsForFields);
                }
            }
        }
    }

    $scope.createSighting = function () {
        $rootScope.$broadcast('loading:show');

        $scope.sightingInvalid = false;
        try {
            $scope.$apply();
        }
        catch (ex) {

        }
        $timeout(function () {
            if ((!$scope.newSighting.animal && $scope.newSighting.animal == "")) {
                $scope.sightingInvalid = true;
                $rootScope.$broadcast('loading:hide');
            } else {
                var sighting = {};
                sighting.SightingId = taskService.guid();
                console.log('Starts creating sighting with ID:' + sighting.SightingId);
                sighting.Field_Id = $rootScope.selectedField.FieldId;
                sighting.latitude = $rootScope.markerCoordianates.lat;
                sighting.longtitude = $rootScope.markerCoordianates.lng;

                sighting.Date = $scope.newSighting.date;
                sighting.Type = $scope.newSighting.type;
                sighting.Age = $scope.newSighting.age;
                sighting.State = $scope.newSighting.state;
                sighting.Note = $scope.newSighting.note;
                sighting.Animal = $scope.newSighting.animal;
                if ($scope.newSighting.animal && $scope.newSighting.animal != "")
                    addAnimal($scope.newSighting.animal);
                sighting.Hunter = {};
                sighting.Hunter.UserName = $rootScope.currUser.UserName;
                sighting.Weather = {};

                var tmpImage = {};
                tmpImage.SRC = $scope.newSightingImages[0];

                var imagesObjArr = makeImagesObj($scope.newSightingImages);

                if ($scope.newSightingImages.length > 0) {
                    sighting.Image = tmpImage;
                    sighting.Images = imagesObjArr;
                }

                for (var i = 0; i < $rootScope.selectedField.weather.length; i++) {
                    if ($filter('date')($scope.newSighting.date, 'yyyy-MM-dd') == $rootScope.selectedField.weather[i].date) {
                        sighting.Weather = JSON.parse(JSON.stringify($rootScope.selectedField.weather[i]));
                        break;
                    }
                }
                var index = -1;
                for (var i = 0, len = $rootScope.selectedField.Sightings.length; i < len; i++) {
                    if ($rootScope.selectedField.Sightings[i].SightingId === sighting.SightingId) {
                        index = i;
                        break;
                    }
                }

                if (index == -1) {
                    console.log('Adding sighting with ID:' + sighting.SightingId + ' to local array');

                    $rootScope.selectedField.Sightings.push(sighting);
                    $rootScope.sightCount++;

                    stableSort($rootScope.selectedField.Sightings);
                    fileHelper.saveToFile($rootScope.fields, "fields.txt");

                    apiConnection.postSighting(sighting).then(function (data) {
                        $rootScope.$broadcast('loading:hide');

                        $scope.newSighting = {
                            type: '',
                            age: '',
                            state: '',
                            note: '',
                            latitude: '',
                            longtitude: '',
                            date: new Date().toISOString()
                        };
                        for (var i = 0; i < $scope.newSightingImages.length; i++)
                            apiConnection.uploadSightingImage($rootScope.urlForImage($scope.newSightingImages[i]), $scope.newSightingImages[i], sighting.Field_Id, sighting.SightingId, i).then(function (data) {
                                console.log('Successfully sent image of new Sighting');
                            }, function (data) {

                            });
                        $scope.newSightingImages = [];

                        $rootScope.isSightingSaved = true;

                        $rootScope.modal.remove(); //removes modal popup window
                        $scope.$apply();

                    }, function (status, answer) {
                        $rootScope.$broadcast('loading:hide');

                        var task = taskService.createDataTask('POST', '/odata/Sightings/', sighting);
                        var imagesTasksArr = [];
                        for (var i = 0; i < $scope.newSightingImages.length; i++) {
                            var imagesSubtask = taskService.createImgTask('/api/upload/sighting/' + sighting.Field_Id + '/' + sighting.SightingId, $scope.newSightingImages[i], $rootScope.urlForImage($scope.newSightingImages[i]));
                            imagesTasksArr.push(imagesSubtask);
                        }
                        if (imagesTasksArr.length > 0)
                            task.subTask = imagesTasksArr;
                        taskService.addTask(task);

                        $scope.newSightingImages = [];
                        $scope.newSighting = {
                            type: '',
                            age: '',
                            state: '',
                            note: '',
                            latitude: '',
                            longtitude: '',
                            date: new Date().toISOString()
                        };

                        $rootScope.isSightingSaved = true;
                        $rootScope.modal.remove(); //removes modal popup window
                        $scope.$apply();
                    });
                }
            }
        }, 700);
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

    $scope.getBackgroundSize = function () {
        var w = $('.backgroundSize').width();
        var h = $('.backgroundSize').height();
        var str = w + 'px ' + h + 'px;'
    }

    $scope.takeImage = function (options) {

        navigator.camera.getPicture(function (imageData) {
            var a = apiConnection.saveToDevice(imageData).then(function (data) {
                $scope.newSightingImages.push(data);
            });
        }, function (err) {
            console.log(err);
        }, options);

        //Camera.getPicture(options).then(function (imageData) {
        //    var a = apiConnection.saveToDevice(imageData).then(function (data) {
        //        $scope.newSightingImages.push(data);
        //        //alert('lox');
        //        // alert(JSON.strigify(data));
        //    });
        //}, function (err) {
        //    console.log(err);
        //});
    }

    function getOffsetRect(id) {
        var elem = document.getElementById(id);
        var box = elem.getBoundingClientRect()
        var body = document.body
        var docElem = document.documentElement
        var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
        var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
        var clientLeft = docElem.clientLeft || body.clientLeft || 0
        var top = box.top + scrollTop - clientTop
        var left = box.left + scrollLeft - clientLeft
        return { top: Math.round(top), left: Math.round(left) }
    }

    $scope.selectDate = function () {

        console.log("datepicker");
        var c = $("#datepicker");
        var coords = c.offset();
        console.log(coords);
        var x = coords.left;
        var y = coords.top;

        var now = new Date();

        var options = {
            date: new Date(),
            mode: 'datetime',
            maxDate: new Date().valueOf(),
            is24Hour: $rootScope.time == '24' ? true : false,
            locale: $rootScope.time == '24' ? 'en_150' : 'en_us',
            allowFutureDates: false,
            minDate: now.setDate(now.getDate() - 365).valueOf(),
            cancelText: $trans('dpCancel'),
            okText: $trans('dpOk'),
            todayText: $trans('dpToday'),
            nowText: $trans('dpNow'),
            doneButtonLabel: $trans('dpDone'),
            cancelButtonLabel: $trans('dpCancel'),
            x: x,
            y: y
        };

        function onSuccess(date) {
            $scope.$apply(function () {
                $scope.newSighting.date = new Date(date).toISOString();
            });
        }

        function onError(error) { // Android only
            console.log('Error on datepick: ' + error);
        }

        datePicker.show(options, onSuccess, onError);

    }

    $scope.deleteImage = function (index) {
        $scope.newSightingImages.splice(index, 1);
        //$scope.downloadImage('http://si.wsj.net/public/resources/images/BN-IB385_0424hu_J_20150423202238.jpg');
    }

    $scope.downloadImage = function (imageData) {
        apiConnection.downloadSightingImage(imageData, 'asdasdasdasdasdasdasdasdasd').then(function (daata) {
            //alert('good');
        });
    }

    //=========Weather functionality=========\\

    $scope.isExpanded = false;
    $scope.expandWeather = function () {
        $scope.isExpanded = !$scope.isExpanded;
    }

    $scope.isLocaL = function (data) {
        return isLocal(data);
    }

});