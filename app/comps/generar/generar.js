'use strict';

angular.module('app.generar', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/generar', {
      templateUrl: 'comps/generar/generar.html',
      controller: 'generarCtrl'
    });
  }])

  .controller('generarCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, NgMap, $localStorage) {

    }
  ]);
