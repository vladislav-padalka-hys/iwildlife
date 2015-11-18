angular.module('personalInfoCtrlMd', ['ui.router'])
    .controller('PersonalInfoCtrl', function ($scope, $state, $translate, $filter, $http, $rootScope, $ionicPlatform, $cordovaPush, $cordovaDialogs, $ionicPopup, apiConnection) {

        $scope.user = {};
        $scope.user.newUsername = $rootScope.currUser.UserName;
        $scope.user.password = {};
        $scope.user.password.oldPassword = '';
        //for (var i = 0; i < $rootScope.currUser.passwordLength; i++) {
        //    $scope.user.password.oldPassword = $scope.user.password.oldPassword + '1';
        //}
        $scope.user.newEmail = $rootScope.currUser.email;
        $scope.$on('$ionicView.beforeEnter', function () {
            $scope.personalInfoInvalid = false;
        });


        $scope.clearOldPasswordField = function () {
            $scope.user.password.oldPassword = '';
        }
        //$scope.rewriteOldPassword = function() {
        //    if ($scope.user.password.oldPassword == '') {
        //        for (var i = 0; i < $rootScope.currUser.passwordLength; i++) {
        //            $scope.user.password.oldPassword = $scope.user.password.oldPassword + '1';
        //        }
        //    }
        //}

        $scope.clearNewPasswordField = function () {
            $scope.user.password.newPassword = '';
        }

        $scope.clearConfirmPasswordField = function () {
            $scope.user.password.confirmPassword = '';
        }

        $scope.changePassword = function (password) {
            apiConnection.changePassword(password.oldPassword, password.newPassword, password.newPassword).then(function (data) {
                apiConnection.DoLogin($rootScope.currUser.email, $rootScope.currUser.password).then(function (data) {
                    $rootScope.$broadcast('loading:hide');
                }, function(status) {
                    $scope.personalInfoInvalid = true;
                    $rootScope.$broadcast('loading:hide'); 
                });
            }, function (data) { $rootScope.$broadcast('loading:hide'); });
        }

        $scope.changeEmail = function () {
            apiConnection.changeEmail($scope.user.newEmail).then(function (data) {
                $rootScope.currUser.email = $scope.user.newEmail;
                saveToLocalStorage('logged', false);
                $state.go('login');
                $rootScope.$broadcast('loading:hide');
            }, function (data) { $rootScope.$broadcast('loading:hide'); });
        }

        $scope.changeUsername = function () {
            apiConnection.changeUsername($scope.user.newUsername).then(function (data) {
                $rootScope.$broadcast('loading:hide');
                //apiConnection.headers = {
                //    "Authorization": "Bearer " + data.token
                //};
            }, function(status) {
                $scope.personalInfoInvalid = true;
                $rootScope.$broadcast('loading:hide');
            });
        }

        $scope.changeUserData = function () {
            var userRegExp = /^$|\s+/; //if there's whitespace or its empty 
            var emailRegExp = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i; //if there's correct email structure
            var passwordRegExp = /^[ \t\r\n]*$/; //if string contains only whitespaces

            $scope.personalInfoInvalid = false;
            $scope.$apply();

            //username validation
            if ($scope.user.newUsername != $rootScope.currUser.UserName) {
                if (userRegExp.test($scope.user.newUsername))
                    $scope.personalInfoInvalid = true;
                else {
                    $rootScope.$broadcast('loading:show');
                    $scope.changeUsername();
                }
            }

            //password validation
            if ($scope.user.password.oldPassword && $scope.user.password.newPassword && $scope.user.password.confirmPassword && $scope.user.password.oldPassword!=$scope.user.password.newPassword)
                    if (!passwordRegExp.test($scope.user.password.newPassword)) {
                        if ($scope.user.password.newPassword == $scope.user.password.confirmPassword) {
                            $rootScope.$broadcast('loading:show');
                            $scope.changePassword($scope.user.password);
                        } else {
                            $scope.personalInfoInvalid = true;
                        }
                    }

            //email validation
            if ($scope.user.newEmail != $rootScope.currUser.email) {
                if (emailRegExp.test($scope.user.newEmail)) {
                    $rootScope.$broadcast('loading:show');
                    $scope.changeEmail();
                }
                else {
                    $scope.personalInfoInvalid = true;
                }
            }
            if (!$scope.personalInfoInvalid)
                $state.go($state.current, {}, { reload: true });
        }
    });