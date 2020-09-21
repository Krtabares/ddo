'use strict';

angular.module('app.headerClient', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])
.component("headerClient", {
    templateUrl: "comps/clientHeader/clientHeader.html",
    controller: 'clientHeaderCtrl'
  })

  .controller('clientHeaderCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, NgMap, $localStorage) {

        console.log("clientHeaderCtrl entro")

        $scope.hasUserClient = false;
        $scope.user = {};
        $scope.client = {};
        $scope.client_info = {}
        $scope.dtInstance = {};
        var ip = "http://192.168.168.170:3500";

        $scope.clienteValido = true
        $scope.clientInvalidoMsg = null
        $scope.creditoClient = null
        verificClient()

        function verificClient(){

            var client = localStorage.getItem('client')
            var client_info = localStorage.getItem('client_info')
            $scope.creditoClient = localStorage.getItem('creditoClient')
            console.log(client)
            console.log( client=='{}'  )
             if ( client=='{}' ){
                $scope.hasUserClient = false;
            }else{
                $scope.hasUserClient = true;
                $scope.client_info = JSON.parse(client_info);
                $scope.client = JSON.parse(client);
                $scope.client_info.limite_credito = $scope.client.limite_credito = parseFloat($scope.client_info.limite_credito)
                var body = {}
                body.pCliente = $scope.client_info.cod_cliente
                body.pNoCia = $scope.client_info.cod_cia
                body.pNoGrupo =  $scope.client_info.grupo_cliente

                validaClienteDDO(body)


            }
        }


        function validaClienteDDO(body) {
          console.log("validaClienteDDO");
          request.post(ip+'/valida/client', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response.data.data)

            // $scope.creditoClient = response.data.obj
            // $scope.creditoClient.disp_bs_format = parseFloat(response.data.obj.disp_bs)
            // $scope.creditoClient.disp_usd_format = parseFloat(response.data.obj.disp_usd)
            if(!response.data.data && !response.data.data[0]){
              $scope.clienteValido = true
              $scope.clientInvalidoMsg = null
            }else{
              $scope.clientInvalidoMsg = response.data.data[0]
              ngNotify.set($scope.clientInvalidoMsg,'warn')
              $scope.clienteValido = false
              $scope.tabsIndex = 0
              return;
            }

          }, function errorCallback(response) {
            console.log(response)
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
