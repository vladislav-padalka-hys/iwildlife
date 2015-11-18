angular.module('mapMd', [])
.controller('MapCtrl', function ($ionicPopup, $ionicPopover, $ionicModal, $timeout, $scope, $rootScope, mapFactory, $translate, $state, $filter, Camera, $cordovaFile, apiConnection, taskService, fileHelper, $ionicActionSheet) {
    var $trans = $filter('translate');
    $rootScope.filterStr = $trans('show_all');

    Date.prototype.getWeekNumber = function () {
        var d = new Date(+this);
        d.setHours(0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
    };

    function redraw() {
        var w = window.innerWidth,
               h = 60,
               parseDate = d3.time.format("%Y-%m-%d").parse;

        var temp = [];
        if ($rootScope.selectedField.weather && $rootScope.selectedField.weather.length)
            temp = $rootScope.selectedField.weather.map(function (d) { return d3.time.format("%Y-%m-%d").parse(d.date) });

        var weat = [];

        d3.select(".mapScroll").remove();

        var svg = d3.select("#mapContainer")
                .append("svg")
                .attr("class", "mapScroll")
                .attr("width", w)
                .attr("height", h);

        var scale = d3.time.scale()
                        .domain([temp[0], temp[temp.length - 1]])
                        .range([0, w]);

        var xaxis = d3.svg.axis().scale(scale)
            .orient("top")
            //.tickSubdivide(2)
            .tickSize(25, 0)
        .tickFormat(function (d, i, e) {
            svg.select("g").selectAll("text")
                .style("font-size", "10px")
                .each(function () {
                    if (this.textContent == dateToDateShortString(new Date())) {
                        this.classList.add("today");
                    }
                    var ar = this.textContent.split("/");
                    var dt = new Date(parseInt(ar[2], 10),
                  parseInt(ar[1], 10) - 1,
                  parseInt(ar[0], 10));
                    if (dt.getDay() == 0 || dt.getDay() == 1) {
                        this.classList.add("weekend");
                    }
                });
            var ind = getInd($rootScope.selectedField, d.toISOString());
            {
                curZoom = zoom.scale();
                var k = 0;
                if ((d.getMonth() + 1) % 2 == 0)
                    k = 1;
                if (curZoom >= 64.1) {
                    if (d.getHours() == 0)
                    { if (ind != -1) weat.push(d); return ""; }
                    else return dateToDateShortString(d);
                }
                else if (curZoom >= 32.5 && ind != -1) {
                    if (d.getDate() % 2 == 0)
                    { weat.push(d); return ""; }
                    else return dateToDateShortString(d);
                }
                else if (curZoom >= 10.13 && ind != -1) {
                    if ((d.getDate() + 1) / 2 % 2 == 0)
                    { weat.push(d); return ""; }
                    else return dateToDateShortString(d);
                }
                else if (curZoom >= 2.62 && ind != -1) {
                    if (d.getWeekNumber() % 2 == 0)
                    { weat.push(d); return ""; }
                    else return dateToDateShortString(d);
                }
                else if (curZoom >= 0.87 && ind != -1) {
                    if ((d.getMonth() + 1) % 2 == 0)
                    { weat.push(d); return ""; }
                    else return dateToDateShortString(d);
                }
                else {
                    if ((d.getMonth() + 2) % 2 != 0 && ind != -1)
                    { weat.push(d); return ""; }
                    else return dateToDateShortString(d);
                }
            }
            
            return dateToDateShortString(d);//"Year1 Year2, etc depending on the tick value - 0,1,2,3,4"
        });

        var zoom = d3.behavior.zoom()
            .scaleExtent([0.5, 100])
            .on("zoom", function (a, b, c) {
                svg.select("g").call(xaxis);
                getDateRange();

                update_events();
                weat = [];
                $scope.$apply();
            })
            .x(scale);

        var rectBlack = svg.append("rect")
            .attr("class", "rectBlack")
                        .attr("x", w / 8)
                        .attr("y", 0)
                        .attr("width", 3 * w / 4)
                        .attr("height", h);

        var rectRight = svg.append("rect")
            .attr("class", "rectFilter")
                        .attr("x", 7 * w / 8)
                        .attr("y", 0)
                        .attr("width", w / 8)
                        .attr("height", h);

        var rectLeft = svg.append("rect")
            .attr("class", "rectFilter")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", w / 8)
                        .attr("height", h);

        svg.append("g")
            .attr("class", "xaxis")
            .attr("transform", "translate(0,60)")
            .call(xaxis)
            .selectAll("text")
            .style("font-size", "10px");

        getDateRange();

        var rect = svg.append("rect")
            .attr("class", "rectWhite")
						.attr("x", 0)
						.attr("y", 0)
						.attr("width", w)
						.attr("height", h)
						.call(zoom);

        function getDateRange() {
            var ind = 0, minInd = -1, maxInd = -1;
            var tmp = xaxis.scale().ticks(xaxis.ticks()[0]);
            svg.select("g").selectAll(".tick").each(function (data) {
                var tick = d3.select(this);
                var x = tick[0][0].getBoundingClientRect().left;
                if (x > w)
                    x -= w;
                if (x > w / 8 && minInd == -1)
                    minInd = ind;
                if (maxInd == -1)
                    if (x > 7 * w / 8) maxInd = ind - 1;
                    else if (ind == tmp.length - 1) maxInd = ind;
                ind++;
            });
            $rootScope.minDate = tmp[minInd];
            $rootScope.maxDate = tmp[maxInd];
        }

        function update_events() {
            svg.selectAll("text.weat").remove();

            var events = svg.selectAll("text.weat").data(weat);

            events.enter()
                .append('text')
                .attr("class", "weat")
                .attr("x", function (d) { return (scale(d) - 7); })
                .attr("y", 20)
        .text(function (d) { return getUTFIcon($rootScope.selectedField.weather[getWeatIndex($rootScope.selectedField, d.toISOString())].MoonIcon) });

            events.exit()
                    .remove();
        }

        update_events()
    }

    if ($rootScope.selectedField) {
        //if (!$rootScope.savedScroll)
            redraw();
        //else $rootScope.savedScroll.appendTo('#timelineContainer');
    }

    window.addEventListener("orientationchange", function () {
        if ($rootScope.selectedField)
            redraw();
    })

    $rootScope.modalAddress = '';
    $rootScope.markerCoordianates = null;
    $scope.selectedMarker = null

    $scope.field = {};
    $scope.fieldCenter = L.latLng(0, 0);

    $scope.newField = {};
    $scope.newField.Image = {};
    $scope.newField.Coordinates = null;
    $scope.isAddNoteButtonClicked = false;
    $scope.isAddPhotoButtonClicked = false;
    $scope.isPolygonCreated = false;

    $rootScope.sightingCluster = null;
    $rootScope.poiCluster = null;

    $scope.showGalleryVar = false;
    $scope.isPolygonButtonClicked = false;
    $scope.isFinishPolygonDrawingClicked = false;
    $scope.isDeleteLastPointClicked = false;
    $scope.isCancelPolygonDrawingClicked = false;
    $scope.isEditPolygonClicked = false;
    $scope.isDeletePolygonClicked = false;
    $scope.isLocateMeButtonClicked = false;
    $scope.showEditRemoveButtons = false;
    $scope.polygonLayer = null;
    $scope.isPolygonCreated = true;
    $scope.isShowInfoButtonClicked = false;

    $scope.markerOldCoord = null;
    $scope.markerNewCoord = null;

    $scope.filterMarkers = function () {
        $rootScope.modalAddress = 'templates/markersFilter.html';
        $rootScope.makeModal();
    };

    var sightFilterAnimals = function () {
        $rootScope.animalDeletedMarkers = [];
        if ($rootScope.animalFilterLatLngArr)
            $.each($rootScope.animalFilterLatLngArr, function (index, sightingMarkerLatLng) {
                $rootScope.sightingCluster.eachLayer(function (marker) {
                    var clusterMarkerLatLng = marker.getLatLng();
                    if (clusterMarkerLatLng.lat === sightingMarkerLatLng.lat && clusterMarkerLatLng.lng === sightingMarkerLatLng.lng) {
                        $rootScope.animalDeletedMarkers.push(marker);
                    }
                });
            });
    };

    var sightFilterTypes = function () {
        $rootScope.typeDeletedMarkers = [];
        if ($rootScope.typeFilterLatLngArr)
            $.each($rootScope.typeFilterLatLngArr, function (index, sightingMarkerLatLng) {
                $rootScope.sightingCluster.eachLayer(function (marker) {
                    var clusterMarkerLatLng = marker.getLatLng();
                    if (clusterMarkerLatLng.lat === sightingMarkerLatLng.lat && clusterMarkerLatLng.lng === sightingMarkerLatLng.lng) {
                        $rootScope.typeDeletedMarkers.push(marker);
                    }
                });
            });
    };

    var sightFilterUsers = function () {
        $rootScope.userDeletedMarkers = [];
        if ($rootScope.userFilterLatLngArr)
            $.each($rootScope.userFilterLatLngArr, function (index, sightingMarkerLatLng) {
                $rootScope.sightingCluster.eachLayer(function (marker) {
                    var clusterMarkerLatLng = marker.getLatLng();
                    if (clusterMarkerLatLng.lat === sightingMarkerLatLng.lat && clusterMarkerLatLng.lng === sightingMarkerLatLng.lng) {
                        $rootScope.userDeletedMarkers.push(marker);
                    }
                });
            });
    };

    var sightFilterStates = function () {
        $rootScope.stateDeletedMarkers = [];
        if ($rootScope.stateFilterLatLngArr)
            $.each($rootScope.stateFilterLatLngArr, function (index, sightingMarkerLatLng) {
                $rootScope.sightingCluster.eachLayer(function (marker) {
                    var clusterMarkerLatLng = marker.getLatLng();
                    if (clusterMarkerLatLng.lat === sightingMarkerLatLng.lat && clusterMarkerLatLng.lng === sightingMarkerLatLng.lng) {
                        $rootScope.stateDeletedMarkers.push(marker);
                    }
                });
            });
    };

    $scope.isDateInRangeMap = function () {
        $scope.dateFilterLatLngArr = [];
        for (var i = 0; i < $rootScope.selectedField.Sightings.length; i++) {
            var date = $rootScope.selectedField.Sightings[i].Date;
            if (Date.parse(date) < $rootScope.minDate || Date.parse(date) > $rootScope.maxDate) {
                var markerLat = $rootScope.selectedField.Sightings[i].latitude,
                    markerLng = $rootScope.selectedField.Sightings[i].longtitude;
                $scope.dateFilterLatLngArr.push(L.latLng(markerLat, markerLng));
            }
        }
        $rootScope.isFilterArraysChanged = $rootScope.isFilterArraysChanged ? false : true;
    }


    var sightFilterDate = function () {
        $rootScope.dateDeletedMarkers = [];
        if ($scope.dateFilterLatLngArr)
            $.each($scope.dateFilterLatLngArr, function (index, sightingMarkerLatLng) {
                $rootScope.sightingCluster.eachLayer(function (marker) {
                    var clusterMarkerLatLng = marker.getLatLng();
                    if (clusterMarkerLatLng.lat === sightingMarkerLatLng.lat && clusterMarkerLatLng.lng === sightingMarkerLatLng.lng) {
                        $rootScope.dateDeletedMarkers.push(marker);
                    }
                });
            });
    };

    $rootScope.sightMarkersFilter = function () {
        sightFilterUsers();
        sightFilterStates();
        sightFilterAnimals();
        sightFilterTypes();
        sightFilterDate();
    };

    $scope.$on("$ionicView.afterEnter", function () {
        if (!$rootScope.isAdmin($rootScope.currUser, $rootScope.selectedField))
            $rootScope.map.off('dblclick', $rootScope.addSightingOrPoi);

        $rootScope.map.scrollWheelZoom.disable();
        $('div.leaflet-control-attribution.leaflet-control').css({ 'pointer-events': 'none' }); //prevent a href transition 

        $scope.creating = false;
        $scope.field.name = $rootScope.selectedField.Name;
        $scope.field.note = $rootScope.selectedField.Note;

        var latCoord = parseFloat($rootScope.selectedField.latitude),
           lngCoord = parseFloat($rootScope.selectedField.longtitude),
           myLatLng = new L.LatLng(latCoord, lngCoord);


        $rootScope.map.setView(myLatLng, 15);

        $scope.interactionWithDOM();

        mapFactory.loadField($rootScope.selectedField.Coordinates, $rootScope.drawnItems, $rootScope.map);
        mapFactory.loadSightings($rootScope.selectedField.Sightings, $rootScope.listedMarkers, $rootScope.sightingCluster);
        mapFactory.loadPOIs($rootScope.selectedField.POIs, $rootScope.listedMarkers, $rootScope.poiCluster);


        $scope.isPolygonCreated = true;
        $scope.fieldCenter.lng = $rootScope.selectedField.longtitude;
        $scope.fieldCenter.lat = $rootScope.selectedField.latitude;

        $scope.attachEditToolbarToPolygon();

    });

    $scope.clearFilters = function () {
        $rootScope.deletedClusterMarkersArr = [];
        $rootScope.animalFilterLatLngArr = [];
        $rootScope.typeFilterLatLngArr = [];
        $rootScope.stateFilterLatLngArr = [];

        $rootScope.filterSighting.Animal = '';
        $rootScope.filterSighting.Type = '';
        $rootScope.filterSighting.State = '';
        $rootScope.filterSighting.User = '';
        $rootScope.isFilterArraysChanged = $rootScope.isFilterArraysChanged ? false : true;
    }

    $scope.$on("$ionicView.afterLeave", function () {
        //$('.filterBtn-FD span').css('width', '');
        $scope.clearFilters();

        $rootScope.drawnItems.clearLayers();
        $rootScope.sightingCluster.clearLayers();
        $rootScope.poiCluster.clearLayers();

        $scope.isPolygonCreated = false;
        $scope.polygonLayer = null;
        $scope.creating = false;

        $rootScope.testMarker = null;
        $scope.drawControl.removeFrom($rootScope.map);
        //$rootScope.map.remove();
    });


    // whatch when we click popupAlert cancel on save sighting location while dragging

    //$scope.$watch('popupAlert.$$state.status', function () {
    //    if ($rootScope.popupAlert)
    //        if ($rootScope.popupAlert.$$state.status == 1 && $rootScope.isCancelButtonClicked && $rootScope.isTwoButtons) {
    //            $scope.cancelMarkerDragging();
    //            $rootScope.isCancelButtonClicked = false;
    //        }
    //});


    $scope.$on("$ionicView.loaded", function () {


        $rootScope.map = L.map('map');


        //$rootScope.map = new L.map('map');
        //
        //$rootScope.sightingCluster = L.markerClusterGroup({
        //    iconCreateFunction: function (cluster) {
        //        var clusterIcon = L.divIcon({
        //            html: '<div class="collapsedMarkerIcon10"><span>' + cluster.getChildCount() + '</span><img src="images/sightings/sighting_marker_big@2x.png"/><div>',
        //            iconSize: [20, 30]
        //        });
        //        return clusterIcon;
        //    }
        //});

        $rootScope.sightingCluster = L.markerClusterGroup({
            iconCreateFunction: function (cluster) {
                var clusterCount = cluster.getChildCount();
                var clusterIcon = null;

                if (clusterCount < 10) {
                    clusterIcon = L.divIcon({
                        html: '<div class="collapsedMarkerIcon10"><span>' + cluster.getChildCount() + '</span><img src="images/sightings/sighting_marker_big@2x.png"/><div>',
                        iconSize: [20, 30]
                    });
                }
                else if (clusterCount < 100) {
                    clusterIcon = L.divIcon({
                        html: '<div class="collapsedMarkerIcon100"><span>' + cluster.getChildCount() + '</span><img src="images/sightings/sighting_marker_big@2x.png"/><div>',
                        iconSize: [20, 30]
                    });
                }
                return clusterIcon;
            }
        });

        $rootScope.poiCluster = L.markerClusterGroup({
            iconCreateFunction: function (cluster) {
                var clusterCount = cluster.getChildCount();
                var clusterIcon = null;

                if (clusterCount < 10) {
                    clusterIcon = L.divIcon({
                        html: '<div class="collapsedMarkerIcon10"><span>' + cluster.getChildCount() + '</span><img src="images/poi/sighting_marker_big_green@2x.png"/><div>',
                        iconSize: [20, 30]
                    });
                }
                else if (clusterCount < 100) {
                    clusterIcon = L.divIcon({
                        html: '<div class="collapsedMarkerIcon100"><span>' + cluster.getChildCount() + '</span><img src="images/poi/sighting_marker_big_green@2x.png"/><div>',
                        iconSize: [20, 30]
                    });
                }
                return clusterIcon;
            }
        });

        $rootScope.map.addLayer($rootScope.sightingCluster);
        $rootScope.map.addLayer($rootScope.poiCluster);




        var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            mapLayer = L.tileLayer(osmUrl, { attribution: osmAttrib, noWrap: true });

        mapLayer.addTo($rootScope.map);

        $rootScope.map.worldCopyJump = false;


        //ADD CONTROLS//
        $rootScope.drawnItems = new L.FeatureGroup();
        $rootScope.listedMarkers = new L.FeatureGroup();
        $rootScope.map.addLayer($rootScope.drawnItems);

        $scope.drawControl = new L.Control.Draw({
            position: 'bottomright',
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    drawError: {
                        color: '#b00b00',
                        timeout: 1000
                    },
                    shapeOptions: {
                        color: '#2E4AFF'
                    }
                },
                rectangle: false,
                polyline: false,
                circle: false,
                marker: true
            },
            edit: {
                featureGroup: $rootScope.drawnItems,
                remove: true
            }
        });


        $rootScope.map.addControl($scope.drawControl);


        var handleCreationEvent = function (l) {

            var layer = l;

            if (layer instanceof L.Polygon) {
                $scope.polygonLayer = layer;

                $scope.isPolygonCreated = true;

                $scope.interactionWithDOM();

                //var pixelFieldCenterG = $rootScope.map.options.crs.latLngToPoint($scope.fieldCenter, $rootScope.map.getZoom());

                $scope.fieldCenter = $scope.polygonLayer.getBounds().getCenter();

                $scope.attachEditToolbarToPolygon();

                $rootScope.drawnItems.addLayer(layer);
            }

        }

        $rootScope.addSightingOrPoi = function (e) {
            if ($rootScope.selectedField && !$scope.creating) {
                $rootScope.map.off('dblclick', $rootScope.addSightingOrPoi);

                //console.log('dbl clicked!');
                $scope.disableMapInteraction();

                $timeout(function () {
                    var markerLatLng = e.latlng;
                    $rootScope.markerCoordianates = markerLatLng;
                    $rootScope.testMarker = L.marker(markerLatLng, { icon: $rootScope.neutralIcon });

                    //.bindPopup("You are within " + radius + " meters from this point").openPopup();

                    $rootScope.map.setView(markerLatLng);
                    $rootScope.drawnItems.addLayer($rootScope.testMarker);
                    $rootScope.listedMarkers.addLayer($rootScope.testMarker);

                    $rootScope.modalAddress = 'templates/AddSightingOrPOI.html';
                    $rootScope.makeModal();
                }, 200);
            }
        }

        $rootScope.map.on('draw:created', function (e) {

            handleCreationEvent(e.layer);

        });

        $rootScope.map.on('draw:editstart', function (e) {

            $scope.$apply(function () {
                $scope.creating = true;
            });
        });

        $rootScope.map.on('draw:edited', function (e) {

            $rootScope.drawnItems.eachLayer(function (layer) {
                if (layer instanceof L.Polygon) {
                    $scope.polygonLayer = layer;
                    $scope.fieldCenter = $scope.polygonLayer.getBounds().getCenter();

                    $rootScope.drawnItems.removeLayer($scope.polygonLayer._leaflet_id);
                    $rootScope.drawnItems.addLayer($scope.polygonLayer);
                    $scope.polygonLayer.redraw();
                    //handleCreationEvent(layer);
                }
            });
        });

        $rootScope.map.on('dblclick', $rootScope.addSightingOrPoi);

        $rootScope.map.on('draw:deleted', function (e) {
            var layers = e.layers;
            layers.eachLayer(function (layer) {
                //if (layer instanceof L.Marker) {
                //    $scope.markers.removeLayer(layer);
                //    console.log($scope.markers);
                //}
                if (layer instanceof L.Polygon) {
                    $scope.isPolygonCreated = false;
                    //$scope.fieldCenter = null;
                    $scope.interactionWithDOM();
                }
            });
        });

        //$rootScope.sightingCluster.on('animationend', function () {
        //   
        //});

        $rootScope.map.on('drag', function () {
            $scope.attachEditToolbarToPolygon();

            //$('div.leaflet-control-attribution.leaflet-control').css({ 'pointer-events': 'auto' });
        });

        $rootScope.map.on('viewreset', function () {
            $scope.attachEditToolbarToPolygon();

        });

        $rootScope.listedMarkers.on('layeradd', function (drawnLayer) {

            var drawnMarker = drawnLayer.layer;
            var onSightingClick = function (markerLatLng) {
                $.each($rootScope.selectedField.Sightings, function (index, sighting) {
                    var sightingCoord = L.latLng(sighting.latitude, sighting.longtitude);
                    if (markerLatLng.lat === sightingCoord.lat && markerLatLng.lng === sightingCoord.lng) {
                        $rootScope.selectedSighting = sighting;
                        $rootScope.modalAddress = 'templates/showSightingInfo.html';
                        $rootScope.makeModal();
                    }
                });
            };
            var onPOIClick = function (markerLatLng) {
                $.each($rootScope.selectedField.POIs, function (index, poi) {
                    var POICoord = L.latLng(poi.latitude, poi.longtitude);
                    if (markerLatLng.lat === POICoord.lat && markerLatLng.lng === POICoord.lng) {
                        $rootScope.selectedPOI = poi;
                        $rootScope.modalAddress = 'templates/showPOIInfo.html';
                        $rootScope.makeModal();
                    }
                });
            };

            drawnMarker.on('click', function () {
                var markerLatLng = drawnMarker.getLatLng();
                $scope.selectedMarker = drawnMarker;
                $rootScope.map.setView(markerLatLng);

                if ($rootScope.sightingCluster.hasLayer(drawnMarker))
                    onSightingClick(markerLatLng);
                else if ($rootScope.poiCluster.hasLayer(drawnMarker))
                    onPOIClick(markerLatLng);
            });

            var markerLongTouch = function () {
                drawnMarker.off('contextmenu', markerLongTouch);
                drawnMarker.setIcon($rootScope.draggingIcon);
                $scope.markerOldCoord = drawnMarker._latlng;
                drawnMarker.dragging.enable();
            };
            var saveSightingLocation = function () {
                $scope.markerNewCoord = drawnMarker.getLatLng();
                $.each($rootScope.selectedField.Sightings, function (index, sighting) {
                    var sightingCoord = L.latLng(sighting.latitude, sighting.longtitude);
                    if ($scope.markerOldCoord.lat === sightingCoord.lat && $scope.markerOldCoord.lng === sightingCoord.lng) {
                        sighting.latitude = $scope.markerNewCoord.lat;
                        sighting.longtitude = $scope.markerNewCoord.lng;
                        putSighting(sighting);
                        if ($rootScope.sightingCluster.hasLayer(drawnMarker))
                            $rootScope.showAlertPopup($trans("sight_location_changed_success"), false);
                    }
                });
            };
            var putSighting = function (sighting) {
                fileHelper.saveToFile($rootScope.fields, "fields.json");
                $rootScope.$broadcast('loading:show');

                apiConnection.putSighting(sighting).then(function (data) {
                    if ($rootScope.sightingCluster.hasLayer(drawnMarker))
                        drawnMarker.setIcon($rootScope.sightingIcon);
                    else if ($rootScope.poiCluster.hasLayer(drawnMarker))
                        drawnMarker.setIcon($rootScope.poiIcon);
                    drawnMarker.on('contextmenu', markerLongTouch);

                    $rootScope.$broadcast('loading:hide');
                }, function (status, answer) {
                    var data = JSON.stringify({
                        Type: sighting.Type,
                        Animal: sighting.Animal,
                        State: sighting.State,
                        Note: sighting.Note,
                        Age: sighting.Age,
                        latitude: sighting.latitude,
                        longtitude: sighting.longtitude,
                        Date: sighting.Date
                    });
                    var task = taskService.createDataTask('PUT', '/odata/Sightings/' + sighting.SightingId, data);
                    taskService.addTask(task);
                    $rootScope.$broadcast('loading:hide');
                });
            };
            var savePOILocation = function () {
                $scope.markerNewCoord = drawnMarker.getLatLng();
                $.each($rootScope.selectedField.POIs, function (index, poi) {
                    var poiCoord = L.latLng(poi.latitude, poi.longtitude);
                    if ($scope.markerOldCoord.lat === poiCoord.lat && $scope.markerOldCoord.lng === poiCoord.lng) {
                        poi.latitude = $scope.markerNewCoord.lat;
                        poi.longtitude = $scope.markerNewCoord.lng;
                        putPOI(poi);
                        if ($rootScope.poiCluster.hasLayer(drawnMarker))
                            $rootScope.showAlertPopup($trans("poi_location_changed_success"), false);
                    }
                });
            };
            var putPOI = function (poi) {
                fileHelper.saveToFile($rootScope.fields, "fields.json");
                $rootScope.$broadcast('loading:show');

                apiConnection.putPOI(poi).then(function (data) {
                    if ($rootScope.poiCluster.hasLayer(drawnMarker))
                        drawnMarker.setIcon($rootScope.poiIcon);
                    drawnMarker.on('contextmenu', markerLongTouch);

                    $rootScope.$broadcast('loading:hide');
                }, function (status, answer) {
                    var data = JSON.stringify({
                        Name: poi.Name,
                        Note: poi.Note,
                        latitude: poi.latitude,
                        longtitude: poi.longtitude
                    });
                    var task = taskService.createDataTask('PUT', '/odata/POIs/' + poi.POIId, data);
                    taskService.addTask(task);
                    $rootScope.$broadcast('loading:hide');
                });
            }

            $scope.cancelMarkerDragging = function () {
                drawnMarker = $scope.currentMarker;
                drawnMarker.setLatLng($scope.markerOldCoord).update();
                if ($rootScope.sightingCluster.hasLayer(drawnMarker))
                    drawnMarker.setIcon($rootScope.sightingIcon);
                else if ($rootScope.poiCluster.hasLayer(drawnMarker))
                    drawnMarker.setIcon($rootScope.poiIcon);
                drawnMarker.on('contextmenu', markerLongTouch);
            }

            //drawnMarker.on('contextmenu', markerLongTouch);
            drawnMarker.on('dragend', function () {
                if ($rootScope.sightingCluster.hasLayer(drawnMarker))
                    $rootScope.showAlertPopup($trans("save_sighting_location"), true, saveSightingLocation);
                else if ($rootScope.poiCluster.hasLayer(drawnMarker))
                    $rootScope.showAlertPopup($trans("save_poi_location"), true, savePOILocation);

                // whatch when we click save sighting location popupAlert cancel btn while dragging
                $(document).on('click', '#popupCancel', function () {
                    $scope.cancelMarkerDragging();
                });

                drawnMarker.dragging.disable();
                $scope.currentMarker = drawnMarker;
            });
        });
    });

    $ionicPopover.fromTemplateUrl('templates/usersManagementPopover.html', {
        scope: $scope,
    }).then(function (popover) {
        $scope.popover = popover;
    });

    $scope.showInvite = function () {
        $scope.popover.hide();
        $scope.invites = $ionicPopup.show({
            cssClass: 'popup-invites',
            templateUrl: 'templates/invites.html',
            scope: $scope
        });
    }

    $scope.showManage = function () {
        $scope.popover.hide();
        if ($rootScope.selectedField.Users.length == 1 && $rootScope.selectedField.Users[0].UserName == $rootScope.currUser.UserName) {
            $rootScope.showAlertPopup("You are the only user of this field", false);
            return;
        }
            $scope.manages = $ionicPopup.show({
                cssClass: 'popup-manages',
                templateUrl: 'templates/manages.html',
                scope: $scope
            });
    }

    $scope.addNote = function () {
        $scope.isAddNoteButtonClicked = ($scope.isAddNoteButtonClicked === true) ? false : true;
    }

    $scope.locationLayersGroup = new L.LayerGroup();

    $scope.locateMe = function () {
        $scope.isLocateMeButtonClicked = true;
        $rootScope.map.locate({ setView: true, maxZoom: 16 });


        function onLocationFound(e) {
            var radius = e.accuracy / 2;

            var myIcon = L.icon({
                iconUrl: 'images/leaflet/marker.png',
                iconRetinaUrl: 'images/leaflet/marker@2x.png',
                iconSize: [10, 10],
                iconAnchor: [4, 4],
                popupAnchor: [0, 0],
                shadowUrl: 'images/leaflet/shadow.png',
                shadowRetinaUrl: 'images/leaflet/shadow@2x.png',
                shadowSize: [15, 10],
                shadowAnchor: [0, 5]
            });

            $scope.locationLayersGroup.clearLayers();


            L.marker(e.latlng, { icon: myIcon }).addTo($scope.locationLayersGroup);
            //    .bindPopup("You are within " + radius + " meters from this point").openPopup();

            L.circle(e.latlng, radius).addTo($scope.locationLayersGroup);


            $scope.locationLayersGroup.addTo($rootScope.map);
            $scope.isLocateMeButtonClicked = false;
            $scope.$apply();
        }

        function onLocationError(e) {
            $rootScope.showAlertPopup($trans("location_error"), false);
            $scope.isLocateMeButtonClicked = false;
            $scope.$apply();
        }

        $rootScope.map.on('locationfound', onLocationFound);
        $rootScope.map.on('locationerror', onLocationError);
    };

    $scope.interactionWithDOM = function () {
        $timeout(function () {
            $('#map').trigger('click');
        }, 100);
    };

    $scope.cancelFieldEditing = function () {
        $scope.isPolygonButtonClicked = false;
        $scope.creating = false;
        if ($scope.isPolygonCreated)
            $rootScope.drawnItems.eachLayer(function (layer) {
                if (layer instanceof L.Polygon) {
                    $rootScope.drawnItems.removeLayer(layer);
                    mapFactory.loadField($rootScope.selectedField.Coordinates, $rootScope.drawnItems, $rootScope.map);
                }
            });

        else {
            mapFactory.loadField($rootScope.selectedField.Coordinates, $rootScope.listedMarkers, $rootScope.map);
        }
        $scope.showEditRemoveButtons = false;
        $scope.field.name = $rootScope.selectedField.Name;
    }

    $scope.exportData = function (fieldId) {
        $rootScope.$broadcast('loading:show');
        apiConnection.exportField(fieldId).then(function (data) {
            $rootScope.$broadcast('loading:hide');
            $rootScope.showAlertPopup($trans("field_export_success"), false);
        });
    }

    $scope.addImage = function () {

        var hideSheet = $ionicActionSheet.show({
            buttons: [
               { text: $trans("choose_from_galery") },
               { text: $trans("take_photo") }
            ],
            titleText: $trans("add_field_pic"),
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

    //$scope.takePhoto = function () {
    //    var options = {
    //        correctOrientation: true
    //    };
    //    $scope.takeImage(options);
    //}

    //$scope.choosePhoto = function () {
    //    var options = {
    //        sourceType: 0,
    //        correctOrientation: true
    //    };
    //    $scope.takeImage(options);
    //    $scope.showGalleryVar = false;
    //    $scope.isAddPhotoButtonClicked = false;
    //}

    $scope.takeImage = function (options) {
        // 2
        //var options = {
        //    destinationType: Camera.DestinationType.FILE_URI,
        //    sourceType: Camera.PictureSourceType.CAMERA, // Camera.PictureSourceType.PHOTOLIBRARY
        //    allowEdit: false,
        //    encodingType: Camera.EncodingType.JPEG,
        //    popoverOptions: CameraPopoverOptions,
        //};

        // 3
        Camera.getPicture(options).then(function (imageData) {

            // 4
            onImageSuccess(imageData);

            function onImageSuccess(fileURI) {
                createFileEntry(fileURI);
                console.log(JSON.stringify(fileURI));
            }

            function createFileEntry(fileURI) {
                window.resolveLocalFileSystemURL(fileURI, copyFile, fail);
            }

            // 5
            function copyFile(fileEntry) {
                var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
                var newName = makeid() + name;
                console.log(JSON.stringify(fileEntry));
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (fileSystem2) {
                    fileEntry.copyTo(
                    fileSystem2,
                    newName,
                    onCopySuccess,
                    fail
                    );
                },
                fail);
            }

            // 6
            function onCopySuccess(entry) {
                $scope.$apply(function () {
                    // if ($scope.newField.Image.SRC == "")
                    $scope.newField.Image.SRC = entry.name;
                    //else $scope.newField.images.push(entry.name);
                });
            }

            function fail(error) {
                console.log("fail: " + error.code);
            }

            function makeid() {
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                for (var i = 0; i < 5; i++) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }

                return text;
            }

        }, function (err) {
            console.log(err);
        });
    }

    $scope.allStepsFinished = function () {
        if ($scope.field.name && $scope.field.name !== '' &&
            $scope.field.note && $scope.field.note !== '' &&
            !$scope.isEditPolygonClicked &&
            $scope.isPolygonCreated) {

            return true;
        } else return false;
    };

    $scope.saveField = function () {
        var putFunc = function () {
            apiConnection.putField($rootScope.selectedField).then(function (data) {

                fileHelper.saveToFile($rootScope.fields, "fields.json");

                //apiConnection.getWeather($rootScope.selectedField.FieldId).then(function (result) {

                //    $rootScope.selectedField.weather = result.data
                //    fileHelper.saveToFile($rootScope.fields, "fields.json");

                //}, function (status, answer) {

                //});

                /*IMAGE EDITING*/  /////////////////////////////////////////////////////////////////////////////////////////////////////
                
                if ($scope.newField.Image.SRC && $scope.newField.Image.SRC != "")
                    apiConnection.uploadFieldPhotos($rootScope.urlForImage($scope.newField.Image.SRC), $scope.newField.Image.SRC, $scope.newField.FieldId, 0).then(function (data) {
                        if (!data.success) {
                            alert("failed photo #" + data.index);
                        }
                    });
                  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                //$state.go('dashboard');
                //$rootScope.form.close();
            }, function (status, answer) {
                var data = JSON.stringify({
                    Name: $rootScope.selectedField.Name,
                    Note: $rootScope.selectedField.Note,
                    Date: $rootScope.selectedField.Date,
                    longtitude: $rootScope.selectedField.longtitude,
                    latitude: $rootScope.selectedField.latitude,
                    Coordinates: $rootScope.selectedField.Coordinates
                });
                var task = taskService.createDataTask('PUT', '/api/Fields/' + $rootScope.selectedField.FieldId, data);

                /*IMAGE EDITING*/ ///////////////////////////////////////////////////////////////////////////////////////////////////
                
                if ($scope.newField.Image.SRC && $scope.newField.Image.SRC != "") {
                    var imagesSubtask = taskService.createImgTask('/api/upload/field/' + $scope.newField.FieldId, $scope.newField.Image.SRC, $rootScope.urlForImage($scope.newField.Image.SRC));
                    task.subTask = imagesSubtask;
                }
                 /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                taskService.addTask(task);
                fileHelper.saveToFile($rootScope.fields, "fields.json");

                //$state.go('dashboard');
                //$rootScope.form.close();
            });
        }

        if ($scope.polygonLayer) {
            $scope.fieldCenter = $scope.polygonLayer.getBounds().getCenter();
            $rootScope.selectedField.Coordinates = $scope.polygonLayer.getLatLngs();
        }

        $rootScope.selectedField.Name = $scope.field.name;
        $rootScope.selectedField.Note = $scope.field.note;
        $rootScope.selectedField.longtitude = $scope.fieldCenter.lng;
        $rootScope.selectedField.latitude = $scope.fieldCenter.lat;
        $rootScope.selectedField.Image = $scope.newField.Image;

        putFunc();

        $scope.creating = false;
        $scope.isPolygonButtonClicked = false;
    }

    //map buttons logic//
    $scope.createPolygon = function () {
        if ($scope.isPolygonButtonClicked) {
            $scope.isPolygonButtonClicked = false;
        } else {
            if (!$scope.isPolygonCreated) {
            $('a.leaflet-draw-draw-polygon')[0].click();
            }
            $scope.isPolygonButtonClicked = true;
        }
    }

    $scope.cancelPolygonDrawing = function () {
        $('ul.leaflet-draw-actions li a')[2].click();
        $scope.isPolygonButtonClicked = false;
    }

    $scope.deleteLastPoint = function () {
        $('ul.leaflet-draw-actions li a')[1].click();
    }

    $scope.finishPolygonDrawing = function () {
        $('ul.leaflet-draw-actions li a')[0].click();
        $scope.isPolygonButtonClicked = false;
    }

    $scope.editPolygon = function () {
        if ($scope.isEditPolygonClicked) {
            $scope.isEditPolygonClicked = false;
        } else {
            if (!$scope.isDeletePolygonClicked) {               //if another button is not active at this time
                $('a.leaflet-draw-edit-edit')[0].click();
                $scope.isEditPolygonClicked = true;
            }
        }
    }

    $scope.deletePolygon = function () {
        if ($scope.isDeletePolygonClicked) {
            $scope.isDeletePolygonClicked = false;
        } else {
            if (!$scope.isEditPolygonClicked) {             //if another button is not active at this time 
                $('a.leaflet-draw-edit-remove')[0].click();
                $scope.isDeletePolygonClicked = true;
            }
        }
    }

    $scope.saveEditedPolygon = function () {
        $('ul.leaflet-draw-actions.leaflet-draw-actions-top li:first-child a')[0].click();
        $scope.isEditPolygonClicked = false;
    }

    $scope.cancelEditingPolygon = function () {
        $('ul.leaflet-draw-actions.leaflet-draw-actions-top li:last-child a')[0].click();
        $scope.isEditPolygonClicked = false;
    }

    $scope.savePolygonDeletion = function () {
        $('ul.leaflet-draw-actions.leaflet-draw-actions-bottom li a')[0].click();
        $scope.isDeletePolygonClicked = false;
        $scope.isPolygonButtonClicked = false;
    }

    $scope.cancelPolygonDeletion = function () {
        $('ul.leaflet-draw-actions.leaflet-draw-actions-bottom li a')[1].click();
        $scope.isDeletePolygonClicked = false;
    }

    $scope.$watch('isPolygonButtonClicked', function () {
        if (!$scope.isPolygonButtonClicked) {
            if ($scope.isEditPolygonClicked) {
                $scope.isEditPolygonClicked = false;
                //$('ul.leaflet-draw-actions.leaflet-draw-actions-top li:last-child a')[0].click();
            }
            $(".createPolygon").attr("src", "images/field/ico_add_boundaries@2x.png");
            if ($('ul.leaflet-draw-actions li a')[2]) // if user clicked CreatePolygon button when it was already pressed
                $('ul.leaflet-draw-actions li a')[2].click();  // cancel button actions
            if ($scope.isPolygonCreated)
                $scope.showEditRemoveButtons = false;
        }
        else {
            $(".createPolygon").attr("src", "images/field/ico_add_boundaries_pressed@2x.png");
            if ($scope.isPolygonCreated)
                $scope.showEditRemoveButtons = true;
        }
        //alert($('a.leaflet-draw-draw-polygon').length);

    });

    $scope.$watch('isEditPolygonClicked', function () {
        if (!$scope.isEditPolygonClicked) {
            $(".polygonEditing-map img:first").attr("src", "images/field/polygon/ico_boundarie_edit@2x.png");
            if ($('ul.leaflet-draw-actions.leaflet-draw-actions-top li:last-child a')[0]) // if user clicked EditPolygon button when it was already pressed
                $('ul.leaflet-draw-actions.leaflet-draw-actions-top li:last-child a')[0].click(); // cancel button actions
            //if ($rootScope.selectedField) //if edit mode of selected field is active
            //    $scope.creating = false;
        }
        else {
            //if ($rootScope.selectedField) //if edit mode of selected field is active
            //    $scope.creating = true;
            $(".polygonEditing-map img:first").attr("src", "images/field/polygon/ico_boundarie_edit_pressed@2x.png");
        }
    });

    $scope.$watch('isDeletePolygonClicked', function () {
        if (!$scope.isDeletePolygonClicked) {
            $(".polygonEditing-map > img:nth-child(2)").attr("src", "images/field/polygon/ico_boundarie_delete@2x.png");
            if ($('ul.leaflet-draw-actions.leaflet-draw-actions-bottom li:last-child a')[0]) // if user clicked RempvePolygon button when it was already pressed
                $('ul.leaflet-draw-actions.leaflet-draw-actions-bottom li:last-child a')[0].click(); // cancel button actions
            //if ($rootScope.selectedField) //if delete mode of selected field is active
            //    $scope.creating = false;
        }
        else {
            //if ($rootScope.selectedField) //if delete mode of selected field is active
            //    $scope.creating = true;
            $(".polygonEditing-map > img:nth-child(2)").attr("src", "images/field/polygon/ico_boundarie_delete_pressed@2x.png");
        }
    });

    $scope.$watch('isAddNoteButtonClicked', function () {
        if (!$scope.isAddNoteButtonClicked) {
            $(".addNotes").attr("src", "images/field/ico_add_info@2x.png");
        }
        else {
            $(".addNotes").attr("src", "images/field/ico_add_info_pressed@2x.png");
        }
    });

    $scope.$watch('isAddPhotoButtonClicked', function () {
        if (!$scope.isAddPhotoButtonClicked) {
            $(".addPhotos").attr("src", "images/field/ico_add_cover@2x.png");
        }
        else {
            $(".addPhotos").attr("src", "images/field/ico_add_cover_pressed@2x.png");
        }
    });

    $scope.$watch('isLocateMeButtonClicked', function () {
        if (!$scope.isLocateMeButtonClicked) {
            $(".mapLocation").attr("src", "images/field/ico_locate_me@2x.png");
        }
        else {
            $(".mapLocation").attr("src", "images/field/ico_locate_me_pressed@2x.png");
        }
    });

    $scope.$watch('isPolygonCreated', function () {
        if (!$scope.isPolygonCreated) {
            //if ($rootScope.selectedField)
            //    $scope.creating = true;
        }
        else {
            $scope.isPolygonButtonClicked = false;
        }
    });

    $scope.attachEditToolbarToPolygon = function () {
        if ($scope.isPolygonCreated) {
            var pixelFieldCenter = $rootScope.map.latLngToLayerPoint($scope.fieldCenter);
            var pixelCoord = $rootScope.map.layerPointToContainerPoint(pixelFieldCenter);
            var x = Math.round(pixelCoord.x) - 55;
            var y = Math.round(pixelCoord.y) - 22;
            $('.polygonEditing-map').css('left', x);
            $('.polygonEditing-map').css('top', y);
        }
    };

    $scope.showInfo = function () {
        $scope.isShowInfoButtonClicked = $scope.isShowInfoButtonClicked ? false : true;
    };

    $scope.$watch('isShowInfoButtonClicked', function () {
        if (!$scope.isShowInfoButtonClicked) {
            $(".showNotes").attr("src", "images/field/ico_field_info@2x.png");
        }
        else {
            $(".showNotes").attr("src", "images/field/ico_field_info_pressed@2x.png");
        }
    });

    $scope.editField = function () {
        $scope.creating = true;
    };

    $scope.disableMapInteraction = function () {
        //$rootScope.map.scrollWheelZoom.disable();
        $rootScope.map.doubleClickZoom.disable();
        $rootScope.map.dragging.disable();
        $rootScope.map.tap.disable();
        $rootScope.map.touchZoom.disable();
    };

    $rootScope.enableMapInteraction = function () {
        //$rootScope.map.scrollWheelZoom.enable();
        $rootScope.map.doubleClickZoom.enable();
        $rootScope.map.dragging.enable();
        $rootScope.map.tap.enable();
        $rootScope.map.touchZoom.enable();
    };

    //$scope.addSighting = function () {
    //    $('a.leaflet-draw-draw-marker')[0].click();
    //}

    $rootScope.onRemoveModalWindow = function () {
        if ($rootScope.isSightingSaved) {
            $rootScope.isSightingSaved = false;
            $rootScope.testMarker.setIcon($rootScope.sightingIcon);
            $rootScope.drawnItems.removeLayer($rootScope.testMarker);
            $rootScope.sightingCluster.addLayer($rootScope.testMarker);
            $rootScope.testMarker = null;
        }

        if ($rootScope.isPoiSaved) {
            $rootScope.isPoiSaved = false;
            $rootScope.testMarker.setIcon($rootScope.poiIcon);
            $rootScope.drawnItems.removeLayer($rootScope.testMarker);
            $rootScope.poiCluster.addLayer($rootScope.testMarker);
            $rootScope.testMarker = null;
        }

        if ($rootScope.deleteSelectedMarker) {
            if ($rootScope.sightingCluster.hasLayer($scope.selectedMarker))
                $rootScope.sightingCluster.removeLayer($scope.selectedMarker);
            else if ($rootScope.poiCluster.hasLayer($scope.selectedMarker))
                $rootScope.poiCluster.removeLayer($scope.selectedMarker);
            $rootScope.listedMarkers.removeLayer($scope.selectedMarker);
            $rootScope.deleteSelectedMarker = false;
        }
    };

    //MODAL WINDOW//
    //$rootScope.makeModal = function () {
    //    $ionicModal.fromTemplateUrl($rootScope.modalAddress, {
    //        scope: $rootScope,
    //        animation: 'slide-in-up'
    //    }).then(function (modal) {
    //        $rootScope.modal = modal;
    //    });
    //
    //    $timeout(function () {
    //        $rootScope.modal.show();
    //
    //        if ($state.includes('map'))
    //            $rootScope.map.on('dblclick', $rootScope.addSightingOrPoi);
    //
    //        //remove modal window if we click outside this window
    //        $('div.modal-backdrop-bg').css({ 'pointer-events': 'auto' });
    //        $('div.modal-backdrop-bg').css({ 'z-index': '-100' });
    //        $('div.modal-wrapper > div').css({ 'z-index': '100' });
    //
    //        var modalBackground = $('div.modal-backdrop-bg')[$('div.modal-backdrop-bg').length - 1];
    //        $(modalBackground).on('click', function () {
    //            $rootScope.modal.remove();
    //            if ($rootScope.testMarker) {
    //                $rootScope.drawnItems.removeLayer($rootScope.testMarker);
    //                $rootScope.listedMarkers.removeLayer($rootScope.testMarker);
    //            }
    //        });
    //    }, 100);
    //};
    //
    ////Cleanup the modal when we're done with it!
    //$scope.$on('$destroy', function () {
    //    console.log('on destroy');
    //    if ($rootScope.modal)
    //        $rootScope.modal.remove();
    //});
    //// Execute action on hide modal
    //$scope.$on('modal.hidden', function () {
    //    //console.log('hidden');
    //});
    //// Execute action on remove modal
    //$scope.$on('modal.removed', function () {
    //    if ($state.includes('map'))
    //        $rootScope.enableMapInteraction();
    //
    //    if ($rootScope.isSightingSaved) {
    //        $rootScope.isSightingSaved = false;
    //        $rootScope.testMarker.setIcon($rootScope.sightingIcon);
    //        $rootScope.drawnItems.removeLayer($rootScope.testMarker);
    //        $rootScope.sightingCluster.addLayer($rootScope.testMarker);
    //        $rootScope.testMarker = null;
    //    }
    //
    //    if ($rootScope.isPoiSaved) {
    //        $rootScope.isPoiSaved = false;
    //        $rootScope.testMarker.setIcon($rootScope.poiIcon);
    //        $rootScope.drawnItems.removeLayer($rootScope.testMarker);
    //        $rootScope.poiCluster.addLayer($rootScope.testMarker);
    //        $rootScope.testMarker = null;
    //    }
    //
    //    if ($rootScope.deleteSelectedMarker) {
    //        if ($rootScope.sightingCluster.hasLayer($scope.selectedMarker))
    //            $rootScope.sightingCluster.removeLayer($scope.selectedMarker);
    //        else if ($rootScope.poiCluster.hasLayer($scope.selectedMarker))
    //            $rootScope.poiCluster.removeLayer($scope.selectedMarker);
    //        $rootScope.listedMarkers.removeLayer($scope.selectedMarker);
    //        $rootScope.deleteSelectedMarker = false;
    //    }
    //
    //    //clear sighting filter arrays
    //    $rootScope.animalFilterLatLngArr = null;
    //    $rootScope.typeFilterLatLngArr = null;
    //    $rootScope.stateFilterLatLngArr = null;
    //});
    //MODAL WINDOW//

    //=========Weather functionality=========\\
    $scope.getDistance = function (data) {
        return getDistance(data);
    }

    $scope.isExpanded = false;

    $scope.expandWeather = function () {
        $scope.isExpanded = !$scope.isExpanded;
    }

    $scope.isLocaL = function (data) {
        return isLocal(data);
    }

    $scope.showSightingInfo = function (sighting, state) {
        $scope.changeRightCol(state);
        $rootScope.selectedSighting = sighting;
    }

    //$scope.initGallery = function () {
    //    //"file:///data/data/io.cordova.IWL1/cache/Cover1977123709.jpg"
    //    //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
    //    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (succ) {
    //        var dirEntry = new resolveLocalFileSystemURL('file:///', function (success) {
    //            var a = 0;
    //            var directoryReader = success.createReader();
    //            directoryReader.readEntries(function (results) {
    //                //$('.slickContainer').slick({
    //                //    lazyLoad: true
    //                //});
    //                //for (var i = 0; i < results.length; i++) {
    //                //    $('.slickContainer').slick('slickAdd', '<div class="galleryImage" style="background-image:url("' + results[i] + '") center no-repeat;"></div>');
    //                //}
    //            }, function (error) {
    //                console.log('Error: ' + error);
    //            })
    //        }, function (errror) {
    //            var i = 0;
    //        });
    //    }, function (err) {

    //    });

    //};

    $scope.toggleGallery = function () {
        $scope.isAddPhotoButtonClicked = !$scope.isAddPhotoButtonClicked;
        $scope.addImage();
        //$scope.showGalleryVar = !$scope.showGalleryVar;
    }

    $scope.getStyle = function (val) {
        if (val) {
            var height = window.innerHeight - 100;
            return { 'height': height + 'px' };
        } else {
            return { 'height': '100%' };
        }

    }

    function getUTFIcon(name) {
        switch (name) {
            case "wi-moon-new":
                return '\uf095';
                break;
            case "wi-moon-waxing-cresent-3":
                return '\uf098';
                break;
            case "wi-moon-first-quarter":
                return '\uf09c';
                break;
            case "wi-moon-waxing-gibbous-3":
                return '\uf09f';
                break;
            case "wi-moon-full":
                return '\uf0a3';
                break;
            case "wi-moon-waning-gibbous-4":
                return '\uf0a7';
                break;
            case "wi-moon-3rd-quarter":
                return '\uf0aa';
                break;
            case "wi-moon-waning-crescent-4":
                return '\uf0ae';
                break;
        }
    }

    function getWeatIndex(field, dateISO) {
        var date = (dateISO == undefined) ? new Date() : new Date(dateISO);
        var today = $filter('date')(date, 'yyyy-MM-dd');
        for (var i = 0; i < field.weather.length; i++) {
            if (field.weather[i].date == today) {
                return i;
            }
        }
    }

    function getInd(field, dateISO) {
        var date = (dateISO == undefined) ? new Date() : new Date(dateISO);
        var today = $filter('date')(date, 'yyyy-MM-dd');
        for (var i = 0; i < field.weather.length; i++) {
            if (field.weather[i].date == today) {
                return i;
            }
        }
        return -1;
    }
});
