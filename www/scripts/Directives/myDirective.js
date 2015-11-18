angular.module('myDirectiveMd', []).directive('myDirective', [
    '$timeout', '$rootScope',
    function ($timeout, $rootScope) {
        return {
            restrict: 'A',
            scope: {
                name: $rootScope.selectedField.Name,
                note: $rootScope.selectedField.Note
            },
            link: function ($scope, $rootScope, element) {
                
            }
        };
    }
]);