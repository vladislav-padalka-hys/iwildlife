angular.module('loginCtrlMd', ['ui.router'])

.controller('LoginCtrl', function ($scope, $state, $translate, $http, $rootScope, $ionicPlatform, $cordovaPush, $cordovaDialogs, $ionicPopup, apiConnection, fileHelper, taskService) {
    console.log("login.js");

    $rootScope.latitude = "0";
    $rootScope.longtitude = "0";

    $scope.user = {};
    $rootScope.currUser = {};
    var isFirstLogin = readFromLocalStorage("isFirstLogin") == null ? true : readFromLocalStorage("isFirstLogin");;
    //REMOVE
    $scope.user.password = 'Password';
    $scope.user.email = 'lirik1105@gmail.com';

    $scope.$on('$ionicView.enter', function () {
        $scope.loginInvalid = false;
    });

    $scope.forgotPassword = function () {
        $state.go("forgotPassword");
    }

    $scope.signIn = function () {
        $scope.loginInvalid = false;

        //if (!$scope.user.email) {
        //    $scope.loginInvalid = true;
        //    //$rootScope.showAlertPopup("Enter some name, please.", false);
        //    return;
        //}
        //if (!$scope.user.password) {
        //    $scope.loginInvalid = true;
        //    //$rootScope.showAlertPopup("Enter some email, please.", false);
        //    return;
        //}
        $rootScope.$broadcast('loading:show');
        $rootScope.previousUser = readFromLocalStorage("user");
        apiConnection.DoLogin($scope.user.email, $scope.user.password).then(function (data) {
            $rootScope.currUser.email = $scope.user.email;
            
            saveToLocalStorage('user', $rootScope.currUser);
            saveToLocalStorage('lastLogin', JSON.stringify(new Date()));
            $rootScope.$broadcast('loading:hide');
            if ($rootScope.previousUser && $rootScope.previousUser.userName && $rootScope.previousUser.userName == data.userName)
            {
                fileHelper.readFromFile('fields.txt').then(function (data) {
                    if (data && data != {} && data.length > 0)
                    {
                        $rootScope.fields = JSON.parse(data);
                        stableSort($rootScope.fields);
                        console.log("Fields:" + $rootScope.fields.length);
                    }
                    if (isFirstLogin) {
                            isFirstLogin = false;
                            var platform = null;

                            var config = {
                                "senderID": "555818327405",
                            };

                            if (ionic.Platform.isIOS()) {
                                config = {
                                    "badge": "true",
                                    "sound": "true",
                                    "alert": "true"
                                }
                                platform = "iOS";
                            }
                            else { platform = "Android"; }
                            $cordovaPush.register(config).then(function (result) {
                                if (ionic.Platform.isIOS()) {
                                    if (!readFromLocalStorage("isFirstLogin")) {
                                        saveToLocalStorage("isFirstLogin", "false");
                                        apiConnection.storeDeviceToken(result, platform);
                                    }
                                }
                            }, function (err) {
                                $rootScope.showAlertPopup('Error during registration for push notifications', false);
                            })
                            // WARNING: dangerous to unregister (results in loss of tokenID)
                            //$cordovaPush.unregister(options).then(function (result) {
                            //}, function (err) {
                            //    // Error
                            //})
                    }
                    if (!readFromLocalStorage('logged')) {
                        $state.go('pin');
                    }
                    else
                    {
                        $state.go("dashboard");
                    }
                },
                function (error) {
                    console.log("error" + JSON.stringify(error));
                    $rootScope.fields = [];
                    if (!readFromLocalStorage('logged')) {
                        $state.go('pin');
                    } else
                        $state.go("dashboard");
                });
            }
            else {
                $rootScope.fields = [];
                fileHelper.saveToFile($rootScope.fields, 'fields.txt');

                if (!$rootScope.language || !$rootScope.language.value || $rootScope.language.value=="")
                {
                    $rootScope.language = { 'name': 'English', 'value': 'en' };
                }

                $translate.use($rootScope.language.value);

                $rootScope.lastUpdated = '2000-12-12T12:00:00';
                $rootScope.temperature = 'C';
                $rootScope.weight = 'kg';
                $rootScope.distance = 'km';
                $rootScope.time = '24';

                saveToLocalStorage('lastUpdated', '2000-12-12T12:00:00');
                saveToLocalStorage('weight', 'kg');
                saveToLocalStorage('distance', 'km');
                saveToLocalStorage('time', '24');
                saveToLocalStorage('language', { 'name': 'English', 'value': 'en' });
                if (isFirstLogin) {
                    isFirstLogin = false;
                    var platform = null;

                    var config = {
                        "senderID": "555818327405",
                    };

                    if (ionic.Platform.isIOS()) {
                        config = {
                            "badge": "true",
                            "sound": "true",
                            "alert": "true"
                        }
                        platform = "iOS";
                    }
                    else { platform = "Android"; }
                    $cordovaPush.register(config).then(function (result) {
                        if (ionic.Platform.isIOS()) {
                            if (!readFromLocalStorage("isFirstLogin")) {
                                saveToLocalStorage("isFirstLogin", "false");
                                apiConnection.storeDeviceToken(result, platform);
                            }
                        }
                    }, function (err) {
                        $rootScope.showAlertPopup('Error during registration for push notifications', false);
                    })
                    // WARNING: dangerous to unregister (results in loss of tokenID)
                    //$cordovaPush.unregister(options).then(function (result) {
                    //}, function (err) {
                    //    // Error
                    //})
                }
                if (!readFromLocalStorage('logged'))
                {
                    $state.go('pin');
                }
                else
                {
                    $state.go("dashboard");
                }
            }

        }, function (result) {
            $rootScope.$broadcast('loading:hide');
            $scope.loginInvalid = true;
        });
    }

    $scope.register = function () {
        $state.go('register');
    }
});
