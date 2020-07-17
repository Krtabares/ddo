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
         if( client ==  null){
           $scope.hasClient = false;
         }else{
           $scope.hasClient = true;
           $scope.client = JSON.parse(client);
         } 
         console.log($scope.client)
       }


        $scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
          var defer = $q.defer();
          var body = {}
          body.pNoCia = $scope.client.COD_CIA
          body.pNoGrupo = $scope.client.GRUPO_CLIENTE
          body.pCliente = $scope.client.COD_CLIENTE
           request.post(ip+'/procedure_facturacion', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
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

    }
]);