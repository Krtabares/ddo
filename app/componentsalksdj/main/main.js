'use strict';

angular.module('app.main', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile','swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/main', {
      templateUrl: 'components/main/vendedorinterno.html',
      controller: 'MainCtrl'
    });


  }])

  .controller('MainCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, NgMap, $localStorage) {

      $scope.estadoqtal = "PENDIENTE";
    }
  ]);
