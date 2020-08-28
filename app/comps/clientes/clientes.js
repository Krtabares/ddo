'use strict';

angular.module('app.clientes', ['datatables', 'datatables.buttons', 'datatables.bootstrap', 'ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/clientes', {
      templateUrl: 'comps/clientes/clientes.html',
      controller: 'clientesCtrl'
    });
  }])

  .controller('clientesCtrl', ['$scope', '$q', '$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {

      var ip = "http://192.168.168.170:3500";
      $scope.deuda = {};
      $scope.listDeuda = [{}];

	$scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
         request.post(ip+'/procedure_clientes', {'page': 1}, {'Authorization': 'Bearer ' + localstorage.get('token', '')})
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
		// .withOption('responsive', true);

        $scope.dtColumns = [


            // DTColumnBuilder.newColumn('nombre_cia').withTitle('Cliente'),
            DTColumnBuilder.newColumn('cod_cliente').withTitle('Codigo'),
            DTColumnBuilder.newColumn('nombre_cliente').withTitle('Nombre'),
            DTColumnBuilder.newColumn('docu_identif_cliente').withTitle('Documento de identificación'),
            DTColumnBuilder.newColumn('direccion_cliente').withTitle('Direccion'),
            // DTColumnBuilder.newColumn('cod_cia').withTitle('Código Cia'),
            /*DTColumnBuilder.newColumn('nombre_cia').withTitle('Nombre Cia'),*/
            // DTColumnBuilder.newColumn('grupo_cliente').withTitle('Grupo del cliente'),
            DTColumnBuilder.newColumn('nombre_encargado').withTitle('Nombre del encargado').withClass('none'),
            // DTColumnBuilder.newColumn('nom_grupo_cliente').withTitle('Nombre de grupo del cliente').withClass('none'),
            DTColumnBuilder.newColumn('telefono1').withTitle('telefono1').withClass('none'),
            // DTColumnBuilder.newColumn('telefono2').withTitle('telefono2').withClass('none'),
            // DTColumnBuilder.newColumn('telefono3').withTitle('telefono3').withClass('none'),
            // DTColumnBuilder.newColumn('telefono4').withTitle('telefono4').withClass('none'),
            DTColumnBuilder.newColumn('email1').withTitle('email1').withClass('none'),
            // DTColumnBuilder.newColumn('email2').withTitle('email2').withClass('none'),
            // DTColumnBuilder.newColumn('email3').withTitle('email3').withClass('none'),
            // DTColumnBuilder.newColumn('email4').withTitle('email4').withClass('none'),
            DTColumnBuilder.newColumn('v_persona_cyc').withTitle('Credito y cobranzas').withClass('none')
        ];


  }]);
