// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', [
        'ionic', 'starter.controllers', 'ngCordova', 'ionic.service.core', 'ionic.service.push', 'pascalprecht.translate',
        'apiConn',
        'taskSvc',
        'fileHelp',
        'loginCtrlMd',
        'dashboardCtrlMd',
        'fieldDetailsCtrlMd',
        'registerCtrlMd',
        'forgotPasswordMd',
        'addFieldCtrlMd',
        'popupAlertCtrlMd',
        'aboutMd',
        'personalInfoCtrlMd',
        'mapMd',
        'createMapMd',
        'cleanMapMD',
        'textAreaMd',
        'addSightingCtrlMd',
        'addPointOfInterestMd',
        'addSightingOrPoiMd',
        'pinCtrlMd',
        'editFieldCtrlMd',
        'showSightingInfoCtrlMd',
        'showPOIInfoCtrlMd',
        'editSightingCtrlMd',
        'editPOICtrlMd',
        'markersFilterMd',
        'invitesCtrlMd',
        'managesCtrlMd',
        'popupPushCtrlMd'

], function ($httpProvider) {
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    /**
* The workhorse; converts an object to x-www-form-urlencoded serialization.
* @param {Object} obj
* @return {String}
*/
    var param = function (obj) {
        var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

        for (name in obj) {
            value = obj[name];

            if (value instanceof Array) {
                for (i = 0; i < value.length; ++i) {
                    subValue = value[i];
                    fullSubName = name + '[' + i + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            } else if (value instanceof Object) {
                for (subName in value) {
                    subValue = value[subName];
                    fullSubName = name + '[' + subName + ']';
                    innerObj = {};
                    innerObj[fullSubName] = subValue;
                    query += param(innerObj) + '&';
                }
            } else if (value !== undefined && value !== null)
                query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
        }

        return query.length ? query.substr(0, query.length - 1) : query;
    };

    // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [
        function (data) {
            return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
        }
    ];
})
//.directive('movePopup', function($ionicPopup) {
//    return {
//        restrict: 'A',
//        link: function(scope, element, attrs) { 
//            element.parent().parent().css('top', rowHeight * scope.index + somethingElse + 'px');
//        }
//    }
//})



.factory('Camera', [
    '$q', function ($q) {

        return {
            getPicture: function (options) {
                var q = $q.defer();

                navigator.camera.getPicture(function (result) {
                    // Do any magic you need
                    q.resolve(result);
                }, function (err) {
                    q.reject(err);
                }, options);

                return q.promise;
            }
        }
    }
])

