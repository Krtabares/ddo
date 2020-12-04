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
        var ip = IP_SERVER_PYTHON;

        $scope.loading = false;
        $scope.hasUserClient = false;
        $scope.client = {};
        $scope.client_info = {}
        $scope.isEmpleado = false;

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
           var grupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
           // console.log(grupo);
           if(grupo == "02"){
             $scope.isEmpleado = true;
           }
         }
         console.log($scope.client)
       }

       function dateToNum(d) {
          // Convert date "26/06/2016" to 20160626
          d = d.split("/"); return Number(d[2]+d[1]+d[0]);
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

             var facAux = Object.keys(response.data.obj)

             // $scope.facturas = Object.keys(response.data.obj)

             $scope.facturasList = response.data.obj
              var obj = {}
              var auxFact2 = []
            facAux.forEach((item, i) => {
              // console.log($scope.facturasList[item]);
              obj = {}
              obj.detalle = $scope.facturasList[item];
              obj.nro_factura = $scope.facturasList[item][0].nro_factura;
              obj.fecha_factura = $scope.facturasList[item][0].fecha_factura;
              obj.fecha_facturaDate = new Date($scope.facturasList[item][0].fecha_factura);
              obj.tipo_pedido = $scope.facturasList[item][0].tipo_pedido;
              obj.fecha_entrega = $scope.facturasList[item][0].fecha_entrega;

              $scope.facturasList[item].forEach((element, j) => {
                if( !$scope.facturasTotales.hasOwnProperty(element.nro_factura)){
                  $scope.facturasTotales[element.nro_factura] = {
                    total_bs: 0,
                    total_usd:0
                  }
                }
                $scope.facturasTotales[element.nro_factura].total_bs += element.total_producto
                $scope.facturasTotales[element.nro_factura].total_usd += element.total_producto_usd

              });
              // console.log($scope.facturasTotales);

              auxFact2.push(obj)
            });


            // $scope.facturas.sort(function (a, b) {
            //     return ('' + a.fecha_factura).localeCompare(b.fecha_factura);
            // })
            $scope.facturas = auxFact2.sort((a, b) => b.fecha_facturaDate - a.fecha_facturaDate)
            console.log($scope.facturas);
            $scope.loading = false
          });
       }
          $scope.totalfactura = {
            "bs" : 0,
            "usd": 0
          }
          $scope.factura = []
          $scope.selectFactura = function (fact) {

            console.log(fact[0]);

            fact.sort(function (a, b) {
              if (a.no_linea > b.no_linea) {
                return 1;
              }
              if (a.no_linea < b.no_linea) {
                return -1;
              }
              // a must be equal to b
              return 0;
            })
            $scope.factura = fact
            $scope.totalfactura.bs =  $scope.facturasTotales[fact[0].nro_factura].total_bs
            $scope.totalfactura.usd =  $scope.facturasTotales[fact[0].nro_factura].total_usd
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
                if($scope.client.grupo_cliente == "02"){
                  $scope.isEmpleado = true;
                }
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

              // console.log(cantidad);
              // console.log(parseFloat(monto));
              // return $scope.formato(tipo, monto * parseInt(cantidad))
              return $scope.formato(tipo, monto )
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
                    .withDisplayLength(15)


        $scope.dtOptionsFact = DTOptionsBuilder.newOptions()
                  .withPaginationType('full_numbers')
                  .withOption('responsive', true)
                  .withDOM('frtip').withPaginationType('full_numbers')
                  .withLanguage(DATATABLE_LANGUAGE_ES)
                  .withDisplayLength(15)


    }
]);
