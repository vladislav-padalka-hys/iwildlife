angular.module('showSightingInfoCtrlMd', ['ui.router'])
    .controller('showSightingInfoCtrl', function ($rootScope, $timeout, $scope, $state, $filter, $ionicPopup, taskService, apiConnection, fileHelper) {
        $scope.currentSighting = $rootScope.selectedSighting;
        var $trans = $filter('translate');
        
        $scope.editSighting = function() {
            $rootScope.modal.remove();
            $rootScope.modalAddress = 'templates/editSighting.html';

            $rootScope.makeModal();
        };
        
        $scope.getDistance = function (data) {
            return getDistance(data);
        }
        $scope.isLocaL = function (data) {
            return isLocal(data);
        }
    })