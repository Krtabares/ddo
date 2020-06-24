'use strict';

angular.module('app.consulta', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/consulta', {
      templateUrl: 'comps/consulta/consulta.html',
      controller: 'ConsultaCtrl'
    });
  }])

  .controller('ConsultaCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, NgMap, $localStorage) {

    }
  ]);
