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

        console.log("clientHeaderCtrl entro")
        // var test = mini;

        $scope.hasUserClient = false;
        $scope.user = {};
        $scope.client = {};
        $scope.client_info = {}
        $scope.dtInstance = {};
        var ip = "http://192.168.168.170:3500";

        $scope.clienteValido = true
        $scope.clientInvalidoMsg = null
        $scope.creditoClient = null
        $scope.inputClient = false;

        var $ctrl = this;
        var entrada = {}
        $ctrl.$onInit = function () {
          // $ctrl.cliente
          console.log($ctrl.cliente);
          if($ctrl.cliente){
            $scope.inputClient = true;
            entrada =  $ctrl.cliente
          }

          verificClient()
        }

        $ctrl.onChanges = function (changes) {
          console.log("esto es lo que cambio",obj);

          }
          $scope.creditoClient={}
          function getClientDispService(body) {
            // console.log("getClientDispService");
            // $scope.loading = true
            request.post(ip+'/disponible_cliente', body,{})
            .then(function successCallback(response) {
              // console.log(response)

              $scope.creditoClient = response.data.obj
              $scope.creditoClient.disp_bs_format = parseFloat(response.data.obj.disp_bs)
              $scope.creditoClient.disp_usd_format = parseFloat(response.data.obj.disp_usd)
              localstorage.set('creditoClient',  JSON.stringify($scope.creditoClient.disp_bs_format));
              $scope.loading = false

            }, function errorCallback(response) {
              // console.log(response)
              // $scope.loading = false
            });
          }


        function verificClient(){

            var client = localStorage.getItem('client')
            var client_info = localStorage.getItem('client_info')
            $scope.creditoClient = localStorage.getItem('creditoClient')
            console.log(client)
            console.log( client=='{}'  )
             if ( client=='{}' ){
                $scope.hasUserClient = false;
                console.log($scope.inputClient);
                if($scope.inputClient){
                  $scope.client_info = entrada
                  $scope.inputClient = true;
                  console.log($scope.client_info);
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
              // ngNotify.set($scope.clientInvalidoMsg,'warn')
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
