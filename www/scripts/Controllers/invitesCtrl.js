angular.module('invitesCtrlMd', ['ui.router'])

.controller('InvitesCtrl', function ($scope, $rootScope, apiConnection) {
    $(".popup-container .popup").addClass('transp');

    $scope.emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
    $scope.invite = {
        Role: "Guest",
        asRole: "as guest"
    };
    $scope.rolesOpen = false;

    $scope.selectRole = function (role, asRole) {
        $scope.invite.Role = role;
        $scope.invite.asRole = asRole;
        $("#roles").hide("fast");
    }

    $scope.close = function () {

    }

    $scope.toggleRoles = function () {
        if ($scope.rolesOpen)
            $("#roles").hide("fast");
        else $("#roles").fadeToggle("fast");
        $scope.rolesOpen != $scope.rolesOpen;
    }

    $scope.inviteUser = function () {
        $rootScope.$broadcast('loading:show');
        if ($scope.invite.email != "")
            apiConnection.inviteUser($scope.invite.Role, $rootScope.selectedField.FieldId, $scope.invite.email)
                .then(function (data) {
                    $rootScope.$broadcast('loading:hide');
                    $rootScope.showAlertPopup("User successfully invited", false);
                    if (data.response.UserName)
                        $rootScope.selectedField.Users.push({
                            UserRoles: [data.fieldId + data.role],
                            UserName: data.response.UserName,
                            Email: data.email
                        });
                    $scope.invites.close();
                }, function (data) {
                    $rootScope.$broadcast('loading:hide');
                    if (data.status == 409)
                        $rootScope.showAlertPopup("User already invited for this field", false);
                    else
                        $rootScope.showAlertPopup("User not invited. Error occured", false);
                });
        else {
            $rootScope.$broadcast('loading:hide');
            $rootScope.showAlertPopup("Enter some real email", false);
        }
    }
})