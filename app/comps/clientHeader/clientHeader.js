'use strict';

angular.module('app.headerClient', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])
.component("headerClient", {
    templateUrl: "comps/clientHeader/clientHeader.html",
    controller: 'clientHeaderCtrl',
    bindings: {
      cliente: "="
    }
  })

  .controller('clientHeaderCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, NgMap, $localStorage, $element) {


        // var test = mini;

        $scope.hasUserClient = false;
        $scope.user = {};
        $scope.client = {};
        $scope.client_info = {
          'limite_credito':0
        }
        // $scope.creditoClient.disp_bs_format = "0"
        $scope.dtInstance = {};
        var ip = IP_SERVER_PYTHON;

        $scope.clienteValido = true
        $scope.clientInvalidoMsg = null
        $scope.creditoClient = {
          disp_bs_format:"0"
        }
        $scope.inputClient = false;

        var $ctrl = this;
        var entrada = {}
        $ctrl.$onInit = function () {
          // $ctrl.cliente

          if($ctrl.cliente){
            $scope.inputClient = true;
            entrada =  $ctrl.cliente
          }

          verificClient()
        }

        $ctrl.onChanges = function (changes) {


          }
          $scope.creditoClient={}
          function getClientDispService(body) {
            //
            // $scope.loading = true
            request.post(ip+'/disponible_cliente', body,{})
            .then(function successCallback(response) {
              //

              $scope.creditoClient = response.data.obj


              $scope.creditoClient.disp_bs_format = (isNaN(parseFloat(response.data.obj.disp_bs)))? 0:parseFloat(response.data.obj.disp_bs)
              $scope.creditoClient.disp_usd_format = (isNaN(parseFloat(response.data.obj.disp_usd)))? 0 : parseFloat(response.data.obj.disp_usd)
              localstorage.set('creditoClient',  JSON.stringify($scope.creditoClient.disp_bs_format));
              $scope.loading = false

            }, function errorCallback(response) {
              //
              // $scope.loading = false
            });
          }


        function verificClient(){

            var client = localStorage.getItem('client')
            var client_info = localStorage.getItem('client_info')
            $scope.creditoClient = localStorage.getItem('creditoClient')


             if ( client=='{}' ){
                $scope.hasUserClient = false;

                if($scope.inputClient){
                  $scope.client_info = entrada
                  $scope.inputClient = true;

                }

            }else{
                $scope.hasUserClient = true;
                $scope.client_info = JSON.parse(client_info);
                $scope.client = JSON.parse(client);
                $scope.client_info.limite_credito = $scope.client.limite_credito = parseFloat($scope.client_info.limite_credito)
            }

            if (Object.keys($scope.client_info).length > 0) {
              var body = {}
              body.pCliente = $scope.client_info.cod_cliente
              body.pNoCia = $scope.client_info.cod_cia
              body.pNoGrupo =  $scope.client_info.grupo_cliente
              getClientDispService(body)
              validaClienteDDO(body)

            }
        }


        function validaClienteDDO(body) {
          console.log(body)
          request.post(ip+'/valida/client', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

              $scope.clienteValido = true
              $scope.clientInvalidoMsg = null


          }, function errorCallback(response) {
            if(response.status == 450){
              // ngNotify.set('¡Usuario inactivo!','error')
              $scope.clientInvalidoMsg = response.data.data[0]
              $scope.clienteValido = false
            }
          });
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
    }
  ]);
