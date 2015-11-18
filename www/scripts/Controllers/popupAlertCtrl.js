angular.module('popupAlertCtrlMd', ['ui.router'])

.controller('PopupAlertCtrl', function ($scope, $rootScope) {
    $scope.closePopup = function () {
        //$rootScope.isCancelButtonClicked = true;
        $rootScope.popupAlert.close();
        $(".popup-dash").remove();
    };
    $scope.buttonFunction = $rootScope.butFunc;
})
