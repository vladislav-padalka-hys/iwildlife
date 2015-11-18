angular.module('cleanMapMD', [])
.controller('cleanMapCtrl', function ($ionicModal, $timeout, $scope, $rootScope, mapFactory, $state,  $filter, taskService, apiConnection, fileHelper) {
    $scope.sightingMarker = null;
    $scope.isSightingPosted = false;

    $scope.$on("$ionicView.afterEnter", function () {
        $('div.leaflet-control-attribution.leaflet-control').css({ 'pointer-events': 'none' }); //prevent a href transition 

        var latCoord = parseFloat($rootScope.selectedField.latitude),
            lngCoord = parseFloat($rootScope.selectedField.longtitude),
            myLatLng = new L.LatLng(latCoord, lngCoord);

        $scope.cleanMap.setView(myLatLng, 15);

        mapFactory.loadField($rootScope.selectedField.Coordinates, $scope.drawnItems, $scope.cleanMap);
        //mapFactory.loadSightings($rootScope.selectedField.Sightings, $scope.drawnItems, $scope.sightingCluster);
    });

    $scope.$on("$ionicView.afterLeave", function () {
        $scope.drawnItems.clearLayers();
        $rootScope.isSightingPosted = false;
        //$ionicHistory.clearCache();
    });

    $scope.$on("$ionicView.loaded", function () {

        $scope.cleanMap = new L.map('cleanMap');

        var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            mapLayer = L.tileLayer(osmUrl, { attribution: osmAttrib, noWrap: true });

        mapLayer.addTo($scope.cleanMap);

        $scope.cleanMap.worldCopyJump = false;

        $scope.drawnItems = new L.FeatureGroup();
        $scope.cleanMap.addLayer($scope.drawnItems);


        $scope.cleanMap.on('click', function (e) {
            $scope.postSightingIcon(e);
        });

        $scope.drawnItems.on('click', function (e) {
            $scope.postSightingIcon(e);
        });
    });

    $scope.postSightingIcon = function (e) {
        $scope.drawnItems.eachLayer(function (layer) {
            if (layer instanceof L.Marker)
                $scope.drawnItems.removeLayer(layer)
        });
        var markerLatLng = e.latlng;
        $rootScope.markerCoordianates = markerLatLng;
        $scope.sightingMarker = L.marker(markerLatLng, { icon: $rootScope.sightingIcon });

        //.bindPopup("You are within " + radius + " meters from this point").openPopup();

        $scope.cleanMap.setView(markerLatLng);
        $scope.drawnItems.addLayer($scope.sightingMarker);
        $scope.isSightingPosted = true;
        $scope.$apply();
    };




    function addAnimal(val) {
        var found = false;
        if (!$rootScope.currFieldAnimals)
            $rootScope.currFieldAnimals = [];
        for (i = 0; i < $rootScope.currFieldAnimals.length; i++) {
            if ($rootScope.currFieldAnimals[i].name == val) {
                found = true;
                addType(val, $rootScope.newSighting.type);
            }
        }
        if (!found) {
            $rootScope.currFieldAnimals.push({ name: val, types: [$rootScope.newSighting.type] });
            $rootScope.animalsForFields[$rootScope.selectedField.FieldId] = $rootScope.currFieldAnimals;
            saveToLocalStorage('fieldsAnimals', $rootScope.animalsForFields);
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
        //$scope.enter();

        $rootScope.$broadcast('loading:show');
        var sighting = {};
        sighting.SightingId = taskService.guid();

        console.log('Starts creating sighting with ID:' + sighting.SightingId);

        sighting.Field_Id = $rootScope.selectedField.FieldId;
        sighting.latitude = $rootScope.markerCoordianates.lat;
        sighting.longtitude = $rootScope.markerCoordianates.lng;
        sighting.Date = $rootScope.newSighting.date;
        sighting.Type = $rootScope.newSighting.type;
        sighting.Age = $rootScope.newSighting.age;
        sighting.State = $rootScope.newSighting.state;
        sighting.Note = $rootScope.newSighting.note;
        sighting.Animal = $rootScope.newSighting.animal;
        sighting.Hunter = {};
        sighting.Hunter.UserName = $rootScope.currUser.UserName;
        sighting.Weather = {};

        if ($rootScope.newSighting.animal && $rootScope.newSighting.animal != "")
            addAnimal($rootScope.newSighting.animal);

        var tmpImage = {};
        tmpImage.SRC = $rootScope.newSightingImages[0];

        var imagesObjArr = makeImagesObj($rootScope.newSightingImages);

        if ($rootScope.newSightingImages.length > 0) {
            sighting.Image = tmpImage;
            sighting.Images = imagesObjArr;
        }

        for (var i = 0; i < $rootScope.selectedField.weather.length; i++) {
            if ($filter('date')($rootScope.newSighting.date, 'yyyy-MM-dd') == $rootScope.selectedField.weather[i].date) {
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
                for (var i = 0; i < $rootScope.newSightingImages.length; i++)
                    apiConnection.uploadSightingImage($rootScope.urlForImage($rootScope.newSightingImages[i]), $rootScope.newSightingImages[i], sighting.Field_Id, sighting.SightingId, i).then(function (data) {
                        var ta = 1;
                    }, function (data) {

                    });

                $rootScope.newSighting = {
                    type: '',
                    age: '',
                    state: '',
                    note: '',
                    latitude: '',
                    longtitude: '',
                    date: new Date().toISOString()
                };
                $rootScope.newSightingImages = [];

            }, function (status, answer) {
                var task = taskService.createDataTask('POST', '/odata/Sightings/', sighting);
                var imagesTasksArr = [];
                for (i = 0; i < $rootScope.newSightingImages.length; i++) {
                    var imagesSubtask = taskService.createImgTask('/api/upload/sighting/' + sighting.Field_Id + '/' + sighting.SightingId, $scope.newSightingImages[i], $rootScope.urlForImage($scope.newSightingImages[i]));
                    imagesTasksArr.push(imagesSubtask);
                }
                task.subTask = imagesTasksArr;
                taskService.addTask(task);

                $rootScope.newSightingImages = [];
                $rootScope.newSighting = {
                    type: '',
                    age: '',
                    state: '',
                    note: '',
                    latitude: '',
                    longtitude: '',
                    date: new Date().toISOString()
                };
            });
        }
        $rootScope.$broadcast('loading:hide');
        $state.go('fieldDetails');
    }

    $scope.backToFieldDetails = function () {
        $state.go('fieldDetails');
    };

});
