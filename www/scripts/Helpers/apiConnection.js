var apiConnection = angular.module('apiConn', []).factory('apiConnection', ['$http', '$rootScope', '$q', '$filter', '$cordovaFileTransfer', 'fileHelper','taskService',
    function ($http, $rootScope, $q, $filter, $cordovaFileTransfer, fileHelper, taskService) {

        var $trans = $filter('translate');

        var getFields = function () {
            if (!apiConnection.headers && $rootScope.headers) {
                apiConnection.headers = JSON.parse(JSON.stringify($rootScope.headers));
            }
            var defer = $q.defer();

            var reqFields = {
                method: 'GET',
                url: this.baseURL + '/api/Fields?updated=' + $rootScope.lastUpdated,
                headers: apiConnection.headers
            };

            var curThis = this;
            $http(reqFields)
            .success(function (data, status, headers, config) {
                $rootScope.previousUpdated = $rootScope.lastUpdated;
                $rootScope.lastUpdated = new Date().toISOString();
                saveToLocalStorage('lastUpdated', $rootScope.lastUpdated);

                defer.resolve(data);
            })
            .error(function (data, status, headers, config) {
                //if (status == 0) $rootScope.showAlertPopup("Check your Internet connection", false);
                //else if (status == 400) $rootScope.showAlertPopup("Bad Request", false);
                //else if (status == 401) $rootScope.showAlertPopup("Authorization Problem", false);
                //else if (status == 500) $rootScope.showAlertPopup('Internal Server Error', false);
                //else $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                defer.reject({ status: status, answer: data });
            });

            return defer.promise;
        }

        var login = function (email, pass) {
            var loginData = {
                grant_type: 'password',
                username: email,
                password: pass
            };

            var defer = $q.defer();

            $http.post(this.baseURL + '/Token', loginData)
                .success(function (data, status, headers, config) {
                    $rootScope.currUser.UserName = data.userName;
                    $rootScope.currUser.Roles = JSON.parse(data.Roles);
                    saveToLocalStorage('user', $rootScope.currUser);
                    apiConnection.headers = {
                        "Authorization": "Bearer " + data.access_token
                    };
                    $rootScope.headers = {
                        "Authorization": "Bearer " + data.access_token
                    };
                    saveToLocalStorage('headers', $rootScope.headers);
                    apiConnection.Token = data.access_token;
                    defer.resolve(data);
                })
                .error(function (data, status, headers, config) {
                    //defer.resolve(status);
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 400) {
                    //    if (data.error_description)
                    //        $rootScope.showAlertPopup(data.error_description, false);
                    //    else $rootScope.showAlertPopup("Invalid login data", false);
                    //}
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                    defer.reject(data);
                });

            return defer.promise;

            //var loginData = {
            //    grant_type: 'password',
            //    username: email,
            //    password: pass
            //};

            //var dataStr = 'grant_type=password&username=' + email + '&password=' + pass;

            //var xmlHttp = new XMLHttpRequest();
            //xmlHttp.open("POST", baseURL1+"/Token", false);
            //xmlHttp.send(dataStr);
            //xmlHttp.onreadystatechange = function () {
            //    alert('lox')
            //    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            //        alert(JSON.stringify(xmlHttp));
            //        //"Authorization": "Bearer " + data.access_token
            //    }
            //}
            //alert(JSON.stringify(xmlHttp));

            //return xmlHttp.responseText;
        }

        var register = function (user, email, pass) {

            var defer = $q.defer();

            var registerData = {
                UserName: user,
                Email: email,
                Password: pass,
                ConfirmPassword: pass
            };

            $http.post(this.baseURL + '/api/Account/Register', registerData)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                    $rootScope.showAlertPopup($trans("confirm_email_to_login"), false);
                })
                .error(function (data, status, headers, config) {
                    //if (status == 0) {
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //}
                    //if (status == 400) {
                    //    var text = "";
                    //    for (var index in data.ModelState['']) {
                    //        text += data.ModelState[''][index];
                    //    }
                    //    $rootScope.showAlertPopup(text, false);
                    //}
                    //else if (status == 500) {
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //}
                    //else {
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                    //}
                    defer.reject(data);
                });

            return defer.promise;
        }

        var resetPassword = function (email) {
            var defer = $q.defer();

            $http.get(this.baseURL + '/api/Account/ResetPassword?email=' + email)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                    $rootScope.showAlertPopup($trans("send_instructions"), false);
                })
                .error(function (data, status, headers, config) {
                    //if (status == 0) {
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //}
                    //if (status == 400) {

                    //    var text = "";
                    //    if (data.ModelState['']) {
                    //        for (var index in data.ModelState['']) {
                    //            text += data.ModelState[''][index];
                    //        }
                    //    }
                    //    if (data.error_description)
                    //        text = data.error_description;
                    //    $rootScope.showAlertPopup(text, false);
                    //}
                    //else if (status == 500) {
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //}
                    //else {
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                    //}
                    defer.reject(data);
                });

            return defer.promise;
        }

        var changePassword = function (oldP, newP, conP) {
            apiConnection.headers["Content-Type"] = "application/json";

            var defer = $q.defer();

            var passwordData = {
                'OldPassword': oldP,
                'NewPassword': newP,
                'ConfirmPassword': conP
            };
            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/api/Account/ChangePassword',
                headers: apiConnection.headers,
                data: JSON.stringify(passwordData)
            };

            $http(reqPF)//.post(this.baseURL + '/api/Account/ChangePassword', passwordData, { headers: apiConnection.headers })
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                    $rootScope.showAlertPopup($trans("pass_change_success"), false);
                })
                .error(function (data, status, headers, config) {
                    //defer.resolve(status);
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                    defer.reject(status);

                });

            return defer.promise;
        }

        var changeEmail = function (newEmail) {

            var defer = $q.defer();

            var emailData = {
                'Email': newEmail
            };
            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/api/Account/ChangeEmail',
                headers: apiConnection.headers,
                data: emailData
            };

            $http.post(this.baseURL + '/api/Account/ChangeEmail', emailData, { headers: apiConnection.headers })
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                    $rootScope.showAlertPopup($trans("email_change_success"), false);
                })
                .error(function (data, status, headers, config) {
                    //defer.resolve(status);
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                    defer.reject(status);

                });

            return defer.promise;
        }

        var changeUsername = function (newUsername) {

            var defer = $q.defer();

            var usernameData = {
                'UserName': newUsername
            };
            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/api/Account/ChangeUserName',
                headers: apiConnection.headers,
                data: usernameData
            };

            $http.post(this.baseURL + '/api/Account/ChangeUserName', usernameData, { headers: apiConnection.headers })
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                    $rootScope.showAlertPopup($trans("username_change_success"), false);
                })
                .error(function (data, status, headers, config) {
                    defer.reject(status);
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                });
            return defer.promise;
        }

        var autocomplete = function (substr) {

            var defer = $q.defer();

            $http.get(this.baseURL + '/autocomplete?subStr=' + substr)
                .success(function (data, status, headers, config) {
                    data.success = true;
                    defer.resolve(data);
                })
                .error(function (data, status, headers, config) {
                    data.success = false;
                    defer.resolve(data);
                    ////defer.resolve(status);
                    //$rootScope.$broadcast('loading:hide');
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 400) {
                    //    //$scope.isEmailErr = true;
                    //    //$scope.isPassErr = true;
                    //    $rootScope.showAlertPopup("Wrong login data", false);
                    //}
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                });

            return defer.promise;
        }

        var uploadFieldImage = function (filepath, filename, fieldId, i) {

            var defer = $q.defer();

            var options = new FileUploadOptions();
            options.headers = apiConnection.headers;
            options.fileName = filename;
            $cordovaFileTransfer.upload(this.baseURL + '/api/upload/field/' + fieldId, filepath, options).then(function (result) {
                defer.resolve({ success: true, index: i });
            }, function (err) {
                $rootScope.showAlertPopup('Error occured, photo was not uploaded', false);
                //$rootScope.showAlertPopup(JSON.stringify(err), false);
                defer.resolve({ success: false, index: i });
            }, function (progress) {
                // constant progress updates
            });

            return defer.promise;
        }

        var getWeather = function (id) {

            var defer = $q.defer();

            var reqWeather = {
                method: 'GET',
                url: this.baseURL + '/odata/Fields(' + id + ')/Weather',
                headers: apiConnection.headers
            };

            $http(reqWeather)
            .success(function (data, status, headers, config) {
                defer.resolve({ data: data, fieldId: id });
            })
            .error(function (data, status, headers, config) {
                //if (status == 0) $rootScope.showAlertPopup("Check your Internet connection", false);
                //else if (status == 400) $rootScope.showAlertPopup("Bad Request", false);
                //else if (status == 401) $rootScope.showAlertPopup("Authorization Problem", false);
                //else if (status == 500) $rootScope.showAlertPopup('Internal Server Error', false);
                //else $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                defer.reject({ status: status, answer: data, fieldId: id });
            });

            return defer.promise;

        }

        var getSelfWeather = function () {

            var defer = $q.defer();

            var reqWeather = {
                method: 'GET',
                url: this.baseURL + '/api/Weathers?pastDays=0&place=' + $rootScope.latitude.replace(',', '.') + "," + $rootScope.longtitude.replace(',', '.'),
                headers: apiConnection.headers
            };

            $http(reqWeather)
            .success(function (data, status, headers, config) {

                defer.resolve(data);
            })
            .error(function (data, status, headers, config) {
                defer.reject({ status: status, answer: data });
            });

            return defer.promise;

        }

        var exportField = function (fieldId) {

            var defer = $q.defer();

            var reqWeather = {
                method: 'GET',
                url: this.baseURL + '/api/Account/Export?field=' + fieldId,
                headers: apiConnection.headers
            };

            $http(reqWeather)
            .success(function (data, status, headers, config) {
                defer.resolve(data);
            })
            .error(function (data, status, headers, config) {
                defer.reject({ status: status, answer: data });
            });

            return defer.promise;

        }

        var postField = function (field) {

            var newField = JSON.parse(JSON.stringify(field));
            var now = new Date(newField.Date);
            newField.Date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()).toISOString();

            var defer = $q.defer();

            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/api/Fields',
                headers: apiConnection.headers,
                data: {
                    Name: field.Name,
                    Note: field.Note,
                    Date: field.Date,
                    latitude: field.latitude,
                    longtitude: field.longtitude,
                    Coordinates: field.Coordinates,
                    FieldId: field.FieldId
                }
            };
            $http(reqPF)
            .success(function (data, status, headers, config) {
                defer.resolve(data);
            })
            .error(function (data, status, headers, config) {
                defer.reject({ status: status, answer: data });
            });

            return defer.promise;
        }

        var putField = function (field) {

            var defer = $q.defer();

            var req = {
                method: 'PUT',
                url: this.baseURL + '/api/Fields/' + field.FieldId,
                headers: apiConnection.headers,
                data: JSON.stringify({
                    Name: field.Name,
                    Note: field.Note,
                    Date: field.Date,
                    latitude: field.latitude,
                    longtitude: field.longtitude,
                    Coordinates: field.Coordinates,
                    FieldId: field.FieldId
                })
            };
            //alert(JSON.stringify(req));
            $http(req)
            .success(function (data, status, headers, config) {
                defer.resolve(data);
            })
            .error(function (data, status, headers, config) {
                //if (status == 0) $rootScope.showAlertPopup("Check your Internet connection", false);
                //else if (status == 400) $rootScope.showAlertPopup("Bad Request", false);
                //else if (status == 401) $rootScope.showAlertPopup("Authorization Problem", false);
                //else if (status == 500) $rootScope.showAlertPopup('Internal Server Error', false);
                //else $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                defer.reject({ status: status, answer: data });
            });

            return defer.promise;
        }

        var deleteField = function (field) {

            var defer = $q.defer();

            var reqPF = {
                method: 'DELETE',
                headers: apiConnection.headers,
                url: this.baseURL + "/api/Fields/" + field.FieldId
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);

                })
                .error(function (data, status, headers, config) {
                    //defer.resolve(status);
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 404)
                    //    defer.resolve(data);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                    defer.reject(status);

                });

            return defer.promise;
        }

        var postSighting = function (sighting) {
            var defer = $q.defer();

            var newSighting = JSON.parse(JSON.stringify(sighting));
            var now = new Date(newSighting.Date);
            newSighting.Date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()).toISOString();

            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/odata/Sightings',
                headers: apiConnection.headers,
                data: newSighting
            };
            console.log('Request for creating sighting with ID:' + sighting.SightingId + ' sent');

            $http(reqPF)
            .success(function (data, status, headers, config) {
                defer.resolve(data);
            })
            .error(function (data, status, headers, config) {
                //if (status == 0) $rootScope.showAlertPopup("Check your Internet connection", false);
                //else if (status == 400) $rootScope.showAlertPopup("Bad Request", false);
                //else if (status == 401) $rootScope.showAlertPopup("Authorization Problem", false);
                //else if (status == 500) $rootScope.showAlertPopup('Internal Server Error', false);
                //else $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                defer.reject({ status: status, answer: data });
            });

            return defer.promise;
        }

        var putSighting = function (sighting) {
            var defer = $q.defer();

            var newSighting = JSON.parse(JSON.stringify(sighting));
            var now = new Date(newSighting.Date);
            newSighting.Date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()).toISOString();

            var reqPF = {
                method: 'PATCH',
                url: this.baseURL + '/odata/Sightings(\'' + sighting.SightingId + '\')',
                headers: apiConnection.headers,
                //data: newSighting
                data: JSON.stringify({
                    Type: newSighting.Type,
                    Animal: newSighting.Animal,
                    State: newSighting.State,
                    Note: newSighting.Note,
                    Age: newSighting.Age,
                    latitude: newSighting.latitude,
                    longtitude: newSighting.longtitude,
                    Date: newSighting.Date
                })
            };
            console.log('Request for updating sighting with ID:' + sighting.SightingId + ' sent');

            $http(reqPF)
            .success(function (data, status, headers, config) {
                defer.resolve(data);
            })
            .error(function (data, status, headers, config) {
                //if (status == 0) $rootScope.showAlertPopup("Check your Internet connection", false);
                //else if (status == 400) $rootScope.showAlertPopup("Bad Request", false);
                //else if (status == 401) $rootScope.showAlertPopup("Authorization Problem", false);
                //else if (status == 500) $rootScope.showAlertPopup('Internal Server Error', false);
                //else $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                defer.reject({ status: status, answer: data });
            });

            return defer.promise;
        }

        var postPOI = function (poi) {
            var defer = $q.defer();

            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/odata/POIs',
                headers: apiConnection.headers,
                data: poi
            };
            console.log('Request for creating POI :' + poi.Name + '( ' + poi.POIId + ' ) sent');

            $http(reqPF)
            .success(function (data, status, headers, config) {
                defer.resolve(data);
            })
            .error(function (data, status, headers, config) {
                //if (status == 0) $rootScope.showAlertPopup("Check your Internet connection", false);
                //else if (status == 400) $rootScope.showAlertPopup("Bad Request", false);
                //else if (status == 401) $rootScope.showAlertPopup("Authorization Problem", false);
                //else if (status == 500) $rootScope.showAlertPopup('Internal Server Error', false);
                //else $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                defer.reject({ status: status, answer: data });
            });

            return defer.promise;
        }

        var putPOI = function (poi) {
            var defer = $q.defer();

            var newPoi = JSON.parse(JSON.stringify(poi));
            //var now = new Date(newPoi.Date);
            //newPoi.Date = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()).toISOString();

            var reqPF = {
                method: 'PATCH',
                url: this.baseURL + '/odata/POIs(\'' + poi.POIId + '\')',
                headers: apiConnection.headers,
                //data: JSON.stringify(newPoi)
                data: JSON.stringify({
                    Name: newPoi.Name,
                    Note: newPoi.Note,
                    latitude: newPoi.latitude,
                    longtitude: newPoi.longtitude
                })
            };

            console.log('Request for updating poi with ID:' + poi.POIId + ' sent');

            $http(reqPF)
            .success(function (data, status, headers, config) {
                defer.resolve(data);
            })
            .error(function (data, status, headers, config) {
                //if (status == 0) $rootScope.showAlertPopup("Check your Internet connection", false);
                //else if (status == 400) $rootScope.showAlertPopup("Bad Request", false);
                //else if (status == 401) $rootScope.showAlertPopup("Authorization Problem", false);
                //else if (status == 500) $rootScope.showAlertPopup('Internal Server Error', false);
                //else $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                defer.reject({ status: status, answer: data });
            });

            return defer.promise;
        }

        var deletePOI = function (PID) {

            var defer = $q.defer();

            var reqPF = {
                method: 'DELETE',
                headers: apiConnection.headers,
                url: this.baseURL + "/odata/POIs('" + PID + "')"
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                })
                .error(function (data, status, headers, config) {
                    //defer.resolve(status);
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 404)
                    //    defer.resolve(data);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                    defer.reject(status);

                });

            return defer.promise;
        }

        var deleteSighting = function (SID) {

            var defer = $q.defer();

            var reqPF = {
                method: 'DELETE',
                headers: apiConnection.headers,
                url: this.baseURL + "/odata/Sightings('" + SID + "')"
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                })
                .error(function (data, status, headers, config) {
                    //defer.resolve(status);
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 404)
                    //    defer.resolve(data);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                    defer.reject(status);

                });

            return defer.promise;
        }

        var uploadSightingImage = function (filepath, filename, fieldId, sightingId, i) {

            var defer = $q.defer();

            var options = new FileUploadOptions();
            options.headers = apiConnection.headers;
            options.fileName = filename;
            $cordovaFileTransfer.upload(this.baseURL + '/api/upload/sighting/' + fieldId + '/' + sightingId, filepath, options).then(function (result) {
                defer.resolve({ success: true, index: i });
            }, function (err) {
                //$rootScope.showAlertPopup('error, photo was not uploaded', false);
                //$rootScope.showAlertPopup(JSON.stringify(err), false);
                taskService.addTask(taskService.createImgTask('/api/upload/sighting/' + fieldId + '/' + sightingId, filename, filepath));
                defer.reject({ success: false, index: i });
            }, function (progress) {
                // constant progress updates
            });

            return defer.promise;
        }

        var uploadPOIImage = function (filepath, filename, fieldId, poiId, i) {

            var defer = $q.defer();

            var options = new FileUploadOptions();
            options.headers = apiConnection.headers;
            options.fileName = filename;
            $cordovaFileTransfer.upload(this.baseURL + '/api/upload/poi/' + fieldId + '/' + poiId, filepath, options).then(function (result) {
                defer.resolve({ success: true, index: i });
            }, function (err) {
                //$rootScope.showAlertPopup('error, photo was not uploaded', false);
                //$rootScope.showAlertPopup(JSON.stringify(err), false);
                taskService.addTask(taskService.createImgTask('/api/upload/poi/' + fieldId + '/' + poiId, filename, filepath));
                defer.reject({ success: false, index: i });
            }, function (progress) {
                // constant progress updates
            });

            return defer.promise;
        }

        var downloadImage = function (url, name, backref) {
            //url=apiConnection.baseURL+url;
            var defer = $q.defer();


            var targetPath = cordova.file.dataDirectory + name + ".jpg";
            $cordovaFileTransfer.download(this.baseURL + url, targetPath, {}, true)
                .then(function (result) {
                    //alert(JSON.stringify(result));
                    defer.resolve({ URL: result, success: true, index: backref });
                }, function (err) {
                    defer.reject({ URL: err, success: false, index: backref });
                }, function (progress) {
                    ////$timeout(function () {
                    //    $scope.downloadProgress = (progress.loaded / progress.total) * 100;
                    //})
                });

            return defer.promise;
        }

        var saveToDevice = function (imageData) {
            var defer = $q.defer();
            onImageSuccess(imageData);
            return defer.promise;

            function onImageSuccess(fileURI) {
                createFileEntry(fileURI);
                //alert(JSON.stringify(fileURI));
            }

            function createFileEntry(fileURI) {
                window.resolveLocalFileSystemURL(fileURI, copyFile, fail);
            }

            // 5
            function copyFile(fileEntry) {
                var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
                var newName = makeid() + name;
                //alert(JSON.stringify(fileEntry));
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
                //$scope.$apply(function () {
                //if ($scope.newField.defaultImage == "")
                //    $scope.newField.defaultImage = entry.name;
                defer.resolve(entry.name);
                //return ;
                //});
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
        }

        var deleteFieldPhoto = function (field) {

            var defer = $q.defer();

            var reqPF = {
                method: 'DELETE',
                headers: apiConnection.headers,
                url: this.baseURL + "/api/Fields/Photo/" + field.FieldId
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                })
                .error(function (data, status, headers, config) {
                    defer.reject(status);

                });

            return defer.promise;
        }

        var deleteSightingPhoto = function (sighting) {

            var defer = $q.defer();

            var reqPF = {
                method: 'DELETE',
                headers: apiConnection.headers,
                url: this.baseURL + "/odata/Sightings/Photo(" + sighting.SightingId + ")"
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                })
                .error(function (data, status, headers, config) {
                    defer.reject(status);

                });

            return defer.promise;
        }

        var deleteSightingPhotos = function (sighting, img) {

            var defer = $q.defer();

            var reqPF = {
                method: 'DELETE',
                headers: apiConnection.headers,
                url: this.baseURL + "/odata/Sightings/Photos(" + sighting.SightingId + ")/" + img.replace('.jpg', '')
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                })
                .error(function (data, status, headers, config) {
                    defer.reject(status);

                });

            return defer.promise;
        }

        var deletePOIPhoto = function (poi) {

            var defer = $q.defer();

            var reqPF = {
                method: 'DELETE',
                headers: apiConnection.headers,
                url: this.baseURL + "/odata/POIs/Photo(" + poi.POIId + ")"
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                })
                .error(function (data, status, headers, config) {
                    defer.reject(status);

                });

            return defer.promise;
        }

        var deletePOIPhotos = function (poi, img) {

            var defer = $q.defer();

            var reqPF = {
                method: 'DELETE',
                headers: apiConnection.headers,
                url: this.baseURL + "/odata/POIs/Photos(" + poi.POIId + ")/" + img
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                })
                .error(function (data, status, headers, config) {
                    defer.reject(status);

                });

            return defer.promise;
        }

        var inviteUser = function (role, fieldId, email) {
            var defer = $q.defer();

            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/api/Account/Invite',
                headers: apiConnection.headers,
                data: {
                    role: role,
                    fieldId: fieldId,
                    email: email
                }
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve({
                        response: data,
                        role: role,
                        fieldId: fieldId,
                        email: email
                    });
                })
                .error(function (data, status, headers, config) {
                    defer.reject({
                        response: data,
                        status: status,
                        role: role,
                        fieldId: fieldId,
                        email: email
                    });
                });
            return defer.promise;
        }

        var changeUserRole = function (user, oldRole, newRole, fieldId) {
            var defer = $q.defer();

            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/api/Account/ChangeRole',
                headers: apiConnection.headers,
                data: {
                    oldRole: oldRole,
                    newRole: newRole,
                    fieldId: fieldId,
                    userName: user.UserName
                }
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve({
                        response: data,
                        oldRole: oldRole,
                        newRole: newRole,
                        fieldId: fieldId,
                        user: user
                        });
                })
                .error(function (data, status, headers, config) {
                    defer.reject({
                        response: data,
                        status:status,
                        oldRole: oldRole,
                        newRole: newRole,
                        fieldId: fieldId,
                        user: user
                    });
                });
            return defer.promise;
        }

        var addRole = function (userName, newRole, fieldId) {
            var defer = $q.defer();

            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/api/Account/AddRole',
                headers: apiConnection.headers,
                data: {
                    oldRole: oldRole,
                    fieldId: fieldId,
                    userName: userName
                }
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                    //$rootScope.showAlertPopup($trans("username_change_success"), false);
                })
                .error(function (data, status, headers, config) {
                    defer.reject(status);
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                });
            return defer.promise;
        }

        var deleteRole = function (userName, oldRole, fieldId) {
            var defer = $q.defer();

            var reqPF = {
                method: 'POST',
                url: this.baseURL + '/api/Account/DeleteRole',
                headers: apiConnection.headers,
                data: {
                    oldRole: oldRole,
                    fieldId: fieldId,
                    userName: userName
                }
            };

            $http(reqPF)
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                    //$rootScope.showAlertPopup($trans("username_change_success"), false);
                })
                .error(function (data, status, headers, config) {
                    defer.reject(status);
                    //if (status == 0)
                    //    $rootScope.showAlertPopup("Check your Internet connection", false);
                    //else if (status == 401)
                    //    $rootScope.showAlertPopup("Authorization Problem", false);
                    //else if (status == 500)
                    //    $rootScope.showAlertPopup('Internal Server Error', false);
                    //else
                    //    $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                });
            return defer.promise;
        }

        var storeDeviceToken = function (regId, platform) {
            var reqDevToken = {
                method: 'POST',
                url: this.baseURL + '/api/Account/register/id',
                headers: apiConnection.headers,
                data: {
                    RegId: regId,
                    Platform: platform
                }
            };
            $http(reqDevToken).success(function (data, status, headers, config) {

            })
                    .error(function (data, status, headers, config) {
                        if (status == 0) {
                            $rootScope.$broadcast('loading:hide');
                            $rootScope.showAlertPopup("Check your Internet connection", false);
                        }
                        else if (status == 400) {
                            $rootScope.$broadcast('loading:hide');
                            $rootScope.showAlertPopup("Bad Request", false);
                        }
                        else if (status == 401) {
                            $rootScope.$broadcast('loading:hide');
                            $rootScope.showAlertPopup("Authorization Problem", false);
                        }
                        else if (status == 500) {
                            $rootScope.$broadcast('loading:hide');
                            $rootScope.showAlertPopup('Internal Server Error', false);
                        }
                        else {
                            $rootScope.$broadcast('loading:hide');
                            $rootScope.showAlertPopup("Something went wrong! Status:" + status, false);
                        }
                    });
        }

        return {
            Token: "",

            headers: {},

            baseURL: "http://185.96.4.166", //test->http://192.168.10.155:1244 lesha->http://192.168.0.163:12444

            saveToDevice: saveToDevice,

            DoLogin: login,

            DoRegister: register,

            DoResetPassword: resetPassword,

            GetFields: getFields,

            autocomplete: autocomplete,

            uploadFieldPhotos: uploadFieldImage,

            postField: postField,

            putField: putField,

            postSighting: postSighting,

            postPOI: postPOI,

            putSighting: putSighting,

            putPOI: putPOI,

            uploadSightingImage: uploadSightingImage,

            uploadPOIImage: uploadPOIImage,

            getWeather: getWeather,

            getSelfWeather: getSelfWeather,

            changePassword: changePassword,

            deleteField: deleteField,

            deleteSighting: deleteSighting,

            deletePOI: deletePOI,

            downloadImage: downloadImage,

            changeEmail: changeEmail,

            changeUsername: changeUsername,

            exportField: exportField,

            deleteFieldPhoto: deleteFieldPhoto,

            deleteSightingPhoto: deleteSightingPhoto,

            deleteSightingPhotos: deleteSightingPhotos,

            deletePOIPhoto: deletePOIPhoto,

            deletePOIPhotos: deletePOIPhotos,

            inviteUser: inviteUser,

            changeUserRole: changeUserRole,

            addRole: addRole,

            deleteRole: deleteRole,

            storeDeviceToken: storeDeviceToken
        }
    }])