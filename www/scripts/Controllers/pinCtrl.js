angular.module('pinCtrlMd', [])

.controller('PinCtrl', function ($cordovaPush,$scope, $rootScope, $state, $ionicModal, $timeout, $ionicPlatform, $ionicSlideBoxDelegate, fileHelper, apiConnection) {
    $scope.pin = '';
    $scope.pressed = false;
    $scope.confirmPin = false;
    $scope.userLogged = false;
    $scope.CreatePin = '';
    $scope.CreatePinC = '';
    if (readFromLocalStorage('logged') == true) {
        $scope.userLogged = true;
    }
    else {
        $scope.userLogged = false;
    }

    $scope.$on('$ionicView.beforeLeave', function (e) {
        cordova.plugins.Keyboard.close();
    })

    $scope.oldPin = '';
    $scope.newPin = '';
    $scope.newPinC = '';
    $scope.changePinIndex = 0;

    $scope.pinChange = function (index) {
        if ($scope.changePinIndex == index)
            return true;
        return false;
    }

    $scope.pinShow = function (index, pin) {
        if (index < $scope.pin.length) {
            return true;
        }
        return false;
    }

    $ionicPlatform.ready(function () {
        setTimeout(function () {
            document.getElementById('pin').focus();
        }, 1000);
        setTimeout(function () {
            cordova.plugins.Keyboard.show();
        }, 2000);
    })

    $scope.focusInput = function () {
        setTimeout(function () { document.getElementById('pin').focus(); }, 5);
    }

    $scope.checkPin = function (pin) {
        if (pin || pin == 0)
            pin = pin.toString();
        else {
            document.getElementById('pin').value = $scope.pin;
            return;
        }
        if (pin.length > 0 && !/^\d+$/.test(pin)) {
            document.getElementById('pin').value = pin.substring(0, pin.length - 1);
            $rootScope.showAlertPopup("Enter only digits, please", false);
            document.getElementById('pin').focus();
            return;
        }
        $scope.pin = pin;
        if (pin.length != 4)
            return;
        if (!$scope.userLogged) {
            if ($scope.confirmPin) {
                if ($scope.CreatePin == $scope.pin) {
                    saveToLocalStorage('logged', true);
                    saveToLocalStorage('pin', pin);
                    $rootScope.$broadcast('loading:show');

                    setTimeout(function () {
                        $scope.CreatePin = $scope.pin;
                        $scope.pin = '';
                        $scope.confirmPin = true;
                        $scope.$apply();

                        $state.go("dashboard");
                    }, 200);
                }
                else {
                    $scope.CreatePin = '';
                    $scope.confirmPin = false;
                    $rootScope.showAlertPopup('Pin and confirmation does not match', false);
                    $rootScope.$broadcast('loading:hide');
                }
            } else {
                setTimeout(function () {
                    $scope.CreatePin = $scope.pin;
                    $scope.pin = '';
                    document.getElementById('pin').value = '';
                    $scope.confirmPin = true;
                    $scope.$apply();
                }, 200);
            }
        } else {
            var truePin = readFromLocalStorage('pin');
            if (pin == truePin) {
                saveToLocalStorage('logged', true);
                saveToLocalStorage('lastLogin', JSON.stringify(new Date()));

                $rootScope.$broadcast('loading:show');

                apiConnection.headers = readFromLocalStorage('headers');
                $rootScope.headers = apiConnection.headers;
                $rootScope.currUser = readFromLocalStorage('user');
                
                fileHelper.readFromFile('fields.txt').then(function (data) {
                    if (data && data != "" && data != {} && data.length > 0) {
                        $rootScope.fields = JSON.parse(data);
                        stableSort($rootScope.fields);
                        console.log("Fields:" + $rootScope.fields.length);
                    }
                    $state.go("dashboard");
                },
                        function (error) {
                            console.log("error" + error);
                            $rootScope.fields = [];
                            $state.go("dashboard");
                        });
            } else {
                cordova.plugins.Keyboard.close();
                $rootScope.$broadcast('loading:show');
                setTimeout(function () {
                    $rootScope.showAlertPopup('Pin is incorrect', false);
                    $rootScope.$broadcast('loading:hide');
                    $scope.pin = '';
                    document.getElementById('pin').value = '';
                }, 200);
            }
        }
    }

    $scope.signOff = function () {
        saveToLocalStorage('logged', false);
        $scope.userLogged = false;
        $scope.pressed = false;
        $scope.confirmPin = false;
        $scope.CreatePin = '';
        $scope.pin = '';
        $state.go('login');
    }
});