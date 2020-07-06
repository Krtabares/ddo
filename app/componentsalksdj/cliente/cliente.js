'use strict';

angular.module('app.cliente', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile','swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/cliente', {
      templateUrl: 'components/cliente/vendedorinterno.html',
      controller: 'ClienteCtrl'
    });


  }])

  .controller('ClienteCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, NgMap, $localStorage) {

      $scope.estadoqtal = "PENDIENTE";
    }
  ]);
