angular.module('createMapMd', [])
.controller('CreateMapCtrl', function ($timeout, $scope, $rootScope, $state, $filter, Camera, apiConnection, taskService, fileHelper, $ionicHistory) {
    var $trans = $filter('translate');

    $rootScope.markerCoordianates = null;

    $scope.field = {};

    $scope.fieldCenter = L.latLng(0, 0);

    $scope.newField = {};
    $scope.newField.Image = {};
    $scope.newField.Coordinates = null;

    $scope.isAddNoteButtonClicked = false;
    $scope.isAddPhotoButtonClicked = false;
    $rootScope.isPolygonCreated = false;

    $scope.drawControl = null;
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

    $scope.$on("$ionicView.afterEnter", function () {
        $scope.createMap.scrollWheelZoom.disable();
        $('div.leaflet-control-attribution.leaflet-control').css({ 'pointer-events': 'none' }); //prevent a href transition 

        $scope.field.name = "";
        $scope.field.note = "";
        var europeLatLng = L.latLng(44, 4);
        $scope.createMap.setView(europeLatLng, 5);
        $scope.locateMe();

    });


    $scope.$on("$ionicView.afterLeave", function () {
        $scope.drawnItems.clearLayers();

        $rootScope.isPolygonCreated = false;
        $scope.polygonLayer = null;
        $rootScope.testMarker = null;
        $ionicHistory.clearCache();
        $scope.drawControl.removeFrom($scope.createMap);
        //$scope.createMap.remove();
    });

    $scope.$on("$ionicView.loaded", function () {

        $scope.createMap = new L.map('createMap');

        var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            mapLayer = L.tileLayer(osmUrl, { attribution: osmAttrib, noWrap: true });

        mapLayer.addTo($scope.createMap);

        $scope.createMap.worldCopyJump = false;


        //ADD CONTROLS//
        $scope.drawnItems = new L.FeatureGroup();
        $scope.createMap.addLayer($scope.drawnItems);

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
                        color: '#2e4aff'
                    }
                },
                rectangle: false,
                polyline: false,
                circle: false,
                marker: true
            },
            edit: {
                featureGroup: $scope.drawnItems,
                remove: true
            }
        });


        $scope.createMap.addControl($scope.drawControl);


        var handleCreationEvent = function (l) {

            var layer = l;

            if (layer instanceof L.Polygon) {
                $scope.polygonLayer = layer;

                $rootScope.isPolygonCreated = true;

                $scope.interactionWithDOM();

                $scope.fieldCenter = $scope.polygonLayer.getBounds().getCenter();

                $scope.attachEditToolbarToPolygon();

                $scope.drawnItems.addLayer(layer);
            }
        }

        $scope.createMap.on('draw:created', function (e) {
            handleCreationEvent(e.layer);
        });

        //$scope.createMap.on('draw:editstart', function (e) {

        //    $scope.$apply(function () {
        //        $scope.creating = true;
        //    });
        //});

        $scope.createMap.on('draw:edited', function (e) {

            $scope.drawnItems.eachLayer(function (layer) {
                if (layer instanceof L.Polygon) {
                    $scope.polygonLayer = layer;
                    $scope.fieldCenter = $scope.polygonLayer.getBounds().getCenter();

                    $scope.drawnItems.removeLayer($scope.polygonLayer._leaflet_id);
                    $scope.drawnItems.addLayer($scope.polygonLayer);
                    $scope.polygonLayer.redraw();
                    //handleCreationEvent(layer);
                }
            });
        });


        $scope.createMap.on('draw:deleted', function (e) {
            var layers = e.layers;
            layers.eachLayer(function (layer) {
                if (layer instanceof L.Polygon) {
                    $rootScope.isPolygonCreated = false;
                    //$scope.fieldCenter = null;
                    $scope.interactionWithDOM();
                }
            });
        });

        $scope.createMap.on('drag', function () {
            $scope.attachEditToolbarToPolygon();
        });

        $scope.createMap.on('viewreset', function () {
            $scope.attachEditToolbarToPolygon();
        });
    });

    $scope.addNote = function () {
        $scope.isAddNoteButtonClicked = ($scope.isAddNoteButtonClicked === true) ? false : true;
    }

    $scope.locationLayersGroup = new L.LayerGroup();

    $scope.locateMe = function () {
        $scope.isLocateMeButtonClicked = true;
        $scope.createMap.locate({ setView: true, maxZoom: 16 });


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


            $scope.locationLayersGroup.addTo($scope.createMap);
            $scope.isLocateMeButtonClicked = false;
            $scope.$apply();
        }

        function onLocationError(e) {
            $rootScope.showAlertPopup($trans("location_error"), false);
            $scope.isLocateMeButtonClicked = false;
            $scope.$apply();
        }

        $scope.createMap.on('locationfound', onLocationFound);
        $scope.createMap.on('locationerror', onLocationError);
    };

    $scope.interactionWithDOM = function () {
        $timeout(function () {
            $('#createMap').trigger('click');
        }, 100);
    };

    $scope.backButton = function () {
        $scope.showGalleryVar = false;
        $state.go('dashboard');
    }

    $scope.takePhoto = function () {
        var options = {
            correctOrientation: true
        };
        $scope.takeImage(options);
    }

    $scope.choosePhoto = function () {
        var options = {
            sourceType: 0,
            correctOrientation: true
        };
        $scope.takeImage(options);
        $scope.showGalleryVar = false;
        $scope.isAddPhotoButtonClicked = false;
    }

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
            $rootScope.isPolygonCreated) {

            return true;
        } else return false;
    };

    $rootScope.saveNewField = function () {
        if ($scope.allStepsFinished()) {
            $scope.newField.Coordinates = $scope.polygonLayer.getLatLngs();
            $scope.newField.Name = $scope.field.name;
            $scope.newField.Note = $scope.field.note;
            $scope.newField.longtitude = $scope.fieldCenter.lng;
            $scope.newField.latitude = $scope.fieldCenter.lat;
            $scope.newField.Date = (new Date()).toISOString();
            $scope.newField.FieldId = taskService.guid();
            $scope.newField.Owner = {};
            $scope.newField.Owner.UserName = $rootScope.currUser.UserName;

            console.log("Adding new Field:" + JSON.stringify($scope.newField));

            $rootScope.fields.push($scope.newField);

            apiConnection.postField($scope.newField).then(function (data) {
                for (var indexF = 0; indexF < $rootScope.fields.length; indexF++) {
                    if ($rootScope.fields[indexF].FieldId == data.FieldId) {
                        fieldIndex = indexF;
                        break;
                    }
                }
                $rootScope.fields[fieldIndex].Users = data.Users
                fileHelper.saveToFile($rootScope.fields, "fields.json");

                apiConnection.getWeather($scope.newField.FieldId).then(function (result) {
                    var fieldIndex = null;
                    for (var indexF = 0; indexF < $rootScope.fields.length; indexF++) {
                        if ($rootScope.fields[indexF].FieldId == result.fieldId) {
                            fieldIndex = indexF;
                            break;
                        }
                    }
                    $rootScope.fields[fieldIndex].weather = result.data
                    fileHelper.saveToFile($rootScope.fields, "fields.json");

                }, function (status, answer) {

                    //saveToFile("fields", $rootScope.fields);
                });
                if ($scope.newField.Image.SRC && $scope.newField.Image.SRC != "")
                    apiConnection.uploadFieldPhotos($rootScope.urlForImage($scope.newField.Image.SRC), $scope.newField.Image.SRC, $scope.newField.FieldId, 0).then(function (data) {
                        if (!data.success) {
                            console.log("failed photo #" + data.index);
                        }
                    });

                //$state.go('dashboard');
                //$rootScope.form.close();
            }, function (status, answer) {
                var data = {
                    Name: $scope.newField.Name,
                    Note: $scope.newField.Note,
                    Date: $scope.newField.Date,
                    longtitude: $scope.fieldCenter.lng,
                    latitude: $scope.fieldCenter.lat,
                    Coordinates: $scope.newField.Coordinates,
                    FieldId: $scope.newField.FieldId
                }
                var task = taskService.createDataTask('POST', '/api/Fields/', data);
                if ($scope.newField.Image.SRC && $scope.newField.Image.SRC != "") {
                    var imagesSubtask = taskService.createImgTask('/api/upload/field/' + $scope.newField.FieldId, $scope.newField.Image.SRC, $rootScope.urlForImage($scope.newField.Image.SRC));
                    task.subTask = imagesSubtask;
                }
                taskService.addTask(task);

                fileHelper.saveToFile($rootScope.fields, "fields.json");

                //$state.go('dashboard');
                //$rootScope.form.close();
            });

            $rootScope.selectedField = $rootScope.fields[$rootScope.fields.length - 1];
            $rootScope.selectedField.Sightings = ($rootScope.selectedField.Sightings) ? $rootScope.selectedField.Sightings : [];
            stableSort($rootScope.fields);

            $scope.drawnItems.clearLayers(); //to avoid polygons overlay when map is reloaded 
            $state.go("map");
        };
    }

    //map buttons logic//
    $scope.createPolygon = function () {
        if ($scope.isPolygonButtonClicked) {
            $scope.isPolygonButtonClicked = false;
        } else {
            if (!$rootScope.isPolygonCreated) {
                //alert($('a.leaflet-draw-draw-polygon').length);

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
            //$(".createPolygon").attr("src", "images/field/ico_add_boundaries@2x.png");
            if ($('ul.leaflet-draw-actions li a')[2]) // if user clicked CreatePolygon button when it was already pressed
                $('ul.leaflet-draw-actions li a')[2].click();  // cancel button actions
            if ($rootScope.isPolygonCreated) {
                $scope.showEditRemoveButtons = false;
            }
        }
        else {
            //$(".createPolygon").attr("src", "images/field/ico_add_boundaries_pressed@2x.png");
            if ($rootScope.isPolygonCreated) {
                $scope.showEditRemoveButtons = true;
            }
        }
        //alert($('a.leaflet-draw-draw-polygon').length);

    });

    $scope.$watch('isEditPolygonClicked', function () {
        if (!$scope.isEditPolygonClicked) {
            //$(".polygonEditing-map img:first").attr("src", "images/field/polygon/ico_boundarie_edit@2x.png");
            if ($('ul.leaflet-draw-actions.leaflet-draw-actions-top li:last-child a')[0]) // if user clicked EditPolygon button when it was already pressed
                $('ul.leaflet-draw-actions.leaflet-draw-actions-top li:last-child a')[0].click(); // cancel button actions
            //if ($rootScope.selectedField) //if edit mode of selected field is active
            //    $scope.creating = false;
        }
        else {
            //if ($rootScope.selectedField) //if edit mode of selected field is active
            //    $scope.creating = true;
            //$(".polygonEditing-map img:first").attr("src", "images/field/polygon/ico_boundarie_edit_pressed@2x.png");
        }
    });

    $scope.$watch('isDeletePolygonClicked', function () {
        if (!$scope.isDeletePolygonClicked) {
            //$(".polygonEditing-map > img:nth-child(2)").attr("src", "images/field/polygon/ico_boundarie_delete@2x.png");
            if ($('ul.leaflet-draw-actions.leaflet-draw-actions-bottom li:last-child a')[0]) // if user clicked RempvePolygon button when it was already pressed
                $('ul.leaflet-draw-actions.leaflet-draw-actions-bottom li:last-child a')[0].click(); // cancel button actions
            //if ($rootScope.selectedField) //if delete mode of selected field is active
            //    $scope.creating = false;
        }
        else {
            //if ($rootScope.selectedField) //if delete mode of selected field is active
            //    $scope.creating = true;
            //$(".polygonEditing-map > img:nth-child(2)").attr("src", "images/field/polygon/ico_boundarie_delete_pressed@2x.png");
        }
    });

    //$scope.$watch('isAddNoteButtonClicked', function () {
    //    if (!$scope.isAddNoteButtonClicked) {
    //        $(".addNotes").attr("src", "images/field/ico_add_info@2x.png");
    //    }
    //    else {
    //        $(".addNotes").attr("src", "images/field/ico_add_info_pressed@2x.png");
    //    }
    //});

    //$scope.$watch('isAddPhotoButtonClicked', function () {
    //    if (!$scope.isAddPhotoButtonClicked) {
    //        $(".addPhotos").attr("src", "images/field/ico_add_cover@2x.png");
    //    }
    //    else {
    //        $(".addPhotos").attr("src", "images/field/ico_add_cover_pressed@2x.png");
    //    }
    //});

    $scope.$watch('isLocateMeButtonClicked', function () {
        if (!$scope.isLocateMeButtonClicked) {
            $(".mapLocation").attr("src", "images/field/ico_locate_me@2x.png");
        }
        else {
            $(".mapLocation").attr("src", "images/field/ico_locate_me_pressed@2x.png");
        }
    });

    $scope.$watch('isPolygonCreated', function () {
        if (!$rootScope.isPolygonCreated) {
            //if ($rootScope.selectedField)
            //    $scope.creating = true;
        }
        else {
            $scope.isPolygonButtonClicked = false;
        }
    });

    $scope.attachEditToolbarToPolygon = function () {
        if ($rootScope.isPolygonCreated) {
            var pixelFieldCenter = $scope.createMap.latLngToLayerPoint($scope.fieldCenter);
            var pixelCoord = $scope.createMap.layerPointToContainerPoint(pixelFieldCenter);
            var x = Math.round(pixelCoord.x) - 55;
            var y = Math.round(pixelCoord.y) - 22;
            $('.polygonEditing-map').css('left', x);
            $('.polygonEditing-map').css('top', y);
        }
    };


    $scope.isLocaL = function (data) {
        return isLocal(data);
    }

    $scope.initGallery = function () {
        //"file:///data/data/io.cordova.IWL1/cache/Cover1977123709.jpg"
        //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (succ) {
            var dirEntry = new resolveLocalFileSystemURL('file:///', function (success) {
                var a = 0;
                var directoryReader = success.createReader();
                directoryReader.readEntries(function (results) {
                    //$('.slickContainer').slick({
                    //    lazyLoad: true
                    //});
                    //for (var i = 0; i < results.length; i++) {
                    //    $('.slickContainer').slick('slickAdd', '<div class="galleryImage" style="background-image:url("' + results[i] + '") center no-repeat;"></div>');
                    //}
                }, function (error) {
                    console.log('Error: ' + error);
                })
            }, function (errror) {
                var i = 0;
            });
        }, function (err) {

        });

    };

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
});
