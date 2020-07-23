'use strict';

angular.module('app.headerClient', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])
.component("headerClient", {
    templateUrl: "comps/clientHeader/clientHeader.html",
    controller: 'clientHeaderCtrl'
  })

  .controller('clientHeaderCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, NgMap, $localStorage) {

        console.log("clientHeaderCtrl entro")

        $scope.hasClient = false;
        $scope.user = {};
        $scope.client = {};
        $scope.client_info = {}
        $scope.dtInstance = {};
        verificClient() 
  
      function verificClient(){
        
        var client = localStorage.getItem('client')
        var client_info = localStorage.getItem('client_info')
        console.log(client)
        if( client ==  null){
            $scope.hasClient = false;
        }else{
            $scope.hasClient = true;
            $scope.client_info = JSON.parse(client_info);
            $scope.client = JSON.parse(client);
            
        } 
    }
  ]);
