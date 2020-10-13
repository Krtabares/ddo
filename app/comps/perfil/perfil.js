'use strict';

angular.module('app.perfil', ['ngRoute', 'cgNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/perfil', {
      templateUrl: 'comps/perfil/perfil.html',
      controller: 'perfilCtrl'
    });
  }])

  .controller('perfilCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'notify', 'request', 'NgMap', 'localstorage', '$localStorage', '$sessionStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, notify, request, NgMap, localstorage, $localStorage, $sessionStorage) {

      // CARGA INICIAL DE CHART

      $scope.client = {};
      $scope.client_info = {};
      $scope.hasUserClient = false;
      // $scope.numero = 0
      //
      // $scope.numeroChang = function () {
      //   $scope.numero++
      //   console.log("numeroChang"+ $scope.numero);
      // }

      $scope.getUser = function (username) {
        var body = {}
        body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
        body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
        body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
        body.username = username
         request.post(ip+'/get/user', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          .then(function successCallback(response) {
            console.log(response.data)
            $scope.user = response.data
            // $scope.permisos = $scope.user.permisos
            $scope.typeview = 'view'
            // $scope.modalTitle = 'Ver usuario'
         });
      }


    }
  ]);
