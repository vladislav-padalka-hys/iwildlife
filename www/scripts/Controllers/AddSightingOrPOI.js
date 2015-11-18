angular.module('addSightingOrPoiMd', ['ui.router'])

.controller('addSightingOrPoiCtrl', function ($ionicModal, $rootScope, $timeout, $scope, $state) {

    $scope.openPOIwindow = function () {
        $rootScope.testMarker.setIcon($rootScope.newPoiIcon);
        //$rootScope.modalAddress = null;
        $rootScope.modal.remove();
        $rootScope.modalAddress = 'templates/addPointOfInterest.html';

        $rootScope.makeModal();
    };

    $scope.openSightingWindow = function () {
        $rootScope.testMarker.setIcon($rootScope.newSightingIcon);
        //$rootScope.modalAddress = null;

        $rootScope.modal.remove();
        $rootScope.modalAddress = 'templates/addSighting.html';

        $rootScope.makeModal();
    };

});