.factory('$cordovaPush', ['$q', '$window', '$rootScope', '$timeout', function ($q, $window, $rootScope, $timeout) {
    return {
        onNotification: function (notification) {
            $timeout(function () {
                $rootScope.$broadcast('$cordovaPush:notificationReceived', notification);
            });
        },

        register: function (config) {
            var q = $q.defer();
            var injector;
            if (config !== undefined && config.ecb === undefined) {
                if (document.querySelector('[ng-app]') === null) {
                    injector = "document.body";
                }
                else {
                    injector = "document.querySelector('[ng-app]')";
                }
                config.ecb = "angular.element(" + injector + ").injector().get('$cordovaPush').onNotification";
            }

            $window.plugins.pushNotification.register(function (token) {
                q.resolve(token);
            }, function (error) {
                q.reject(error);
            }, config);
            return q.promise;
        },

        unregister: function (options) {
            var q = $q.defer();
            $window.plugins.pushNotification.unregister(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            }, options);

            return q.promise;
        },

        // iOS only
        setBadgeNumber: function (number) {
            var q = $q.defer();
            $window.plugins.pushNotification.setApplicationIconBadgeNumber(function (result) {
                q.resolve(result);
            }, function (error) {
                q.reject(error);
            }, number);
            return q.promise;
        }
    };
}])
.factory('$cordovaFileTransfer', [
    '$q', '$timeout', function ($q, $timeout) {
        return {
            download: function (source, filePath, options, trustAllHosts) {
                var q = $q.defer();
                var ft = new FileTransfer();
                var uri = (options && options.encodeURI === false) ? source : encodeURI(source);

                if (options && options.timeout !== undefined && options.timeout !== null) {
                    $timeout(function () {
                        ft.abort();
                    }, options.timeout);
                    options.timeout = null;
                }

                ft.onprogress = function (progress) {
                    q.notify(progress);
                };

                q.promise.abort = function () {
                    ft.abort();
                };

                ft.download(uri, filePath, q.resolve, q.reject, trustAllHosts, options);
                return q.promise;
            },

            upload: function (server, filePath, options, trustAllHosts) {
                var q = $q.defer();
                var ft = new FileTransfer();
                var uri = (options && options.encodeURI === false) ? server : encodeURI(server);

                if (options && options.timeout !== undefined && options.timeout !== null) {
                    $timeout(function () {
                        ft.abort();
                    }, options.timeout);
                    options.timeout = null;
                }

                ft.onprogress = function (progress) {
                    q.notify(progress);
                };

                q.promise.abort = function () {
                    ft.abort();
                };

                ft.upload(filePath, uri, q.resolve, q.reject, options, trustAllHosts);
                return q.promise;
            }
        };
    }
])
.factory('mapFactory', function ($rootScope) {

    var geoCoord = [];

    var loadSightings = function (sightings, drawLayers, sightingCluster) {
        var geoJsonMarker;

        for (var i = 0; i < sightings.length; i++) {
            geoJsonMarker = {
                "type": "Point",
                "coordinates": [
                    sightings[i].longtitude,
                    sightings[i].latitude
                ]
            };


            var newGeoMarker = L.geoJson(geoJsonMarker, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, { icon: $rootScope.sightingIcon });
                }
            });

            drawLayers.addLayer(newGeoMarker.getLayers()[0]);
            sightingCluster.addLayer(newGeoMarker.getLayers()[0]);

        }
    };

    var loadPOIs = function (pois, drawLayers, poiCluster) {
        var geoJsonMarker;
        if (pois) {
            for (var i = 0; i < pois.length; i++) {
                geoJsonMarker = {
                    "type": "Point",
                    "coordinates": [
                        pois[i].longtitude,
                        pois[i].latitude
                    ]
                };

                var newGeoMarker = L.geoJson(geoJsonMarker, {
                    pointToLayer: function (feature, latlng) {
                        return L.marker(latlng, { icon: $rootScope.poiIcon });
                    }
                });

                drawLayers.addLayer(newGeoMarker.getLayers()[0]);
                poiCluster.addLayer(newGeoMarker.getLayers()[0]);
            }
        }
    };

    var loadField = function (fieldCoordArr, drawLayers, map) {
        var arr = [];
        var isExist = false;
        var idx = 0;
        var geoJsonPolygon;

        for (var i = 0; i < fieldCoordArr.length; i++) {
            for (var j = 0; j < arr.length; j++) {
                if (arr[j] !== undefined)
                    if (arr[j][0] === fieldCoordArr[i].lng && arr[j][1] === fieldCoordArr[i].lat) {
                        isExist = true;
                        break;
                    }
            };
            if (!isExist) {
                arr[idx++] = [fieldCoordArr[i].lng, fieldCoordArr[i].lat];
            } else
                isExist = false;

        }

        geoJsonPolygon = {
            "type": "Polygon",
            "coordinates": [
                arr
            ]
        };
        $rootScope.isPolygonCreated = true;

        drawLayers.addLayer(L.geoJson(geoJsonPolygon).getLayers()[0]);
        map.fitBounds(L.geoJson(geoJsonPolygon).getLayers()[0].getBounds());
    };

    var latLngsToLocalStorage = function (type, coord) {
        var geoObjTmp = {
            type: '',
            coord: null
        };
        geoObjTmp.type = type;
        geoObjTmp.coord = coord;
        geoCoord.push(geoObjTmp);
        saveToLocalStorage('geoObjCoordArr', geoCoord);
    };

    var loadLatLngsFromLocalStorage = function (drawLayer) {
        var geoObjArr = readFromLocalStorage('geoObjCoordArr');
        console.log(geoObjArr);
        var arr = [];
        var isExist = false;
        var idx = 0;
        var latLngsObj = {
            ininitLatLngs: null,
            convertArr: null
        };
        var geoJsonObj;
        if (geoObjArr === null) {
            console.log('hello!');
            return;
        }
        $.each(geoObjArr, function (index, value) {
            if (value.type === 'Polygon') {
                console.log('polygon');

                for (var i = 0; i < value.coord.length; i++) {
                    for (var j = 0; j < arr.length; j++) {
                        if (arr[j] !== undefined)
                            if (arr[j][0] === value.coord[i].lng && arr[j][1] === value.coord[i].lat) {
                                isExist = true;
                                break;
                            }
                    };
                    if (!isExist) {
                        arr[idx++] = [value.coord[i].lng, value.coord[i].lat];
                    } else
                        isExist = false;

                }
                latLngsObj.ininitLatLngs = value.coord;
                latLngsObj.convertArr = arr;

                geoJsonObj = {
                    "type": "Polygon",
                    "coordinates": [
                        latLngsObj.convertArr
                    ]
                };
                drawLayer.addLayer(L.geoJson(geoJsonObj));
                $rootScope.fieldBounds = latLngsObj.ininitLatLngs;
            };

            if (value.type === 'Point') {
                latLngsObj.ininitLatLngs = value.coord;

                latLngsObj.convertArr = L.latLng(value.coord.lng, value.coord.lat);
                console.log('Point coord: ');

                geoJsonObj = {
                    "type": "Point",
                    "coordinates": [value.coord.lng, value.coord.lat]
                };
                drawLayer.addLayer(L.geoJson(geoJsonObj));
            };
        });
    };

    return {
        latLngsToLocalStorage: latLngsToLocalStorage,
        loadLatLngsFromLocalStorage: loadLatLngsFromLocalStorage,
        loadField: loadField,
        loadSightings: loadSightings,
        loadPOIs: loadPOIs
    }
})

.directive('ngPlaceholder', function () {
    return {
        restrict: 'A',
        scope: {
            placeholder: '=ngPlaceholder'
        },
        link: function (scope, elem, attr) {
            scope.$watch('placeholder', function () {
                elem[0].placeholder = scope.placeholder;
            });
        }
    }
})

