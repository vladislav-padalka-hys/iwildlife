angular.module('managesCtrlMd', ['ui.router'])

.controller('ManagesCtrl', function ($scope, $rootScope, apiConnection) {
    $(".popup-container .popup").addClass('transp');

    $scope.getCurrentRole = function (user) {
        for (var i = 0; i < user.UserRoles.length; i++)
            if (user.UserRoles[i].indexOf($rootScope.selectedField.FieldId) != -1) {
                return user.UserRoles[i].substring(32);
            }
    }

    $scope.initChanging = function (user) {
        var role = "";
        for (var i = 0; i < user.UserRoles.length; i++)
            if (user.UserRoles[i].indexOf($rootScope.selectedField.FieldId) != -1) {
                role = user.UserRoles[i].substring(32);
                break;
            }
        if (role == "Administrator")// && !$rootScope.isAdmin($rootScope.currUser, $rootScope.selectedField))
            return;
        //close all opened
        $(".close-change-role-icon").hide();
        $(".role").hide();
        $(".role").removeClass('selected');
        $(".current-role").css('display', 'inline-block');
        $(".change-role-icon").css('display', 'inline-block');
        //open only needed
        $(".current-role[data-id='"+user.UserName+"']").hide();
        $(".change-role-icon[data-id='" + user.UserName + "']").hide();
        $(".manage-role[data-id='" + user.UserName + "']").css('background-color', 'rgba(211,211,211,0.7)');
        $(".role[data-id='" + user.UserName + "']").css('display', 'inline-block');
        $(".close-change-role-icon[data-id='" + user.UserName + "']").css('display', 'inline-block');
        $(".role[data-id='" + user.UserName + "']").each(function () {
            var val = $(this).html();
            if (val == role) {
                $(this).addClass('selected');
            }
        });

    }

    $scope.closeChanging = function (user) {
        var role = "";
        for (var i = 0; i < user.UserRoles.length; i++)
            if (user.UserRoles[i].indexOf($rootScope.selectedField.FieldId) != -1) {
                role = user.UserRoles[i].substring(32);
                break;
            }
        $(".close-change-role-icon[data-id='" + user.UserName + "']").hide();
        $(".role[data-id='" + user.UserName + "']").hide();
        $(".role[data-id='" + user.UserName + "']").removeClass('selected');
        $(".current-role[data-id='" + user.UserName + "']").css('display', 'inline-block');
        $(".change-role-icon[data-id='" + user.UserName + "']").css('display', 'inline-block');
    }

    $scope.changeRole = function (role, user) {
        $rootScope.$broadcast('loading:show');
        var oldRole = "";
        for (var i = 0; i < user.UserRoles.length; i++)
            if (user.UserRoles[i].indexOf($rootScope.selectedField.FieldId) != -1) {
                oldRole = user.UserRoles[i];
                break;
            }
        if (oldRole == $rootScope.selectedField.FieldId + role) {
            $scope.closeChanging(user);
            $rootScope.$broadcast('loading:hide');
            return;
        }

        apiConnection.changeUserRole(user, oldRole.substring(32), role, $rootScope.selectedField.FieldId).then(
            function (data) {
                for (var i = 0; i < user.UserRoles.length; i++)
                    if (user.UserRoles[i].indexOf(data.fieldId) != -1) {
                        user.UserRoles[i] = data.fieldId + data.newRole;
                        break;
                    }
                $rootScope.$broadcast('loading:hide');
            },
            function (error) {
                alert("Error:" + JSON.stringify(error));
                $rootScope.$broadcast('loading:hide');
            });
        $scope.closeChanging(user);
        
    }

    $scope.getPreviousRole = function (user) {
        for (var i = 0; i < user.UserRoles.length; i++)
            if (user.UserRoles[i].indexOf($rootScope.selectedField.FieldId) != -1) {
                if (user.UserRoles[i].substring(32) == "Manager")
                    return "Guest";
                if (user.UserRoles[i].substring(32) == "Administrator")
                    return "Manager";
                if (user.UserRoles[i].substring(32) == "Guest")
                    return "Administrator";
            }
    }

    $scope.getNextRole = function (user) {
        for (var i = 0; i < user.UserRoles.length; i++)
            if (user.UserRoles[i].indexOf($rootScope.selectedField.FieldId) != -1) {
                if (user.UserRoles[i].substring(32) == "Manager")
                    return "Administrator";
                if (user.UserRoles[i].substring(32) == "Administrator")
                    return "Guest";
                if (user.UserRoles[i].substring(32) == "Guest")
                    return "Manager";
            }
    }
})