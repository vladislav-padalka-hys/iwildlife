angular.module('popupPushCtrlMd', ['ui.router'])

.controller('popupPushCtrl', function ($scope, $rootScope, $state, $ionicPlatform) {

    $scope.notification = $rootScope.notifAlert;

    $scope.closePush = function () {
        $rootScope.pushPopup.close();
    };

    $scope.showPush = function () {
        for (var i = 0; i < $rootScope.fields.length; i++)
            if ($rootScope.fields[i].FieldId == $rootScope.pushFieldId)
                $rootScope.selectedField = $rootScope.fields[i];
        if ($state.current.name == 'fieldDetails') {
            $rootScope.pushPopup.close();
            $state.go($state.current, {}, { reload: true });
        }
        else {
            $rootScope.pushPopup.close();
            $state.go('fieldDetails');
        }
    };
})