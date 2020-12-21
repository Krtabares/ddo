'use strict';

angular.module('app.deuda', ['datatables', 'datatables.buttons', 'datatables.bootstrap', 'ngRoute', 'ngNotify','cgNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/deuda', {
      templateUrl: 'comps/deuda/deuda.html',
      controller: 'deudaCtrl'
    });
  }])

  .controller('deudaCtrl', ['$scope', '$q', 'localstorage','$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify','notify', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify,notify, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {

      var ip = IP_SERVER_PYTHON;
      $scope.loading = false
      $scope.deuda = {};
      $scope.tabsIndex = 0
      $scope.tabs = 1
      $scope.listDeuda = [{}];
      $scope.hasUserClient = false;
      $scope.client = {};
      $scope.client_info = {}
      $scope.listFact = []
      $scope.response = {}
      $scope.aplica_corte = false
      $scope.listAvisos = [];


      $scope.nextStep = function () {
        $scope.goToTab($scope.tabsIndex + 1 );
      }

      $scope.goToTab = function (index) {
        if(index <= $scope.tabs )
          $scope.tabsIndex = index

      }
      $scope.vencimiento = []
      $scope.tieneReg = true
      $scope.getDeudas = function(){
        $scope.loading = true
        var body = {}
       body.pCLiente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
       body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
       body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;

         request.post(ip+'/procedure_deudas', body, {'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response.data)
            // var response = $scope.response
            // console.log(response)
            if(response.data.obj.length > 0 ){
              $scope.tieneReg = true
            }
            response.data.obj.forEach((item, i) => {

              if(item.aplica_corte=="S"){
                $scope.aplica_corte = true
                return
              }else{
                  $scope.listFact = response.data.obj;
                  return;
              }

            });
            // console.log($scope.listFact)
            if($scope.aplica_corte){

              $scope.listAvisos = {}
              //Recorremos el arreglo
              response.data.obj.forEach( x => {
                if( !$scope.listAvisos.hasOwnProperty(x.fecha_aviso)){
                  $scope.listAvisos[x.fecha_aviso] = {
                    facturas: [],
                    fecha_aviso: x.fecha_aviso,
                    docu_aviso: x.docu_aviso,
                    fecha_vencimiento: x.fecha_vencimiento,
                    saldo: 0
                  }
                }

                $scope.listAvisos[x.fecha_aviso].facturas.push(x)
                $scope.listAvisos[x.fecha_aviso].saldo += parseFloat(x.monto_actual)
              })

            }else{
              var aux = []
              var listDate = []
              response.data.obj.forEach( x => {
                if( !aux.hasOwnProperty(x.fecha_vencimiento)){
                  listDate.push(x.fecha_vencimiento)
                  aux[x.fecha_vencimiento] = {
                    fecha_vencimiento: x.fecha_vencimiento,
                    no_fisico : x.no_fisico,
                    saldo: 0,
                    saldo_usd:0

                  }
                }


                aux[x.fecha_vencimiento].saldo += parseFloat(x.monto_actual)
                aux[x.fecha_vencimiento].saldo_usd += parseFloat(x.monto_actual_usd)

              })

              listDate.forEach((item, i) => {
                console.log(item);
                $scope.vencimiento.push(aux[item])
              });


              console.log($scope.vencimiento);
            }

            // $scope.listDeuda = response.data.obj
            $scope.loading = false
         });
      }
      $scope.avisoAct = {}
      $scope.selectAviso=function (row) {

          $scope.listFact = row.facturas;
          $scope.avisoAct.fecha_aviso= row.fecha_aviso


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


      $scope.clientes = null;
      $scope.nombre_cliente = null;


      $scope.selectCLient = function(){

        // $scope.client = x
        if($scope.clientes.length > 0){
          $scope.client  = $scope.clientes[ $scope.clientIndex ];
            console.log($scope.client,"selectCLient" )
            $scope.getDeudas();
            angular.element('#clientes').focus();
        }


          // selectCLientCAP( $scope.client)

      }

      verificClient()

      function verificClient(){

       var client = localStorage.getItem('client')
       var client_info = localStorage.getItem('client_info')
       console.log(client)
        if ( client=='{}' ){
         $scope.hasUserClient = false;
       }else{
         $scope.hasUserClient = true;
         $scope.client = JSON.parse(client);
         $scope.client_info = JSON.parse(client_info);
         $scope.getDeudas();
       }
       console.log($scope.client_info)
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
      $scope.totales={
        'bolivares' : 0
      }
      function calcularTotales() {
        $scope.totales.bolivares = 0
        $scope.listDeuda.forEach(element => {

          $scope.totales.bolivares = parseFloat($scope.totales.bolivares)
                                         + (parseFloat(element.monto_actual))

        });
        console.log($scope.totales.bolivares)
        $scope.totales.bolivares = parseFloat($scope.totales.bolivares).toFixed(2)
      }


      $scope.getDeuda = function(param){
        console.log(param);
      }

    $scope.showDeuda = function(deuda){
      console.log(deuda);
      $scope.deuda = deuda;
    }


	$scope.listDeuda=[]
  $scope.dtOptions = DTOptionsBuilder.newOptions()
      .withPaginationType('full_numbers')
      .withOption('responsive', true)
      .withDOM('frtip').withPaginationType('full_numbers')
      .withLanguage(DATATABLE_LANGUAGE_ES)

  $scope.dtOptionsAviso = DTOptionsBuilder.newOptions()
      .withPaginationType('full_numbers')
      .withOption('responsive', true)
      .withDOM('frtip').withPaginationType('full_numbers')
      .withLanguage(DATATABLE_LANGUAGE_ES)

        $scope.dtColumns = [
            // DTColumnBuilder.newColumn('no_fisico').withTitle('N.º de documento'),
            // DTColumnBuilder.newColumn('fecha_vencimiento').withTitle('Fecha de vencimiento'),
            // DTColumnBuilder.newColumn('tipo_venta').withTitle('Tipo de venta'),
            // DTColumnBuilder.newColumn('monto_actual').withTitle('Monto actual'),
            // DTColumnBuilder.newColumn('estatus_deuda').withTitle('Estatus deuda').withClass('none'),
            // DTColumnBuilder.newColumn('codigo_tipo_doc').withTitle('Código tipo doc').withClass('none'),
            // DTColumnBuilder.newColumn('nombre_tipo_doc').withTitle('Nombre tipo doc')
            DTColumnBuilder.newColumn('no_fisico').withTitle('N.º de documento'),
            // DTColumnBuilder.newColumn('codigo_cliente').withTitle(''),
            // DTColumnBuilder.newColumn('nombre_cliente').withTitle(''),
            DTColumnBuilder.newColumn('tipo_venta').withTitle('Tipo venta'),
            DTColumnBuilder.newColumn('fecha_vencimiento').withTitle('Fecha vencimiento'),
            DTColumnBuilder.newColumn('monto_inicial').withTitle('Monto inicial'),
            DTColumnBuilder.newColumn('monto_actual').withTitle('Monto actual'),
            DTColumnBuilder.newColumn('fecha_ultimo_pago').withTitle('Fecha ultimo pago'),
            DTColumnBuilder.newColumn('monto_ultimo_pago').withTitle('Monto ultimo pago'),
            DTColumnBuilder.newColumn('estatus_deuda').withTitle('Estatus'),
            // DTColumnBuilder.newColumn('codigo_tipo_doc').withTitle('codio'),
            DTColumnBuilder.newColumn('nombre_tipo_doc').withTitle('Tipo documento'),
            DTColumnBuilder.newColumn('tipo_cambio').withTitle('Tipo cambio'),
            DTColumnBuilder.newColumn('fecha_aviso').withTitle('Fecha aviso'),
            DTColumnBuilder.newColumn('docu_aviso').withTitle('Documento aviso'),
            DTColumnBuilder.newColumn('serie_fisico').withTitle('Serie'),
            DTColumnBuilder.newColumn('fecha_documento').withTitle('Fecha documento')
        ];




	/*$('#deudas_table').DataTable( {
      dom: 'Bfrtip',
      buttons: [
          'copy', 'excel', 'pdf'
      ]
	});*/

   // $scope.getSaldo(1);

  }]);
