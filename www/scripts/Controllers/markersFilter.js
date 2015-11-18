angular.module('markersFilterMd', [])
    .controller('markersFilterCtrl', function ($timeout, $scope, $rootScope, $state, $filter, apiConnection, taskService, fileHelper) {
        var $trans = $filter('translate');
        //console.log($rootScope.filterSighting);
        //$rootScope.filterSighting = {
        //    Animal: '',
        //    Type: '',
        //    State: ''
        //};


        //$rootScope.filterSighting = JSON.parse(JSON.stringify($rootScope.selectedSighting));
        //
        //$scope.oldSighting = $rootScope.selectedSighting;

        $scope.animalsForFields = getAnimalsForField($rootScope.selectedField);
        $scope.currUsers = getUsersForField($rootScope.selectedField);


        $scope.sightingInvalid = false;


        //$(document).ready(function () {
        //   
        //});
        //$(document).ready(function () { //ionicView.enter
        if ($scope.animalsForFields.length == 0) {
            saveToLocalStorage('fieldsAnimals', []);
            $scope.animalsForFields = [];
            $scope.currFieldAnimals = [];
            $scope.currTypes = [];
            $scope.currStates = [];
            $rootScope.filterSighting.Type = '';
        } else {
            $scope.currFieldAnimals = $scope.animalsForFields; //$scope.animalsForFields[$rootScope.selectedField.FieldId];
            //$scope.currFieldAnimals = [{ name: 'wolf', types: ['lox', 'poc'] }, { name: 'olen', types: [] }];
            //$scope.currTypes = [];
            //$rootScope.filterSighting.Type = '';
            //for (var i = 0; i < $scope.currFieldAnimals.length; i++) {
            //    if ($scope.currFieldAnimals[i].name == $scope.currentSighting.Animal) {
            //        $scope.currTypes = $scope.currFieldAnimals[i].types;
            //        break;
            //    };
            //};
        }


        //});
        //$rootScope.isFiltered = function() {
        //    if ($rootScope.filterStr && $rootScope.filterStr !== ' ')
        //        return false;
        //    else return true;
        //}

        $scope.appendFilterStr = function () {
            if ($state.includes('map'))
                $('.filterBtn span').css('width', '');
            else if ($state.includes('fieldDetails'))
                $('.filterBtn-FD span').css('width', '');

            $rootScope.filterStr = $trans('show');
            var activeFilters = false;

            if (($rootScope.animalFilterLatLngArr &&
                $rootScope.animalFilterLatLngArr.length !== 0 &&
                $rootScope.filterSighting.Animal != '')
                || ($rootScope.animalFilterSightIdArr &&
                $rootScope.animalFilterSightIdArr.length !== 0 &&
                $rootScope.filterSighting.Animal != '')) {
                $rootScope.filterStr = $rootScope.filterStr.concat(' ');
                $rootScope.filterStr = $rootScope.filterStr.concat($rootScope.filterSighting.Animal);
                activeFilters = true;
            };
            if (($rootScope.typeFilterLatLngArr &&
                $rootScope.typeFilterLatLngArr.length !== 0 &&
                $rootScope.filterSighting.Animal != '')
                || ($rootScope.typeFilterSightIdArr &&
                $rootScope.typeFilterSightIdArr.length !== 0 &&
                $rootScope.filterSighting.Animal != '')) {
                if (activeFilters)
                    $rootScope.filterStr = $rootScope.filterStr.concat(', ');
                else
                    $rootScope.filterStr = $rootScope.filterStr.concat(' ');
                $rootScope.filterStr = $rootScope.filterStr.concat($rootScope.filterSighting.Type);
                activeFilters = true;
            };
            if (($rootScope.stateFilterLatLngArr &&
                $rootScope.stateFilterLatLngArr.length !== 0 &&
                $rootScope.filterSighting.Animal != '')
                || ($rootScope.stateFilterSightIdArr &&
                $rootScope.stateFilterSightIdArr.length !== 0 &&
                $rootScope.filterSighting.Animal != '')) {
                if (activeFilters)
                    $rootScope.filterStr = $rootScope.filterStr.concat(', ');
                else
                    $rootScope.filterStr = $rootScope.filterStr.concat(' ');
                $rootScope.filterStr = $rootScope.filterStr.concat($rootScope.filterSighting.State);
                activeFilters = true;
            };
            if (($rootScope.userFilterLatLngArr &&
                $rootScope.userFilterLatLngArr.length !== 0 &&
                $rootScope.filterSighting.Animal != '')
                || ($rootScope.userFilterSightIdArr &&
                $rootScope.userFilterSightIdArr.length !== 0 &&
                $rootScope.filterSighting.Animal != '')) {
                if (activeFilters)
                    $rootScope.filterStr = $rootScope.filterStr.concat(', ');
                else
                    $rootScope.filterStr = $rootScope.filterStr.concat(' ');
                $rootScope.filterStr = $rootScope.filterStr.concat($rootScope.filterSighting.User);
                activeFilters = true;
            };

            if (activeFilters)
                activeFilters = false;
            else
                $rootScope.filterStr = $trans('show_all');
            $scope.$apply();
            if ($state.includes('map')) {
                if ($($('.filterBtn span')[0]).width() > 150) {
                    $('.filterBtn span').css({ 'width': '150px' });
                };
            } else if ($state.includes('fieldDetails'))
                if ($($('.filterBtn-FD span')[0]).width() > 150)
                    $('.filterBtn-FD span').css({ 'width': '150px' });
        }

        $scope.selectAnimal = function (val) {
            $rootScope.filterSighting.Animal = val;
            $("#filterMenu" + $scope.lastIndex).hide("fast");
            for (i = 0; i < $scope.currFieldAnimals.length; i++) {
                if ($scope.currFieldAnimals[i].name == val) {
                    $rootScope.filterSighting.Type = '';
                    $scope.currTypes = $scope.currFieldAnimals[i].types;
                    //$scope.$apply();
                }
            }

            $rootScope.typeFilterLatLngArr = [];
            $rootScope.animalFilterSightIdArr = [];

            $rootScope.typeFilterSightIdArr = [];
            $rootScope.animalFilterLatLngArr = [];
            if ($rootScope.selectedField.Sightings)
                $.each($rootScope.selectedField.Sightings, function (index, sighting) {
                    if (sighting.Animal != $rootScope.filterSighting.Animal) {
                        if ($state.includes('map'))
                            $rootScope.animalFilterLatLngArr.push(L.latLng(sighting.latitude, sighting.longtitude));
                        else if ($state.includes('fieldDetails'))
                            $rootScope.animalFilterSightIdArr.push(sighting.SightingId);
                    }
                });

            $scope.appendFilterStr();
            $rootScope.isFilterArraysChanged = $rootScope.isFilterArraysChanged ? false : true;
        }

        $scope.selectType = function (val) {
            $rootScope.filterSighting.Type = val;
            $("#filterMenu" + $scope.lastIndex).hide("fast");

            $rootScope.typeFilterLatLngArr = [];
            $rootScope.typeFilterSightIdArr = [];

            if ($rootScope.selectedField.Sightings)
                $.each($rootScope.selectedField.Sightings, function (index, sighting) {
                    if (sighting.Type != $rootScope.filterSighting.Type) {
                        if ($state.includes('map'))
                            $rootScope.typeFilterLatLngArr.push(L.latLng(sighting.latitude, sighting.longtitude));
                        else if ($state.includes('fieldDetails'))
                            $rootScope.typeFilterSightIdArr.push(sighting.SightingId);
                    }
                });

            $scope.appendFilterStr();
            $rootScope.isFilterArraysChanged = $rootScope.isFilterArraysChanged ? false : true;
        }

        //if ($rootScope.filterSighting.Animal && $rootScope.filterSighting.Animal != '' && $rootScope.filterSighting.Type == '') {
        //    $scope.selectAnimal($rootScope.filterSighting.Animal);
        //}

        $scope.selectState = function (val) {
            $rootScope.filterSighting.State = val;
            $("#filterMenu" + $scope.lastIndex).hide("fast");
            $rootScope.stateFilterLatLngArr = [];
            $rootScope.stateFilterSightIdArr = [];

            if ($rootScope.selectedField.Sightings)
                $.each($rootScope.selectedField.Sightings, function (index, sighting) {
                    if (sighting.State != $rootScope.filterSighting.State)
                        if ($state.includes('map'))
                            $rootScope.stateFilterLatLngArr.push(L.latLng(sighting.latitude, sighting.longtitude));
                        else if ($state.includes('fieldDetails'))
                            $rootScope.stateFilterSightIdArr.push(sighting.SightingId);
                });

            $scope.appendFilterStr();
            $rootScope.isFilterArraysChanged = $rootScope.isFilterArraysChanged ? false : true;
        }

        $scope.selectUser = function (val) {
            $rootScope.filterSighting.User = val;
            $("#filterMenu" + $scope.lastIndex).hide("fast");
            $rootScope.userFilterLatLngArr = [];
            $rootScope.userFilterSightIdArr = [];

            if ($rootScope.selectedField.Sightings)
                $.each($rootScope.selectedField.Sightings, function (index, sighting) {
                    if (sighting.Hunter.UserName != $rootScope.filterSighting.User)
                        if ($state.includes('map'))
                            $rootScope.userFilterLatLngArr.push(L.latLng(sighting.latitude, sighting.longtitude));
                        else if ($state.includes('fieldDetails'))
                            $rootScope.userFilterSightIdArr.push(sighting.Hunter.UserName);
                });

            $scope.appendFilterStr();
            $rootScope.isFilterArraysChanged = $rootScope.isFilterArraysChanged ? false : true;
        }


        $scope.showAll = function (typeNum) {
            switch (typeNum) {
                case 1:
                    if ($state.includes('map'))
                        $rootScope.sightingCluster.addLayers($rootScope.animalDeletedMarkers);
                    $rootScope.filterSighting.Animal = '';
                    $rootScope.filterSighting.Type = '';
                    $scope.currTypes = [];
                    $rootScope.animalFilterLatLngArr = [];
                    $rootScope.typeFilterLatLngArr = [];

                    $rootScope.animalFilterSightIdArr = [];
                    $rootScope.typeFilterSightIdArr = [];

                    $("#filterMenu" + $scope.lastIndex).hide("fast");
                    break;
                case 2:
                    if ($state.includes('map'))
                        $rootScope.sightingCluster.addLayers($rootScope.typeDeletedMarkers);
                    $rootScope.filterSighting.Type = '';
                    $rootScope.typeFilterLatLngArr = [];
                    $rootScope.typeFilterSightIdArr = [];
                    $("#filterMenu" + $scope.lastIndex).hide("fast");
                    break;
                case 3:
                    if ($state.includes('map'))
                        $rootScope.sightingCluster.addLayers($rootScope.userDeletedMarkers);
                    $rootScope.filterSighting.User = '';
                    $rootScope.userFilterLatLngArr = [];
                    $rootScope.userFilterSightIdArr = [];
                    $("#filterMenu" + $scope.lastIndex).hide("fast");
                    break;
                case 4:
                    if ($state.includes('map'))
                        $rootScope.sightingCluster.addLayers($rootScope.stateDeletedMarkers);
                    $rootScope.filterSighting.State = '';
                    $rootScope.stateFilterLatLngArr = [];
                    $rootScope.stateFilterSightIdArr = [];
                    $("#filterMenu" + $scope.lastIndex).hide("fast");
                    break;
                case 5:
                    if ($state.includes('map')) {
                        $rootScope.sightingCluster.addLayers($rootScope.deletedClusterMarkersArr);
                        $rootScope.deletedClusterMarkersArr = [];
                        $rootScope.animalFilterLatLngArr = [];
                        $rootScope.typeFilterLatLngArr = [];
                        $rootScope.stateFilterLatLngArr = [];
                        $rootScope.userFilterLatLngArr = [];
                    }
                    else if ($state.includes('fieldDetails')) {
                        $rootScope.animalFilterSightIdArr = [];
                        $rootScope.typeFilterSightIdArr = [];
                        $rootScope.stateFilterSightIdArr = [];
                        $rootScope.userFilterSightIdArr = [];
                    };
                    $rootScope.filterSighting.Animal = '';
                    $rootScope.filterSighting.Type = '';
                    $rootScope.filterSighting.State = '';
                    $rootScope.filterSighting.User = '';
                    $scope.currTypes = [];
                    break;
            }

            $scope.appendFilterStr();
            $rootScope.isFilterArraysChanged = $rootScope.isFilterArraysChanged ? false : true;
        }

        $scope.toggleSightDetails = function (index) {
            if ($scope.lastIndex && index != $scope.lastIndex)
                $("#filterMenu" + $scope.lastIndex).hide("fast");
            $scope.lastIndex = index;//to toggle last opened menu
            $("#filterMenu" + index).fadeToggle("fast");
        }

        $scope.checkState = function () {
            if ($state.includes('map'))
                return true;
            else if ($state.includes('filedDetails'))
                return false;
        }

        $scope.getBackgroundSize = function () {
            var w = $('.backgroundSize').width();
            var h = $('.backgroundSize').height();
            var str = w + 'px ' + h + 'px;'
        }


        $scope.isLocaL = function (data) {
            return isLocal(data);
        }


    });