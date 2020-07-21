'use strict';

angular.module('app.deuda', ['datatables', 'datatables.buttons', 'datatables.bootstrap', 'ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/deuda', {
      templateUrl: 'comps/deuda/deuda.html',
      controller: 'deudaCtrl'
    });
  }])

  .controller('deudaCtrl', ['$scope', '$q', 'localstorage','$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {

      var ip = "http://192.168.168.170:3500";
      $scope.deuda = {};
      $scope.listDeuda = [{}];
      $scope.hasClient = false;
      $scope.client = {};
      $scope.client_info = {}
      verificClient()

      function verificClient(){
        
       var client = localStorage.getItem('client')
       var client_info = localStorage.getItem('client_info')
       console.log(client)
       if( client ==  null){
         $scope.hasClient = false;
       }else{
         $scope.hasClient = true;
         $scope.client = JSON.parse(client);
         $scope.client_info = JSON.parse(client_info);
         
       } 
       console.log($scope.client)
     }
	  
	  $scope.arr_page = new Array(4);
      $scope.max = 4
      $scope.min = 0;
      $scope.aux = {'pages': '01', 'totalPages': 11};
	  
      $scope.getNumber = function(num) {
		  console.log(num);
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
    
    $scope.showDeuda = function(deuda){
      console.log(deuda);
      $scope.deuda = deuda;
    }

    $scope.getSaldo = function(page){
	  var obj = {'page': page};
	  //console.log(obj);
      request.post(ip+'/get/deuda', obj ,{})
      .then(function successCallback(response) {
        console.log(response);
		if(response.data.data.length > 0){
			$scope.listDeuda = response.data.data;
			$scope.aux.totalPages = 100;
			//console.log($scope.listDeuda);
		}
        /*if (response.data.exist) {
          ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
        } else if (response.data.email_flag) {
          ngNotify.set('¡Ya el correo está registrado!','error')
        }*/
      }, function errorCallback(response) {
        console.log(response)
      });
    }
	
	$scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        var body = {}
       body.pCLiente = $scope.client.COD_CLIENTE

         request.post(ip+'/procedure_deudas', body, {'Authorization': 'Bearer ' + localstorage.get('token', '')})
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
		.withOption('responsive', true);
		
        $scope.dtColumns = [
            DTColumnBuilder.newColumn('id_deuda').withTitle('ID'),
            DTColumnBuilder.newColumn('codigo_cliente').withTitle('Codigo cliente'),
            DTColumnBuilder.newColumn('nombre_cliente').withTitle('Nombre cliente'),
			DTColumnBuilder.newColumn('fecha_vencimiento').withTitle('Fecha de vencimiento'),
			DTColumnBuilder.newColumn('tipo_pago').withTitle('Tipo de pago'),
			DTColumnBuilder.newColumn('monto_inicial').withTitle('Monto inicial'),
			DTColumnBuilder.newColumn('monto_actual').withTitle('Monto actual'),
			DTColumnBuilder.newColumn('fecha_ultimo_pago').withTitle('Fecha de ultimo pago').withClass('none'),
			DTColumnBuilder.newColumn('monto_ultimo_pago').withTitle('Monto de ultimo pago').withClass('none'),
			DTColumnBuilder.newColumn('estatus_deuda').withTitle('Estatus deuda').withClass('none'),
			DTColumnBuilder.newColumn('codigo_tipo_doc').withTitle('Código tipo doc').withClass('none'),
			DTColumnBuilder.newColumn('nombre_tipo_doc').withTitle('Nombre tipo doc').withClass('none')
        ];
	
	/*$('#deudas_table').DataTable( {
      dom: 'Bfrtip',
      buttons: [
          'copy', 'excel', 'pdf'
      ]
	});*/

   // $scope.getSaldo(1);

  }]);
