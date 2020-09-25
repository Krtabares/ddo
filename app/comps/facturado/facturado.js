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


        $scope.hasUserClient = false;
        $scope.client = {};
        $scope.client_info = {}

        verificClient()

        function verificClient(){

         var client = localStorage.getItem('client')
         var client_info = localStorage.getItem('client_info')
         console.log(client)
          if ( client=='{}' ){
           $scope.hasUserClient = false;
         }else{
           $scope.hasUserClient = true;
           $scope.client_info = JSON.parse(client_info);
           $scope.client = JSON.parse(client);
           facturacion()
         }
         console.log($scope.client)
       }

       $scope.facturas = []
       $scope.facturasTotales = []
       $scope.facturasList = []
       function facturacion() {
         var body = {}
         body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
         body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
         body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
          request.post(ip+'/procedure_facturacion', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
           .then(function successCallback(response) {
             console.log(response.data)
             $scope.facturas = Object.keys(response.data.obj)
             $scope.facturasList = response.data.obj

            // $scope.facturas.forEach((item, i) => {

              $scope.facturasList,forEach((element, j) => {

                if( !$scope.facturasTotales.hasOwnProperty(element.nro_pedido)){
                  $scope.facturasTotales[element.nro_pedido] = {
                    total_bs: 0,
                    total_usd:0
                  }
                }


                $scope.facturasTotales[element.nro_pedido].total_bs = element.total_producto * element.unidades_facturadas
                $scope.facturasTotales[element.nro_pedido].total_bs = element.total_producto_usd * element.unidades_facturadas
              });


            // });


          });
       }
          $scope.factura = []
          $scope.selectFactura = function (fact) {
            $scope.factura = fact
              // angular.element('#btnfacturaInfo').trigger('click');
          }
          $scope.clientes = null;
          $scope.nombre_cliente = null;


          $scope.selectCLient = function(){

            // $scope.client = x
            if($scope.clientes.length > 0){
              $scope.client  = $scope.clientes[ $scope.clientIndex ];
                console.log($scope.client,"selectCLient" )
                facturacion()
            }


              // selectCLientCAP( $scope.client)

          }

          $scope.getClientNew = function (filter = false) {
            console.log("getClientNew");
            var body = {};
            if(filter){
              body.pNombre = $scope.nombre_cliente
            }
            request.post(ip+'/procedure_clientes', body,{})
            .then(function successCallback(response) {
              console.log(response)

              $scope.clientes = response.data.obj

            }, function errorCallback(response) {
              console.log(response)
            });
          }

          $scope.dtOptions = DTOptionsBuilder.newOptions()
                    .withPaginationType('full_numbers')
                    .withOption('responsive', true)
                    .withDOM('frtip').withPaginationType('full_numbers')

        $scope.dtOptionsFact = DTOptionsBuilder.newOptions()
                  .withPaginationType('full_numbers')
                  .withOption('responsive', true)
                  .withDOM('frtip').withPaginationType('full_numbers')


    }
]);
