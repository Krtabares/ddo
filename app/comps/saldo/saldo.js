'use strict';

angular.module('app.saldo', ['datatables', 'datatables.buttons', 'datatables.bootstrap', 'ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/saldo', {
      templateUrl: 'comps/saldo/saldo.html',
      controller: 'saldoCtrl'
    });
  }])

  .controller('saldoCtrl', ['$scope', '$q', 'localstorage', '$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'DTColumnDefBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, DTOptionsBuilder, DTColumnBuilder, DTColumnDefBuilder, NgMap, $localStorage) {

      var ip = "http://192.168.168.170:3500";
      $scope.saldo = {};
      $scope.listDeuda = [{}];

      $scope.arr_page = new Array(4);
      $scope.max = 4
      $scope.min = 0;
      $scope.aux = {'pages': '01', 'totalPages': 11};
      $scope.hasUserClient = false;
      $scope.isOptionsReady = false;
      $scope.client = {};
      $scope.client_info = {}
      $scope.dtInstance = {};
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

     }
     console.log($scope.client)
   }


   $scope.clientes = null;
   $scope.nombre_cliente = null;


   $scope.selectCLient = function(){

     // $scope.client = x
     if($scope.clientes.length > 0){
       $scope.client  = $scope.clientes[ $scope.clientIndex ];
         console.log($scope.client,"selectCLient" )
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
// $scope.getClientNew()
    const formatterVe = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    })
    // console.log(formatterVe.format(value))
    const formatterVeDECIMAL = new Intl.NumberFormat('es-VE', {
    })
    $scope.formato = function(tipo, valor){
      if(tipo == 1){
        return formatterVeDECIMAL.format(valor)
      }
      if(tipo==2){
        return formatterVe.format(valor)
      }
    }
    $scope.getNumber = function(num) {
      return new Array(num);
    }

	  $scope.page = function(param){
        if(param == 'prev'){
          if($scope.min > 0){
            $scope.min = $scope.min - 1;
            $scope.max = $scope.max - 1;
          }
        }else if(param == 'next'){
          if($scope.max < $scope.aux.totalPages){
            $scope.min = $scope.min + 1;
            $scope.max = $scope.max + 1;
          }
        }
      }

    $scope.getDeuda = function(param){
      console.log(param);
    }

    $scope.showSaldo = function(saldo){
      console.log(saldo);
      $scope.saldo = saldo;
    }

    $scope.getSaldo = function(page){
	  var obj = {'page': page};
		request.post(ip+'/get/saldo', obj ,{})
		  .then(function successCallback(response) {
			console.log(response);
			if(response.data.data.length > 0){
				$scope.listDeuda = response.data.data;
				$scope.aux.totalPages = 100;
				//console.log($scope.listDeuda);
			}
		  }, function errorCallback(response) {
			console.log(response)
		  });

    }
    $scope.busqueda_prod = null
    $scope.getProdNew = function (filter = false) {
      console.log("getProdNew");
      // var defer = $q.defer();
      var body = {};

      console.log($scope.client)
      if(filter){

        body.pNoCia = $scope.client.COD_CIA
        body.pNoGrupo = $scope.client.GRUPO_CLIENTE
        body.pCliente = $scope.client.COD_CLIENTE
        body.pBusqueda = $scope.busqueda_prod
      }
      console.log(body)
      request.post(ip+'/procedure_productos', body,{})
      .then(function successCallback(response) {
        console.log(response)
        if(response.data.obj.length > 1){
          // $scope.productos = response.data.obj
          // defer.resolve(response.data.obj);
            $scope.listaProd = response.data.obj;
          // $scope.dtOptions.reloadData()
        }else{
          ngNotify.set('¡No se encontraron resultados!', 'warn')
        }

      }, function errorCallback(response) {
        console.log(response)
      });
    }

    $scope.listaPro=[];
    $scope.newPromise = newPromise;

    function newPromise() {
      console.log("getProdNew");
      // var defer = $q.defer();
      var body = {};
      console.log($scope.client)
      // if(filter){

      body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
      body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
      body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
        body.pBusqueda = $scope.busqueda_prod
      // }
      console.log(body)
      request.post(ip+'/procedure_productos', body,{})
      .then(function successCallback(response) {
        console.log(response)
        if(response.data.obj.length > 1){
          // $scope.productos = response.data.obj
          response.data.obj.forEach((item, i) => {
            item.precio = item.precio.replace(",", ".")
            item.precio = $scope.formato(2,  parseFloat(item.precio).toFixed(2) )

          });
          $scope.listaProd = response.data.obj;
          // defer.resolve(response.data.obj);
          // $scope.dtOptions.reloadData()
        }else{
          ngNotify.set('¡No se encontraron resultados!', 'warn')
        }

      }, function errorCallback(response) {
        console.log(response)
      });
        // return defer.promise;
    }

    // newPromise();


	$scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        var body = {}
        console.log($scope.client);

        body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
        body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
        body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;

        console.log(body);
         request.post(ip+'/procedure_productos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          .then(function successCallback(response) {
            console.log(response.data)

            response.data.obj.forEach((item, i) => {
              item.precio = item.precio_bruto_bs.replace(",", ".")
              item.precio = $scope.formato(2,  parseFloat(item.precio).toFixed(2) )

            });
            defer.resolve(response.data.obj);

         });
        return defer.promise;
		})
		.withDOM('frtip')
        .withPaginationType('full_numbers')
		.withButtons([
            'colvis',
            'pdf',
            'excel'
        ])

        $scope.dtColumns = [
            // DTColumnBuilder.newColumn('bodega').withTitle('Bodega'),
            DTColumnBuilder.newColumn('nombre_producto').withTitle('Nombre de producto'),
            DTColumnBuilder.newColumn('fecha_vence').withTitle('Fecha vencimiento'),
            DTColumnBuilder.newColumn('proveedor').withTitle('Proveedor'),
            // DTColumnBuilder.newColumn('cod_producto').withTitle('Código de producto'),
            DTColumnBuilder.newColumn('princ_activo').withTitle('Principio activo').withClass('none'),
            DTColumnBuilder.newColumn('existencia').withTitle('Existencia').withClass('none'),
            // DTColumnBuilder.newColumn('precio').withTitle('Precio')
        ];
  }]);
