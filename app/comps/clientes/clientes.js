'use strict';

angular.module('app.clientes', ['datatables', 'datatables.buttons', 'datatables.bootstrap', 'ngRoute', 'ngNotify','cgNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/clientes', {
      templateUrl: 'comps/clientes/clientes.html',
      controller: 'clientesCtrl'
    });
  }])

  .controller('clientesCtrl', ['$scope', '$q', '$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify','notify', 'localstorage', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify,notify, localstorage, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {

      var ip = IP_SERVER_PYTHON;

      $scope.deuda = {};
      $scope.clientes = []
      $scope.clientIndex = null
      $scope.showProductTable = null
      $scope.loading = false
      $scope.nombre_cliente=null
      $scope.loading = false
      $scope.tipoBusquedaCliente = 0;

      $scope.getClientNew = function (filter = false) {
        console.log("getClient")
        $scope.loading = true
        var body = {};
        if(filter){
          body.pNombre = $scope.nombre_cliente
        }
        body.pNoCia = "01";
        body.pNoGrupo = ($scope.tipoBusquedaCliente != 0)? "02": "01";
        console.log(body)
        request.post(ip+'/procedure_clientes', body,{})
        .then(function successCallback(response) {
          console.log(response)
          // $scope.clientes = []
          $scope.clientIndex = null
          $scope.showProductTable = null
          $scope.loading = false

          if(response.data.obj.length > 0){

            $scope.clientes = response.data.obj
            // $scope.clientes = null
            // $scope.clientIndex = -1
            // $scope.nombre_cliente = null

          }else{
            $scope.clientes = []
            notify({ message:'¡No se encontraron resultados!', position:'right', duration:10000, classes:'   alert-warning'});

          }



        }, function errorCallback(response) {
          // console.log(response)
          $scope.loading = false
        });
      }


      $scope.dtOptions = DTOptionsBuilder.newOptions()
          .withPaginationType('full_numbers')
          .withOption('responsive', true)
          .withDOM('frtip')
          .withPaginationType('full_numbers')
          .withLanguage(DATATABLE_LANGUAGE_ES)
          .withDisplayLength(15)




  }]);
