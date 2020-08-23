'use strict';

angular.module('app.pedidos', ['datatables', 'datatables.buttons', 'datatables.bootstrap','ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/pedidos', {
      templateUrl: 'comps/pedidos/pedidos.html',
      controller: 'pedidosCtrl'
    });
  }])
  .controller('pedidosCtrl', ['$scope', '$q', 'localstorage', '$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {
        //init
        $scope.pedido = {
            'fecha': new Date(),
            'pedido':[]
        };
        $scope.tabs = 1
        $scope.tabsIndex = 0
        $scope.editView = false;
        $scope.articulo = {};
        $scope.nombre_cliente = null;
        $scope.listaPedidos=[]
        $scope.busqueda_prod = null;
        $scope.clientes = null;
        $scope.client = {};
        $scope.client_info = {}
        $scope.ID = null
        $scope.clientIndex = -1;
        $scope.productos = null;
        $scope.product = {};
        $scope.productIndex = -1;

        var ip = "http://192.168.168.170:3500";
        //list pedido
        $scope.listPedido = [];

        $scope.nextStep = function () {
          $scope.goToTab($scope.tabsIndex + 1 );
        }

        $scope.goToTab = function (index) {
          if(index <= $scope.tabs )
            $scope.tabsIndex = index

        }

        $scope.initModal = function () {
          console.log("initmodal")
          $scope.ID = null
          $scope.reset()

          $(function(){
            $("#addPedidoModal").modal({
                backdrop: 'static',
                keyboard: false
            });
          })

        }

        $scope.validaTabs = function(tab) {
            switch (tab) {
              case 1:

                if (Object.keys($scope.client).length == 0) {
                  return false
                }
                if($scope.hasUserClient){
                  return false
                }
                break;
              default:

            }
        }

        $scope.nuevoTotal = function () {
          var total =  parseFloat($scope.totales.bolivares)
                                           + parseFloat($scope.articulo.PRECIO | 0 )* ($scope.articulo.CANTIDAD | 0  )
          return $scope.formato(2, total)
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

        $scope.editPedido= function(){
          if($scope.pedido.estatus_id >= 3){

            ngNotify.set('¡Este pedido no puede ser editado!','error')
            return
          }else{
            $scope.edit_pedido();
          }

        }

        $scope.showProductTable = false

        $scope.selectCLient = function(){

          // $scope.client = x
          if($scope.clientes.length > 0){
              var auxCli = $scope.clientes
              var auxCliIndex = $scope.clientIndex

              $scope.reset()

              $scope.clientes = auxCli
              $scope.clientIndex = auxCliIndex
              $scope.client  = $scope.clientes[ $scope.clientIndex ];

              $scope.showProductTable = true;

          }else {
            $scope.showProductTable = false
          }

            selectCLientCAP( $scope.client)
            $scope.getPedidos_filteringV2()

        }

        function selectCLientCAP(client){

            $scope.pedido.no_cia = (client.COD_CIA)?  client.COD_CIA : client.cod_cia ;
            $scope.pedido.grupo = (client.GRUPO_CLIENTE)? client.GRUPO_CLIENTE: client.grupo_cliente;
            $scope.pedido.no_cliente = (client.COD_CLIENTE)? client.COD_CLIENTE: client.cod_cliente;

            var body = {};
            body.pCliente = $scope.pedido.no_cliente
            body.pNoCia = $scope.pedido.no_cia
            body.pNoGrupo =  $scope.pedido.grupo
            getClientDispService(body)
            validaClienteDDO(body)

            console.log($scope.pedido, "pedido select" )

        }

        function listarPedidos(){
         var body = {}
           body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
           body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
           body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
           request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
             .then(function successCallback(response) {
               console.log(response.data)

               $scope.listaPedidos=response.data.data
               // defer.resolve(response.data.data);
            });

            request.post(ip+'/get/pedidosV2', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
              .then(function successCallback(response) {
                console.log(response.data)

                $scope.listaPedidosV2 = response.data.data.sort(function(a, b) {
                  var keyA = a.ID,
                    keyB = b.ID;
                  // Compare the 2 dates
                  if (keyA < keyB) return 1;
                  if (keyA > keyB) return -1;
                  return 0;
                });
             });

            // $scope.getPedidos_filteringV2()
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
            selectCLientCAP( $scope.client)
            $scope.showProductTable = true
         }

         listarPedidos()
         console.log($scope.client_info)


        }

        $scope.selectProduct = function(value = null){


           var index = (value!=null)? value:$scope.productIndex
            $scope.productIndex = index;
            $scope.product  = $scope.productos[ index ];
            $scope.articulo = $scope.product
            $scope.articulo.COD_PRODUCTO = $scope.product.cod_producto;
            $scope.articulo.PRECIO = $scope.product.precio_bruto_bs.replace(",", ".");
            $scope.articulo.precio_neto_usd = $scope.product.precio_neto_usd.replace(",", ".")
            $scope.articulo.existencia =$scope.product.existencia
            $scope.articulo.CANTIDAD = 1
            // $scope.articulo.no_cliente = $scope.client.cod_cliente
            angular.element('#btnProductInfo').trigger('click');
            console.log($scope.product )

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

            if(response.data.obj.length > 1){

              $scope.clientes = response.data.obj

            }else{
              ngNotify.set('¡No se encontraron resultados!', 'warn')
            }

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        function getClientService(body) {
          request.post(ip+'/procedure_clientes', body,{})
          .then(function successCallback(response) {
            console.log(response)

            if(response.data.obj.length > 0){

              $scope.client = response.data.obj[0]

            }else{
              ngNotify.set('¡No se encontraron resultados!', 'warn')
            }

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.finalizar_pedido =function () {
          var body = {}
          body.ID = $scope.ID
          request.post(ip+'/finalizar_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)

              $scope.getPedidos_filtering();
              $scope.getPedidos_filteringV2();
              ngNotify.set('¡Cerrado con exito! ', 'success')

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.edit_pedido =function () {
          var body = {}
          body.ID = $scope.ID
          request.post(ip+'/editar_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)

              $scope.getPedidos_filtering();
              $scope.getPedidos_filteringV2();
              $scope.editView = true
              $scope.pedido.estatus = response.data.estatus
              $scope.pedido.estatus_id = 1
              ngNotify.set('Pedido en construccion! ', 'success')
              $scope.mytimeout = $timeout($scope.onTimeout,1000);

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.creditoClient = {}
        $scope.clienteValido = true
        $scope.clientInvalidoMsg = null
        function validaClienteDDO(body) {
          console.log("validaClienteDDO");
          request.post(ip+'/valida/client', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response.data.data)

            if(response.data.data){
              $scope.clientInvalidoMsg = response.data.data[0]
              ngNotify.set($scope.clientInvalidoMsg,'warn')
              $scope.clienteValido = false
              $scope.tabsIndex = 0
              return;
            }
              $scope.clienteValido = true
              $scope.clientInvalidoMsg = null



          }, function errorCallback(response) {
            console.log(response)
          });
        }

        function getClientDispService(body) {
          console.log("getClientDispService");
          request.post(ip+'/disponible_cliente', body,{})
          .then(function successCallback(response) {
            console.log(response)

            $scope.creditoClient = response.data.obj
            $scope.creditoClient.disp_bs_format = parseFloat(response.data.obj.disp_bs)
            $scope.creditoClient.disp_usd_format = parseFloat(response.data.obj.disp_usd)

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.getProdNew = function (filter = false) {

          console.log("getProdNew");
          var body = {};
          // console.log($scope.client);

          if(filter){
            body.pNombre = $scope.nombre_cliente
            body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
            body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
            body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
            body.pBusqueda = $scope.busqueda_prod
          }
          // console.log(body, "body")
          request.post(ip+'/procedure_productos', body,{})
          .then(function successCallback(response) {
            // console.log(response)
            if(response.data.obj.length > 1){
              response.data.obj.forEach((item, i) => {

                item.precioFormatVE = item.precio_bruto_bs.replace(",", ".")
                item.precioFormatVE = $scope.formato(2,  parseFloat(item.precioFormatVE).toFixed(2) )
                // item.precio_neto_usd =
                item.precioFormatUSD = item.precio_neto_usd.replace(",", ".")
                item.precioFormatUSD = $scope.formato(3,  parseFloat(item.precioFormatUSD).toFixed(2) )

              });


              $scope.productos = response.data.obj

              $scope.refreshProduct()

            }else{
              ngNotify.set('¡No se encontraron resultados!', 'warn')
            }

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        var refreshCount = 0
        var stop

        $scope.refreshProduct = function() {

        refreshCount++

        if ( angular.isDefined(stop) ) return;

        stop = $interval(function() {
            if (refreshCount <= 3) {
              $scope.getProdNew(true)
              // console.log("recargo")
            } else {
              $scope.stopFight();
              // console.log("se detuvo")
            }
          }, 108000);
        };

        $scope.stopFight = function() {
        if (angular.isDefined(stop)) {
          $interval.cancel(stop);
          stop = undefined;
        }
      };

        $scope.closeModalProducts = function () {
          $scope.stopFight()
          $(function(){
            $("#modalproduct").modal("hide");
          })
        }

        $scope.openModalProducts = function () {
          $scope.busqueda_prod = null
          $scope.productIndex = -1
          $scope.productos = []
          $(function(){
            $("#modalproduct").modal({
                backdrop: 'static',
                keyboard: false
            });
          })
        }

        $scope.addPedido = function(){
          // console.log(pedido);
          var body = $scope.buildBody();
          request.post(ip+'/add/pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)
              $scope.reset();
              $scope.getPedidos_filtering();
              $scope.getPedidos_filteringV2();
              ngNotify.set('¡Pedido generado con exito!','success')
            /*if (response.data.exist) {
              ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
            } else if (response.data.email_flag) {
              ngNotify.set('¡Ya el correo está registrado!','error')
            }*/
            alert("Guardado con exito!")
          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.addPedidoV2 = function(){
          // console.log(pedido);
          var body = $scope.buildBody();
          request.post(ip+'/add/pedidoV2', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)
            $scope.ID = response.data.ID
            ngNotify.set('¡Pedido abierto con exito!','success')
            $scope.counter = 0;
            $scope.mytimeout = $timeout($scope.onTimeout,1000);
            // alert("Guardado con exito!")
          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.timeLimit = 599999
        $scope.counter = 0;
        $scope.onTimeout = function(){

            if($scope.counter > $scope.timeLimit){
              $scope.stop()
              if(!$scope.editView){
                $scope.delPedido()
              }

              $(function(){
                $("#addPedidoModal").modal("hide");
                $("#modalproduct").modal("hide");
                $("#modalInfoProduct").modal("hide");
              })
              window.location.href = "#!/";

              return;
            }

            $scope.counter= $scope.counter + 1000;

            $scope.mytimeout = $timeout($scope.onTimeout,1000);


        }

        // var mytimeout = $timeout($scope.onTimeout,1000);
        $scope.mytimeout = null

        $scope.stop = function(){
          console.log("stop");
            $timeout.cancel($scope.mytimeout);
        }

        $scope.msToTime =  function(s) {
          var ms = s % 1000;
          s = (s - ms) / 1000;
          var secs = s % 60;
          s = (s - secs) / 60;
          var mins = s % 60;
          var hrs = (s - mins) / 60;

          return hrs + ':' + mins + ':' + secs;
        }

        $scope.addDetalleProducto = function(articulo){
          // console.log(pedido);
          var body = {};

          body.pedido = articulo
          // if(!$scope.ID){
          //   $scope.addPedidoV2()
          // }
          body.ID = $scope.ID
          request.post(ip+'/add/detalle_producto', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)
            $scope.getPedidos_filtering();
            $scope.getPedidos_filteringV2();
            $scope.getProdNew(true);
            if(response.data.reserved < articulo.CANTIDAD && 1==2){
              articulo.CANTIDAD = response.data.reserved
              articulo.alert = true
            }else{
              articulo.alert = false
            }
            $scope.pedido.pedido.push(articulo)
            calcularTotales()

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.removeDetalleProducto = function(i){
          // console.log(pedido);
          var body = {};

          body.COD_PRODUCTO = $scope.pedido.pedido[i].COD_PRODUCTO;
          body.id_pedido = $scope.ID
          request.post(ip+'/del/detalle_producto', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)
            // $scope.getPedidos_filtering();
            $scope.getPedidos_filteringV2();
            $scope.getProdNew(true)
            $scope.removeArt(i)

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.updPedido = function(){
          // console.log(pedido);
          if(!validaCreditoContraTotal()){
            ngNotify.set('¡El precio excede el credito disponible!','error')
            return;
          }
          var body = $scope.buildBody();
          body.ID = $scope.ID
          request.post(ip+'/upd/pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)
              $scope.reset();
              $scope.getPedidos_filtering();
              $scope.getPedidos_filteringV2();
              ngNotify.set('¡Pedido actualizado con exito!','success')
          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.delPedido = function(){
          // console.log(pedido);
          var body = $scope.buildBody();
          body.ID = $scope.ID
          request.post(ip+'/del/pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)
              $scope.reset();
              $scope.getPedidos_filtering();
              $scope.getPedidos_filteringV2();
              $scope.ID = null;
              ngNotify.set('¡Pedido eliminado con exito!','success')
          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.confirmModal = function (ID) {
          $scope.ID = ID
        }

        $scope.addArtPedido = function(){
            console.log($scope.pedido.pedido);
            if(Object.keys($scope.articulo).length === 0)
              return

            var existe = false;
            $scope.pedido.pedido.forEach(element => {
              if($scope.articulo.COD_PRODUCTO == element.COD_PRODUCTO){
                //  element.CANTIDAD = element.CANTIDAD + $scope.articulo.CANTIDAD;
                 existe = true;
                return
              }
            });
            var error=false;
            if(!existe){

              if(isEmpty( $scope.articulo.COD_PRODUCTO )){
                console.log('¡Complete todos los campos!COD_PRODUCT',isEmpty( $scope.articulo.COD_PRODUCTO ))
                error = true;
              }
               if( isEmpty($scope.articulo.CANTIDAD ) || $scope.articulo.CANTIDAD < 1 ){
                console.log('¡Complete todos los campos!CANTIDAD','error')
                // alert("Por favor verifique la cantidad")
                ngNotify.set('¡Por favor verifique la cantidad!','error')
                error = true;
              }

              console.log("$scope.articulo.CANTIDAD", $scope.articulo.CANTIDAD);
              console.log(" $scope.articulo.existencia",  $scope.articulo.existencia);
               if( $scope.articulo.CANTIDAD > parseInt($scope.articulo.existencia)  ){
                  ngNotify.set('¡La cantidad no puede ser mayor a la existencia!','error')
                 error = true;
              }
              console.log($scope.articulo,"$scope.articulo")

              if( !validaCreditoContraProducto((parseFloat($scope.articulo.precio_bruto_bs)+parseFloat($scope.articulo.iva_bs)) * $scope.articulo.CANTIDAD)  ){
                 ngNotify.set('¡El precio excede el credito disponible!','error')
                error = true;
             }


              $scope.articulo.PRECIO = $scope.articulo.PRECIO.replace(",", ".");
              // $scope.articulo.PRECIO = parseFloat($scope.articulo.PRECIO).toFixed(2);

              console.log($scope.articulo.PRECIO);
              if(!error){
                $scope.addDetalleProducto($scope.articulo)
                calcularTotales()
                $(function(){
                  $("#modalInfoProduct").modal('hide');
                })
                ngNotify.set('¡Producto agregado al pedido!','success')
              }
            }

            if(!error){
              $scope.articulo = {};
              $scope.productIndex = -1
              // $scope.productos = [];
              $scope.product = {}
              $scope.counter = 0;
            }


        }

        function isEmpty(str) {
            return (!str || 0 === str.length);
        }

        $scope.buildBody = function(){

          var fecha = new Date( $scope.pedido.fecha)
          console.log($scope.pedido.pedido)
          var aux = $scope.pedido.pedido
          aux.forEach(element => {

            element.PRECIO = parseFloat(element.PRECIO).toFixed(2)

          });

          var body= {}
          body.cod_cia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
          body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;

          var body = {
            // "totales" : $scope.totales,
            "COD_CIA": body.cod_cia,
            "GRUPO_CLIENTE": body.pNoGrupo,
            "COD_CLIENTE": body.pCliente,
            "FECHA": fecha.getDate()+"-"+ (fecha.getMonth()+1) +"-"+ fecha.getFullYear(),
            "NO_PEDIDO_CODISA":($scope.editView)? $scope.pedido.no_factu:"---",
            "OBSERVACIONES": $scope.pedido.observacion || "",
            "ESTATUS": "0",
            "pedido": aux
          }
          console.log(body,"body")
          return body
        }

        $scope.reset = function(){
          $scope.counter = 0;
          $scope.tabsIndex = 0
          $scope.totales.bolivares = 0
          $scope.totales.USD = 0
          $scope.totales.bsIVA = 0
          $scope.totales.USDIVA = 0
          $scope.totales.bsConIva = 0
          $scope.totales.UsdConIva = 0
          $scope.busqueda_prod = null
          $scope.productIndex = -1
          $scope.clientes = null
          $scope.clientIndex = -1
          $scope.nombre_cliente = null
          $scope.productos = []
          $scope.pedido = {'no_cia':'',
                'grupo':'',
                'no_cliente':'',
                'no_factu':'',
                'no_arti':'',
                'cantidad':'',
                'precio':'',
                'fecha':new Date(),
                            'observacion':'',
                            'pedido':[],
                        };
          if(!$scope.hasUserClient){
            $scope.clienteValido = true
            $scope.creditoClient = {}
          }
        }

        $scope.getPedidos = function(page){
          var obj = {'page': page};
		  // console.log($localStorage.token);
          request.post(ip+'/get/pedidos', obj,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response.data)
            if(response.data.data.length > 0){
              $scope.listaPedidos = response.data.data;
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


        $scope.getPedido = function(ID){
          var obj = {'idPedido': ID};
          $scope.ID = ID
      // console.log($localStorage.token);
          request.post(ip+'/get/pedido', obj, {'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response.data)

            var body = {};
            if(!$scope.hasUserClient){
              body.pCliente = response.data.obj[0].no_cliente
              getClientService(body)
              $scope.showProductTable = true
              body.pNoCia = response.data.obj[0].no_cia
              body.pNoGrupo = response.data.obj[0].grupo
              getClientDispService(body)
              validaClienteDDO(body)
            }

            $scope.showPedido(response.data.obj[0])
            /*if (response.data.exist) {
              ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
            } else if (response.data.email_flag) {
              ngNotify.set('¡Ya el correo está registrado!','error')
            }*/
          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.getPedidos_filtering = function(no_client){

          // var body = {}
          // body.pCliente = $scope.client.COD_CLIENTE
          // request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          // .then(function successCallback(response) {
          //   console.log(response.data)
          //
          //     $scope.listaPedidos = response.data.data;
          //
          // }, function errorCallback(response) {
          //   console.log(response)
          // });
        }
        $scope.listaPedidosV2=[]
        $scope.getPedidos_filteringV2 = function(no_client){

          var body = {}
          body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
          body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
          request.post(ip+'/get/pedidosV2', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          .then(function successCallback(response) {
            console.log(response.data)

            $scope.listaPedidosV2 = response.data.data.sort(function(a, b) {
              var keyA = a.ID,
                keyB = b.ID;
              // Compare the 2 dates
              if (keyA < keyB) return 1;
              if (keyA > keyB) return -1;
              return 0;
            });

              // $scope.listaPedidosV2 = response.data.data;

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.showPedido = function(pedido){
          console.log(pedido);

          $scope.editView = false;
          // pedido.fecha = new Date(pedido.fecha);
          pedido.pedido.forEach((item, i) => {

            // pedido.totales.productos.forEach((element, i) => {
            //   if(item.COD_PRODUCTO == element.COD_PRODUCTO){
                item.iva_bs = item.iva_bs.replace(",", ".")
                item.iva_usd = item.iva_usd.replace(",", ".")
                item.precio_neto_usd = item.precio_neto_usd.replace(",", ".")
                item.PRECIO = item.PRECIO.replace(",", ".")
                // item.nombre_producto = element.nombre_producto
              // }
            // });

          });




          $scope.pedido = pedido;


          // $scope.totales = pedido.totales

          calcularTotales(1)
        }

        $scope.removeArt = function(i){

          // console.log($scope.pedido.pedido[i].COD_PRODUCTO)


          if($scope.pedido.totales)
            $scope.pedido.totales.productos.forEach((item, index) => {
              if(item.COD_PRODUCTO == $scope.pedido.pedido[i].COD_PRODUCTO){
                $scope.pedido.totales.bsConIva = $scope.pedido.totales.bsConIva - item.iva_bs
                $scope.pedido.totales.UsdConIva = $scope.pedido.totales.UsdConIva - item.iva_usd
              }
            });

          $scope.pedido.pedido.splice( i, 1 );

          calcularTotales(1)
        }

        $scope.totales = {
          'bolivares':0,
          'USD':0,
          'bsIVA':0,
          'USDIVA':0,
          'bsConIva':0,
          'UsdConIva':0
        }

        function calcularTotales(type = 0) {

            $scope.totales.bolivares = 0
            $scope.totales.USD = 0
            $scope.totales.bsIVA = 0
            $scope.totales.USDIVA = 0
            console.log($scope.pedido.pedido)
            $scope.pedido.pedido.forEach(element => {

              $scope.totales.bolivares = parseFloat($scope.totales.bolivares)
                                             + (parseFloat(element.PRECIO) * element.CANTIDAD)
              $scope.totales.USD = parseFloat($scope.totales.USD)
                                            + (parseFloat(element.precio_neto_usd) * element.CANTIDAD)


                $scope.totales.bsIVA = parseFloat($scope.totales.bsIVA)
                + (parseFloat(element.iva_bs) * element.CANTIDAD)



                $scope.totales.USDIVA = parseFloat($scope.totales.USDIVA)
                + (parseFloat(element.iva_usd) * element.CANTIDAD)


            });

          $scope.totales.bolivares = parseFloat($scope.totales.bolivares)
          $scope.totales.USD = parseFloat($scope.totales.USD)
          $scope.totales.bsIVA = parseFloat($scope.totales.bsIVA)
          $scope.totales.USDIVA = parseFloat($scope.totales.USDIVA)
          $scope.totales.bsConIva = parseFloat($scope.totales.bolivares + $scope.totales.bsIVA)
          $scope.totales.UsdConIva = parseFloat($scope.totales.USD + $scope.totales.USDIVA)


          console.log($scope.totales)
        }

        function validaCreditoContraProducto(valor) {
          // console.log(valor);
          // console.log($scope.creditoClient.disp_bs_format - valor);
          if(($scope.creditoClient.disp_bs_format - $scope.totales.bsConIva - valor) > 0){
            return true
          }else{
            return false
          }

        }

        function validaCreditoContraTotal() {
          if(($scope.creditoClient.disp_bs_format - $scope.totales.bsConIva) > 0){
            return true
          }else{
            return false
          }
        }

        $scope.formatDate = function(date) {
          date = new Date(date);
             return date.getFullYear()+'-' + (date.getMonth()+1) + '-'+date.getDate();
        }

        $scope.dtOptions = DTOptionsBuilder.newOptions()
            .withPaginationType('full_numbers')
            .withOption('responsive', true)
            .withDOM('frtip').withPaginationType('full_numbers')
        // .withDisplayLength(2);
        // $scope.dtInstanceProd = {};
        $scope.dtOptionsProd = DTOptionsBuilder.newOptions()
            .withPaginationType('full_numbers')
            .withOption('responsive', true)
            .withDOM('frtip').withPaginationType('full_numbers')


        $scope.dtColumns = [
            DTColumnBuilder.newColumn('no_cia').withTitle('Número cia'),
            DTColumnBuilder.newColumn('grupo').withTitle('Grupo'),
            DTColumnBuilder.newColumn('no_cliente').withTitle('Número cliente'),
            DTColumnBuilder.newColumn('no_factu').withTitle('Número factura'),
            DTColumnBuilder.newColumn('estatus').withTitle('Estatus'),
            DTColumnBuilder.newColumn('precio').withTitle('Precio'),
            DTColumnBuilder.newColumn('cantidad').withTitle('Cantidad de Productos')
        ];


    }
]);
