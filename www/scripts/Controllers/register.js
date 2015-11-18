angular.module('registerCtrlMd', ['ui.router'])

.controller('RegisterCtrl', function ($scope, $state, $filter, $translate, $http, $rootScope, $ionicPlatform, $cordovaPush, $cordovaDialogs, $ionicPopup, apiConnection) {
    $scope.$on('$ionicView.beforeEnter', function () {

        $scope.registerInvalid = false;

    });

    var $trans = $filter('translate');
    $scope.emailPlaceholder = $trans('email');
    $scope.passPlaceholder = $trans('password');
    $scope.namePlaceholder = $trans('name');

    $scope.newUser = {};
    $scope.signIn = function () {
        $state.go("login");
    }
    $scope.register = function () {
        $scope.registerInvalid = false;

        //if (!$scope.newUser.name) {
        //    $scope.registerInvalid = true;
        //    //$rootScope.showAlertPopup("Enter some name, please.", false);
        //    return;
        //}
        //if (!$scope.newUser.email) {
        //    $scope.registerInvalid = true;
        //    //$rootScope.showAlertPopup("Enter some email, please.", false);
        //    return;
        //}
        //if (!$scope.newUser.password) {
        //    $scope.registerInvalid = true;
        //    //$rootScope.showAlertPopup("Enter some password, please.", false);
        //    return;
        //}
        apiConnection.DoRegister($scope.newUser.name,$scope.newUser.email, $scope.newUser.password).then(function (data) {
            $state.go("login");
        }, function (result) { $scope.registerInvalid = true;});
    }
});
