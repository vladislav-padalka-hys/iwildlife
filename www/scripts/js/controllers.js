angular.module('starter.controllers', ['ui.router'])

.controller('MainCtrl', function ($scope,$rootScope, $state,apiConnection,taskService,fileHelper) {
    $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
        for (var index in taskService.tasklist)
        {
            taskService.doTask(index).then(function(data){
                taskService.tasklist.splice(index, 1);
            });
        }
    })

    
});