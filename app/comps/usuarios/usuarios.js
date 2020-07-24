'use strict';

angular.module('app.usuarios', ['datatables', 'datatables.buttons', 'datatables.bootstrap','ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/usuarios', {
      templateUrl: 'comps/usuarios/usuarios.html',
      controller: 'usuariosCtrl'
    });
  }])

  .controller('usuariosCtrl', ['$scope', 'localstorage', '$q', '$rootScope', 'DTOptionsBuilder', 'DTColumnBuilder', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'NgMap','$localStorage',
    function($scope, localstorage, $q, $rootScope, DTOptionsBuilder, DTColumnBuilder, $routeParams, $interval, $timeout, ngNotify, request, NgMap, $localStorage) {

      $scope.array_user = [];
      $scope.user = {};
      $scope.user_view = {};
      $scope.type_user = [{'id': 1, type : "vendedor"},{'id': 2, type : "cliente"}];
      var ip = "http://192.168.168.170:3500";
      $scope.nombre_cliente = null;
      $scope.client = {};
      $scope.client_info = {};
      $scope.hasClient = false;
      $scope.clientes=[];
      verificClient()

      function verificClient(){

       var client = localStorage.getItem('client')
       var client_info = localStorage.getItem('client_info')
       console.log(client)
        if ( client=='{}' ){
         $scope.hasClient = false;
       }else{
         $scope.hasClient = true;
         $scope.client_info = JSON.parse(client_info);
         $scope.client = JSON.parse(client);

       }
       console.log($scope.client)
     }

     $scope.selectCLient = function(){
       console.log($scope.client )
       // $scope.client = x
         $scope.client  = $scope.clientes[ $scope.clientIndex ];
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

      $scope.addUser = function(user){
      user.password = "ddo.2017";
      if($scope.hasClient){
        user.COD_CIA = $scope.client.COD_CIA
        user.GRUPO_CLIENTE = $scope.client.GRUPO_CLIENTE
        user.COD_CLIENTE = $scope.client.COD_CLIENTE
      }
      console.log(user);
      // request.post(ip+'/add/user', user,{})
      //     .then(function successCallback(response) {
      //       console.log(response)
      //       if (response.data == "OK") {
			//   $scope.initDatatable();
      //         ngNotify.set('¡Usuario registrado exitosamente!','success')
      //       } else if (response.data.email_flag) {
      //         //ngNotify.set('¡Ya el correo está registrado!','error')
      //       }
      //     }, function errorCallback(response) {
      //       console.log(response)
      //     });
      }

        $scope.listUser = function(){
          request.get(ip+'/get/user', {})
          .then(function(data){
            console.log(data);
            $scope.array_user = data.data;

          }, function(error){
            console.log(error);
          })
        }

        $scope.showUser = function(user){
          $scope.user_view = user;
        }

		$scope.initDatatable = function(){
		$scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();

        request.post(ip+'/get/user', {'page': 1}, {'Authorization': 'Bearer ' + localstorage.get('token')})
          .then(function successCallback(response) {
            console.log(response)
			defer.resolve(response.data);
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

		$scope.initDatatable();

        $scope.dtColumns = [
            DTColumnBuilder.newColumn('name').withTitle('Nombre'),
            DTColumnBuilder.newColumn('username').withTitle('Username'),
            DTColumnBuilder.newColumn('role').withTitle('Tipo de usuario')
        ];

        //$scope.listUser();


    }]);
