angular.module('fieldDetailsCtrlMd', ['ui.router'])

.controller('fieldDetailsCtrl', function ($rootScope, $timeout, $scope, $state, $filter, $ionicPopup, $ionicPopover, taskService, apiConnection, Camera, fileHelper, $ionicActionSheet) {
    Date.prototype.getWeekNumber = function () {
        var d = new Date(+this);
        d.setHours(0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
    };

    $scope.isDateInRange = function (date) {
        if (Date.parse(date) < $rootScope.minDate) return false;
        if (Date.parse(date) > $rootScope.maxDate) return false;
        else return true;
    }

    function redraw() {
        var w = window.innerWidth,
                h = 60,
                parseDate = d3.time.format("%Y-%m-%d").parse;

        var temp = [];
        if ($rootScope.selectedField.weather && $rootScope.selectedField.weather.length)
            temp = $rootScope.selectedField.weather.map(function (d) { return d3.time.format("%Y-%m-%d").parse(d.date) });

        var weat = [];

        d3.select(".fieldScroll").remove();

        var svg = d3.select("#fieldContainer")
            //.select("#timelineContainer")
                .append("svg")
                .attr("class", "fieldScroll")
                .attr("width", w)
                .attr("height", h);

        var scale = d3.time.scale()
                        .domain([temp[temp.length / 2], temp[temp.length - 1].setDate(temp[temp.length - 1].getDate() + temp.length / 2)])
                        .range([0, w]);

        var xaxis = d3.svg
            .axis()
            .scale(scale)
            .orient("top")
            .tickSize(25, 0)
            .tickFormat(function (d, i, e) {
                svg.select("g").selectAll("text")
                    .style("font-size", "10px")
                    .each(function () {
                        if (this.textContent == dateToDateShortString(new Date())) {
                            this.classList.add("today");
                        }
                        var ar = this.textContent.split("/");
                        var dt = new Date(parseInt(ar[2], 10), parseInt(ar[1], 10) - 1, parseInt(ar[0], 10));
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
                countSightsInRange();
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

    function countSightsInRange() {
        $rootScope.sightCount = 0;
        for (var i = 0; i < $scope.filteredSightings.length; i++) {
            var date = $scope.filteredSightings[i].Date;
            if (Date.parse(date) > $rootScope.minDate && Date.parse(date) < $rootScope.maxDate)
                $rootScope.sightCount++;
        }
    }

    $scope.gradient = function (selectedField) {
        if (selectedField && selectedField.Image && selectedField.Image.SRC)
            return {
                //'background': 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 59%, rgba(0, 0, 0, 0.65) 100%),url(' + $scope.getImage(selectedField) + ')'
                "background-image": "url('" + $rootScope.urlForImage(selectedField.Image.SRC) + "')"
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

    $scope.clearFilters = function () {
        $rootScope.animalFilterSightIdArr = [];
        $rootScope.typeFilterSightIdArr = [];
        $rootScope.stateFilterSightIdArr = [];
        $rootScope.userFilterSightIdArr = [];

        $rootScope.filterSighting.Animal = '';
        $rootScope.filterSighting.Type = '';
        $rootScope.filterSighting.State = '';
        $rootScope.filterSighting.User = '';
        $rootScope.isFilterArraysChanged = $rootScope.isFilterArraysChanged ? false : true;
    }

    $scope.$on('$ionicView.afterLeave', function () {
        $scope.clearFilters();
        $rootScope.filterStr = $trans('show_all');
    });

    $scope.$on('$ionicView.beforeEnter', function () {
        $rootScope.filterStr = $trans('show_all');
        $('.filterBtn-FD span').css('width', '');
        $scope.sightingInvalid = false;
        $rootScope.newSighting = {
            animal: '',
            type: '',
            age: '',
            state: '',
            note: '',
            date: new Date().toISOString()
        };
        //$rootScope.newSightingImages = [];
    });
    //$scope.dpCancel = $trans('dpCancel');
    //$scope.dpOk = $trans('dpOk');
    //$scope.dpNow = $trans('dpNow');
    //$scope.dpToday = $trans('dpToday');
    //$scope.dpDone = $trans('dpDone');

    $rootScope.newSightingImages = [];

    $rootScope.newSighting = {
        animal: '',
        type: '',
        age: '',
        state: '',
        note: '',
        date: new Date().toISOString()
    };

    $scope.$on('$ionicView.enter', function (e) {
        $scope.filteredSightings = JSON.parse(JSON.stringify($rootScope.selectedField.Sightings));

        for (i = 0; i < $rootScope.selectedField.Sightings.length; i++) {
            if ($rootScope.selectedField.Sightings[i].Image)
                if ($rootScope.selectedField.Sightings[i].Image.SRC)
                    $rootScope.selectedField.Sightings[i].Image.SRC = getNameFromUrl($rootScope.selectedField.Sightings[i].Image.SRC).replace('.jpg', '') + '.jpg';
        }

        $rootScope.animalsForFields = getAnimalsForField($rootScope.selectedField);
        if ($rootScope.animalsForFields.length == 0) {
            saveToLocalStorage('fieldsAnimals', []);
            $rootScope.animalsForFields = [];
            $scope.currFieldAnimals = [];
            $scope.currTypes = [];
            $rootScope.newSighting.type = '';
        } else {
            $scope.currFieldAnimals = $rootScope.animalsForFields;//$rootScope.animalsForFields[$rootScope.selectedField.FieldId];
            //$scope.currFieldAnimals = [{ name: 'wolf', types: ['lox', 'poc'] }, { name: 'olen', types: [] }];
            $scope.currTypes = [];
            $rootScope.newSighting.type = '';
        }

        countSightsInRange();
        $scope.rightColState = 1;
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

    $scope.finishSighting = function () {
        $rootScope.$broadcast('loading:show');
        $timeout(function () {
            $rootScope.$broadcast('loading:hide');
            $scope.sightingInvalid = false;
            $scope.$apply();
            if ($rootScope.newSighting.animal == '')
                $scope.sightingInvalid = true;
            else {
                $state.go('cleanMap');
            }
        }, 300);

    }

    $scope.editField = function () {
        $rootScope.form = $ionicPopup.show({
            templateUrl: 'templates/editField.html',
            cssClass: 'custom-popup'
        });
    };

    $scope.selectAmimal = function (val) {
        $scope.newSighting.animal = val;
        $("#menu" + $scope.lastIndex).hide("fast");
        $("#editMenu" + $scope.lastIndex).hide("fast");
        for (i = 0; i < $scope.currFieldAnimals.length; i++) {
            if ($scope.currFieldAnimals[i].name == val) {
                $scope.newSighting.type = '';
                $scope.currTypes = $scope.currFieldAnimals[i].types;
                //$scope.$apply();
            }
        }
    }

    $scope.selectEditAmimal = function (val) {
        $scope.currentSighting.Animal = val;
        $("#menu" + $scope.lastIndex).hide("fast");
        $("#editMenu" + $scope.lastIndex).hide("fast");
        for (i = 0; i < $scope.currFieldAnimals.length; i++) {
            if ($scope.currFieldAnimals[i].name == val) {
                $scope.currentSighting.Type = '';
                $scope.currTypes = $scope.currFieldAnimals[i].types;
                //$scope.$apply();
            }
        }
    }

    $scope.getDistance = function (data) {
        return getDistance(data);
    }

    $scope.selectType = function (val) {
        $scope.newSighting.type = val;
        $("#menu" + $scope.lastIndex).hide("fast");
        $("#editMenu" + $scope.lastIndex).hide("fast");
    }

    $scope.selectEditType = function (val) {
        $scope.currentSighting.Type = val;
        $("#menu" + $scope.lastIndex).hide("fast");
        $("#editMenu" + $scope.lastIndex).hide("fast");
    }


    $scope.selectAge = function (val) {
        $scope.newSighting.age = val;
        $("#menu" + $scope.lastIndex).hide("fast");
        $("#editMenu" + $scope.lastIndex).hide("fast");
    }

    $scope.selectEditAge = function (val) {
        $scope.currentSighting.Age = val;
        $("#menu" + $scope.lastIndex).hide("fast");
        $("#editMenu" + $scope.lastIndex).hide("fast");
    }

    $scope.selectState = function (val) {
        $scope.newSighting.state = val;
        $("#menu" + $scope.lastIndex).hide("fast");
        $("#editMenu" + $scope.lastIndex).hide("fast");
    }

    $scope.selectEditState = function (val) {
        $scope.currentSighting.State = val;
        $("#menu" + $scope.lastIndex).hide("fast");
        $("#editMenu" + $scope.lastIndex).hide("fast");
    }

    $scope.rightCol = function (state) {
        if ($scope.rightColState == state) {//state of right col (1 - top menu expanded,2 - bottom menu expanded,3 - sight details)
            return true;
        }
    }

    $scope.toggleSightDetails = function (index) {
        if ($scope.lastIndex && index != $scope.lastIndex) {
            $("#menu" + $scope.lastIndex).hide("fast");
            $("#editMenu" + $scope.lastIndex).hide("fast");
        }
        $scope.lastIndex = index;//to toggle last opened menu
        $("#menu" + index).fadeToggle("fast");
        $("#editMenu" + $scope.lastIndex).fadeToggle("fast");
    }

    $scope.changeRightCol = function (state) {
        $scope.rightColState = state;
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
            $rootScope.animalsForFields[$rootScope.selectedField.FieldId] = $scope.currFieldAnimals;
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
                    $rootScope.animalsForFields[$rootScope.selectedField.FieldId] = $scope.currFieldAnimals;
                    saveToLocalStorage('fieldsAnimals', $rootScope.animalsForFields);
                }
            }
        }
    }

    //$scope.createSighting = function () {
    //    $rootScope.$broadcast('loading:show');
    //    $timeout(function () {
    //        $scope.sightingInvalid = false;
    //        $scope.$apply();
    //        if ((!$scope.newSighting.animal && $scope.newSighting.animal == "")) {
    //            $scope.sightingInvalid = true;
    //        } else {
    //            var sighting = {};
    //            sighting.SightingId = taskService.guid();

    //            console.log('Starts creating sighting with ID:' + sighting.SightingId);

    //            sighting.Field_Id = $rootScope.selectedField.FieldId;
    //            sighting.Date = $scope.newSighting.date;
    //            sighting.Type = $scope.newSighting.type;
    //            sighting.Age = $scope.newSighting.age;
    //            sighting.State = $scope.newSighting.state;
    //            sighting.Note = $scope.newSighting.note;
    //            sighting.Animal = $scope.newSighting.animal;
    //            if ($scope.newSighting.animal && $scope.newSighting.animal != "")
    //                addAnimal($scope.newSighting.animal);
    //            sighting.Hunter = {};
    //            sighting.Hunter.UserName = $rootScope.currUser.UserName;
    //            sighting.Weather = {};

    //            var tmpImage = {};
    //            tmpImage.SRC = $rootScope.newSightingImages[0];

    //            var imagesObjArr = makeImagesObj($rootScope.newSightingImages);

    //            if ($rootScope.newSightingImages.length > 0) {
    //                sighting.Image = tmpImage;
    //                sighting.Images = imagesObjArr;
    //            }

    //            for (var i = 0; i < $rootScope.selectedField.weather.length; i++) {
    //                if ($filter('date')($scope.newSighting.date, 'yyyy-MM-dd') == $rootScope.selectedField.weather[i].date) {
    //                    sighting.Weather = JSON.parse(JSON.stringify($rootScope.selectedField.weather[i]));
    //                    break;
    //                }
    //            }
    //            var index = -1;
    //            for (var i = 0, len = $rootScope.selectedField.Sightings.length; i < len; i++) {
    //                if ($rootScope.selectedField.Sightings[i].SightingId === sighting.SightingId) {
    //                    index = i;
    //                    break;
    //                }
    //            }
    //            //sighting.Hunter = $rootScope.currUser.name;
    //            if (index == -1) {
    //                console.log('Adding sighting with ID:' + sighting.SightingId + ' to local array');
    //                $rootScope.selectedField.Sightings.push(sighting);
    //                stableSort($rootScope.selectedField.Sightings);
    //                fileHelper.saveToFile("fields", $rootScope.fields);


    //                apiConnection.postSighting(sighting).then(function (data) {
    //                    $scope.newSighting = {
    //                        type: '',
    //                        age: '',
    //                        state: '',
    //                        note: '',
    //                        date: new Date().toISOString()
    //                    };

    //                    //var x = 0;
    //                    //var loopArray = function (arr) {
    //                    //    downloadImg(x, function () {
    //                    //        // set x to next item
    //                    //        x++;
    //                    //        // any more items in array? continue loop
    //                    //        if (x < arr.length) {
    //                    //            loopArray(arr);
    //                    //        } else {
    //                    //            $rootScope.newSightingImages = [];
    //                    //        }
    //                    //    });
    //                    //}

    //                    //function downloadImg(i, callback) {
    //                    //    if ($rootScope.newSightingImages[i]) {
    //                    //        apiConnection.uploadSightingImage(urlForImage($rootScope.newSightingImages[i]), $rootScope.newSightingImages[i], sighting.Field_Id, sighting.SightingId, i).then(function (data) {
    //                    //            var ta = 1;
    //                    //            callback();
    //                    //            //$rootScope.selectedField.sightings[$rootScope.selectedField.sightings.length - 1].defaultImage = $rootScope.newSightingImages[0];
    //                    //            //$rootScope.selectedField.sightings[$rootScope.selectedField.sightings.length - 1].images = $rootScope.newSightingImages;
    //                    //            //$rootScope.newSightingImages[data.index] = null;
    //                    //        }, function (data) {
    //                    //            callback();
    //                    //            //var imagesSubtask = taskService.createImgTask('/api/upload/sighting/' + sighting.Field_Id + '/' + sighting.SightingId, $rootScope.newSightingImages[i], urlForImage($rootScope.newSightingImages[i]));
    //                    //            //taskService.addTask(task);
    //                    //        });
    //                    //    } else callback();
    //                    //    // do callback when ready
    //                    //}

    //                    //loopArray($rootScope.newSightingImages);

    //                    for (var i = 0; i < $rootScope.newSightingImages.length; i++)
    //                        apiConnection.uploadSightingImage(urlForImage($rootScope.newSightingImages[i]), $rootScope.newSightingImages[i], sighting.Field_Id, sighting.SightingId, i).then(function (data) {
    //                            var ta = 1;
    //                        }, function (data) {

    //                        });
    //                    $rootScope.newSightingImages = [];

    //                }, function (status, answer) {
    //                    var task = taskService.createDataTask('POST', '/odata/Sightings', sighting);
    //                    var imagesTasksArr = [];
    //                    for (i = 0; i < $rootScope.newSightingImages.length; i++) {
    //                        var imagesSubtask = taskService.createImgTask('/api/upload/sighting/' + sighting.Field_Id + '/' + sighting.SightingId, $rootScope.newSightingImages[i], urlForImage($rootScope.newSightingImages[i]));
    //                        imagesTasksArr.push(imagesSubtask);
    //                    }
    //                    task.subTask = imagesTasksArr;
    //                    taskService.addTask(task);
    //                    $rootScope.newSightingImages = [];
    //                    $scope.newSighting = {
    //                        type: '',
    //                        age: '',
    //                        state: '',
    //                        note: '',
    //                        date: new Date().toISOString()
    //                    };
    //                });
    //            }
    //        }
    //        $rootScope.$broadcast('loading:hide');
    //    }, 500);
    //}

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

    $scope.addImageEdit = function () {

        var hideSheet = $ionicActionSheet.show({
            buttons: [
              { text: $trans("choose_from_galery") },
              { text: $trans("take_photo") }
            ],
            titleText: $trans("add_sight_pic"),
            cancelText: $trans("dpCancel"),
            cancel: function () {
                hideSheet();
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
                $scope.takeImageEdit(options);
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
                $rootScope.newSightingImages.push(data);
            });
        }, function (err) {
            console.log(err);
        }, options);

        //Camera.getPicture(options).then(function (imageData) {
        //    var a = apiConnection.saveToDevice(imageData).then(function (data) {
        //        $rootScope.newSightingImages.push(data);
        //        //alert('lox');
        //        // alert(JSON.strigify(data));
        //    });
        //}, function (err) {
        //    console.log(err);
        //});
    }

    $scope.takeImageEdit = function (options) {

        navigator.camera.getPicture(function (imageData) {
            var a = apiConnection.saveToDevice(imageData).then(function (data) {
                if (!$scope.currentSighting.Images) {
                    $scope.currentSighting.Images = [{ SRC: data }];
                }
                $scope.currentSighting.Images.push({ SRC: data });
                if (!$scope.currentSighting.Image) {
                    $scope.currentSighting.Image = { SRC: data };
                }
            });
        }, function (err) {
            console.log(err);
        }, options);

        //Camera.getPicture(options).then(function (imageData) {
        //    var a = apiConnection.saveToDevice(imageData).then(function (data) {
        //        $rootScope.newSightingImages.push(data);
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
                if ($scope.rightColState == 4)
                    $scope.currentSighting.Date = new Date(date).toISOString();
                else $scope.newSighting.date = new Date(date).toISOString();
            });
        }

        function onError(error) { // Android only
            console.log('Error on datepick: ' + error);
        }

        datePicker.show(options, onSuccess, onError);

    }

    $scope.deleteField = function () {
        $rootScope.$broadcast('loading:show');

        $rootScope.showAlertPopup($trans("delete_field_popup_title"), true, deleteConfirmed);
    }

    $scope.deleteSighting = function (sighting) {
        $rootScope.$broadcast('loading:show');

        $rootScope.showAlertPopup($trans("delete_sighting_popup_title"), true, deleteSightConfirmed);
    }

    $scope.exportData = function (fieldId) {
        $rootScope.$broadcast('loading:show');

        apiConnection.exportField(fieldId).then(function (data) {
            $rootScope.$broadcast('loading:hide');
            $rootScope.showAlertPopup($trans("field_export_success"), false);
        }, function (err) {
            $rootScope.$broadcast('loading:hide');
            if (err.status == 0)
                $rootScope.showAlertPopup($trans("internet_connection"), false);
            else $rootScope.showAlertPopup($trans("field_export_error"), false);
        });
    }

    var deleteConfirmed = function () {

        var ind = $rootScope.fields.indexOf($rootScope.selectedField);

        $rootScope.fields.splice(ind, 1);

        fileHelper.saveToFile($rootScope.fields, 'fields.txt');
        $state.go("dashboard");

        apiConnection.deleteField($rootScope.selectedField).then(function (data) {
        }, function (data) {
            var data = {};
            var url = '/odata/Fields/' + $rootScope.selectedField.FieldId;
            var task = taskService.createDataTask('DELETE', url, data);
            taskService.addTask(task);
        });

        $rootScope.showAlertPopup($trans("field_delete_success"), false);
    }

    var deleteSightConfirmed = function () {
        var ind = null;
        for (var i = 0; i < $rootScope.selectedField.Sightings.length; i++)
            if ($rootScope.selectedField.Sightings[i].SightingId == $scope.selectedSighting.SightingId) {
                ind = i;
                //$scope.selectedSighting.SightingId = $rootScope.selectedField.Sightings[i].SightingId;
                break;
            }

        //var ind = $rootScope.selectedField.Sightings.indexOf($scope.selectedSighting);

        $rootScope.selectedField.Sightings.splice(ind, 1);
        $rootScope.sightCount--;
        $scope.filteredSightings = JSON.parse(JSON.stringify($rootScope.selectedField.Sightings));

        $scope.changeRightCol(1);

        fileHelper.saveToFile($rootScope.fields, 'fields.txt');

        apiConnection.deleteSighting($scope.selectedSighting.SightingId).then(function (data) {

        }, function (data) {
            var data = {};
            var url = '/odata/Sightings(' + $scope.selectedSighting.SightingId + ')';
            var task = taskService.createDataTask('DELETE', url, data);
            taskService.addTask(task);
        });

        $rootScope.showAlertPopup($trans("sight_delete_success"), false);
    }

    $scope.deleteImage = function (index) {
        $rootScope.newSightingImages.splice(index, 1);
    }

    //$scope.deleteImageEdit = function (index) {
    //    $scope.currentSighting.Images.splice(index, 1);
    //
    //}

    $scope.deleteImageEdit = function (image) {
        var ind = $scope.currentSighting.Images.indexOf(image);
        if ($scope.currentSighting.Image && $scope.currentSighting.Images[ind].SRC.indexOf($scope.currentSighting.Image.SRC) > -1)
            if ($scope.currentSighting.Images.length < 2)
                $scope.currentSighting.Image = null;
            else if ($scope.currentSighting.Images[ind + 1])
                $scope.currentSighting.Image = $scope.currentSighting.Images[ind + 1];
            else if ($scope.currentSighting.Images[ind - 1])
                $scope.currentSighting.Image = $scope.currentSighting.Images[ind - 1];
        $scope.currentSighting.Images.splice(ind, 1);
    }

    function getWeatIndex(field, dateISO) {
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

    $scope.isExpanded = false;
    $scope.expandWeather = function () {
        $scope.isExpanded = !$scope.isExpanded;
    }

    $scope.showSightingInfo = function (sighting, state) {
        $scope.changeRightCol(state);
        $scope.selectedSighting = sighting;
    }

    $scope.isLocaL = function (data) {
        return isLocal(data);
    }

    $scope.editSighting = function (state) {
        $scope.oldSighting = $scope.selectedSighting;
        $scope.currentSighting = JSON.parse(JSON.stringify($scope.selectedSighting));
        //$scope.selectedSighting = $scope.currentSighting;

        $scope.changeRightCol(state);
    };

    $rootScope.saveSighting = function () {
        $rootScope.oldImage = null;
        $rootScope.$broadcast('loading:show');

        $rootScope.imagesChanged($scope.currentSighting.Images, $scope.oldSighting.Images);

        if ($scope.currentSighting.Animal !== $scope.oldSighting.Animal ||
            $scope.currentSighting.Type !== $scope.oldSighting.Type ||
            $scope.currentSighting.Age !== $scope.oldSighting.Age ||
            $scope.currentSighting.State !== $scope.oldSighting.State ||
            $scope.currentSighting.Date !== $scope.oldSighting.Date ||
            $scope.currentSighting.Note !== $scope.oldSighting.Note || $rootScope.delArray.length > 0 || $rootScope.addArray.length > 0) {
            if ($scope.selectedSighting.Image)
                $rootScope.oldImage = $scope.selectedSighting.Image.SRC;
            var field = null;
            for (var i = 0; i < $rootScope.fields.length; i++)
                if ($rootScope.fields[i].FieldId == $rootScope.selectedField.FieldId)
                    field = $rootScope.fields[i];
            for (var i = 0; i < $rootScope.selectedField.Sightings.length; i++)
                if ($rootScope.selectedField.Sightings[i].SightingId == $scope.oldSighting.SightingId) {
                    field.Sightings[i] = JSON.parse(JSON.stringify($scope.currentSighting));
                    break;
                }

            fileHelper.saveToFile($rootScope.fields, "fields.json");

            apiConnection.putSighting($scope.currentSighting).then(function (data) {
                //$rootScope.modal.remove();
                $rootScope.$broadcast('loading:hide');

                for (var i = 0; i < $rootScope.delArray.length; i++) {
                    if ($rootScope.oldImage && $rootScope.delArray[i].indexOf($rootScope.oldImage) > -1) {
                        apiConnection.deleteSightingPhoto($scope.currentSighting).then(function (data) {

                        }, function (error) {

                        });
                    }
                    apiConnection.deleteSightingPhotos($scope.currentSighting, $rootScope.delArray[i]).then(function (data) {

                    }, function (error) {

                    });
                }
                for (var i = 0; i < $rootScope.addArray.length; i++)
                    apiConnection.uploadSightingImage($rootScope.urlForImage($rootScope.addArray[i]), $rootScope.addArray[i], $rootScope.selectedField.FieldId, $scope.currentSighting.SightingId, i).then(function (data) {

                    }, function (error) {

                    })
            }, function (status, answer) {
                //$rootScope.modal.remove();
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

                var task = taskService.createDataTask('PUT', '/odata/Sightings/' + $scope.currentSighting.SightingId, data);
                var imagesTasksArr = [];

                for (var i = 0; i < $rootScope.delArray.length; i++) {
                    if ($rootScope.delArray[i] == $scope.currentSighting.Image.SRC) {
                        var tmp1 = taskService.createDataTask('DELETE', "/odata/Sightings/Photo(" + $scope.currentSighting.SightingId + ")", {});
                        imagesTasksArr.push(tmp1);
                    }
                    {
                        var tmp = taskService.createDataTask('DELETE', "/odata/Sightings/Photos(" + $scope.selectedSighting.SightingId + ")/" + $rootScope.delArray[i], {});
                        imagesTasksArr.push(tmp);
                    }
                }
                for (i = 0; i < $rootScope.addArray.length; i++) {
                    var imagesSubtask = taskService.createImgTask('/api/upload/sighting/' + $rootScope.selectedField.FieldId + '/' + $scope.currentSighting.SightingId, $rootScope.addArray[i], $rootScope.urlForImage($rootScope.addArray[i]));
                    imagesTasksArr.push(imagesSubtask);
                }

                task.subTask = imagesTasksArr;
                taskService.addTask(task);
            });

            $scope.filteredSightings = JSON.parse(JSON.stringify($rootScope.selectedField.Sightings));
            $scope.selectedSighting = JSON.parse(JSON.stringify($scope.currentSighting));
            $scope.$apply();
            $scope.changeRightCol(3);

            //if ($scope.selectedSighting === $rootScope.filterSighting)
            //    console.log('yes');
            //else 
            //    console.log('no');
            //console.log($rootScope.currUser);

        }
        else {
            $rootScope.$broadcast('loading:hide');
            //alert('You have not made any changes to the sighting!');
        }
    }


    var sightFilterAnimals = function () {
        $scope.animalFilteredSightings = [];
        if ($rootScope.animalFilterSightIdArr)
            $.each($rootScope.animalFilterSightIdArr, function (index, filteredSightingId) {
                $.each($rootScope.selectedField.Sightings, function (index, sighting) {
                    if (sighting.SightingId !== filteredSightingId)
                        $scope.animalFilteredSightings.push(sighting);
                });
            });
    };

    var sightFilterTypes = function () {
        $scope.typeFilteredSightings = [];
        if ($rootScope.typeFilterSightIdArr)
            $.each($rootScope.typeFilterSightIdArr, function (index, filteredSightingId) {
                $.each($rootScope.selectedField.Sightings, function (index, sighting) {
                    if (sighting.SightingId !== filteredSightingId)
                        $scope.typeFilteredSightings.push(sighting);
                });
            });
    };

    var sightFilterStates = function () {
        $scope.stateFilteredSightings = [];
        if ($rootScope.stateFilterSightIdArr)
            $.each($rootScope.stateFilterSightIdArr, function (index, filteredSightingId) {
                $.each($rootScope.selectedField.Sightings, function (index, sighting) {
                    if (sighting.SightingId !== filteredSightingId)
                        $scope.stateFilteredSightings.push(sighting);
                });
            });
    };


    $rootScope.sightIDsFilter = function () {
        //sightFilterStates();
        //sightFilterAnimals();
        //sightFilterTypes();
        var filtSighLength = null;
        $scope.filteredSightings = JSON.parse(JSON.stringify($rootScope.selectedField.Sightings));
        $rootScope.sightCount = $scope.filteredSightings.length;

        //var isFound = false;
        //if ($scope.animalFilteredSightings.length !== 0)
        //    $scope.filteredSightings = $scope.animalFilteredSightings.slice();
        //else if ($scope.typeFilteredSightings.length !== 0)
        //    $scope.filteredSightings = $scope.typeFilteredSightings.slice();
        //else if ($scope.stateFilteredSightings.length !== 0)
        //    $scope.filteredSightings = $scope.stateFilteredSightings.slice();


        if ($rootScope.animalFilterSightIdArr && $rootScope.animalFilterSightIdArr.length !== 0) {
            //filtSighLength = $scope.filteredSightings.length;
            for (var i = 0; i < $scope.filteredSightings.length ; i++) {
                for (var j = 0; j < $rootScope.animalFilterSightIdArr.length; j++) {
                    if ($scope.filteredSightings[i].SightingId === $rootScope.animalFilterSightIdArr[j]) {
                        $scope.filteredSightings.splice(i, 1);
                        $rootScope.sightCount--;
                        i--;
                        break;
                    };
                };
            };
        }

        if ($rootScope.typeFilterSightIdArr && $rootScope.typeFilterSightIdArr.length !== 0) {
            //filtSighLength = $scope.filteredSightings.length;
            for (var i = 0; i < $scope.filteredSightings.length ; i++) {
                for (var j = 0; j < $rootScope.typeFilterSightIdArr.length; j++) {
                    if ($scope.filteredSightings[i].SightingId === $rootScope.typeFilterSightIdArr[j]) {
                        $scope.filteredSightings.splice(i, 1);
                        $rootScope.sightCount--;
                        i--;
                        break;
                    };
                };
            };
        };

        if ($rootScope.userFilterSightIdArr && $rootScope.userFilterSightIdArr.length !== 0) {
            //filtSighLength = $scope.filteredSightings.length;
            for (var i = 0; i < $scope.filteredSightings.length ; i++) {
                for (var j = 0; j < $rootScope.userFilterSightIdArr.length; j++) {
                    if ($scope.filteredSightings[i].Hunter.UserName == $rootScope.userFilterSightIdArr[j]) {
                        $scope.filteredSightings.splice(i, 1);
                        $rootScope.sightCount--;
                        i--;
                        break;
                    };
                };
            };
        };

        if ($rootScope.stateFilterSightIdArr && $rootScope.stateFilterSightIdArr.length !== 0) {
            //filtSighLength = $scope.filteredSightings.length;
            for (var i = 0; i < $scope.filteredSightings.length; i++) {
                for (var j = 0; j < $rootScope.stateFilterSightIdArr.length; j++) {
                    if ($scope.filteredSightings[i].SightingId === $rootScope.stateFilterSightIdArr[j]) {
                        $scope.filteredSightings.splice(i, 1);
                        $rootScope.sightCount--;
                        i--;
                        break;
                    };
                };
            };
        };

        //if ($scope.animalFilteredSightings.length !== 0)
        //    for (var i = 0; i < $scope.filteredSightings.length; i++) {
        //        for (var j = 0; j < $scope.animalFilteredSightings.length; j++) {
        //            if ($scope.filteredSightings[i].SightingId === $scope.animalFilteredSightings[j].SightingId) {
        //                isFound = true;
        //                break;
        //            }
        //        };
        //        if (isFound)
        //            isFound = false;
        //        else {
        //            $scope.filteredSightings.splice(i, 1);
        //            $rootScope.sightCount--;
        //        }
        //        //$scope.filteredSightings.push($scope.typeFilteredSightings[i]);
        //    };
        //if ($scope.typeFilteredSightings.length !== 0)
        //    for (var i = 0; i < $scope.filteredSightings.length; i++) {
        //        for (var j = 0; j < $scope.typeFilteredSightings.length; j++) {
        //            if ($scope.filteredSightings[i].SightingId === $scope.typeFilteredSightings[j].SightingId) {
        //                isFound = true;
        //                break;
        //            }
        //        };
        //        if (isFound)
        //            isFound = false;
        //        else {
        //            $scope.filteredSightings.splice(i, 1);
        //            $rootScope.sightCount--;
        //        }
        //        //$scope.filteredSightings.push($scope.typeFilteredSightings[i]);
        //    };
        //if ($scope.stateFilteredSightings.length !== 0)
        //    for (var i = 0; i < $scope.filteredSightings.length; i++) {
        //        for (var j = 0; j < $scope.stateFilteredSightings.length; j++) {
        //            if ($scope.filteredSightings[i].SightingId === $scope.stateFilteredSightings[j].SightingId) {
        //                isFound = true;
        //                break;
        //            }
        //        };
        //        if (isFound)
        //            isFound = false;
        //        else {
        //            $scope.filteredSightings.splice(i, 1);
        //            $rootScope.sightCount--;
        //        }
        //        //$scope.filteredSightings.push($scope.typeFilteredSightings[i]);
        //    };


        //for (var i = 0; i < $scope.typeFilteredSightings.length; i++) {
        //    for (var j = 0; j < $scope.filteredSightings.length; j++) {
        //        if ($scope.typeFilteredSightings[i].SightingId === $scope.filteredSightings[j].SightingId) {
        //            $scope.filteredSightings.splice(j, 1);
        //            //isSightMatched = true;
        //            break;
        //        }
        //    };
        //    //if (isSightMatched)
        //    //    isSightMatched = false;
        //    //else
        //    //
        //    //    $scope.filteredSightings.push($scope.typeFilteredSightings[i]);
        //};
        //
        //for (var i = 0; i < $scope.stateFilteredSightings.length; i++) {
        //    for (var j = 0; j < $scope.filteredSightings.length; j++) {
        //        if ($scope.stateFilteredSightings[i].SightingId === $scope.filteredSightings[j].SightingId) {
        //            $scope.filteredSightings.splice(j, 1);
        //            //isSightMatched = true;
        //            break;
        //        }
        //    };
        //    //if (isSightMatched)
        //    //    isSightMatched = false;
        //    //else
        //    //    $scope.filteredSightings.push($scope.stateFilteredSightings[i]);
        //};
    };

    $scope.filterMarkers = function () {
        $rootScope.modalAddress = 'templates/markersFilter.html';
        $rootScope.makeModal();
    };
});