'use strict';

angular.module('app.mySidebar', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])
.component("mySidebar", {
    templateUrl: "comps/sidebar/sidebar.html"
  })

  .controller('sidebarCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, NgMap, $localStorage) {

        console.log("sidebarCtrl entro")

        $scope.hasClient = false;
        $scope.user = {};
        init()
        function init() {
          var user = localStorage.getItem('user')
           $scope.user = JSON.parse(user);
           console.log($scope.user)
        }
    }
  ]);
