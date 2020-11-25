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

      var ip = 'http://192.168.168.170:8888';

	  $scope.$storage = $localStorage

    $scope.user = {username:null}

    $scope.resetPass = function (user) {
      console.log("resetPass");
      console.log( $scope.user)
      request.post(ip+'/resetPass', user,{})
      .then(function successCallback(response) {
        console.log(response)

        notify({ message:'El nuevo password fue enviado a su correo', position:'right', duration:1000, classes:'alert-success'});

      }, function errorCallback(response) {
        console.log(response)
        notify({ message:'No se pudo completar la accion verifique los datos', position:'right', duration:1000, classes:'alert-danger'});

      });
    }





    }
  ]);
