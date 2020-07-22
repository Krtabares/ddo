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
      $scope.hasClient = false;
      $scope.isOptionsReady = false;
      $scope.client = {};
      $scope.client_info = {}
      $scope.dtInstance = {};
      verificClient() 

    function verificClient(){
      
     var client = localStorage.getItem('client')
     var client_info = localStorage.getItem('client_info')
     console.log(client)
     if( client ==  null){
       $scope.hasClient = false;
     }else{
       $scope.hasClient = true;
       $scope.client_info = JSON.parse(client_info);
       $scope.client = JSON.parse(client);
       
     } 
     console.log($scope.client)
   }
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
      var defer = $q.defer();
      var body = {};
      if(filter){

        body.pNoCia = $scope.client.COD_CIA
        body.pNoGrupo = $scope.client.GRUPO_CLIENTE
        body.pCliente = $scope.client.COD_CLIENTE
        body.pBusqueda = $scope.busqueda_prod
      }
      request.post(ip+'/procedure_productos', body,{})
      .then(function successCallback(response) {
        console.log(response)
        if(response.data.obj.length > 1){
          // $scope.productos = response.data.obj
          defer.resolve(response.data.obj);
          // $scope.dtOptions.reloadData()
        }else{
          ngNotify.set('¡No se encontraron resultados!', 'warn')
        }

      }, function errorCallback(response) {
        console.log(response)
      });
    }

    $scope.newPromise = newPromise;
    function newPromise() {
      console.log("getProdNew");
      var defer = $q.defer();
      var body = {};
      // if(filter){

        body.pNoCia = $scope.client.COD_CIA
        body.pNoGrupo = $scope.client.GRUPO_CLIENTE
        body.pCliente = $scope.client.COD_CLIENTE
        body.pBusqueda = $scope.busqueda_prod
      // }
      request.post(ip+'/procedure_productos', body,{})
      .then(function successCallback(response) {
        console.log(response)
        if(response.data.obj.length > 1){
          // $scope.productos = response.data.obj
          defer.resolve(response.data.obj);
          // $scope.dtOptions.reloadData()
        }else{
          ngNotify.set('¡No se encontraron resultados!', 'warn')
        }

      }, function errorCallback(response) {
        console.log(response)
      });
        return defer.promise;
    }
	
	
	$scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        var body = {}
        body.pNoCia = $scope.client.COD_CIA
        body.pNoGrupo = $scope.client.GRUPO_CLIENTE
        body.pCliente = $scope.client.COD_CLIENTE
        // body.pBusqueda = ''
         request.post(ip+'/procedure_productos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          .then(function successCallback(response) {
            console.log(response.data)
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
            DTColumnBuilder.newColumn('bodega').withTitle('Bodega'),
            DTColumnBuilder.newColumn('nombre_bodega').withTitle('Nombre de la bodega'),
            DTColumnBuilder.newColumn('cod_producto').withTitle('Código de producto'),
            DTColumnBuilder.newColumn('nombre_producto').withTitle('Nombre de producto'),
            DTColumnBuilder.newColumn('princ_activo').withTitle('Principio activo').withClass('none'),
            DTColumnBuilder.newColumn('existencia').withTitle('Existencia').withClass('none'),
            DTColumnBuilder.newColumn('precio').withTitle('Precio')
        ];
  }]);
