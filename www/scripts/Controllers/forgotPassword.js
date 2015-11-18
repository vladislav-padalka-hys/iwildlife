angular.module('forgotPasswordMd', ['ui.router'])

.controller('ForgotPasswordCtrl', function ($scope, $state, $http, $rootScope, $ionicPlatform, $cordovaPush, $cordovaDialogs, $ionicPopup, apiConnection) {
    $scope.user = {};
    $scope.forgotInvalid = false;

    //if (!$scope.user.email)
    //    $scope.forgotInvalid = true;
    $scope.$on('$ionicView.beforeEnter', function () {

        $scope.forgotInvalid = false;

    });
    $scope.sendInstructions = function () {
        $scope.forgotInvalid = false;

        apiConnection.DoResetPassword($scope.user.email).then(function (data) {
            $state.go("login");
        }, 
        function (result) {
            $scope.forgotInvalid = true;;
        });
    }

    $scope.returnToLogin = function () {
        $state.go("login");
    }
});
