'use strict';

angular.module('app.facturado', ['datatables', 'datatables.buttons', 'datatables.bootstrap','ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/facturado', {
      templateUrl: 'comps/facturado/facturado.html',
      controller: 'facturadoCtrl'
    });
  }])
  .controller('facturadoCtrl', ['$scope', '$q', 'localstorage', '$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {
        //init
        var ip = "http://192.168.168.170:3500";
        $scope.hasClient = false;
      $scope.client = {};
        verificClient()

        function verificClient(){

         var client = localStorage.getItem('client')
         console.log(client)
          if ( client=='{}' ){
           $scope.hasClient = false;
         }else{
           $scope.hasClient = true;
           $scope.client = JSON.parse(client);
         }
         console.log($scope.client)
         facturacion()
       }
       $scope.facturas = []
       $scope.facturasList = []
       function facturacion() {
         var body = {}
         body.pNoCia = $scope.client.COD_CIA
         body.pNoGrupo = $scope.client.GRUPO_CLIENTE
         body.pCliente = $scope.client.COD_CLIENTE
          request.post(ip+'/procedure_facturacion', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
           .then(function successCallback(response) {
             console.log(response.data)
             $scope.facturas = Object.keys(response.data.obj)
             $scope.facturasList= response.data.obj

          });
       }


      //   $scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
      //     var defer = $q.defer();
      //     var body = {}
      //     body.pNoCia = $scope.client.COD_CIA
      //     body.pNoGrupo = $scope.client.GRUPO_CLIENTE
      //     body.pCliente = $scope.client.COD_CLIENTE
      //      request.post(ip+'/procedure_facturacion', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
      //       .then(function successCallback(response) {
      //         console.log(response.data)
      //   defer.resolve(response.data.obj);
      //      });
      //     return defer.promise;
      // })
      // .withDOM('frtip')
      //     .withPaginationType('full_numbers')
      // .withButtons([
      //         'colvis',
      //         'pdf',
      //         'excel'
      //     ])

          $scope.dtOptions = DTOptionsBuilder.newOptions()
              .withPaginationType('full_numbers')
              .withOption('responsive', true)
              .withDOM('frtip').withPaginationType('full_numbers')

          $scope.dtColumns = [
            DTColumnBuilder.newColumn('nro_pedido').withTitle('N Pedido'),
            DTColumnBuilder.newColumn('fecha_factura').withTitle('fecha factura'),
            DTColumnBuilder.newColumn('fecha_pedido').withTitle('fecha pedido'),
            DTColumnBuilder.newColumn('nombre_arti').withTitle('nombre producto'),
            DTColumnBuilder.newColumn('total_producto').withTitle('Total de Productos'),
            DTColumnBuilder.newColumn('unidades_facturadas').withTitle('Unidades Facturadas'),
			      DTColumnBuilder.newColumn('unidades_pedido').withTitle('unidades de pedido'),
            DTColumnBuilder.newColumn('nombre_vendedor').withTitle('nombre vendedor'),

        ];

    }
]);
