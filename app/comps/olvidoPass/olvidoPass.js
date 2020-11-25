'use strict';

angular.module('app.olvidoPass', ['ngRoute', 'cgNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/olvidoPass', {
      templateUrl: 'comps/olvidoPass/olvidoPass.html',
      controller: 'olvidoPassCtrl'
    });
  }])

  .controller('olvidoPassCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'notify', 'request', 'NgMap', 'localstorage', '$localStorage', '$sessionStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, notify, request, NgMap, localstorage, $localStorage, $sessionStorage) {

      // CARGA INICIAL DE CHART

      $scope.client = {};
      $scope.client_info = {};
      $scope.hasUserClient = false;

      var ip = IP_SERVER_PYTHON;

	  $scope.$storage = $localStorage








    }
  ]);
