angular.module('showPOIInfoCtrlMd', ['ui.router'])
    .controller('showPOIInfoCtrl', function ($rootScope, $timeout, $scope, $state, $filter, $ionicPopup, taskService, apiConnection, fileHelper) {
        $scope.currentPOI = $rootScope.selectedPOI;

        var $trans = $filter('translate');


        $scope.closeModal = function () {
            $rootScope.modal.remove();
        };

        $scope.editPOI = function () {
            $rootScope.modal.remove();
            $rootScope.modalAddress = 'templates/editPOI.html';

            $rootScope.makeModal();
        };

    

        $scope.getDistance = function (data) {
            return getDistance(data);
        }
        $scope.isLocaL = function (data) {
            return isLocal(data);
        }
    })