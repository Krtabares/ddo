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

        $scope.loading = true;
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
       $scope.facturasTotales = {}
       $scope.facturasList = []
       function facturacion() {
         $scope.loading = true
         var body = {}
         body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
         body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
         body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
          request.post(ip+'/procedure_facturacion', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
           .then(function successCallback(response) {
             console.log(response.data)
             $scope.facturas = Object.keys(response.data.obj)
             $scope.facturasList = response.data.obj
            console.log($scope.facturas);
            $scope.facturas.forEach((item, i) => {
              // console.log($scope.facturasList[item]);
              $scope.facturasList[item].forEach((element, j) => {
                // console.log(element);
                if( !$scope.facturasTotales.hasOwnProperty(element.nro_factura)){
                  $scope.facturasTotales[element.nro_factura] = {
                    total_bs: 0,
                    total_usd:0
                  }
                }

                var uni_fact =  parseInt(element.unidades_facturadas)
                // console.log( uni_fact);
                // console.log( typeof uni_fact );
                if(isNaN(uni_fact)){

                  uni_fact = 0
                }

                element.unidades_facturadas = uni_fact

                console.log(!isNaN(uni_fact));
                console.log( uni_fact);
                console.log( element.unidades_facturadas );
                $scope.facturasTotales[element.nro_factura].total_bs += element.total_producto * uni_fact
                $scope.facturasTotales[element.nro_factura].total_usd += element.total_producto_usd * uni_fact
              });
              // console.log($scope.facturasTotales);

            });

            $scope.loading = false
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
            if($scope.clientes && $scope.clientes.length > 0){
              $scope.client  = $scope.clientes[ $scope.clientIndex ];
                console.log($scope.client,"selectCLient" )
                facturacion()
                angular.element('#clientes').focus();
            }


              // selectCLientCAP( $scope.client)

          }

          const formatterUSD = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          })
          const formatterVe = new Intl.NumberFormat('es-VE', {
            style: 'currency',
            currency: 'VES'
          })
          const formatterVeDECIMAL = new Intl.NumberFormat('es-VE', {
          })

          $scope.formato = function(tipo, valor){
            if(tipo == 1){
              return formatterVeDECIMAL.format(valor)
            }
            if(tipo==2){
              return formatterVe.format(valor)
            }
            if(tipo==3){
              return formatterUSD.format(valor)
            }
          }

          $scope.calculaMontoLinea=function (monto, cantidad, tipo) {

              // monto =

              return $scope.formato(tipo, parseFloat(monto.replace(",", ".")) * parseInt(cantidad))
          }

          $scope.getClientNew = function (filter = false) {
            $scope.loading = true
            console.log("getClientNew");
            var body = {};
            if(filter){
              body.pNombre = $scope.nombre_cliente
            }
            request.post(ip+'/procedure_clientes', body,{})
            .then(function successCallback(response) {
              console.log(response)

              $scope.clientes = response.data.obj
              $scope.loading = false

            }, function errorCallback(response) {
              console.log(response)
              $scope.loading = false
            });
          }

          $scope.dtOptions = DTOptionsBuilder.newOptions()
                    .withPaginationType('full_numbers')
                    .withOption('responsive', true)
                    .withDOM('frtip').withPaginationType('full_numbers')
                    .withLanguage(DATATABLE_LANGUAGE_ES)

        $scope.dtOptionsFact = DTOptionsBuilder.newOptions()
                  .withPaginationType('full_numbers')
                  .withOption('responsive', true)
                  .withDOM('frtip').withPaginationType('full_numbers')
                  .withLanguage(DATATABLE_LANGUAGE_ES)


    }
]);