.run(function ($ionicPlatform, $timeout, $rootScope, $ionicHistory, $ionicPopup, $ionicModal, $ionicLoading, $translate, $filter, fileHelper, apiConnection, $state, $cordovaNetwork, taskService) {
    $ionicPlatform.registerBackButtonAction(function (e) {

    }, 101);


    $rootScope.neutralIcon = L.icon({
        iconUrl: 'images/neutral_icon/ico_new_marker_neutral.png',
        iconRetinaUrl: 'images/neutral_icon/ico_new_marker_neutral@2x.png',
        iconSize: [20, 30],
        iconAnchor: [0, 0],
        popupAnchor: [0, 0],
        shadowUrl: '',
        shadowRetinaUrl: '',
        shadowSize: [15, 10],
        shadowAnchor: [0, 5]
    });

    $rootScope.draggingIcon = L.icon({
        iconUrl: 'images/field/dragging_yellow_marker@2x.png',
        iconRetinaUrl: 'images/field/dragging_yellow_marker_big@2x.png',
        iconSize: [20, 30],
        iconAnchor: [0, 0],
        popupAnchor: [0, 0],
        shadowUrl: '',
        shadowRetinaUrl: '',
        shadowSize: [15, 10],
        shadowAnchor: [0, 5]
    });

    $rootScope.sightingIcon = L.icon({
        iconUrl: 'images/sightings/sighting_marker@2x.png',
        iconRetinaUrl: 'images/sightings/sighting_marker_big@2x.png',
        iconSize: [20, 30],
        iconAnchor: [0, 0],
        popupAnchor: [0, 0],
        shadowUrl: '',
        shadowRetinaUrl: '',
        shadowSize: [15, 10],
        shadowAnchor: [0, 5]
    });

    $rootScope.poiIcon = L.icon({
        iconUrl: 'images/poi/sighting_marker_green.png',
        iconRetinaUrl: 'images/poi/sighting_marker_green@2x.png',
        iconSize: [20, 30],
        iconAnchor: [0, 0],
        popupAnchor: [0, 0],
        shadowUrl: '',
        shadowRetinaUrl: '',
        shadowSize: [15, 10],
        shadowAnchor: [0, 5]
    });

    $rootScope.newSightingIcon = L.icon({
        iconUrl: 'images/sightings/ico_new_marker.png',
        iconRetinaUrl: 'images/sightings/ico_new_marker@2x.png',
        iconSize: [20, 30],
        iconAnchor: [0, 0],
        popupAnchor: [0, 0],
        shadowUrl: '',
        shadowRetinaUrl: '',
        shadowSize: [15, 10],
        shadowAnchor: [0, 5]
    });

    $rootScope.newPoiIcon = L.icon({
        iconUrl: 'images/poi/ico_new_marker_green.png',
        iconRetinaUrl: 'images/poi/ico_new_marker_green@2x.png',
        iconAnchor: [0, 0],
        popupAnchor: [0, 0],
        shadowUrl: '',
        shadowRetinaUrl: '',
        shadowSize: [15, 10],
        shadowAnchor: [0, 5]
    });


    //$rootScope.previousState = null;
    //$rootScope.currentState = null;
    //$rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
    //    $rootScope.previousState = from.name;
    //    $rootScope.currentState = to.name;
    //    //console.log('Previous state:' + $rootScope.previousState);
    //    //console.log('Current state:' + $rootScope.currentState);
    //});

    $rootScope.$on('loading:show', function () {
        $ionicLoading.show({ template: '<ion-spinner></ion-spinner>' })
    });

    $rootScope.$on('loading:hide', function () {
        $ionicLoading.hide();
        angular.element(document.querySelector('body')).removeClass('loading-active');
    });
    //////////////////////////////////////////DELETE////////////////////////////////////

    $rootScope.filterSighting = {
            Animal: '',
            Type: '',
            State: '',
            User: ''
        };

        //MODAL WINDOW//
        $rootScope.makeModal = function () {
            $ionicModal.fromTemplateUrl($rootScope.modalAddress, {
                scope: $rootScope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $rootScope.modal = modal;
            });

            $timeout(function () {
                $rootScope.modal.show();

                if ($state.includes('map') && $rootScope.isAdmin($rootScope.currUser, $rootScope.selectedField))
                    $rootScope.map.on('dblclick', $rootScope.addSightingOrPoi);

                //remove modal window if we click outside this window
                $('div.modal-backdrop-bg').css({ 'pointer-events': 'auto' });
                $('div.modal-backdrop-bg').css({ 'z-index': '-100' });
                $('div.modal-wrapper > div').css({ 'z-index': '100' });

                var modalBackground = $('div.modal-backdrop-bg')[$('div.modal-backdrop-bg').length - 1];
                $(modalBackground).on('click', function () {
                    $rootScope.modal.remove();
                    if ($rootScope.testMarker) {
                        $rootScope.drawnItems.removeLayer($rootScope.testMarker);
                        $rootScope.listedMarkers.removeLayer($rootScope.testMarker);
                    }
                });

                //console.log($($('.markersFilter-modal')[0]).width());

                var modalHalfWidth = null,
                    offset = null,
                    temp = null;

                if ($state.includes('fieldDetails')) {
                    modalHalfWidth = 174;
                    offset = $(window).width() / 2 - modalHalfWidth;
                    temp = offset + 'px';
                    $('.markersFilter-modal-dark').css({ 'margin-right': temp });
                }
                //else if ($state.includes('map')) {
                //    modalHalfWidth = 174;
                //    offset = $(window).width() / 2 - modalHalfWidth;
                //    temp = offset + 'px';
                //    $('.markersFilter-modal').css({ 'margin-right': temp });
                //}
            }, 100);
        };
    //////////////////////////////////////////DELETE////////////////////////////////////

    $ionicPlatform.ready(function () {

        console.log("app.run.platformReady");

        var type = $cordovaNetwork.getNetwork()

        var isOnline = $cordovaNetwork.isOnline()

        var isOffline = $cordovaNetwork.isOffline()

        // listen for Online event
        $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
            if ($ionicHistory.currentStateName() != 'pin' && $ionicHistory.currentStateName() != 'login')
                $rootScope.updateFields();
            var onlineState = networkState;
            var indexes = [];
            var x = 0;
            var loopArray = function (arr) {
                doOurTask(x, function () {
                    // set x to next item
                    x++;

                    // any more items in array? continue loop
                    if (x < arr.length) {
                        loopArray(arr);
                    }
                });
            }

            function doOurTask(i, callback) {

                if (taskService.tasklist && taskService.tasklist[i]) {
                    taskService.doTask(i).then(function (data) {
                        indexes.push(i);
                        callback();
                    });
                }
                else callback();
                // do callback when ready
            }

            if (taskService.tasklist)
                loopArray(taskService.tasklist);
            for (var ind in indexes) {
                taskService.tasklist.splice(ind, 1);
            }
        })

        // listen for Offline event
        $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
            var offlineState = networkState;
        })

        $rootScope.$on('$cordovaPush:notificationReceived', function (event, notification) {
            if (ionic.Platform.isAndroid()) {
                handleAndroid(JSON.parse(JSON.stringify(notification)));
            }
            else {
                handleIOS(JSON.parse(JSON.stringify(notification)));

                $rootScope.$apply(function () {
                    $rootScope.notifications.push(JSON.stringify(notification.alert));
                })
            }
        });

        function handleIOS(notification) {

            if (notification.alert) {
                $rootScope.notifAlert = notification.alert;
                notification.badge = 0;//------------------------------------------------------------------------------BADGE
                if ($rootScope.pushPopup) {
                    $rootScope.pushPopup.close();
                }
                $rootScope.pushPopup = $ionicPopup.show({
                    cssClass: 'popup-dash',
                    templateUrl: 'templates/popupPush.html'
                });
            }
            if (notification.sound) {
                var mediaSrc = $cordovaMedia.newMedia(notification.sound);
                mediaSrc.promise.then($cordovaMedia.play(mediaSrc.media));
            }
            if (notification.badge) {
                $cordovaPush.setBadgeNumber(notification.badge).then(function (result) {
                    // Success!
                }, function (err) {
                    // An error occurred. Show a message to the user
                });
            }
        }

        function handleAndroid(notification) {
            if (notification.event == 'registered') {
                if (notification.regid.length > 0) {
                    if (!readFromLocalStorage("isFirstLogin")) {
                        saveToLocalStorage("isFirstLogin", "false");
                        apiConnection.storeDeviceToken(notification.regid, "Android");
                    }
                }
            }
            else if (notification.event == 'message') {
                // this is the actual push notification. its format depends on the data model from the push server                        
                $rootScope.notifAlert = notification.payload.message;
                $rootScope.pushFieldId = notification.payload.alert.fieldId;
                if ($rootScope.pushPopup) {
                    $rootScope.pushPopup.close();
                }
                $rootScope.pushPopup = $ionicPopup.show({
                    cssClass: 'popup-dash',
                    templateUrl: 'templates/popupPush.html'
                });
            }
            else if (notification.event == 'error') {
                $rootScope.showAlertPopup('GCM error = ' + notification.msg, false);
            }
            else {
                $rootScope.showAlertPopup('An unknown GCM event has occurred', false);
            }
        }

        taskService.tasklist = readFromLocalStorage('tasklist');
        $rootScope.language = readFromLocalStorage("lang") == null ? { 'name': 'English', 'value': 'en' } : readFromLocalStorage("lang");
        $rootScope.lastUpdated = readFromLocalStorage("lastUpdated") == null ? '2000-12-12T12:00:00' : readFromLocalStorage("lastUpdated");
        $rootScope.temperature = readFromLocalStorage("temperature") == null ? 'C' : readFromLocalStorage("temperature");
        $rootScope.weight = readFromLocalStorage("weight") == null ? 'kg' : readFromLocalStorage("weight");
        $rootScope.distance = readFromLocalStorage("distance") == null ? 'km' : readFromLocalStorage("distance");
        $rootScope.time = readFromLocalStorage("time") == null ? '24' : readFromLocalStorage("time");
        $translate.use($rootScope.language.value);

        $rootScope.$watch('isFilterArraysChanged', function () {
            if ($state.includes('map')) {
                if ($rootScope.deletedClusterMarkersArr) {
                    $rootScope.sightingCluster.addLayers($rootScope.deletedClusterMarkersArr);
                    $rootScope.deletedClusterMarkersArr = [];
                } else
                    $rootScope.deletedClusterMarkersArr = [];

                $rootScope.sightMarkersFilter();

                var markerClusterGroup = new L.FeatureGroup();

                $.each($rootScope.animalDeletedMarkers, function (index, marker) {
                    if (!markerClusterGroup.hasLayer(marker))
                        markerClusterGroup.addLayer(marker);
                });
                $.each($rootScope.typeDeletedMarkers, function (index, marker) {
                    if (!markerClusterGroup.hasLayer(marker))
                        markerClusterGroup.addLayer(marker);
                });
                $.each($rootScope.stateDeletedMarkers, function (index, marker) {
                    if (!markerClusterGroup.hasLayer(marker))
                        markerClusterGroup.addLayer(marker);
                });
                $.each($rootScope.userDeletedMarkers, function (index, marker) {
                    if (!markerClusterGroup.hasLayer(marker))
                        markerClusterGroup.addLayer(marker);
                });
                if ($rootScope.dateDeletedMarkers)
                    $.each($rootScope.dateDeletedMarkers, function (index, marker) {
                        if (!markerClusterGroup.hasLayer(marker))
                            markerClusterGroup.addLayer(marker);
                    });


                markerClusterGroup.eachLayer(function (marker) {
                    $rootScope.deletedClusterMarkersArr.push(marker);
                });

                $rootScope.sightingCluster.removeLayers($rootScope.deletedClusterMarkersArr);
            }
            else if ($state.includes('fieldDetails')) {
                $rootScope.sightIDsFilter();
            };

        });

        //Cleanup the modal when we're done with it!
        $rootScope.$on('$destroy', function () {
            console.log('on destroy');
            if ($rootScope.modal)
                $rootScope.modal.remove();
        });
        // Execute action on hide modal
        $rootScope.$on('modal.hidden', function () {
            //console.log('hidden');
        });
        // Execute action on remove modal
        $rootScope.$on('modal.removed', function () {
            if ($state.includes('map')) {
                $rootScope.enableMapInteraction();
                $rootScope.onRemoveModalWindow();
            }


            //clear sighting filter arrays
            //$rootScope.animalFilterLatLngArr = null;
            //$rootScope.typeFilterLatLngArr = null;
            //$rootScope.stateFilterLatLngArr = null;
        });
        //MODAL WINDOW//

        $rootScope.showAlertPopup = function (message, isTwoButtons, calback) {
            if ($rootScope.popupAlert) {
                if ($rootScope.popupAlert.$$state.status == 0) {
                    $rootScope.popupAlert.close();
                    $timeout(function () {

                        $rootScope.popupAlertMessage = message;
                        $rootScope.isTwoButtons = isTwoButtons;
                        $rootScope.$broadcast('loading:hide');

                        $rootScope.popupAlert = $ionicPopup.show({
                            cssClass: 'popup-dash',
                            templateUrl: 'templates/popupAlert.html'
                        });

                        if (isTwoButtons && calback)
                            $rootScope.butFunc = calback;
                    }, 500);
                } else {
                    $rootScope.popupAlertMessage = message;
                    $rootScope.isTwoButtons = isTwoButtons;
                    $rootScope.$broadcast('loading:hide');

                    $rootScope.popupAlert = $ionicPopup.show({
                        cssClass: 'popup-dash',
                        templateUrl: 'templates/popupAlert.html'
                    });

                    if (isTwoButtons && calback)
                        $rootScope.butFunc = calback;
                }
            }
            else {
                $rootScope.popupAlertMessage = message;
                $rootScope.isTwoButtons = isTwoButtons;
                $rootScope.$broadcast('loading:hide');

                $rootScope.popupAlert = $ionicPopup.show({
                    cssClass: 'popup-dash',
                    templateUrl: 'templates/popupAlert.html'
                });

                if (isTwoButtons && calback)
                    $rootScope.butFunc = calback;
            }
        };

        function convertUTCDateToLocalDate(date) {
            var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

            var offset = date.getTimezoneOffset() / 60 + 1;
            var hours = date.getHours();

            newDate.setHours(hours - offset);

            return newDate;
        }

        $rootScope.slickSettings = {
            dots: false,
            infinite: false,
            slidesToShow: 4,
            slidesToScroll: 4,
            arrows: false,
            prevArrow: $('.dashArrow.ion-chevron-left'),
            nextArrow: $('.dashArrow.ion-chevron-right'),
            responsive: [
                {
                    breakpoint: 2048,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 3
                    }
                },
                {
                    breakpoint: 1024,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2
                    }
                },
                {
                    breakpoint: 480,
                    settings: {
                        slidesToShow: 1,
                        slidesToScroll: 1
                    }
                }
            ]
        };

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)

        //if (window.cordova && window.cordova.plugins.Keyboard) {
        //    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        //}
        //if (window.StatusBar) {
        //    // org.apache.cordova.statusbar required
        //    StatusBar.styleDefault();
        //}

    });

    $rootScope.imagesChanged = function (newIMGs, oldIMGs) {
        $rootScope.delArray = [];
        $rootScope.addArray = [];
        var flag = true;

        if (!oldIMGs) {
            oldIMGs = [];
        }
        if (!newIMGs) {
            newIMGs = [];
        }
        for (var i = 0; i < oldIMGs.length; i++) {
            flag = true;
            for (var j = 0; j < newIMGs.length; j++) {
                if (newIMGs[j].SRC == oldIMGs[i].SRC)
                    flag = false;
            }
            if (flag) {
                $rootScope.delArray.push(oldIMGs[i].SRC);
            }
        }
        for (var i = 0; i < newIMGs.length; i++) {
            flag = true;
            for (var j = 0; j < oldIMGs.length; j++) {
                if (newIMGs[i].SRC == oldIMGs[j].SRC)
                    flag = false;
            }
            if (flag) {
                $rootScope.addArray.push(newIMGs[i].SRC);
            }
        }
    }

    $rootScope.urlForImage = function (imageName) {
        //var name = imageName.substr(imageName.lastIndexOf('/') + 1);
        var trueOrigin = null;
        //trueOrigin = cordova.file.dataDirectory + imageName.replace('.jpg', '');

        if (imageName)
            if (imageName.indexOf(".") == -1)
                trueOrigin = cordova.file.dataDirectory + imageName;
            else
                trueOrigin = cordova.file.dataDirectory + imageName.replace('.jpg', '') + '.jpg';
        return trueOrigin;
    };

    $rootScope.isAdmin = function (user, field) {
        if (user && field && field.Users)
            for (var i = 0; i < field.Users.length; i++) {
                if (field.Users[i].UserName == user.UserName && field.Users[i].UserRoles &&
                    field.Users[i].UserRoles.length > 0 && field.Users[i].UserRoles.indexOf(field.FieldId + "Administrator") != -1)
                    return true;
            }
        return false;
    };

    $rootScope.isManager = function (user, field) {
        if (user && field && field.Users)
            for (var i = 0; i < field.Users.length; i++) {
                if (field.Users[i].UserName == user.UserName && field.Users[i].UserRoles &&
                    field.Users[i].UserRoles.length > 0 && field.Users[i].UserRoles.indexOf(field.FieldId + "Manager") != -1)
                    return true;
            }
        return false;
    };

    $rootScope.isCurrUser = function (user) {
        if (user.UserName == $rootScope.currUser.UserName)
            return true;
        return false;
    }

    $rootScope.updateFields = function () {
        apiConnection.GetFields().then(function (data) {
            stableSort(data);
            console.log("Got:" + data.length + " fields in updateFields Method");

            for (var index = 0; index < data.length; index++) {

                //Getting index of field in current array if there is no such than CurFieldIndex stay null
                $rootScope.CurFieldIndex = null;
                for (var indexF = 0; indexF < $rootScope.fields.length; indexF++) {
                    if ($rootScope.fields[indexF].FieldId == data[index].FieldId) {
                        $rootScope.CurFieldIndex = indexF;
                        break;
                    }
                }

                //If there is such field update it
                if ($rootScope.CurFieldIndex != null) {

                    //If it is deleted than remove it from current array
                    if (data[index].Deleted) {
                        $rootScope.fields.splice($rootScope.CurFieldIndex, 1);
                        console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " deleted from current array.");
                    }

                        //Else start updating it
                    else {
                        console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " starts updating.");
                        var img = false;

                        //Check if we already have it's current image
                        if ($rootScope.fields[$rootScope.CurFieldIndex].Image && data[index].Image)
                            if (getNameFromUrl(data[index].Image.SRC) == getName($rootScope.fields[$rootScope.CurFieldIndex].Image.SRC)) {
                                data[index].Image.SRC = $rootScope.fields[$rootScope.CurFieldIndex].Image.SRC;
                                img = true;
                                console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " doesn't need to update field image because there is already one in memory.");
                            }

                        //Check if there is weather for a field in current array and also checking is it up-to-date
                        if (!$rootScope.fields[$rootScope.CurFieldIndex].weather || $rootScope.fields[$rootScope.CurFieldIndex].weather.length < 300 || $filter('date')($rootScope.fields[$rootScope.CurFieldIndex].Updated, 'yyyy-MM-dd') != $filter('date')(new Date(), 'yyyy-MM-dd')) {
                            apiConnection.getWeather($rootScope.fields[$rootScope.CurFieldIndex].FieldId).then(function (result) {
                                for (var i = 0; i < $rootScope.fields.length; i++) {
                                    if ($rootScope.fields[i].FieldId == result.fieldId) {
                                        $rootScope.fields[i].weather = result.data;
                                        break;
                                    }
                                }
                                fileHelper.saveToFile($rootScope.fields, 'fields.txt');
                                console.log("Field with ID:" + result.fieldId + " updated weather(rewriting the file).");
                            }, function (answer) {
                                console.log("Got an error while updating weather:" + JSON.stringify(answer));
                                $rootScope.lastUpdated = $rootScope.previousUpdated;
                                saveToLocalStorage('lastUpdated', $rootScope.lastUpdated);
                            });
                        }

                            //If it is up-to-date ther is no need to update it
                        else {
                            data[index].weather = $rootScope.fields[$rootScope.CurFieldIndex].weather;
                            console.log("Field with ID:" + data[index].fieldId + " doesn't need to update weather because there is already one in memory.");
                        }

                        //*********UPDATING SIGHTINGS*********
                        console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " started updating Sightings.");
                        if (data[index].Sightings && data[index].Sightings.length > 0) {
                            var oldSightings = $rootScope.fields[$rootScope.CurFieldIndex].Sightings;
                            var newSightings = data[index].Sightings;
                            var newSig = true;

                            //We create new array of sightings there will be new Sightings and updated old
                            for (var i = 0; i < newSightings.length; i++) {
                                newSig = true;
                                for (var j = 0; j < oldSightings.length; j++)
                                    if (newSightings[i].SightingId == oldSightings[j].SightingId) {
                                        if (oldSightings[j].Images)
                                            for (var k = 0; k < oldSightings[j].Images.length; k++)
                                                if (newSightings[i].Images[k] && getNameFromUrl(newSightings[i].Images[k].SRC) == getName(oldSightings[j].Images[k].SRC))
                                                    newSightings[i].Images[k].SRC = oldSightings[j].Images[k].SRC;
                                        if (newSightings[i].Deleted) {
                                            console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + "removed Sighting :" + newSightings[i].Animal + "( " + newSightings[i].SightingId + " )");
                                            oldSightings.splice(j, 1);
                                        }
                                        else {
                                            oldSightings[j] = newSightings[i];
                                            console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " updated Sighting :" + newSightings[i].Animal + "( " + newSightings[i].SightingId + " )");
                                        }
                                        newSightings[i] = null;
                                        newSig = false;
                                        break;
                                    }
                                if (newSig && !newSightings[i].Deleted) {
                                    oldSightings.push(newSightings[i]);
                                    console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " added Sighting :" + newSightings[i].Animal + "( " + newSightings[i].SightingId + " )");
                                }
                            }
                            data[index].Sightings = oldSightings;

                            $rootScope.downloadSIghtingsImages($rootScope.CurFieldIndex);
                        } else {
                            data[index].Sightings = $rootScope.fields[$rootScope.CurFieldIndex].Sightings;
                        }
                        stableSort($rootScope.fields[$rootScope.CurFieldIndex].Sightings);

                        //*********UPDATING POIS*********
                        console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " started updating POIs.");
                        if (data[index].POIs && data[index].POIs.length > 0) {
                            var oldPOIs = $rootScope.fields[$rootScope.CurFieldIndex].POIs;
                            var newPOIs = data[index].POIs;
                            var newSig = true;
                            //We create new array of POIs there will be new POIs and updated old
                            for (var i = 0; i < newPOIs.length; i++) {
                                newSig = true;
                                for (var j = 0; j < oldPOIs.length; j++)
                                    if (newPOIs[i].POIId == oldPOIs[j].POIId) {
                                        if (oldPOIs[j].Images)
                                            for (var k = 0; k < oldPOIs[j].Images.length; k++)
                                                if (newPOIs[i].Images && newPOIs[i].Images[k] && getNameFromUrl(newPOIs[i].Images[k].SRC) == getName(oldPOIs[j].Images[k].SRC))
                                                    newPOIs[i].Images[k].SRC = oldPOIs[j].Images[k].SRC;
                                        if (newPOIs[i].Deleted) {
                                            console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + "removed POI :" + newPOIs[i].Name + "( " + newPOIs[i].POIId + " )");
                                            oldPOIs.splice(j, 1);
                                        }
                                        else {
                                            oldPOIs[j] = newPOIs[i];
                                            console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " updated POI :" + newPOIs[i].Name + "( " + newPOIs[i].POIId + " )");
                                        }
                                        newPOIs[i] = null;
                                        newSig = false;
                                        break;
                                    }
                                if (newSig && !newPOIs[i].Deleted) {
                                    oldPOIs.push(newPOIs[i]);
                                    console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " added POI :" + newPOIs[i].Name + "( " + newPOIs[i].POIId + " )");
                                }
                            }
                            data[index].POIs = oldPOIs;

                            $rootScope.downloadPOIsImages($rootScope.CurFieldIndex);
                        } else {
                            data[index].POIs = $rootScope.fields[$rootScope.CurFieldIndex].POIs;
                        }

                        //Now we rewrite all other field info
                        $rootScope.fields[$rootScope.CurFieldIndex] = data[index];

                        if (data[index].Image && !isLocal(data[index].Image.SRC) && !img) {
                            console.log("Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " request updating image.");
                            apiConnection.downloadImage(data[index].Image.SRC, getNameFromUrl(data[index].Image.SRC), $rootScope.fields[$rootScope.CurFieldIndex]).then(function (data) {
                                data.index.Image = {};
                                data.index.Image.SRC = data.URL.name;
                                console.log("Field with ID:" + data.index.FieldId + " updated image(rewriting file).");
                                fileHelper.saveToFile($rootScope.fields, 'fields.txt');
                            }, function (data) {
                                console.log("Field with ID:" + data.index.FieldId + " got an error while updating Image:" + JSON.stringify(data));
                                $rootScope.lastUpdated = $rootScope.previousUpdated;
                                saveToLocalStorage('lastUpdated', $rootScope.lastUpdated);

                            });
                        }
                    }
                }
                else if ($rootScope.CurFieldIndex == null && !data[index].Deleted) {

                    console.log("Adding Field : " + data[index].Name + "( " + data[index].FieldId + " )");

                    for (var i = 0; i < data[index].Sightings.length; i++)
                        if (data[index].Sightings[i].Deleted) {
                            console.log("New Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " sighting with Id:" + data[index].Sightings[i].SightingId + " removed");
                            data[index].Sightings = data[index].Sightings.splice(i, 1);
                        }

                    $rootScope.fields.push(JSON.parse(JSON.stringify(data[index])));

                    if (data[index].Image) {
                        console.log("New Field : " + data[index].Name + "( " + data[index].FieldId + " )" + " request updating image.");
                        apiConnection.downloadImage($rootScope.fields[$rootScope.fields.length - 1].Image.SRC, getNameFromUrl($rootScope.fields[$rootScope.fields.length - 1].Image.SRC), $rootScope.fields[$rootScope.fields.length - 1]).then(function (data) {
                            data.index.Image.SRC = data.URL.name;
                            console.log("New Field with ID:" + data.index.FieldId + " updated image(rewriting file).");
                            fileHelper.saveToFile($rootScope.fields, 'fields.txt');
                        }, function (data) {
                            $rootScope.lastUpdated = $rootScope.previousUpdated;
                            saveToLocalStorage('lastUpdated', $rootScope.lastUpdated);
                            console.log("New Field with ID:" + data.index.FieldId + "failed to update image answer:" + JSON.stringify(data));
                        });
                    }

                    apiConnection.getWeather($rootScope.fields[$rootScope.fields.length - 1].FieldId).then(function (result) {
                        for (var i = 0; i < $rootScope.fields.length; i++) {
                            if ($rootScope.fields[i].FieldId == result.fieldId) {
                                $rootScope.fields[i].weather = result.data;
                                break;
                            }
                        }
                        console.log("New Field with ID:" + result.fieldId + " updated weather(rewriting the file).");
                        fileHelper.saveToFile($rootScope.fields, 'fields.txt');
                    }, function (answer) {
                        $rootScope.lastUpdated = $rootScope.previousUpdated;
                        saveToLocalStorage('lastUpdated', $rootScope.lastUpdated);
                        console.log("New Field with ID:" + answer.fieldId + "failed to update weather answer:" + JSON.stringify(answer));
                    });
                    if (data[index].Sightings && data[index].Sightings.length > 0) {
                        $rootScope.downloadSIghtingsImages($rootScope.fields.length - 1);
                    }
                    if (data[index].POIs && data[index].POIs.length > 0) {
                        $rootScope.downloadPOIsImages($rootScope.fields.length - 1);
                    }
                }
            }
            stableSort($rootScope.fields);
            $rootScope.setItemSize();
            if (data.length > 0) {
                fileHelper.saveToFile($rootScope.fields, 'fields.txt');
            }
            if (index == data.length - 1)
                var i = 0;
            $timeout(function () { $rootScope.$broadcast('loading:hide'); }, 1000);
        }, function () {

        });
    }

    $rootScope.baseURL = "http://185.96.4.166";
})

