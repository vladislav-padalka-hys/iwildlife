angular.module('editSightingCtrlMd', ['ui.router'])

.controller('editSightingCtrl', function ($ionicActionSheet, $rootScope, $timeout, $scope, $state, $filter, taskService, apiConnection, Camera, fileHelper) {
    var $trans = $filter('translate');

    $scope.currentSighting = JSON.parse(JSON.stringify($rootScope.selectedSighting));

    $scope.oldSighting = $rootScope.selectedSighting;

    $scope.animalsForFields = getAnimalsForField($rootScope.selectedField);

    $scope.sightingInvalid = false;

    $(document).ready(function () { //ionicView.enter
        if ($scope.animalsForFields.length == 0) {
            saveToLocalStorage('fieldsAnimals', []);
            $scope.animalsForFields = [];
            $scope.currFieldAnimals = [];
            $scope.currTypes = [];
            $scope.currentSighting.Type = '';
        } else {
            $scope.currFieldAnimals = $scope.animalsForFields; //$scope.animalsForFields[$rootScope.selectedField.FieldId];
            //$scope.currFieldAnimals = [{ name: 'wolf', types: ['lox', 'poc'] }, { name: 'olen', types: [] }];
            for (var i = 0; i < $scope.currFieldAnimals.length; i++) {
                if ($scope.currFieldAnimals[i].name == $scope.currentSighting.Animal) {
                    $scope.currTypes = $scope.currFieldAnimals[i].types;
                    break;
                };
            };
            //$scope.currTypes = [];
            //$scope.currentSighting.Type = '';
        }
    });

    $scope.selectAmimal = function (val) {
        $scope.currentSighting.Animal = val;
        $("#editSightDetails" + $scope.lastIndex).hide("fast");
        for (i = 0; i < $scope.currFieldAnimals.length; i++) {
            if ($scope.currFieldAnimals[i].name == val) {
                $scope.currentSighting.Type = '';
                $scope.currTypes = $scope.currFieldAnimals[i].types;
                //$scope.$apply();
            }
        }
    }

    $scope.selectType = function (val) {
        $scope.currentSighting.Type = val;
        $("#editSightDetails" + $scope.lastIndex).hide("fast");
    }

    $scope.selectAge = function (val) {
        $scope.currentSighting.Age = val;
        $("#editSightDetails" + $scope.lastIndex).hide("fast");
    }

    $scope.selectState = function (val) {
        $scope.currentSighting.State = val;
        $("#editSightDetails" + $scope.lastIndex).hide("fast");
    }

    $scope.toggleSightDetails = function (index) {
        if ($scope.lastIndex && index != $scope.lastIndex)
            $("#editSightDetails" + $scope.lastIndex).hide("fast");
        $scope.lastIndex = index;//to toggle last opened menu
        $("#editSightDetails" + index).fadeToggle("fast");
    }

    function addAnimal(val) {
        var found = false;
        if (!$scope.currFieldAnimals)
            $scope.currFieldAnimals = [];
        for (i = 0; i < $scope.currFieldAnimals.length; i++) {
            if ($scope.currFieldAnimals[i].name == val) {
                found = true;
                addType(val, $scope.currentSighting.Type);
            }
        }
        if (!found) {
            $scope.currFieldAnimals.push({ name: val, types: [$scope.currentSighting.Type] });
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

    $rootScope.saveSighting = function () {
        $rootScope.oldImage == null;
        $rootScope.$broadcast('loading:show');

        $rootScope.imagesChanged($scope.currentSighting.Images, $scope.oldSighting.Images);
        if ($scope.currentSighting.Animal !== $scope.oldSighting.Animal ||
            $scope.currentSighting.Type !== $scope.oldSighting.Type ||
            $scope.currentSighting.Age !== $scope.oldSighting.Age ||
            $scope.currentSighting.State !== $scope.oldSighting.State ||
            $scope.currentSighting.Date !== $scope.oldSighting.Date ||
            $scope.currentSighting.Note !== $scope.oldSighting.Note || $rootScope.delArray.length > 0 || $rootScope.addArray.length > 0) {
            if ($rootScope.selectedSighting.Image)
                $rootScope.oldImage = $rootScope.selectedSighting.Image.SRC;
            var field = null;
            for (var i = 0; i < $rootScope.fields.length; i++)
                if ($rootScope.fields[i].FieldId == $rootScope.selectedField.FieldId)
                    field = $rootScope.fields[i];
            var sightI = $rootScope.selectedField.Sightings.indexOf($rootScope.selectedSighting);
            field.Sightings[sightI] = JSON.parse(JSON.stringify($scope.currentSighting));
            fileHelper.saveToFile($rootScope.fields, "fields.json");

            apiConnection.putSighting($scope.currentSighting).then(function (data) {
                $rootScope.modal.remove();
                $rootScope.$broadcast('loading:hide');

                for (var i = 0; i < $rootScope.delArray.length; i++) {
                    if ($rootScope.oldImage && $rootScope.delArray[i].indexOf($rootScope.oldImage) > -1) {
                        apiConnection.deleteSightingPhoto($rootScope.selectedSighting).then(function (data) {

                        }, function (error) {

                        });
                    }
                    apiConnection.deleteSightingPhotos($rootScope.selectedSighting, $rootScope.delArray[i]).then(function (data) {

                    }, function (error) {

                    });
                }
                for (var i = 0; i < $rootScope.addArray.length; i++)
                    apiConnection.uploadSightingImage($rootScope.urlForImage($rootScope.addArray[i]), $rootScope.addArray[i], $rootScope.selectedField.FieldId, $rootScope.selectedSighting.SightingId, i).then(function (data) {

                    }, function (error) {

                    })
            }, function (status, answer) {
                $rootScope.modal.remove();

                $rootScope.$broadcast('loading:hide');


                var data = JSON.stringify({
                    Type: $scope.currentSighting.Type,
                    Animal: $scope.currentSighting.Animal,
                    State: $scope.currentSighting.State,
                    Note: $scope.currentSighting.Note,
                    Age: $scope.currentSighting.Age,
                    latitude: $scope.currentSighting.latitude,
                    longtitude: $scope.currentSighting.longtitude,
                    Date: $scope.currentSighting.Date
                })
                var task = taskService.createDataTask('PUT', '/odata/Sightings/' + $rootScope.selectedSighting.SightingId, data);
                var imagesTasksArr = [];
                
                for (var i = 0; i < $rootScope.delArray.length; i++) {
                    if ($rootScope.delArray[i] == $rootScope.selectedSighting.Image.SRC) {
                        var tmp1 = taskService.createDataTask('DELETE', "/odata/Sightings/Photo(" + $rootScope.selectedSighting.SightingId + ")", {});
                        imagesTasksArr.push(tmp1);
                    }
                    {
                        var tmp = taskService.createDataTask('DELETE', "/odata/Sightings/Photos(" + $rootScope.selectedSighting.SightingId + ")/" + $rootScope.delArray[i], {});
                        imagesTasksArr.push(tmp);
                    }
                }
                for (i = 0; i < $rootScope.addArray.length; i++) {
                    var imagesSubtask = taskService.createImgTask('/api/upload/sighting/' + $rootScope.selectedField.FieldId + '/' + $rootScope.selectedSighting.SightingId, $rootScope.addArray[i], $rootScope.urlForImage($rootScope.addArray[i]));
                    imagesTasksArr.push(imagesSubtask);
                }

                task.subTask = imagesTasksArr;
                taskService.addTask(task);
            });
        }
        else {
            $rootScope.$broadcast('loading:hide');
            //alert('You have not made any changes to the sighting!');
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

    $scope.getBackgroundSize = function () {
        var w = $('.backgroundSize').width();
        var h = $('.backgroundSize').height();
        var str = w + 'px ' + h + 'px;'
    }

    $scope.takeImage = function (options) {

        navigator.camera.getPicture(function (imageData) {
            var a = apiConnection.saveToDevice(imageData).then(function (data) {
                if ($scope.currentSighting.Images)
                    $scope.currentSighting.Images.push({ SRC: data });
                else $scope.currentSighting.Images=[{ SRC: data }];
                if (!$scope.currentSighting.Image)
                {
                    $scope.currentSighting.Image = { SRC: data };
                }
            });
        }, function (err) {
            console.log(err);
        }, options);

        //Camera.getPicture(options).then(function (imageData) {
        //    var a = apiConnection.saveToDevice(imageData).then(function (data) {
        //        $scope.currentSightingImages.push(data);
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
                $scope.currentSighting.date = new Date(date).toISOString();
            });
        }

        function onError(error) { // Android only
            console.log('Error on datepick: ' + error);
        }

        datePicker.show(options, onSuccess, onError);

    }

    $scope.deleteImage = function (index) {
        if ($scope.currentSighting.Image && $scope.currentSighting.Image.SRC == $scope.currentSighting.Images[index].SRC)
            $scope.currentSighting.Image = null;
        $scope.currentSighting.Images.splice(index, 1);
    }

    $scope.isLocaL = function (data) {
        return isLocal(data);
    }

    var deleteSightConfirmed = function () {
        var ind = $rootScope.selectedField.Sightings.indexOf($rootScope.selectedSighting);

        $rootScope.selectedField.Sightings.splice(ind, 1);
        $rootScope.sightCount--;

        fileHelper.saveToFile($rootScope.fields, 'fields.txt');
            
        apiConnection.deleteSighting($scope.currentSighting.SightingId).then(function (data) {
            //console.log('sighting delete was successful!');
        }, function (data) {
            var data = {};
            var url = '/odata/Sightings(' + $scope.currentSighting.SightingId + ')';
            var task = taskService.createDataTask('DELETE', url, data);
            taskService.addTask(task);
        });
    
        $rootScope.showAlertPopup($trans("sight_delete_success"), false);

        $rootScope.deleteSelectedMarker = true;
        $rootScope.modal.remove();
    }

    $scope.deleteSighting = function () {
        $rootScope.$broadcast('loading:show');

        $rootScope.showAlertPopup($trans("delete_sighting_popup_title"), true, deleteSightConfirmed);
    }
});