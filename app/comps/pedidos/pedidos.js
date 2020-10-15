'use strict';

angular.module('app.pedidos', ['datatables', 'datatables.buttons', 'datatables.bootstrap','ngRoute', 'ngNotify','cgNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/pedidos', {
      templateUrl: 'comps/pedidos/pedidos.html',
      controller: 'pedidosCtrl'
    });
  }])
  .controller('pedidosCtrl', ['$scope', '$q', 'localstorage', '$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify','notify', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, notify, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {
        //init


        $scope.loading = true
        $scope.pedido = {
            'fecha': null,
            'pedido':[]
        };
        $scope.tabs = 2
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
        $scope.infoPsico = false;
        $scope.totalesDdo = {"total_bruto":"0","desc_volumen":"0","otros_descuentos":"0","desc_adicional":"0","desc_dpp":"0","sub_total":"0","impuesto":"0","total":"0"        }
        $scope.tipoBusqueda = 0


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
          // console.log("initmodal")
          $scope.ID = null
          $scope.reset()
          $scope.tabsIndex = 1
          var body={}
          body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
          body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;

          getClientDispService(body)

          $(function(){
            $("#addPedidoModal").modal({
                backdrop: 'static',
                keyboard: false
            });
          })

        }
        $scope.unicOrderID = null
        $scope.oneOrder = function(){
          $scope.unicOrderID = null
          $scope.listaPedidosV2.forEach((item, i) => {

              if( item.cod_estatus == 0  ){
                $scope.unicOrderID = item.ID
                return
              }else if( item.cod_estatus == 1  ){
                $scope.unicOrderID = item.ID
                return
              }else if( item.cod_estatus == 2  ){
                $scope.unicOrderID = item.ID
                return
              }
          });

          console.log($scope.unicOrderID);

        }


        $scope.modalDynTitle = null;
        $scope.modalDynMsg = null;
        $scope.modalDynContext = null;
        $scope.modalDynContextId = null;
        $scope.modalDynColor = null;

        $scope.aceptModalDyn = function () {

          switch ($scope.modalDynContext) {
            case 0,4:
                if($scope.totales.bsConIva > $scope.client.monto_minimo){
                  $scope.finalizar_pedido()
                  $(function(){
                    $("#addPedidoModal").modal("hide");
                    $("#showPedidoModal").modal("hide");
                    $('.modal-backdrop').remove();
                  })
                }else{
                  // ngNotify.set('¡Para realizar un pedido el monto total debe ser mayor a ' + $scope.formato(2, $scope.client.monto_minimo ),'warn')

                  notify({ message:'¡Para realizar un pedido el monto total debe ser mayor a ' + $scope.formato(2, $scope.client.monto_minimo ), position:'right', duration:10000, classes:'alert-warning'});
                }
              break;
              case 3:
                $scope.removeDetalleProducto($scope.modalDynContextId);
                break;
            default:

          }

        }

        $scope.cancelModalDyn = function() {
          switch ($scope.modalDynContext) {
            case 0:

              break;
            default:

          }
        }


        $scope.openModalDyn = function(type, contextId) {

          if(type == 0 && $scope.tipoPedido == "N" ){
            $scope.openModalDyn(4, contextId);
            return
          }
          $scope.modalDynTitle = $scope.typeContext[type].title;
          $scope.modalDynMsg = $scope.typeContext[type].msg;
          $scope.modalDynContext = type;
          $scope.modalDynContextId = contextId;
          $scope.modalDynColor = $scope.typeContext[type].color;

          $(function(){
            $("#modalConfirmDynamic").modal({
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
                                           + parseFloat($scope.articulo.precio_bruto | 0 )* ($scope.articulo.CANTIDAD | 0  )
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

            // ngNotify.set('¡Este pedido no puede ser editado!','error')
            notify({ message:'¡Este pedido no puede ser editado!', position:'right', duration:10000, classes:'alert-danger'});
            return
          }else{

            var body = {}
            body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
            body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
            body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
            getClientDispService(body)


            console.log($scope.creditoClient);

            $scope.edit_pedido();

            //// TODO:
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
            angular.element('#clientes').focus();
        }

        function selectCLientCAP(client){

            $scope.pedido.no_cia = (client.COD_CIA)?  client.COD_CIA : client.cod_cia ;
            $scope.pedido.grupo = (client.GRUPO_CLIENTE)? client.GRUPO_CLIENTE: client.grupo_cliente;
            $scope.pedido.no_cliente = (client.COD_CLIENTE)? client.COD_CLIENTE: client.cod_cliente;

            var body = {};
            body.pCliente = $scope.pedido.no_cliente
            body.pNoCia = $scope.pedido.no_cia
            body.pNoGrupo =  $scope.pedido.grupo
            // getClientDispService(body)
            validaClienteDDO(body)


            // console.log($scope.pedido, "pedido select" )

        }

        function listarPedidos(){
          $scope.loading = true
         var body = {}
           body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
           body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
           body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
           request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
             .then(function successCallback(response) {
               // console.log(response.data)

               $scope.listaPedidos=response.data.data
               // defer.resolve(response.data.data);
            });

            request.post(ip+'/get/pedidosV2', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
              .then(function successCallback(response) {
                // console.log(response.data)

                $scope.listaPedidosV2 = response.data.data.sort(function(a, b) {
                  var keyA = a.ID,
                    keyB = b.ID;
                  // Compare the 2 dates
                  if (keyA < keyB) return 1;
                  if (keyA > keyB) return -1;
                  return 0;
                });

                $scope.oneOrder();
                $scope.loading = false
             });

            // $scope.getPedidos_filteringV2()
        }

        verificClient()

        function verificClient(){

         var client = localStorage.getItem('client')
         var client_info = localStorage.getItem('client_info')
         // console.log(client)
          if ( client=='{}' ){
           $scope.hasUserClient = false;
         }else{
           $scope.hasUserClient = true;
           $scope.client = JSON.parse(client);
           $scope.client_info = JSON.parse(client_info);
           $scope.client.monto_minimo = parseFloat($scope.client_info.monto_minimo)
           $scope.client.monto_min_pick = $scope.client_info.monto_min_pick

           selectCLientCAP( $scope.client_info)
           $scope.showProductTable = true
         }

         listarPedidos()
         // console.log($scope.client_info)


        }

        $scope.selectProduct = function(value = null){
          //TODO




           var index = (value!=null)? value:$scope.productIndex
            $scope.productIndex = index;
            $scope.product  = $scope.productos[ index ];
            $scope.articulo = $scope.product

            var existe = false;
            var cantidadAux = 0;
            $scope.pedido.pedido.forEach((element,i) => {
              console.log($scope.articulo);
              if($scope.articulo.cod_producto == element.COD_PRODUCTO || $scope.articulo.COD_PRODUCTO == element.COD_PRODUCTO ){
                existe = true;
                console.log("existe", existe);
                cantidadAux = parseInt(element.CANTIDAD)
                return
              }
            });

            $scope.articulo.COD_PRODUCTO = $scope.product.cod_producto;
            $scope.articulo.precio_bruto = $scope.product.precio_bruto_bs.replace(",", ".");
            $scope.articulo.precio_neto_usd = parseFloat($scope.product.precio_neto_usd.replace(",", "."))
            $scope.articulo.precio_neto_bs = $scope.product.precio_neto_bs.replace(",", ".")
            $scope.articulo.existencia =$scope.product.existencia

            if(!existe){

              $scope.articulo.CANTIDAD = 1
              // $scope.articulo.no_cliente = $scope.client.cod_cliente
            }else{
              $scope.articulo.CANTIDAD = cantidadAux
            }
            angular.element('#btnProductInfo').trigger('click');
            console.log($scope.product )

        }
        $scope.tipoBusquedaCliente = 0
        $scope.getClientNew = function (filter = false) {
          // console.log("getClientNew");
          $scope.listaPedidosV2 = []
          $scope.loading = true
          var body = {};
          if(filter){
            body.pNombre = $scope.nombre_cliente
          }
          body.pNoCia = "01";
          body.pNoGrupo = ($scope.tipoBusquedaCliente != 0)? "02": "01";

          request.post(ip+'/procedure_clientes', body,{})
          .then(function successCallback(response) {
            // console.log(response)
            $scope.clientes = null
            $scope.clientIndex = null
            $scope.showProductTable = null
            $scope.loading = false

            if(response.data.obj.length > 0){

              $scope.clientes = response.data.obj
              // $scope.clientes = null
              // $scope.clientIndex = -1
              // $scope.nombre_cliente = null

            }else{
              notify({ message:'¡No se encontraron resultados!', position:'right', duration:10000, classes:'alert-warning'});

            }



          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }

        function getClientService(body) {
          $scope.loading = true
          request.post(ip+'/procedure_clientes', body,{})
          .then(function successCallback(response) {
            // console.log(response)
              $scope.loading = false
            if(response.data.obj.length > 0){

              $scope.client = response.data.obj[0]

            }else{
              notify({ message:'¡No se encontraron resultados!', position:'right', duration:10000, classes:'alert-warning'});
            }

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }

        $scope.finalizar_pedido = function () {

          // if($scope.tipoPedido != "D"){
          //
          //   notify({ message:'¡Si no alcanza dicho monto su pedido se procesa como Normal!', position:'right', duration:10000, classes:'alert-warning'});
          // }

          $scope.loading = true
          var body = {}
          body.ID = $scope.ID
          body.tipoPedido = $scope.tipoPedido
          request.post(ip+'/finalizar_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response)

              //$scope.getPedidos_filtering();
              $scope.loading = false
              $scope.stopTimeout()
              $scope.getPedidos_filteringV2();
              notify({ message:'¡Cerrado con exito!', position:'right', duration:10000, classes:'alert-success'});

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }

        $scope.edit_pedido =function () {
          $scope.loading = true
          var body = {}
          body.ID = $scope.ID
          request.post(ip+'/editar_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response)

              //$scope.getPedidos_filtering();
              $scope.loading = false
              $scope.getPedidos_filteringV2();
              $scope.editView = true
              $scope.pedido.estatus = response.data.estatus
              $scope.pedido.estatus_id = 1
              notify({ message:'Pedido en construccion!', position:'right', duration:10000, classes:'alert-success'});

              $scope.mytimeout = $timeout($scope.onTimeout,1000);

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }

        $scope.creditoClient = {}
        $scope.clienteValido = false
        $scope.clientInvalidoMsg = null
        function validaClienteDDO(body) {
          $scope.loading = true
          // console.log("validaClienteDDO");
          request.post(ip+'/valida/client', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response.data.data)

            if(response.data.data){
              $scope.clientInvalidoMsg = response.data.data[0]
              notify({ message:$scope.clientInvalidoMsg, position:'right', duration:10000, classes:'alert-warning'});
              $scope.clienteValido = false
              $scope.tabsIndex = 0
              return;
            }
              $scope.clienteValido = true
              $scope.clientInvalidoMsg = null

              $scope.loading = false

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false

          });
        }

        function validaDisponibilidadDDO(arti) {
          // console.log("validaDisponibilidadDDO");
          var body = {}
          body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pArti = arti
          request.post(ip+'/valida/articulo', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response.data.data)

            $scope.existenciaEdit = parseInt(response.data.data)

          }, function errorCallback(response) {
            // console.log(response)
          });
        }

        function getClientDispService(body) {
          // console.log("getClientDispService");
          $scope.loading = true
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
            $scope.loading = false
          });
        }

        function getTotalesPedido() {
          // console.log("getClientDispService");
          var body={}
          body.idPedido = $scope.ID
          $scope.loading = true
          request.post(ip+'/totales_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response)
            $scope.totalesDdo = formatoTotales(response.data.totales)

            $scope.loading = false

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }

        $scope.listProveedores=[]
        $scope.proveedor = {"cod_proveedor":null}
        function proveedores() {
          $scope.loading = true
          // console.log("validaClienteDDO");
          request.post(ip+'/get/proveedores', {},{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response.data)

            $scope.listProveedores = response.data.obj

            $scope.loading = false

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false

          });
        }

        $scope.listCategorias=[]
        $scope.categoria = {"CODIGO":null}
        function getCategorias() {
          $scope.loading = true
          // console.log("validaClienteDDO");
          request.post(ip+'/get/categorias', {},{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response.data)

            $scope.listCategorias = response.data.obj

            $scope.loading = false

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false

          });
        }

        $scope.auxBusqueda = null
        $scope.getProdNew = function (filter = false, articulo = false) {
          $scope.loading = true
          // console.log("getProdNew");
          var body = {};
          // // console.log($scope.client);

          if(filter){
            // body.pNombre = $scope.nombre_cliente
            body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
            body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
            body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
            if(articulo){
              body.pArticulo = $scope.pArticulo
            }else{

              if($scope.busqueda_prod == null){
                 $scope.busqueda_prod = $scope.auxBusqueda
              }
              if($scope.tipoBusqueda==1){
                body.pComponente = $scope.busqueda_prod
              }else{
                body.pBusqueda = $scope.busqueda_prod
              }


            }

            if($scope.proveedor.cod_proveedor != null || $scope.proveedor.cod_proveedor != "null" ){
              body.pCodProveedor = $scope.proveedor.cod_proveedor
            }
             if(body.pCodProveedor === "null"){
              body.pCodProveedor = null
            }

            if($scope.categoria.CODIGO != null || $scope.categoria.CODIGO != "null" ){
              body.pFiltroCategoria = $scope.categoria.CODIGO
            }


          }
          // // console.log(body, "body")
          request.post(ip+'/procedure_productos', body,{})
          .then(function successCallback(response) {
            // // console.log(response)

            if(response.data.obj.length > 0){
              response.data.obj.forEach((item, i) => {

                // var uni_fact =  par(element.unidades_facturadas)
                // // console.log( uni_fact);
                // // console.log( typeof uni_fact );
                // if(isNaN(uni_fact)){
                //
                //   uni_fact = 0
                // }

                item.precioFormatVE = item.precio_bruto_bs.replace(",", ".")

                var par1 = parseFloat(item.precioFormatVE)
                if(isNaN(par1)){
                  par1 = 0
                }

                item.precioFormatVE = $scope.formato(2,  par1)
                // item.precio_neto_usd =
                item.precioFormatUSD = item.precio_neto_usd.replace(",", ".")
                var par2 = parseFloat(item.precioFormatVE)
                if(isNaN(par2)){
                  par2 = 0
                }
                item.precioFormatUSD = $scope.formato(3,  par2 )

              });


              $scope.productos = response.data.obj

              $scope.refreshProduct()
              $scope.auxBusqueda = $scope.busqueda_prod
              $scope.busqueda_prod = null;

            }else{
              notify({ message:'¡No se encontraron resultados!', position:'right', duration:10000, classes:'alert-warning'});
            }
            $scope.loading = false

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
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
              // // console.log("recargo")
            } else {
              $scope.stopFight();
              // // console.log("se detuvo")
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
          // // console.log(pedido);
          var body = $scope.buildBody();
          request.post(ip+'/add/pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response)
              $scope.reset();
              //$scope.getPedidos_filtering();
              $scope.getPedidos_filteringV2();

              notify({ message:'¡Pedido generado con exito!', position:'right', duration:10000, classes:'alert-success'});
            /*if (response.data.exist) {
              ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
            } else if (response.data.email_flag) {
              ngNotify.set('¡Ya el correo está registrado!','error')
            }*/
            alert("Guardado con exito!")
          }, function errorCallback(response) {
            // console.log(response)
          });
        }

        $scope.addPedidoV2 = function(){
          $scope.loading = true
          // // console.log(pedido);
          var body = $scope.buildBody();
          request.post(ip+'/add/pedidoV2', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response)
            $scope.ID = response.data.ID

            if($scope.ID != null){
              notify({ message:'¡Pedido abierto con exito!', position:'right', duration:10000, classes:'alert-success'});
              $scope.counter = 0;
              $scope.mytimeout = $timeout($scope.onTimeout,1000);
            }else{
              $(function(){
                $("#addPedidoModal").modal("hide");
              })
              notify({ message:'¡No se pudo abrir un pedido nuevo!', position:'right', duration:10000, classes:'alert-danger'});
            }


            $scope.getPedidos_filteringV2()
            // alert("Guardado con exito!")
            $scope.loading = false
          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }

        $scope.timeLimit = 899999
        $scope.counter = 0;
        $scope.onTimeout = function(){

            if($scope.counter > $scope.timeLimit){
              $scope.stopTimeout()
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

        $scope.stopTimeout = function(){
          // console.log("stop");
            $timeout.cancel($scope.mytimeout);
            $scope.counter = 0;
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
          // // console.log(pedido);
          $scope.loading = true
          var body = {};

          body.pedido = articulo
          // if(!$scope.ID){
          //   $scope.addPedidoV2()
          // }
          body.ID = $scope.ID
          request.post(ip+'/add/detalle_producto', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response)
            //$scope.getPedidos_filtering();
            $scope.getPedidos_filteringV2();
            $scope.getProdNew(true);
            if(response.data.reserved < articulo.CANTIDAD && 1==2){
              articulo.CANTIDAD = response.data.reserved
              articulo.alert = true
            }else{
              articulo.alert = false
            }
            $scope.pedido.pedido.push(articulo)
            $scope.totalesDdo = formatoTotales(response.data.totales)
            calcularTotales()
            $scope.loading = false
          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }

        $scope.removeDetalleProducto = function(i){
          // // console.log(pedido);
          $scope.loading = true
          var body = {};

          body.COD_PRODUCTO = $scope.pedido.pedido[i].COD_PRODUCTO;
          body.id_pedido = $scope.ID
          request.post(ip+'/del/detalle_producto', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response)
            // //$scope.getPedidos_filtering();
            $scope.getPedidos_filteringV2();
            $scope.getProdNew(true)
            $scope.removeArt(i)
            $scope.loading = false

            $scope.totalesDdo = formatoTotales(response.data.totales)
          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }



        $scope.delPedido = function(){
          // // console.log(pedido);
          $scope.loading = true
          var body = $scope.buildBody();
          body.ID = $scope.ID
          request.post(ip+'/del/pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response)
              $scope.reset();
              //$scope.getPedidos_filtering();
              $scope.getPedidos_filteringV2();
              $scope.ID = null;
              notify({ message:'¡Pedido eliminado con exito!', position:'right', duration:10000, classes:'alert-success'});
              $scope.oneOrder()
              $scope.loading = false
          }, function errorCallback(response) {
            // console.log(response)
          });
        }

        $scope.confirmModal = function (ID) {
          $scope.ID = ID
        }

        $scope.updDetalleProductoTable = function (articulo) {

          articulo.CANTIDAD = parseInt(articulo.CANTIDAD )

          // $scope.pedido.pedido.splice( $scope.editRowIndex, 1 );

          calcularTotales($scope.editRowIndex)

          if(!validacionesArticulo(articulo, $scope.existenciaEdit)){
            $scope.updDetalleProducto(articulo)

            $scope.pedido.pedido[$scope.editRowIndex] = articulo

            $scope.existenciaEdit = null
            $scope.editRowIndex = -1
            $scope.editArticulo = null
            $scope.cantidadAux = 0


          }else{
            articulo.CANTIDAD = parseInt($scope.cantidadAux )
          }

          // $scope.pedido.pedido.push(articulo)

          calcularTotales()

        }

        $scope.updDetalleProducto = function(articulo){
          // console.log('updDetalleProducto');
          var body = {};
          var result

          body.pedido = articulo
          body.ID = $scope.ID
          request.post(ip+'/upd/detalle_producto', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response)
            //$scope.getPedidos_filtering();
            $scope.getPedidos_filteringV2();
            // $scope.getProdNew(true);
            if(response.data.reserved < articulo.CANTIDAD ){
              articulo.CANTIDAD = response.data.reserved
              articulo.alert = true
            }else{
              articulo.alert = false
            }
            // $scope.pedido.pedido.push(articulo)
            // calcularTotales() 1234
            $scope.totalesDdo = formatoTotales(response.data.totales)
            result = articulo
          }, function errorCallback(response) {
            // console.log(response)
          });

          return result
        }

        $scope.existenciaEdit = null
        $scope.cantidadAux = 0
        $scope.editRowIndex = -1
        $scope.editArticulo = null
        // deprecado
        $scope.editRow = function (articulo, i) {

          // $scope.existenciaEdit = parseInt(articulo.CANTIDAD)
          console.log("editRow", i);

          calcularTotales(i)

          validaDisponibilidadDDO(articulo.COD_PRODUCTO)

          $scope.cantidadAux = parseInt(articulo.CANTIDAD)

          $scope.editRowIndex = i

          var body = {}

          body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
          body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
          body.pArticulo = articulo.COD_PRODUCTO


          request.post(ip+'/procedure_productos', body,{})
          .then(function successCallback(response) {
            // // console.log(response)
            if(response.data.obj.length > 0){
              response.data.obj.forEach((item, i) => {

                item.precioFormatVE = item.precio_bruto_bs.replace(",", ".")
                item.precioFormatVE = $scope.formato(2,  parseFloat(item.precioFormatVE).toFixed(2) )
                item.precio_bruto = item.precio_bruto_bs.replace(",", ".");
                item.precio_neto_bs = item.precio_neto_bs.replace(",", ".");
                item.precio_neto_usd = item.precio_neto_usd.replace(",", ".");
                item.CANTIDAD = $scope.cantidadAux;
                item.existencia = parseInt($scope.cantidadAux) + parseInt(item.existencia)
                item.precioFormatUSD = item.precio_neto_usd.replace(",", ".")
                item.precioFormatUSD = $scope.formato(3,  parseFloat(item.precioFormatUSD).toFixed(2) )
                $scope.productIndex = i

              });


              $scope.articulo = response.data.obj[0]

              console.log($scope.articulo);

            }else{
              notify({ message:'¡No se encontraron resultados!', position:'right', duration:10000, classes:'alert-warning'});
            }

          }, function errorCallback(response) {
            // console.log(response)
          });

          // $scope.articulo = articulo

          // console.log(articulo)

          $(function(){
            $("#modalInfoProduct").modal({
                backdrop: 'static',
                keyboard: false
            });
          })

        }

        $scope.addArtPedido = function(){
            if(Object.keys($scope.articulo).length === 0)
              return

            console.log($scope.articulo);
            var error=false;
            var existe = false;
            var indexArticulo = null
            $scope.pedido.pedido.forEach((element,i) => {
              console.log($scope.articulo);
              if($scope.articulo.cod_producto == element.COD_PRODUCTO){
                $scope.articulo.COD_PRODUCTO = element.COD_PRODUCTO
                indexArticulo = i
                existe = true;
                console.log("existe", existe);

              }
            });


            if(!existe){

              error = validacionesArticulo($scope.articulo)

              $scope.articulo.precio_bruto = $scope.articulo.precio_bruto.replace(",", ".");
              $scope.articulo.precio_neto_bs = $scope.articulo.precio_neto_bs.replace(",", ".");

              // console.log($scope.articulo.precio_bruto);

              if(!error){
                $scope.addDetalleProducto($scope.articulo)
                calcularTotales()
                $(function(){
                  $("#modalInfoProduct").modal('hide');
                })

                notify({ message:'¡Producto agregado al pedido!', position:'right', duration:10000, classes:'alert-success'});
              }

            }else{
              // console.log("existe");
              var listAux = $scope.pedido.pedido

              var existenciaAux = $scope.articulo.existencia

              // $scope.articulo.existencia = parseInt($scope.articulo.existencia) + parseInt($scope.articulo.CANTIDAD)

              calcularTotales(indexArticulo)

              error = validacionesArticulo($scope.articulo, existenciaAux)

              console.log("error", error)

              if(!error){

                $scope.updDetalleProducto($scope.articulo);

                $scope.pedido.pedido.push($scope.articulo)

                $scope.pedido.pedido.splice( indexArticulo, 1 );

              }else{
                $scope.pedido.pedido = listAux
              }
              $scope.articulo.existencia = existenciaAux

              if(!error){
                calcularTotales()
                getTotalesPedido()
                $(function(){
                  $("#modalInfoProduct").modal('hide');
                })
                notify({ message:'¡Linea actulizada con exito!', position:'right', duration:10000, classes:'alert-success'});
              }

              return
            }

            if(!error){
              $scope.articulo = {};
              $scope.productIndex = -1
              // $scope.productos = [];
              $scope.product = {}
              $scope.counter = 0;
            }


        }
        $scope.artEmpleado = 0

        function validacionesArticulo(articulo , existenciaAux = null) {

          // console.log(articulo);
          if(isEmpty( articulo.COD_PRODUCTO ) && isEmpty( articulo.cod_producto )){
            console.log('¡Complete todos los campos!COD_PRODUCT',isEmpty( articulo.COD_PRODUCTO ))
            return  true;
          }
           if( isEmpty(articulo.CANTIDAD ) || articulo.CANTIDAD < 1 ){
             console.log("Por favor verifique la cantidad!");
            notify({ message:'¡Por favor verifique la cantidad!', position:'right', duration:10000, classes:'alert-danger'});
            return  true;
          }
          // console.log(articulo.existencia,articulo.CANTIDAD );
           if( articulo.CANTIDAD > parseInt(articulo.existencia)  ){
              console.log("¡La cantidad no puede ser mayor a la existencia!");
              // ngNotify.set('¡La cantidad no puede ser mayor a la existencia!','error')
              notify({ message:'¡La cantidad no puede ser mayor a la existencia!', position:'right', duration:10000, classes:'alert-danger'});
             return  true;
          }
          // console.log("validacionesArticulo")
          // console.log(articulo.precio_bruto_bs, articulo.iva_bs,articulo.CANTIDAD );
          var valor = 0

          // console.log(parseFloat(articulo.precio_bruto_bs));
          // console.log(parseFloat(articulo.iva_bs));
          // console.log( existenciaAux - articulo.CANTIDAD );
          valor = (parseFloat(articulo.precio_bruto_bs)+parseFloat(articulo.iva_bs)) * (articulo.CANTIDAD - existenciaAux)

          // console.log(valor);
          valor = (parseFloat(articulo.precio_bruto_bs)+parseFloat(articulo.iva_bs)) * articulo.CANTIDAD
          if( !validaCreditoContraProducto((parseFloat(articulo.precio_bruto_bs)+parseFloat(articulo.iva_bs)) * articulo.CANTIDAD)  ){
            console.log("¡El precio excede el credito disponible! !existenciaaux");
            notify({ message:'¡El precio excede el credito disponible!', position:'right', duration:10000, classes:'alert-danger'});
            // ngNotify.set('¡El precio excede el credito disponible!','error')
            return  true;
          }

          if($scope.client_info.grupo_cliente == "02"){

            if( articulo.CANTIDAD > parseInt(articulo.existencia)  ){
               console.log("¡La cantidad no puede ser mayor a la existencia!");
               // ngNotify.set('¡La cantidad no puede ser mayor a la existencia!','error')
               notify({ message:'¡La cantidad no puede ser mayor a la existencia!', position:'right', duration:10000, classes:'alert-danger'});
              return  true;
           }

          }

          return false

        }

        function isEmpty(str) {
            return (!str || 0 === str.length);
        }

        $scope.buildBody = function(){

          var fecha = new Date( $scope.pedido.fecha)
          // console.log($scope.pedido.pedido)
          var aux = $scope.pedido.pedido
          aux.forEach(element => {

            element.precio_bruto = parseFloat(element.precio_bruto).toFixed(2)

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
          // console.log(body,"body")
          return body
        }

        $scope.reset = function(){
          $scope.stopTimeout()
          $scope.totalesDdo = {"total_bruto":"0","desc_volumen":"0","otros_descuentos":"0","desc_adicional":"0","desc_dpp":"0","sub_total":"0","impuesto":"0","total":"0"        }
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
          // $scope.clientes = null
          // $scope.clientIndex = -1
          // $scope.nombre_cliente = null
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
          }
        }


        $scope.getPedido = function(ID){
          $scope.loading = true
          var obj = {'idPedido': ID};
          $scope.ID = ID
      // // console.log($localStorage.token);
          request.post(ip+'/get/pedido', obj, {'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            // console.log(response.data)

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
            $scope.totalesDdo = formatoTotales(response.data.obj[0].totales)

            $scope.loading = false

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }

        $scope.getPedidos_filtering = function(no_client){

          // var body = {}
          // body.pCliente = $scope.client.COD_CLIENTE
          // request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          // .then(function successCallback(response) {
          //   // console.log(response.data)
          //
          //     $scope.listaPedidos = response.data.data;
          //
          // }, function errorCallback(response) {
          //   // console.log(response)
          // });
        }
        $scope.listaPedidosV2=[]
        $scope.getPedidos_filteringV2 = function(no_client){
          $scope.loading = true
          var body = {}
          body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
          body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
          request.post(ip+'/get/pedidosV2', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          .then(function successCallback(response) {
            // console.log(response.data)

            $scope.listaPedidosV2 = response.data.data.sort(function(a, b) {
              var keyA = a.ID,
                keyB = b.ID;
              // Compare the 2 dates
              if (keyA < keyB) return 1;
              if (keyA > keyB) return -1;
              return 0;
            });

              // $scope.listaPedidosV2 = response.data.data;
              $scope.oneOrder();
              $scope.loading = false

          }, function errorCallback(response) {
            // console.log(response)
            $scope.loading = false
          });
        }

        $scope.showPedido = function(pedido){
          // console.log(pedido);

          $scope.editView = false;
          $scope.tabsIndex = 1;
          // pedido.fecha = new Date(pedido.fecha);
          pedido.pedido.forEach((item, i) => {

            // pedido.totales.productos.forEach((element, i) => {
            //   if(item.COD_PRODUCTO == element.COD_PRODUCTO){
                item.iva_bs = item.iva_bs.replace(",", ".")
                item.iva_usd = item.iva_usd.replace(",", ".")
                item.precio_neto_usd = item.precio_neto_usd.replace(",", ".")
                item.precio_bruto = item.precio_bruto_bs.replace(",", ".")
                item.precio_neto_bs = item.precio_neto_bs.replace(",", ".")
                // item.nombre_producto = element.nombre_producto
              // }
            // });

          });

          $scope.pedido = pedido;
          // $scope.totales = pedido.totales

          calcularTotales()
        }

        $scope.removeArt = function(i){

          // // console.log($scope.pedido.pedido[i].COD_PRODUCTO)

          console.log(i);
          console.log($scope.pedido.totales);
          if($scope.pedido.totales)
            $scope.pedido.totales.productos.forEach((item, index) => {
              if(item.COD_PRODUCTO == $scope.pedido.pedido[i].COD_PRODUCTO){
                $scope.pedido.totales.bsConIva = $scope.pedido.totales.bsConIva - item.iva_bs
                $scope.pedido.totales.UsdConIva = $scope.pedido.totales.UsdConIva - item.iva_usd
              }
            });

          $scope.pedido.pedido.splice( i, 1 );

          calcularTotales()
          $scope.counter = 0;
        }

        $scope.totales = {
          'bolivares':0,
          'USD':0,
          'bsIVA':0,
          'USDIVA':0,
          'bsConIva':0,
          'UsdConIva':0
        }
        $scope.tipoPedido = "N"
        function calcularTotales(editIndex = null) {
            console.log("calcularTotales");
            $scope.totales.bolivares = 0
            $scope.totales.USD = 0
            $scope.totales.bsIVA = 0
            $scope.totales.USDIVA = 0
            $scope.totales.bsConIva = 0
            $scope.totales.UsdConIva = 0
            // console.log($scope.pedido.pedido)
            $scope.pedido.pedido.forEach((element, i )=> {

              if(editIndex != null && editIndex == i){
                console.log("editIndex", editIndex);
                return;
              }

              $scope.totales.bolivares = parseFloat($scope.totales.bolivares)
                                             + (parseFloat(element.precio_neto_bs) * element.CANTIDAD)

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


          var clientgroup =  ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;

            if(clientgroup == "01"){
              if($scope.totales.bsConIva > $scope.client.monto_min_pick){
                $scope.tipoPedido = "D"
              }else{
                $scope.tipoPedido = "N"
              }

            }

          // console.log($scope.totales)
        }

        function validaCreditoContraProducto(valor) {
          // console.log(valor);
          // console.log($scope.creditoClient.disp_bs_format );
          // console.log($scope.creditoClient.disp_bs_format - valor);
          // console.log($scope.totales);
          if(($scope.creditoClient.disp_bs_format - $scope.totales.bsConIva - valor) >= 0){
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
            .withDOM('frtip')
            .withPaginationType('full_numbers')
            .withLanguage(DATATABLE_LANGUAGE_ES)
            .withDisplayLength(15)
        // .withDisplayLength(2);
        // $scope.dtInstanceProd = {};
        $scope.dtOptionsProd = DTOptionsBuilder.newOptions()
            .withPaginationType('full_numbers')
            .withOption('responsive', true)
            .withDOM('frtip').withPaginationType('full_numbers')
            .withLanguage(DATATABLE_LANGUAGE_ES)
      $scope.dtOptionsDetalil = DTOptionsBuilder.newOptions()
          .withPaginationType('full_numbers')
          .withOption('responsive', true)
          .withDOM('frtip').withPaginationType('full_numbers')
          .withLanguage(DATATABLE_LANGUAGE_ES)


        $scope.dtColumns = [
            DTColumnBuilder.newColumn('no_cia').withTitle('Número cia'),
            DTColumnBuilder.newColumn('grupo').withTitle('Grupo'),
            DTColumnBuilder.newColumn('no_cliente').withTitle('Número cliente'),
            DTColumnBuilder.newColumn('no_factu').withTitle('Número factura'),
            DTColumnBuilder.newColumn('estatus').withTitle('Estatus'),
            DTColumnBuilder.newColumn('precio').withTitle('Precio'),
            DTColumnBuilder.newColumn('cantidad').withTitle('Cantidad de Productos')
        ];

        function formatoTotales(totales) {
          totales.total_bruto = totales.total_bruto.replace(",",".")
          totales.desc_volumen = totales.desc_volumen.replace(",",".")
          totales.otros_descuentos = totales.otros_descuentos.replace(",",".")
          totales.desc_adicional = totales.desc_adicional.replace(",",".")
          totales.desc_dpp = totales.desc_dpp.replace(",",".")
          totales.sub_total = totales.sub_total.replace(",",".")
          totales.impuesto  = totales.impuesto.replace(",",".")
          totales.total  = totales.total.replace(",",".")
          return totales
        }

        $scope.typeContext=[
          {

            "title": "Finalizar pedido",
            "msg" : "¿Está seguro de finalizar su pedido?",
            "color": "success"
          },
          {
            "title": "Editar pedido",
            "msg" : "Desea editar este pedido",
            "color": "info"
          },
          {
            "title": "Eliminar pedido",
            "msg" : "Desea eliminar este pedido",
            "color": "danger"
          },
          {
            "title": "Eliminar producto",
            "msg" : "¿Desea eliminar este producto?",
            "color": "danger"
          },
          {
            "title": "Informacion",
            "msg" : "Si no alcanza el monto minimo para pick-up su pedido sera procesado como tipo normal ¿Está seguro de finalizarlo? ",
            "color": "warning"
          }
        ]

        proveedores()
        getCategorias()
    }
]);