.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $compileProvider, $httpProvider, $translateProvider) {
    $ionicConfigProvider.backButton.previousTitleText(false);
    $ionicConfigProvider.backButton.text('').icon('ion-arrow-left-c');
    $ionicConfigProvider.views.swipeBackEnabled(false);

    //$ionicConfigProvider.views.maxCache(0);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
    $stateProvider
      .state('login', {
          url: '/login',
          templateUrl: 'templates/login.html',
          controller: 'LoginCtrl'
      })
        .state('register', {
            url: '/register',
            templateUrl: 'templates/register.html',
            controller: 'RegisterCtrl'
        })
        .state('forgotPassword', {
            url: '/forgotPassword',
            templateUrl: 'templates/forgotPassword.html',
            controller: 'ForgotPasswordCtrl'
        })
      .state('dashboard', {
          url: '/dashboard',
          templateUrl: 'templates/dashboard.html',
          controller: 'DashboardCtrl',
          onEnter: ['$rootScope', function ($rootScope) {
              console.log('entered dashboard');
              if (!$rootScope.slickRedrawer)
                  $rootScope.slickRedrawer = false;
              //var positionFunction = function (event, slick, slide, nextSlide) {

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
          }]
      })
      .state('fieldDetails', {
          url: '/fieldDetails',
          templateUrl: 'templates/fieldDetails.html',
          controller: 'fieldDetailsCtrl'
      })
        .state('addField', {
            url: '/addField',
            templateUrl: 'templates/addField.html',
            controller: 'addFieldCtrl'
        })
                .state('settings', {
                    url: '/settings',
                    abstract: true,
                    templateUrl: 'templates/settings.html'
                })
                .state('settings.about', {
                    url: '/about',
                    views: {
                        "menuContent": {
                            templateUrl: "templates/about.html"
                        }
                    }
                })
                .state('settings.personalInfo', {
                    url: '/personalInfo',
                    controller: 'PersonalInfoCtrl',
                    views: {
                        "menuContent": {
                            templateUrl: "templates/personalInfo.html"
                        }
                    }
                })
                .state('settings.preferences', {
                    url: '/preferences',
                    views: {
                        "menuContent": {
                            templateUrl: "templates/preferences.html"
                        }
                    }
                })
    .state('map', {
        url: '/map',
        templateUrl: 'templates/map.html',
        controller: 'MapCtrl'
    })
        .state('createMap', {
            url: '/createMap',
            templateUrl: 'templates/createMap.html',
            controller: 'CreateMapCtrl'
        })
        .state('addSighting', {
            url: '/addSighting',
            templateUrl: 'templates/addSighting.html',
            controller: 'addSightingCtrl'
        })
    .state('addPointOfInterest', {
        url: '/addPointOfInterest',
        templateUrl: 'templates/addPointOfInterest.html',
        controller: 'addPointOfInterestCtrl'
    })
    .state('addSightingOrPOI', {
        url: '/addSightingOrPOI',
        templateUrl: 'templates/AddSightingOrPOI.html',
        controller: 'addSightingOrPoiCtrl'
    })
    .state('pin', {
        url: "/pin",
        templateUrl: "templates/pin.html",
        controller: "PinCtrl"
    })
    .state('editField', {
        url: '/editField',
        templateUrl: 'templates/editField.html',
        controller: 'editFieldCtrl'
    })
.state('cleanMap', {
    url: '/cleanMap',
    templateUrl: 'templates/cleanMap.html',
    controller: 'cleanMapCtrl'
})
    .state('showSightingInfo', {
        url: '/showSightingInfo',
        templateUrl: 'templates/showSightingInfo.html',
        controller: 'showSightingInfoCtrl'
    })
     .state('showPOIInfo', {
         url: '/showPOIInfo',
         templateUrl: 'templates/showPOIInfo.html',
         controller: 'showPOIInfoCtrl'
     })
    .state('editSighting', {
        url: '/editSighting',
        templateUrl: 'templates/editSighting.html',
        controller: 'editSightingCtrl'
    })
        .state('editPOI', {
            url: '/editPOI',
            templateUrl: 'templates/editPOI.html',
            controller: 'editPoiCtrl'
        })
     .state('markersFilter', {
         url: '/markersFilter',
         templateUrl: 'templates/markersFilter.html',
         controller: 'markersFilterCtrl'
     })

    $urlRouterProvider.otherwise(function ($injector) {
        var $state = $injector.get('$state');

        var lastLogin = localStorage.getItem('lastLogin');
        if (lastLogin) {
            var diff = (new Date() - new Date(lastLogin)) / 86400000;
            if (diff > 7 || !readFromLocalStorage('logged')) {
                $state.go('login');
            }
            else {
                $state.go('pin');
            }
        }
        else {
            $state.go('login');
        }
    })

    $translateProvider.useStaticFilesLoader({
        prefix: 'languages/',
        suffix: '.json'
    });
    $translateProvider.preferredLanguage("en");
    $translateProvider.fallbackLanguage("en");
})
