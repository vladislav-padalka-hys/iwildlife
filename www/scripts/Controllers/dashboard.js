/// <reference path="../index.js" />
var init = true;

angular.module('dashboardCtrlMd', ['ui.router'])

.controller('DashboardCtrl', function ($scope, $rootScope, $filter, $translate, $state, apiConnection, fileHelper, taskService, $cordovaGeolocation, $cordovaNetwork, $timeout, $ionicScrollDelegate, $ionicHistory) {
    $scope.show = true;
    $scope.first = true;

    $scope.isLocal = function (atr) {
        return isLocal(atr);
    }

    $rootScope.timeout = null;
    $rootScope.fieldListPositioned = false;
    $scope.max = 0;

    $rootScope.setItemSize = function () {
        var displayWidth = window.innerWidth * 0.9;
        var divider = 0;

        if (displayWidth >= 1024)
            divider = 3;
        else if (displayWidth <= 1024 && displayWidth >= 480)
            divider = 2;
        else
            divider = 1;

        var itemWidth = displayWidth / divider;
        $rootScope.itemWidth = itemWidth;
        setTimeout(function () {
            $('.fieldWrap').css('width', $rootScope.itemWidth);
            var containerWidth = $rootScope.itemWidth * ($rootScope.fields.length + 1) + 10;
            $('.fieldsListContainer').css('width', containerWidth);
        }, 150);
    }

    $scope.scrollTrigger = function () {
        if (!$rootScope.timeout) {
            $rootScope.timeout = new Date();
            setInterval(function () {
                //console.log('max: ' + $scope.max);
                if (!$rootScope.fieldListPositioned) {
                    var lastChecked = (new Date()) - $rootScope.timeout;
                    if (lastChecked > 250) {

                        $rootScope.fieldListPositioned = true;
                        $scope.max = 0;



                        //$scope.itemWidth = displayWidth / divider;
                        //$('.fieldWrap').css('width', itemWidth);
                        //var containerWidth = $rootScope.itemWidth;
                        //
                        //$('.fieldsListContainer').css('width', containerWidth);
                        try
                        {
                            var currpos = $ionicScrollDelegate.$getByHandle('fieldsListScroll').getScrollPosition().left;
                            var currSlide = Math.round(currpos / $rootScope.itemWidth);
                            var endPosition = currSlide * $rootScope.itemWidth;
                            $rootScope.byCode = true;
                            setTimeout(function () {
                                $rootScope.byCode = false;
                            }, 400);
                            $ionicScrollDelegate.$getByHandle('fieldsListScroll').scrollTo(endPosition, 0, true);
                        }
                        catch (Ex) {

                        }
                    }
                }
            }, 500);
        }
        else {
            if (!$rootScope.byCode) {
                //console.log('qwe');
                //var gap = (new Date()) - $rootScope.timeout;
                ////console.log(gap);
                //if (gap > $scope.max)
                //    $scope.max = gap;
                $rootScope.fieldListPositioned = false;
                $rootScope.timeout = new Date();
            }
        }
    }

    $scope.$on('$ionicView.afterEnter', function (e) {
        if ($scope.first)
            $ionicHistory.clearCache();

        $scope.first = false;

        $rootScope.updateFields();

        setTimeout(function () {
            $('.fieldWrap').css('width', $rootScope.itemWidth);
            var containerWidth = $rootScope.itemWidth * ($rootScope.fields.length + 1) + 10;
            $('.fieldsListContainer').css('width', containerWidth);
        }, 500);

        var posOptions = { timeout: 10000, enableHighAccuracy: false, maximumAge: 1800000 };

        $cordovaGeolocation
          .getCurrentPosition(posOptions)
          .then(function (position) {
              $rootScope.latitude = position.coords.latitude.toString();
              $rootScope.longtitude = position.coords.longitude.toString();
              apiConnection.getSelfWeather().then(function (data) {
                  $scope.curWeather.array = data;
                  $scope.curWeather.exp = false;
                  $scope.curWeather.date = new Date();
              }, function (error) {

              });

          }, function (err) {
              // error
          });

        $timeout(function () { $rootScope.$broadcast('loading:hide'); }, 10000);
    })

    $scope.$on('$ionicView.beforeEnter', function (e) {
        if (!$rootScope.fields) {
            console.log("no fields in file");
            $rootScope.fields = [];
        }
        console.log("dashboard view enter");
    })

    $scope.curWeather = {};

    $scope.expWeather = function () {
        $scope.curWeather.exp = !$scope.curWeather.exp;
    }

    $scope.getDistance = function (data) {
        return getDistance(data);
    }
    //var watchOptions = {
    //    frequency: 1000,
    //    timeout: 60000,
    //    enableHighAccuracy: false 
    //};

    //var watch = $cordovaGeolocation.watchPosition(watchOptions);
    //watch.then(
    //  null,
    //  function (err) {
    //      // error
    //  },
    //  function (position) {
    //      if(Math.abs(parseFloat($rootScope.latitude)-position.coords.latitude)>0.1 || Math.abs(parseFloat($rootScope.longtitude)-position.coords.longtitude)>0.1)
    //      {
    //          $rootScope.latitude = position.coords.latitude.toString();
    //          $rootScope.longtitude = position.coords.longitude.toString();
    //          apiConnection.getSelfWeather().then(function (data) {
    //              $scope.curWeather.array = data;
    //              $scope.curWeather.exp = false;
    //              $scope.curWeather.date = new Date();
    //          });
    //      }
    //  });


    //watch.clearWatch();

    $rootScope.downloadSIghtingsImages = function (fieldIndex) {
        for (i = 0; i < $rootScope.fields[fieldIndex].Sightings.length; i++) {
            var currSight = $rootScope.fields[fieldIndex].Sightings[i];
            if (currSight.Images)
                for (k = 0; k < currSight.Images.length; k++) {
                    var backreference = {
                        field: $rootScope.fields[fieldIndex],
                        sighting: currSight,
                        Image: k
                    };
                    if (currSight.Images[k])
                        if (currSight.Images[k].SRC)
                            if (!isLocal(currSight.Images[k].SRC))
                                apiConnection.downloadImage(currSight.Images[k].SRC, getNameFromUrl(currSight.Images[k].SRC), backreference).then(function (data) {
                                    data.index.sighting.Images[data.index.Image].SRC = data.URL.name;
                                    console.log("Field with ID:" + data.index.field.FieldId + " updated Sighting Images[" + data.index.Image + "] with ID:" + data.index.sighting.SightingId + " (rewriting file)");
                                    fileHelper.saveToFile($rootScope.fields, 'fields.txt');
                                    //saveToFile("fields", $rootScope.fields);
                                    //TODO write data with help of backreference
                                    //$rootScope.fields[data.index].Image.SRC = data.Image;
                                }, function (data) {
                                    var iii = 0;
                                    console.log("Field with ID:" + data.index.field.FieldId + "failed  to update Sighting Images[" + data.index.Image + "] with ID:" + data.index.sighting.SightingId);
                                    $rootScope.lastUpdated = $rootScope.previousUpdated;
                                    saveToLocalStorage('lastUpdated', $rootScope.lastUpdated);
                                });
                }

            if (currSight.Image)
                if (currSight.Image.SRC)
                    if (!isLocal(currSight.Image.SRC)) {
                        var backreference = {
                            field: $rootScope.fields[fieldIndex],
                            sighting: currSight
                        };
                        apiConnection.downloadImage(currSight.Image.SRC, getNameFromUrl(currSight.Image.SRC), backreference).then(function (data) {
                            data.index.sighting.Image.SRC = data.URL.name;
                            console.log("Field with ID:" + data.index.field.FieldId + " updated Sighting Image with ID:" + data.index.sighting.SightingId + " (rewriting file)");
                            fileHelper.saveToFile($rootScope.fields, 'fields.txt');
                            //saveToFile("fields", $rootScope.fields);
                            //TODO write data with help of backreference
                            //$rootScope.fields[data.index].Image.SRC = data.Image;
                        }, function (data) {
                            var iii = 0;
                            console.log("Field with ID:" + data.index.field.FieldId + "failed  to update Sighting Image with ID:" + data.index.sighting.SightingId);
                            $rootScope.lastUpdated = $rootScope.previousUpdated;
                            saveToLocalStorage('lastUpdated', $rootScope.lastUpdated);
                        });
                    }
        }

    }

    $rootScope.downloadPOIsImages = function (fieldIndex) {
        for (i = 0; i < $rootScope.fields[fieldIndex].POIs.length; i++) {
            var currPOI = $rootScope.fields[fieldIndex].POIs[i];
            if (currPOI.Images)
                for (k = 0; k < currPOI.Images.length; k++) {
                    var backreference = {
                        field: $rootScope.fields[fieldIndex],
                        POI: currPOI,
                        Image: k
                    };
                    if (currPOI.Images[k])
                        if (currPOI.Images[k].SRC)
                            if (!isLocal(currPOI.Images[k].SRC))
                                apiConnection.downloadImage(currPOI.Images[k].SRC, getNameFromUrl(currPOI.Images[k].SRC), backreference).then(function (data) {
                                    data.index.POI.Images[data.index.Image].SRC = data.URL.name;
                                    console.log("Field with ID:" + data.index.field.FieldId + " updated POI Images[" + data.index.Image + "] with ID:" + data.index.POI.POIId + " (rewriting file)");
                                    fileHelper.saveToFile($rootScope.fields, 'fields.txt');
                                    //saveToFile("fields", $rootScope.fields);
                                    //TODO write data with help of backreference
                                    //$rootScope.fields[data.index].Image.SRC = data.Image;
                                }, function (data) {
                                    var iii = 0;
                                    console.log("Field with ID:" + data.index.field.FieldId + "failed  to update POI Images[" + data.index.Image + "] with ID:" + data.index.POI.POIId);
                                    $rootScope.lastUpdated = $rootScope.previousUpdated;
                                    saveToLocalStorage('lastUpdated', $rootScope.lastUpdated);
                                });
                }

            if (currPOI.Image)
                if (currPOI.Image.SRC)
                    if (!isLocal(currPOI.Image.SRC))
                        apiConnection.downloadImage(currPOI.Image.SRC, getNameFromUrl(currPOI.Image.SRC), backreference).then(function (data) {
                            data.index.POI.Image.SRC = data.URL.name;
                            console.log("Field with ID:" + data.index.field.FieldId + " updated POI Image with ID:" + data.index.POI.POIId + " (rewriting file)");
                            fileHelper.saveToFile($rootScope.fields, 'fields.txt');
                            //saveToFile("fields", $rootScope.fields);
                            //TODO write data with help of backreference
                            //$rootScope.fields[data.index].Image.SRC = data.Image;
                        }, function (data) {
                            var iii = 0;
                            console.log("Field with ID:" + data.index.field.FieldId + "failed  to update POI Image with ID:" + data.index.POI.POIId);
                            $rootScope.lastUpdated = $rootScope.previousUpdated;
                            saveToLocalStorage('lastUpdated', $rootScope.lastUpdated);
                        });
        }

    }

    $scope.toggleMenu = function () {
        $("#menu").fadeToggle("fast");
    }

    $scope.settings = function () {
        $state.go('settings.about');
    }

    $scope.showAddDialog = function () {
        $state.go('createMap');
    }

    $scope.getDatadDir = function () {
        return cordova.file.dataDirectory;
    }

    $scope.showField = function (field) {
        $rootScope.selectedField = field;
        $rootScope.selectedField.Sightings = ($rootScope.selectedField.Sightings) ? $rootScope.selectedField.Sightings : [];
        $rootScope.sightCount = $rootScope.selectedField.Sightings.length;

        $state.go('fieldDetails');
        //$state.go('map');
        //$state.go('createMap');

    }

    $scope.expandWeather = function (field) {
        if (field.isWeatherExpanded == undefined) { field.isWeatherExpanded = true; field.hideTitle = true; }

        else {
            field.isWeatherExpanded = !field.isWeatherExpanded;
            if (field.hideTitle)
                $timeout(function () {
                    field.hideTitle = !field.hideTitle;
                }, 1000);
            else field.hideTitle = !field.hideTitle;
        }
    }

    $scope.isSunny = function () {
        if ($scope.curWeather.array) {
            var result = true;
            var date = new Date();
            var today = $filter('date')(date, 'yyyy-MM-dd');
            var hours = $filter('date')(date, 'H');
            var minutes = $filter('date')(date, 'm');
            var sun = $scope.curWeather.array[0].AstronomyObject.Sun;
            var rise = {};
            var set = {};
            for (var j = 0; j < sun.events.length; j++) {
                if (sun.events[j].type == "rise") rise = sun.events[j];
                else if (sun.events[j].type == "set") set = sun.events[j];
            }
            if (hours < rise.hour) {
                result = false;
            }
            else if (hours == rise.hour && minutes < rise.min) {
                result = false;
            }
            else if (hours > set.hour) {
                result = false;
            }
            else if (hours == set.hour && minutes > set.min) {
                result = false;
            }
            else result = true;
            //alert("IsSunTime:" + result);
            return result;
        }
    }

    $scope.getWindowName = function (wcode) {
        var result = "no_weather";
        switch (wcode) {
            case 113: //Clear/Sunny
                result = "clear";
                break;
            case 116: //Partly Cloudy
                result = "partly_cloudy"
                break;
            case 119: //Cloudy
                result = "cloudy";
                break;
            case 122: //Overcast
                result = "overcast";
                break;
            case 143: //Mist
                result = "fog";
                break;
            case 248: //Fog same^
                result = "fog";
                break;
            case 260: //Freezing fog same^
                result = "fog";
                break;
            case 176: //Patchy rain nearby
                result = "rain";
                break;
            case 293: //Patchy light rain same^
                result = "rain";
                break;
            case 296: //Light rain same^
                result = "rain";
                break;
            case 353: //Light rain shower same^
                result = "rain";
                break;
            case 356: //Moderate or heavy rain shower same^
                result = "moderate_rain";
                break;
            case 263: //Patchy light drizzle same^
                result = "rain";
                break;
            case 179: //Patchy snow nearby
                result = "snow";
                break;
            case 182: //Patchy sleet nearby
                result = "sleet";
                break;
            case 185: //Patchy freezing drizzle nearby same^
                result = "freezing_drizzle";
                break;
            case 311: //Light freezing rain same^
                result = "freezing_drizzle";
                break;
            case 314: //Moderate or Heavy freezing rain same^
                result = "freezing_drizzle";
                break;
            case 317: //Light sleet same^
                result = "sleet";
                break;
            case 362: //Light sleet showers same^
                result = "sleet";
                break;
            case 365: //Moderate or heavy sleet same^
                result = "sleet";
                break;
            case 200: //Thundery outbreaks in nearby
                result = "storm_showers";
                break;
            case 386: //Patchy light rain in area with thunder same^
                result = "storm_showers";
                break;
            case 227: //Blowing snow
                result = "snow_wind";
                break;
            case 323: //Patchy light snow same^
                result = "snow";
                break;
            case 326: //Light snow same^
                result = "snow";
                break;
            case 230: //Blizzard same^
                result = "heavy_snow";
                break;
            case 335: //Patchy heavy snow same^
                result = "heavy_snow";
                break;
            case 368: //Light snow showers same^
                result = "snow";
                break;
            case 266: //Light drizzle
                result = "rain";
                break;
            case 281: //Freezing drizzle
                result = "freezing_drizzle";
                break;
            case 284: //Heavy freezing drizzle
                result = "freezing_drizzle";
                break;
            case 299: //Moderate rain at times
                result = "moderate_rain";
                break;
            case 305: //Heavy rain at times same^
                result = "heavy_rain";
                break;
            case 302: //Moderate rain
                result = "moderate_rain";
                break;
            case 308: //Heavy rain same^
                result = "heavy_rain";
                break;
            case 359: //Torrential rain shower same^
                result = "rain";
                break;
            case 320: //Moderate or heavy sleet
                result = "sleet";
                break;
            case 329: //Patchy moderate snow
                result = "snow_wind";
                break;
            case 332: //Moderate snow same^
                result = "snow_wind";
                break;
            case 338: //Heavy snow same^
                result = "heavy_snow";
                break;
            case 371: //Moderate or heavy snow showers same^
                result = "heavy_snow";
                break;
            case 350: //Ice pellets
                result = "ice_pellets";
                break;
            case 374: //Light showers of ice pellets same^
                result = "ice_pellets";
                break;
            case 377: //Moderate or heavy showers of ice pellets same^
                result = "ice_pellets";
                break;
            case 389: //Moderate or heavy rain in area with thunder
                result = "rain_with_thunder";
                break;
            case 392: //Patchy light snow in area with thunder
                result = "thunderstorm_snow";
                break;
            case 395: //Moderate or heavy snow in area with thunder
                result = "thunderstorm_snow";
                break;
            default:
                result = "no_weather";
                break;
        }
        return result;
    }

    $rootScope.time = function (str) {
        var curDate = new Date(str);
        //curDate = convertUTCDateToLocalDate(curDate);
        //return curDate.getHours() + ":" + (curDate.getMinutes() < 10 ? '0' : '') + curDate.getMinutes();
        return curDate.getHours() + ":" + curDate.getMinutes();
    }

    $rootScope.isSunTimeSight = function (sighting) {
        if (sighting) {
            var result = true;
            var date = new Date(sighting.Date);
            var hours = $filter('date')(date, 'H');
            var minutes = $filter('date')(date, 'm');
            var sun = sighting.Weather.AstronomyObject.Sun;
            var rise = {};
            var set = {};
            for (var j = 0; j < sun.events.length; j++) {
                if (sun.events[j].type == "rise") rise = sun.events[j];
                else if (sun.events[j].type == "set") set = sun.events[j];
            }
            if (hours < rise.hour) {
                result = false;
            }
            else if (hours == rise.hour && minutes < rise.min) {
                result = false;
            }
            else if (hours > set.hour) {
                result = false;
            }
            else if (hours == set.hour && minutes > set.min) {
                result = false;
            }
            else result = true;
            return result;
        }
    }

    $rootScope.getHourly = function (date) {
        var hours = $filter('date')((date == undefined) ? new Date() : new Date(date), 'H');
        if (parseInt(hours) < 12) { return 0; }
        else { return 1; }
    }

    $rootScope.getWeatherIndex = function (field, dateISO) {
        if (field && field.weather && field.weather.length > 0) {
            var date = (dateISO == undefined) ? new Date() : new Date(dateISO);
            var today = $filter('date')(date, 'yyyy-MM-dd');
            for (var i = 0; i < field.weather.length; i++) {
                if (field.weather[i].date == today) {
                    return i;
                }
            }
        }
        return -1;
    }

    $rootScope.getTemperature = function (data) {
        return getTemperature(data);
    }

    $rootScope.getSunriseTime = function (astronomyObject) {
        for (var j = 0; j < astronomyObject.Sun.events.length; j++) {
            if (astronomyObject.Sun.events[j].type == "rise") return astronomyObject.Sun.events[j].hour + ':' + astronomyObject.Sun.events[j].min;
        }
    }

    $rootScope.getSunsetTime = function (astronomyObject) {
        for (var j = 0; j < astronomyObject.Sun.events.length; j++) {
            if (astronomyObject.Sun.events[j].type == "set") return astronomyObject.Sun.events[j].hour + ':' + astronomyObject.Sun.events[j].min;
        }
    }

    $rootScope.getTwi12StartTime = function (astronomyObject) {
        for (var j = 0; j < astronomyObject.Sun.events.length; j++) {
            if (astronomyObject.Sun.events[j].type == "twi12_start") return astronomyObject.Sun.events[j].hour + ':' + astronomyObject.Sun.events[j].min;
        }
    }

    $rootScope.getTwi12EndTime = function (astronomyObject) {
        for (var j = 0; j < astronomyObject.Sun.events.length; j++) {
            if (astronomyObject.Sun.events[j].type == "twi12_end") return astronomyObject.Sun.events[j].hour + ':' + astronomyObject.Sun.events[j].min;
        }
    }

    $rootScope.getMoonsetTime = function (astronomyObject) {
        for (var j = 0; j < astronomyObject.Moon.events.length; j++) {
            if (astronomyObject.Moon.events[j].type == "set") return astronomyObject.Moon.events[j].hour + ':' + astronomyObject.Moon.events[j].min;
        }
    }

    $rootScope.getMoonriseTime = function (astronomyObject) {
        for (var j = 0; j < astronomyObject.Moon.events.length; j++) {
            if (astronomyObject.Moon.events[j].type == "rise") return astronomyObject.Moon.events[j].hour + ':' + astronomyObject.Moon.events[j].min;
        }
    }

    $rootScope.getTime = function (data, isObj) {
        if (data) {
            if (isObj) {
                return getTime($filter('date')(data, 'H:mm'));
            }
            else {
                var timeArr = data.split(":");
                var minutes = parseInt(timeArr[1]);
                return getTime(timeArr[0] + ":" + (minutes < 10 ? '0' : '') + minutes);
            }
        }
    }

    $rootScope.isSunTime = function (field) {
        if (field && field.weather && field.weather.length > 0) {
            var result = true;
            var date = new Date();
            var today = $filter('date')(date, 'yyyy-MM-dd');
            for (var i = 0; i < field.weather.length; i++) {
                if (field.weather[i].date == today) {
                    var hours = $filter('date')(date, 'H');
                    var minutes = $filter('date')(date, 'm');
                    var sun = field.weather[i].AstronomyObject.Sun;
                    var rise = {};
                    var set = {};
                    for (var j = 0; j < sun.events.length; j++) {
                        if (sun.events[j].type == "rise") rise = sun.events[j];
                        else if (sun.events[j].type == "set") set = sun.events[j];
                    }
                    if (hours < rise.hour) {
                        result = false;
                    }
                    else if (hours == rise.hour && minutes < rise.min) {
                        result = false;
                    }
                    else if (hours > set.hour) {
                        result = false;
                    }
                    else if (hours == set.hour && minutes > set.min) {
                        result = false;
                    }
                    else result = true;
                    break;
                }
            }
            //alert("IsSunTime:" + result);
            return result;
        }
    }

    $rootScope.isSunTime = function (field, dateISO) {
        if (field && field.weather && field.weather.length > 0) {
            var result = true;
            var date = (dateISO == undefined) ? new Date() : new Date(dateISO);
            var today = $filter('date')(date, 'yyyy-MM-dd');
            for (var i = 0; i < field.weather.length; i++) {
                if (field.weather[i].date == today) {
                    var hours = $filter('date')(date, 'H');
                    var minutes = $filter('date')(date, 'm');
                    var sun = field.weather[i].AstronomyObject.Sun;
                    var rise = {};
                    var set = {};
                    for (var j = 0; j < sun.events.length; j++) {
                        if (sun.events[j].type == "rise") rise = sun.events[j];
                        else if (sun.events[j].type == "set") set = sun.events[j];
                    }
                    if (hours < rise.hour) {
                        result = false;
                    }
                    else if (hours == rise.hour && minutes < rise.min) {
                        result = false;
                    }
                    else if (hours > set.hour) {
                        result = false;
                    }
                    else if (hours == set.hour && minutes > set.min) {
                        result = false;
                    }
                    else result = true;
                    break;
                }
            }
            return result;
        }
    }

    $rootScope.date = function (str) {
        var curDate = new Date(str);
        return curDate.getDate() + "/" + (curDate.getMonth() + 1) + "/" + curDate.getFullYear();
    }

});