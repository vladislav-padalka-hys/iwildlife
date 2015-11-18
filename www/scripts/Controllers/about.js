angular.module('aboutMd', ['ui.router'])

.controller('aboutCtrl', function ($scope, $rootScope, $translate, $state, $cordovaCamera, $cordovaFile, $ionicNavBarDelegate) {
    $scope.preferences = {};
    $scope.preferences.temperature = $rootScope.temperature;
    $scope.preferences.language = $rootScope.language.name;
    console.log(JSON.stringify($scope.preferences.language));
    $scope.preferences.time = $rootScope.time;
    $scope.preferences.distance = $rootScope.distance;
    $scope.preferences.weight = $rootScope.weight;

    $scope.returnToPrevious = function () {
        $state.go('dashboard');
    }

    $scope.useLanguage = function (lang) {
        if (lang === 'English') {
            $rootScope.language.name = lang;
            $rootScope.language.value = 'en';
            $translate.use('en');
            saveToLocalStorage("lang", $rootScope.language);
        }
        else if (lang === 'Dutch') {
            $rootScope.language.name = lang;
            $rootScope.language.value = 'nl';
            $translate.use('nl');
            saveToLocalStorage("lang", $rootScope.language);
        }
        else if (lang === 'French') {
            $rootScope.language.name = lang;
            $rootScope.language.value = 'fr';
            $translate.use('fr');
            saveToLocalStorage("lang", $rootScope.language);
        }
        else if (lang === 'German') {
            $rootScope.language.name = lang;
            $rootScope.language.value = 'de';
            $translate.use('de');
            saveToLocalStorage("lang", $rootScope.language);
        }
        else if (lang === 'Spanish') {
            $rootScope.language.name = lang;
            $rootScope.language.value = 'es';
            $translate.use('es');
            saveToLocalStorage("lang", $rootScope.language);
        }
    }
  
    $scope.useTemperature = function (temperature) {
        $rootScope.temperature = temperature;
        saveToLocalStorage("temperature", $rootScope.temperature);
    }

    $scope.useTime = function (time) {
        $rootScope.time = time;
        saveToLocalStorage("time", $rootScope.time);
    }

    $scope.useDistance = function (distance) {
        $rootScope.distance = distance;
        saveToLocalStorage("distance", $rootScope.distance);
    }

    $scope.useWeight = function (weight) {
        $rootScope.weight = weight;
        saveToLocalStorage("weight", $rootScope.weight);
    }

});