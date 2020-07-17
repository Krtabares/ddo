'use strict';

angular.module('app.facturaP', ['datatables', 'datatables.buttons', 'datatables.bootstrap','ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])
  .config(['$routeProvider', function($routeProvider) {
  
    $routeProvider.when('/facturaP', {
      templateUrl: 'comps/facturaP/facturaP.html',
      controller: 'facturaPCtrl'
    });
  }])
  .controller('facturaPCtrl', ['$scope', '$q', 'localstorage', '$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {
        //init   
        
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

    }
]);