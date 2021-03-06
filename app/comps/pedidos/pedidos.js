'use strict';

angular.module('app.pedidos', ['datatables', 'datatables.buttons', 'datatables.bootstrap','ngRoute', 'ngNotify','cgNotify','timer','ngIdle', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])
  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/pedidos', {
      templateUrl: 'comps/pedidos/pedidos.html',
      controller: 'pedidosCtrl'
    });
  }])
  .controller('pedidosCtrl', ['$scope', '$q', 'localstorage', '$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify','notify','Idle', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, notify, Idle, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {


      $scope.$on('IdleTimeout', function() {
        // addEvent({event: 'IdleTimeout', date: new Date()});
        $scope.onTimeout()
        
      });


        $scope.srcServer = IP_SRC_IMAGE
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
        $scope.clientIndex = null;
        $scope.productos = null;
        $scope.product = {};
        $scope.productIndex = -1;
        $scope.infoPsico = false;
        $scope.totalesDdo = {"total_bruto":"0","desc_volumen":"0","otros_descuentos":"0","desc_adicional":"0","desc_dpp":"0","sub_total":"0","impuesto":"0","total":"0","totalExento":"0","totalGravado":"0", "descImpuesto":null, "totalNetoUSD":"0"}
        $scope.tipoBusqueda = '1'
        $scope.pickUpAvailable = '1';
        $scope.clienteEmpleado = false;
        $scope.editProduct = false;

        var userLog = localStorage.getItem('user')
        $scope.userLogged = JSON.parse(userLog)



        var ip = IP_SERVER_PYTHON;


        $scope.listPedido = [];

        $scope.nextStep = function () {
          $scope.goToTab($scope.tabsIndex + 1 );
        }

        $scope.goToTab = function (index) {
          if(index <= $scope.tabs )
            $scope.tabsIndex = index
        }

        $scope.initModal = function () {

          $scope.ID = null
          $scope.reset()
          $scope.tabsIndex = 1
          var body={}
          body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
          body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;

          getClientDispService(body)

          $scope.addPedidoV2()



        }
        $scope.unicOrderID = null
        $scope.oneOrder = function(){
          $scope.unicOrderID = null
          $scope.listaPedidosV2.forEach((item, i) => {

              if( item.cod_estatus == 0  ){
                $scope.unicOrderID = item.ID
                $scope.tiempoPedido(item.ID)
                return
              }else if( item.cod_estatus == 1  ){
                $scope.unicOrderID = item.ID
                $scope.tiempoPedido(item.ID)
                return
              }else if( item.cod_estatus == 2  ){
                $scope.unicOrderID = item.ID
                $scope.tiempoPedido(item.ID)
                return
              }else if( item.cod_estatus == 6  ){
                $scope.unicOrderID = item.ID
                $scope.tiempoPedido(item.ID)
                return
              }
          });



        }


        $scope.modalDynTitle = null;
        $scope.modalDynMsg = null;
        $scope.modalDynContext = null;
        $scope.modalDynContextId = null;
        $scope.modalDynColor = null;

        $scope.aceptModalDyn = function () {
          console.log("aceptModalDyn",$scope.modalDynContext);
          switch ($scope.modalDynContext) {
            case 0:
                console.log($scope.totales);
                if($scope.totales.bsConIva > $scope.client.monto_minimo){
                  $scope.finalizar_pedido()
                  $(function(){
                    $("#addPedidoModal").modal("hide");
                    $("#showPedidoModal").modal("hide");
                    $('.modal-backdrop').remove();
                  })
                }else{


                  notify({ message:'¡Para realizar un pedido el monto total debe ser mayor a ' + $scope.formato(2, $scope.client.monto_minimo )+"!", position:'left', duration:10000, classes:'   alert-warning'});
                }
              break;

              case 3:
                $scope.removeDetalleProducto($scope.modalDynContextId);
                break;

              case 4:
                  if($scope.totales.bsConIva > $scope.client.monto_minimo){
                    $scope.finalizar_pedido()
                    $(function(){
                      $("#addPedidoModal").modal("hide");
                      $("#showPedidoModal").modal("hide");
                      $('.modal-backdrop').remove();
                    })
                  }else{
                    notify({ message:'¡Para realizar un pedido el monto total debe ser mayor a ' + $scope.formato(2, $scope.client.monto_minimo ), position:'left', duration:10000, classes:'   alert-warning'});
                  }
                break;

              case 5:
                $scope.close_pedido()
                $(function(){
                  $("#addPedidoModal").modal("hide");
                  $("#showPedidoModal").modal("hide");
                  $('.modal-backdrop').remove();
                })

                break;
            default:

          }

        }

        $scope.cancelModalDyn = function() {
          switch ($scope.modalDynContext) {
            case 5:
            // TODO: flujo cierre modal
              $scope.delPedido()
              $(function(){
                $("#addPedidoModal").modal("hide");
                $("#showPedidoModal").modal("hide");
                $('.modal-backdrop').remove();
              })

              break;
            default:

          }
        }


        $scope.openModalDyn = function(type, contextId) {

          if(type == 0 && $scope.tipoPedido == "N"  && $scope.pickUpAvailable == "2" ){
            $scope.openModalDyn(4, contextId);
            return
          }
          $scope.modalDynTitle = $scope.typeContext[type].title;
          $scope.modalDynMsg = $scope.typeContext[type].msg;
          $scope.modalDynContext = type;
          $scope.modalDynContextId = contextId;
          $scope.modalDynColor = $scope.typeContext[type].color;
          console.log("entro y seteo");
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
          if($scope.pedido.estatus_id >= 3 && $scope.pedido.estatus_id != 6){


            notify({ message:'¡Este pedido no puede ser editado!', position:'left', duration:10000, classes:'   alert-danger'});
            return
          }else{

            var body = {}
            body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
            body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
            body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
            getClientDispService(body)

            $scope.edit_pedido();


          }

        }

        $scope.showProductTable = false

        $scope.selectCLient = function(){



          if($scope.client != null && $scope.clientes.length > 0){
              var auxCli = $scope.clientes
              var auxCliIndex = $scope.clientIndex

              $scope.reset()

              $scope.clientes = auxCli
              $scope.clientIndex = auxCliIndex
              $scope.client  = $scope.clientes[ $scope.clientIndex ];

              $scope.showProductTable = true;

              if($scope.client.grupo_cliente == "2"){
                $scope.clienteEmpleado = true;
              }else{
                $scope.clienteEmpleado = false;
              }

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
            validaClienteDDO(body)




        }

        function listarPedidos(){
          $scope.loading = true
         var body = {}
           body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
           body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
           body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
           request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
             .then(function successCallback(response) {


               $scope.listaPedidos=response.data.data

            });

            request.post(ip+'/get/pedidosV2', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
              .then(function successCallback(response) {


                $scope.listaPedidosV2 = response.data.data.sort(function(a, b) {
                  var keyA = a.ID,
                    keyB = b.ID;

                  if (keyA < keyB) return 1;
                  if (keyA > keyB) return -1;
                  return 0;
                });

                $scope.oneOrder();
                $scope.loading = false
             });


        }

        verificClient()
        $scope.naturalLimits = true
        function verificClient(){

         var client = localStorage.getItem('client')
         var client_info = localStorage.getItem('client_info')

          if ( client=='{}' ){
           $scope.hasUserClient = false;
         }else{
           $scope.hasUserClient = true;
           $scope.client = JSON.parse(client);
           $scope.client_info = JSON.parse(client_info);

           $scope.client.monto_minimo = parseFloat($scope.client_info.monto_minimo)
           $scope.client.monto_min_pick = $scope.client_info.monto_min_pick
           $scope.client.max_unid_med_emp =  $scope.client_info.max_unid_med_emp
           $scope.client.max_unid_misc_emp =  $scope.client_info.max_unid_misc_emp
           $scope.client.unid_fact_med_emp =  $scope.client_info.unid_fact_med_emp
           $scope.client.unid_fact_misc_emp =  $scope.client_info.unid_fact_misc_emp
           $scope.client.unid_disp_med_emp =  $scope.client_info.unid_disp_med_emp
           $scope.client.unid_disp_misc_emp =  $scope.client_info.unid_disp_misc_emp

           if($scope.client_info.grupo_cliente == "02" ){

             $scope.clienteEmpleado = true

             if($scope.client_info.ind_emp_nolim=='S'){
                $scope.naturalLimits = false
              }else {
                $scope.naturalLimits = true
              }

           }else{
              $scope.clienteEmpleado = false
           }

           selectCLientCAP( $scope.client_info)
           $scope.showProductTable = true
         }

         listarPedidos()



        }
        $scope.auxCantidadBlur = null
        $scope.validaBlur = function (cantidad = null) {
       
          if(cantidad != null && cantidad > 0  ){
            $scope.auxCantidadBlur = cantidad
            $scope.addArtPedido(true)
          }else{
            cantidad = null
            $scope.auxCantidadBlur = null
            return
          }

          
        }

        $scope.selectProduct = function(value = null ,type = null){

           var index = (value!=null)? value:$scope.productIndex
            $scope.productIndex = index;
            $scope.product  = $scope.productos[ index ];
            $scope.articulo = $scope.product
            $scope.editProduct = false;
            var existe = false;
            var cantidadAux = 0;
            $scope.pedido.pedido.forEach((element,i) => {

              if($scope.articulo.cod_producto == element.COD_PRODUCTO || $scope.articulo.COD_PRODUCTO == element.COD_PRODUCTO ){
                existe = true;
                $scope.editProduct = true;
                cantidadAux = parseInt(element.CANTIDAD)
                return
              }
            });

            $scope.articulo.COD_PRODUCTO = $scope.product.cod_producto;
            $scope.articulo.precio_bruto = $scope.product.precio_bruto_bs
            $scope.articulo.precio_neto_usd = $scope.product.precio_neto_usd
            $scope.articulo.precio_neto_bs = $scope.product.precio_neto_bs
            $scope.articulo.existencia =$scope.product.existencia

            if(!existe){

              $scope.articulo.CANTIDAD = 0

            }else{
              $scope.articulo.CANTIDAD = cantidadAux
            }
            if(type == null){
              angular.element('#btnProductInfo').trigger('click');
            }else{
              $(function(){
                $('#cantidad_'+$scope.productIndex).focus();
              })
            }


        }
        $scope.tipoBusquedaCliente = 0
        $scope.getClientNew = function (filter = false) {

          $scope.listaPedidosV2 = []
          $scope.loading = true
          var body = {};

            body.pNombre = $scope.nombre_cliente

          body.pNoCia = "01";
          body.pNoGrupo = ($scope.tipoBusquedaCliente != 0)? "02": "01";

          request.post(ip+'/procedure_clientes', body,{})
          .then(function successCallback(response) {

            $scope.clientes = null
            $scope.clientIndex = null
            $scope.showProductTable = null
            $scope.loading = false

            if(response.data.obj.length > 0){

              $scope.clientes = response.data.obj




            }else{
              notify({ message:'¡No se encontraron resultados!', position:'left', duration:10000, classes:'   alert-warning'});

            }



          }, function errorCallback(response) {

            $scope.loading = false
          });
        }

        function getClientService(body) {
          $scope.loading = true
          request.post(ip+'/procedure_clientes', body,{})
          .then(function successCallback(response) {

              $scope.loading = false
            if(response.data.obj.length > 0){

              $scope.client = response.data.obj[0]

            }else{
              notify({ message:'¡No se encontraron resultados!', position:'left', duration:10000, classes:'   alert-warning'});
            }

          }, function errorCallback(response) {

            $scope.loading = false
          });
        }

        $scope.finalizar_pedido = function () {

          $scope.loading = true
          var body = {}
          body.ID = $scope.ID
          body.tipoPedido = $scope.tipoPedido
            body.username = $scope.userLogged.username
          request.post(ip+'/finalizar_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

              $scope.loading = false;
              $scope.getPedidos_filteringV2();
              notify({ message:'¡Pedido cerrado con éxito!', position:'left', duration:10000, classes:'   alert-success'});
              $scope.stopTimeoutOrdCancel();

          }, function errorCallback(response) {

            $scope.loading = false
          });
        }
        
        $scope.edit_pedido = function () {
          $scope.loading = true
          var body = {}
          body.ID = $scope.ID
          body.estatus = 6
          request.post(ip+'/editar_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {


              $scope.loading = false
              $scope.getPedidos_filteringV2();
              $scope.editView = true
              $scope.pedido.estatus = response.data.estatus
              $scope.pedido.estatus_id = 1
              notify({ message:response.data.estatus, position:'left', duration:10000, classes:'   alert-success'});

              if($scope.liveTimeOrd < 900000){
                $scope.counter = $scope.liveTimeOrd
              }

              // $scope.countdown()
              // $scope.stopTimeout()
              // mytimeout = $timeout(function (){
              //   $scope.onTimeout()
              // },$scope.timeLimit * 1000);

          }, function errorCallback(response) {

            $scope.loading = false
          });
        }

        $scope.close_pedido =function () {
          $scope.loading = true
          var body = {}
          body.ID = $scope.ID
          body.estatus = 1
          request.post(ip+'/posponer_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

              $scope.loading = false

              $scope.getPedidos_filteringV2();

              notify({ message:response.data.estatus, position:'left', duration:10000, classes:'   alert-success'});

          }, function errorCallback(response) {

            $scope.loading = false
          });
        }
        $scope.cancel_pedido =function () {

          $scope.loading = true
          var body = {}
          body.ID = $scope.unicOrderID
          body.estatus = 5
          request.post(ip+'/cancel_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

              $scope.loading = false

              $scope.getPedidos_filteringV2();

              $(function(){
                $("#addPedidoModal").modal("hide");
                $("#showPedidoModal").modal("hide");
                $("#modalproduct").modal("hide");
                $("#modalInfoProduct").modal("hide");
                $("#modalConfirmDynamic").modal("hide");
                $("#modalImg").modal("hide");


                $('.modal-backdrop').remove();
              })

              notify({ message:response.data.estatus, position:'left', duration:10000, classes:'   alert-success'});
              $scope.msgOrdCancel = false

          }, function errorCallback(response) {

            $scope.loading = false
          });
        }

        $scope.creditoClient = {}
        $scope.clienteValido = false
        $scope.clientInvalidoMsg = null
        function validaClienteDDO(body) {
          $scope.loading = true

          request.post(ip+'/valida/client', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

            $scope.clienteValido = true
            $scope.clientInvalidoMsg = null

            $scope.loading = false

          }, function errorCallback(response) {
            if(response.status == 450){
              $scope.clientInvalidoMsg = response.data.data[0]
              notify({ message:$scope.clientInvalidoMsg, position:'left', duration:10000, classes:'   alert-warning'});
              $scope.clienteValido = false
              $scope.tabsIndex = 0
            }
          });

        }

        function validaDisponibilidadDDO(arti) {

          var body = {}
          body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pArti = arti
          request.post(ip+'/valida/articulo', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {


            $scope.existenciaEdit = parseInt(response.data.data)

          }, function errorCallback(response) {

          });
        }

        function getClientDispService(body) {

          $scope.loading = true
          request.post(ip+'/disponible_cliente', body,{})
          .then(function successCallback(response) {


            $scope.creditoClient = response.data.obj
            $scope.creditoClient.disp_bs_format = parseFloat(response.data.obj.disp_bs)
            $scope.creditoClient.disp_usd_format = parseFloat(response.data.obj.disp_usd)
            localstorage.set('creditoClient',  JSON.stringify($scope.creditoClient.disp_bs_format));
            $scope.loading = false

          }, function errorCallback(response) {

            $scope.loading = false
          });
        }

        function getTotalesPedido() {

          var body={}
          body.idPedido = $scope.ID
          $scope.loading = true
          request.post(ip+'/totales_pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

            $scope.totalesDdo = formatoTotales(response.data.totales)

            $scope.loading = false

          }, function errorCallback(response) {

            $scope.loading = false
          });
        }

        $scope.listProveedores=[]
        $scope.proveedor = {"cod_proveedor":null}
        function proveedores() {
          $scope.loading = true

          request.post(ip+'/get/proveedores', {},{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {


            $scope.listProveedores = response.data.obj

            $scope.loading = false

          }, function errorCallback(response) {

            $scope.loading = false

          });
        }

        $scope.listCategorias=[]
        $scope.categoria = {"CODIGO":null}
        function getCategorias() {
          $scope.loading = true

          request.post(ip+'/get/categorias', {},{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {


            $scope.listCategorias = response.data.obj

            $scope.loading = false

          }, function errorCallback(response) {

            $scope.loading = false

          });
        }

        $scope.auxBusqueda = null
        $scope.getProdNew = function (filter = false, articulo = false, refresh = false ) {
          $scope.loading = true

          var body = {};


          if(filter){

            body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
            body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
            body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
            if(articulo){
              body.pArticulo = $scope.pArticulo
            }else{

              if($scope.busqueda_prod == null && refresh){
                 $scope.busqueda_prod = $scope.auxBusqueda
              }
              if($scope.tipoBusqueda=='2'){
                body.pComponente = $scope.busqueda_prod
              }else{
                body.pBusqueda = $scope.busqueda_prod
              }

              if($scope.proveedor.cod_proveedor != null && $scope.proveedor.cod_proveedor != "null" ){
                body.pCodProveedor = $scope.proveedor.cod_proveedor

                if(body.pCodProveedor === "null"){
                  body.pCodProveedor = null
                }
                  
              }

              if($scope.categoria.CODIGO != null && $scope.categoria.CODIGO != "null" ){
                body.pFiltroCategoria = $scope.categoria.CODIGO
                
              }

              if (body.pCodProveedor != null || body.pFiltroCategoria  )  {
                body.pExistencia = 1
              }

            }


          }

          if((body.pBusqueda != null && body.pBusqueda.length > 0 )||(body.pComponente != null && body.pComponente.length > 0 )|| body.pCodProveedor != null || body.pFiltroCategoria != null ){
            request.post(ip+'/procedure_productos', body,{})
            .then(function successCallback(response) {
  
  
              if(response.data.obj.length > 0){
  
  
                $scope.productos = response.data.obj
  
                $scope.refreshProduct()
                $scope.auxBusqueda = $scope.busqueda_prod
                $scope.busqueda_prod = null;
  
              }else{
                notify({ message:'¡No se encontraron resultados!', position:'left', duration:10000, classes:'   alert-warning'});
                $scope.productos = []
              }
              $scope.loading = false
  
            }, function errorCallback(response) {
  
              $scope.loading = false
            });
          }else{

              ngNotify.set('¡Coloque al menos 1 criterio de busqueda !', 'warn')
              $scope.loading = false
              return

            }

         
        }

        var refreshCount = 0
        var stop

        $scope.refreshProduct = function() {

        refreshCount++

        if ( angular.isDefined(stop) ) return;

        stop = $interval(function() {
            if (refreshCount <= 3) {
              $scope.getProdNew(true, null, true)

            } else {
              $scope.stopFight();

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

          var body = $scope.buildBody();
          request.post(ip+'/add/pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

              $scope.reset();

              $scope.getPedidos_filteringV2();

              notify({ message:'¡Pedido generado con éxito!', position:'left', duration:10000, classes:'   alert-success'});

            alert("Guardado con éxito!")
          }, function errorCallback(response) {

          });
        }

        $scope.addPedidoV2 = function(){
          $scope.loading = true

          var body = $scope.buildBody();
          body.username = $scope.userLogged.username
          request.post(ip+'/add/pedidoV2', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

            $scope.ID = response.data.ID

            if($scope.ID != null){
              $scope.counter = $scope.timeLimit;

              $scope.pedido.estatus ='PEDIDO CREADO'
              $(function(){
                $("#addPedidoModal").modal({
                    backdrop: 'static',
                    keyboard: false
                });
              })

            }else{
              $(function(){
                $("#addPedidoModal").modal("hide");
              })
              notify({ message:'¡No se pudo abrir un pedido nuevo!', position:'left', duration:10000, classes:'   alert-danger'});
            }


            $scope.getPedidos_filteringV2()

            $scope.loading = false
          }, function errorCallback(response) {

            $scope.loading = false
          });
        }

        $scope.timeLimit = 300//899
        $scope.counter = $scope.timeLimit;
        $scope.onTimeout = function(){

              // $scope.stopTimeout()

              if($scope.ID !== null && !$scope.editView){
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


         var mytimeout = null

        $scope.stopTimeout = function(){
          console.log(mytimeout)
          // alert("cancelo timeout")
            $timeout.cancel(mytimeout);
            $scope.counter = $scope.timeLimit;
            // $scope.$apply();

        }
        var stopped;
        // $scope.countdown = function() {
        //   console.log($scope.counter);

        //   stopped = $timeout(function() {
        //      console.log($scope.counter);
        //     if($scope.counter < 1){
        //       $scope.stop1()
        //       return
        //     }else{
        //       $scope.counter-=1;   
        //     }
        //   //  $scope.countdown();   
        //   }, 1000);

        // };
         
          
      $scope.stop1 = function(){
         $timeout.cancel(stopped);
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
          console.log("addDetalleProducto");
          $scope.loading = true
          var body = {};
          body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
          body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
          body.pedido = articulo
          body.ID = $scope.ID
          body.username = $scope.userLogged.username
          request.post(ip+'/add/detalle_producto', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {


            $scope.getPedidos_filteringV2();
            $scope.getProdNew(true, null, true);
            if(response.data.reserved < articulo.CANTIDAD){
              articulo.CANTIDAD = response.data.reserved
              articulo.alert = true

              notify({ message:"¡Solo se pudieron reservar "+response.data.reserved+" unidades! verifique disponibilidad", position:'left', duration:10000, classes:'   alert-success'});

            }else{
              articulo.alert = false
            }
            $scope.pedido.pedido.push(articulo)
            $scope.totalesDdo = formatoTotales(response.data.totales)
            calcularTotales()

            $scope.loading = false
            $scope.articulo = {};
            $scope.productIndex = -1
            $scope.product = {}
            $scope.counter = $scope.timeLimit;
            // $scope.stopTimeout()
            // $scope.countdown()
            // mytimeout = $timeout(function (){
            //     $scope.onTimeout()
            //   },$scope.timeLimit * 1000);

            $(function(){
              $("#modalInfoProduct").modal('hide');
            })

            notify({ message:'¡Producto agregado al pedido!', position:'left', duration:10000, classes:'   alert-success'});
          }, function errorCallback(response) {

            if(response.status == 410){
      				  notify({ message:response.data.msg, position:'left', duration:20000, classes:'   alert-danger'});
                $(function(){
                  $("#addPedidoModal").modal("hide");
                  $("#showPedidoModal").modal("hide");
                  $('.modal-backdrop').remove();
                })
                $scope.getPedidos_filteringV2();
      			}
            if(response.status == 480){
                notify({ message:response.data.msg, position:'left', duration:20000, classes:'   alert-danger'});

            }
            $scope.loading = false
          });
        }

        $scope.removeDetalleProducto = function(i){

          $scope.loading = true
          var body = {};

          body.COD_PRODUCTO = $scope.pedido.pedido[i].COD_PRODUCTO;
          body.id_pedido = $scope.ID
          body.username = $scope.userLogged.username
          request.post(ip+'/del/detalle_producto', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {


            $scope.getPedidos_filteringV2();
            $scope.getProdNew(true, null, true)
            $scope.removeArt(i)
            $scope.loading = false

            $scope.totalesDdo = formatoTotales(response.data.totales)
          }, function errorCallback(response) {

            if(response.status == 410){
                notify({ message:response.data.msg, position:'left', duration:20000, classes:'   alert-danger'});
                $(function(){
                  $("#addPedidoModal").modal("hide");
                  $("#showPedidoModal").modal("hide");
                  $('.modal-backdrop').remove();
                })
                $scope.getPedidos_filteringV2();
            }

            $scope.loading = false
          });
        }



        $scope.delPedido = function(){

          $scope.loading = true
          var body = $scope.buildBody();
          body.ID = $scope.ID
          body.username = $scope.userLogged.username
          request.post(ip+'/del/pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

              $scope.getPedidos_filteringV2();
              $scope.ID = null;
              notify({ message:'¡Pedido eliminado con éxito!', position:'left', duration:10000, classes:'   alert-success'});
              $scope.reset();
              $scope.oneOrder()

              $scope.loading = false
          }, function errorCallback(response) {

          });
        }

        $scope.confirmModal = function (ID) {
          $scope.ID = ID
        }


        $scope.updDetalleProducto = function(articulo, indexArticulo, listAux){

          var body = {};
          var result
          body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
          body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
          body.pedido = articulo
          body.ID = $scope.ID
          body.username = $scope.userLogged.username
          request.post(ip+'/upd/detalle_producto', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {


            $scope.getPedidos_filteringV2();

            if(response.data.reserved < articulo.CANTIDAD ){
              articulo.CANTIDAD = response.data.reserved
              articulo.alert = true
            }else{
              articulo.alert = false
            }


            $scope.totalesDdo = formatoTotales(response.data.totales)

            result = articulo

            $scope.pedido.pedido.push($scope.articulo)

            $scope.pedido.pedido.splice( indexArticulo, 1 );

            calcularTotales()
            getTotalesPedido()
            $(function(){
              $("#modalInfoProduct").modal('hide');
            })
            notify({ message:'¡Linea actulizada con éxito!', position:'left', duration:10000, classes:'   alert-success'});

          }, function errorCallback(response) {

            if(response.status == 410){
                notify({ message:response.data.msg, position:'left', duration:20000, classes:'   alert-danger'});
                $(function(){
                  $("#addPedidoModal").modal("hide");
                  $("#showPedidoModal").modal("hide");
                  $('.modal-backdrop').remove();
                })
                $scope.getPedidos_filteringV2();
            }

            if(response.status == 480){
              notify({ message:response.data.msg, position:'left', duration:20000, classes:'   alert-danger'});
              $scope.pedido.pedido = listAux
            }

          });

          return result
        }

        $scope.closeModalInfoProduct = function(){
          calcularTotales()
        }

        $scope.existenciaEdit = null
        $scope.cantidadAux = 0
        $scope.editRowIndex = -1
        $scope.editArticulo = null

        $scope.editRow = function (articulo, i) {


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

            if(response.data.obj.length > 0){
              response.data.obj.forEach((item, i) => {

                item.CANTIDAD = $scope.cantidadAux;
                item.existencia = parseInt($scope.cantidadAux) + parseInt(item.existencia)
                $scope.editProduct = true
                $scope.productIndex = i

              });

              $scope.articulo = response.data.obj[0]

            }else{
              notify({ message:'¡No se encontraron resultados!', position:'left', duration:10000, classes:'   alert-warning'});
            }

          }, function errorCallback(response) {

          });

          $(function(){
            $("#modalInfoProduct").modal({
                backdrop: 'static',
                keyboard: false
            });
          })

        }

        $scope.errorValidaArticulo = false
        $scope.addArtPedido = function(){
            if(Object.keys($scope.articulo).length === 0)
              return

            var error=false;
            var existe = false;
            var indexArticulo = null
            $scope.pedido.pedido.forEach((element,i) => {

              if($scope.articulo.cod_producto == element.COD_PRODUCTO){
                $scope.articulo.COD_PRODUCTO = element.COD_PRODUCTO
                indexArticulo = i
                existe = true;

              }
            });


            if(!existe){

              if(!validacionesArticulo($scope.articulo)){

                $scope.addDetalleProducto($scope.articulo)

              }

            }else{

              var listAux = $scope.pedido.pedido

              var existenciaAux = $scope.articulo.existencia

              calcularTotales(indexArticulo)

              error = validacionesArticulo($scope.articulo, existenciaAux)

              if(!error){
                if($scope.auxCantidadBlur == $scope.articulo.CANTIDAD){
                  return
                }
                $scope.updDetalleProducto($scope.articulo, indexArticulo, listAux);

              }else{

                $scope.pedido.pedido = listAux

              }
              $scope.articulo.existencia = existenciaAux

              return
            }

        }
        $scope.artEmpleado = 0

        function validacionesArticulo(articulo , existenciaAux = null) {


          if(isEmpty( articulo.COD_PRODUCTO ) && isEmpty( articulo.cod_producto )){

            return  true;
          }
           if( isEmpty(articulo.CANTIDAD ) || articulo.CANTIDAD < 1 ){

            notify({ message:'¡Por favor verifique la cantidad!', position:'left', duration:10000, classes:'   alert-danger'});
            return  true;
          }

           if( articulo.CANTIDAD > parseInt(articulo.existencia)  ){


              notify({ message:'¡La cantidad no puede ser mayor a la existencia!', position:'left', duration:10000, classes:'   alert-danger'});
             return  true;
          }


          if( !validaCreditoContraProducto(parseFloat(articulo.precio_neto_bs) * articulo.CANTIDAD)  ){

            notify({ message:'¡El precio excede el crédito disponible!', position:'left', duration:10000, classes:'   alert-danger'});

            return  true;
          }

          console.log("$scope.clienteEmpleado", $scope.clienteEmpleado);
          if( $scope.clienteEmpleado == true){
            console.log("entro en validacion de empleado");

            if( $scope.naturalLimits ){

              if(  articulo.CANTIDAD > 1  ){
                 notify({ message:'¡Solo puede solicitar una unidad por producto!', position:'left', duration:10000, classes:'   alert-danger'});
                return  true;
              }

              if(articulo.disp_prod_emp == "N"){
                notify({ message:'¡Este producto ya fue solicitado en un pediodo el dia de hoy!', position:'left', duration:10000, classes:'   alert-danger'});
               return  true;
              }

            }


            console.log("articulo.tipo_prod_emp", articulo.tipo_prod_emp);
            if(articulo.tipo_prod_emp == "MEDICINA"){
              console.log("$scope.totales.empMed + articulo.CANTIDAD ", $scope.totales.empMed + articulo.CANTIDAD);
              console.log("$scope.client.unid_disp_med_emp", $scope.client.unid_disp_med_emp);
              if( ($scope.totales.empMed + articulo.CANTIDAD) > $scope.client.unid_disp_med_emp){
                notify({ message:'¡Excede cantidad disponible en medicinas!', position:'left', duration:10000, classes:'   alert-danger'});
                // notify({ message:'¡La cantidad ingresada excede la cantidad que usted tiene disponible ('+(  $scope.client.unid_disp_med_emp - $scope.totales.empMed)+') para medicinas!', position:'left', duration:10000, classes:'   alert-danger'});
               return  true;
              }
            }else if(articulo.tipo_prod_emp == "MISCELANEO"){
              console.log("$scope.totales.empMisc + articulo.CANTIDAD", $scope.totales.empMisc + articulo.CANTIDAD);
              console.log("$scope.client.unid_disp_misc_emp", $scope.client.unid_disp_misc_emp);
              if( ($scope.totales.empMisc + articulo.CANTIDAD) > $scope.client.unid_disp_misc_emp){
                
                notify({ message:'¡Excede cantidad disponible en misceláneos!', position:'left', duration:10000, classes:'   alert-danger'});

              // notify({ message:'¡La cantidad ingresada excede la cantidad que usted tiene disponible ('+( $scope.client.unid_disp_misc_emp - $scope.totales.empMisc )+') para productos misceláneos!', position:'left', duration:10000, classes:'   alert-danger'});
               return  true;
              }
            }

          }

          return false

        }

        function isEmpty(str) {
            return (!str || 0 === str.length);
        }

        $scope.buildBody = function(){

          var fecha = new Date( $scope.pedido.fecha)

          var aux = $scope.pedido.pedido
          aux.forEach(element => {

            element.precio_bruto = parseFloat(element.precio_bruto).toFixed(2)

          });

          var body= {}
          body.cod_cia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
          body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
          body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;

          var body = {

            "COD_CIA": body.cod_cia,
            "GRUPO_CLIENTE": body.pNoGrupo,
            "COD_CLIENTE": body.pCliente,
            "FECHA": fecha.getDate()+"-"+ (fecha.getMonth()+1) +"-"+ fecha.getFullYear(),
            "NO_PEDIDO_CODISA":($scope.editView)? $scope.pedido.no_factu:"---",
            "OBSERVACIONES": $scope.pedido.observacion || "",
            "ESTATUS": "0",
            "pedido": aux
          }

          return body
        }

        $scope.closeModalOrder =  function () {
          console.log($scope.pedido);
          if($scope.pedido.estatus =='PEDIDO EN CONSTRUCCION' || $scope.pedido.estatus =='PEDIDO CREADO' || $scope.pedido.estatus == 'POR PROCESAR' || $scope.pedido.estatus == 'PEDIDO EN EDICION'){

            if($scope.pedido.pedido.length < 1){

                $scope.delPedido()
                $(function(){
                  $("#addPedidoModal").modal("hide");
                  $("#showPedidoModal").modal("hide");
                  $('.modal-backdrop').remove();
                })
            }else{
              console.log("openModalDyn");
              $scope.openModalDyn(5, null);
            }
          }else{
              $scope.reset()
              $(function(){
                $("#addPedidoModal").modal("hide");
                $("#showPedidoModal").modal("hide");
                $('.modal-backdrop').remove();
              })

          }

        }

        $scope.reset = function(){
          $scope.stopTimeout()
          // $scope.resetTime()
          $scope.$broadcast('timer-start');
          $scope.stop1()
          $scope.totalesDdo = {"total_bruto":"0","desc_volumen":"0","otros_descuentos":"0","desc_adicional":"0","desc_dpp":"0","sub_total":"0","impuesto":"0","total":"0","totalExento":"0","totalGravado":"0", "descImpuesto":null, "totalNetoUSD":"0"}
          $scope.counter = $scope.timeLimit;
          $scope.tabsIndex = 0
          $scope.totales.bolivares = 0
          $scope.totales.USD = 0
          $scope.totales.bsIVA = 0
          $scope.totales.USDIVA = 0
          $scope.totales.bsConIva = 0
          $scope.totales.UsdConIva = 0
          $scope.totales.empMisc = 0
          $scope.totales.empMed = 0
          $scope.busqueda_prod = null
          $scope.productIndex = -1

          $scope.proveedor.cod_proveedor = null
          $scope.categoria.CODIGO = null


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

          request.post(ip+'/get/pedido', obj, {'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {


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

            $scope.loading = false
          });
        }

        $scope.getPedidos_filtering = function(no_client){


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


            $scope.listaPedidosV2 = response.data.data.sort(function(a, b) {
              var keyA = a.ID,
                keyB = b.ID;

              if (keyA < keyB) return 1;
              if (keyA > keyB) return -1;
              return 0;
            });


              $scope.oneOrder();
              $scope.loading = false

          }, function errorCallback(response) {
            $scope.oneOrder();
            $scope.loading = false
          });
        }

        $scope.showPedido = function(pedido){


          $scope.editView = false;
          $scope.tabsIndex = 1;

          $scope.pedido = pedido;

          $scope.pickUpAvailable = (pedido.tipo_pedido == "N")? "1":"2";

          if(pedido.estatus_id < 3 || pedido.estatus_id == 6){
            $scope.editPedido()
          }
          calcularTotales()
        }

        $scope.removeArt = function(i){

          $scope.pedido.pedido.splice( i, 1 );

          calcularTotales()
          $scope.counter = $scope.timeLimit;
          // $scope.stopTimeout()
          // $scope.countdown()
          // mytimeout = $timeout(function (){
          //   $scope.onTimeout()
          // },$scope.timeLimit * 1000);
          // $scope.resetTime()
        }

        $scope.totales = {
          'bolivares':0,
          'USD':0,
          'bsIVA':0,
          'USDIVA':0,
          'bsConIva':0,
          'UsdConIva':0,
          'empMisc':0,
          'empMed':0,
        }
        $scope.tipoPedido = "N"
        function calcularTotales(editIndex = null) {

            $scope.totales.bolivares = 0
            $scope.totales.USD = 0
            $scope.totales.bsIVA = 0
            $scope.totales.USDIVA = 0
            $scope.totales.bsConIva = 0
            $scope.totales.UsdConIva = 0
            $scope.totales.empMisc = 0
            $scope.totales.empMed = 0

            $scope.pedido.pedido.forEach((element, i )=> {

              if(editIndex != null && editIndex == i){

                return;
              }

              $scope.totales.bolivares = parseFloat($scope.totales.bolivares) + (parseFloat(element.precio_neto_bs) * element.CANTIDAD)

              $scope.totales.USD = parseFloat($scope.totales.USD)  + (parseFloat(element.precio_neto_usd) * element.CANTIDAD)

              $scope.totales.bsIVA = parseFloat($scope.totales.bsIVA) + (parseFloat(element.iva_bs) * element.CANTIDAD)

              $scope.totales.USDIVA = parseFloat($scope.totales.USDIVA) + (parseFloat(element.iva_usd) * element.CANTIDAD)

              if( $scope.clienteEmpleado == true ){
                if(element.tipo_prod_emp == "MISCELANEO"){
                  $scope.totales.empMisc += parseInt(element.CANTIDAD)
                }
                if(element.tipo_prod_emp == "MEDICINA"){
                  $scope.totales.empMed += parseInt(element.CANTIDAD)
                }
              }


            });

          $scope.totales.bolivares = parseFloat($scope.totales.bolivares)
          $scope.totales.USD = parseFloat($scope.totales.USD)
          $scope.totales.bsIVA = parseFloat($scope.totales.bsIVA)
          $scope.totales.USDIVA = parseFloat($scope.totales.USDIVA)
          $scope.totales.bsConIva = parseFloat($scope.totales.bolivares + $scope.totales.bsIVA)
          $scope.totales.UsdConIva = parseFloat($scope.totales.USD + $scope.totales.USDIVA)

            if(!$scope.clienteEmpleado && $scope.pickUpAvailable == "2"){
              if($scope.totales.bsConIva > $scope.client.monto_min_pick){
                $scope.tipoPedido = "D"
              }else{
                $scope.tipoPedido = "N"
              }

            }

            // console.log(  $scope.totales);
        }

        function validaCreditoContraProducto(valor) {

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

       $scope.secondsToString = function (seconds) {
          var hour = Math.floor(seconds / 3600);
          hour = (hour < 10)? '0' + hour : hour;
          var minute = Math.floor((seconds / 60) % 60);
          minute = (minute < 10)? '0' + minute : minute;
          var second = seconds % 60;
          second = (second < 10)? '0' + second : second;
          return hour + ':' + minute + ':' + second;
        }

        $scope.liveTimeOrd = 0
        // $scope.timeLimit = 899999
        $scope.tiempoPedido = function (id) {
          $scope.loading = true
          var body = {}
          body.pIdPedido = id
          request.post(ip+'/tiempo_resta_pedido/articulo', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {

            // notify({ message:"Su pedido cuenta con "+ $scope.secondsToString(response.data.time) +"  para ser cancelado automáticamente por el sistema ", position:'left', duration:10000, classes:'   alert-info'});
            var tiempo =  parseInt(response.data.time )
            $scope.liveTimeOrd = tiempo

            // alert(response.data.time)

            // $scope.mytimeoutOrdCancel = $timeout($scope.onTimeoutOrdCancel(),$scope.liveTimeOrd);

            console.log("tiempo de servidor " , $scope.msToTime(tiempo*1000))
            if (tiempo < 600 ) {
            
              $scope.msgOrdCancel = true;
            }
            $scope.timerRunning = true;
            // msgOrdCancel

            $scope.loading = false

          }, function errorCallback(response) {
            if(response.status == 407){
              notify({ message:"No se pudo obtener esta informacion, intente mas tarde", position:'left', duration:10000, classes:'   alert-warning'});
            }
            $scope.loading = false
          });

        }
        $scope.mytimeoutOrdCancel = null
        $scope.msgOrdCancel =  false
        $scope.countOrdCancel = 0
        $scope.onTimeoutOrdCancel = function(){

          // $scope.liveTimeOrd -= 1000

          // if($scope.liveTimeOrd < 900001 ){
            $scope.msgOrdCancel =  true
          // }
          // if ($scope.liveTimeOrd < 1001 ) {
            // $scope.cancel_pedido()
            $scope.stopTimeoutOrdCancel()
            // return
          // }

          // $scope.mytimeoutOrdCancel = $timeout($scope.onTimeoutOrdCancel(),1000);

        }


        $scope.stopTimeoutOrdCancel = function(){

            $timeout.cancel($scope.mytimeoutOrdCancel);
            $scope.liveTimeOrd = null;
        }


        $scope.dtOptions = DTOptionsBuilder.newOptions()
            .withPaginationType('full_numbers')
            .withOption('responsive', true)
            .withDOM('frtip')
            .withPaginationType('full_numbers')
            .withLanguage(DATATABLE_LANGUAGE_ES)
            .withDisplayLength(15)


        $scope.dtOptionsProd = DTOptionsBuilder.newOptions()
            .withPaginationType('full_numbers')
            // .withOption('responsive', true)
            .withDOM('frtip').withPaginationType('full_numbers')
            .withLanguage(DATATABLE_LANGUAGE_ES)
        $scope.dtOptionsDetalil = DTOptionsBuilder.newOptions()
            .withPaginationType('full_numbers')
            .withOption('responsive', true)
            .withDOM('frtip').withPaginationType('full_numbers')
            .withLanguage(DATATABLE_LANGUAGE_ES)
        $scope.dtOrderDetalil = DTOptionsBuilder.newOptions()
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
          console.log(totales)
          // totales.total_bruto = totales.total_bruto.replace(",",".")
          // totales.desc_volumen = totales.desc_volumen.replace(",",".")
          // totales.otros_descuentos = totales.otros_descuentos.replace(",",".")
          // totales.desc_adicional = totales.desc_adicional.replace(",",".")
          // totales.desc_dpp = totales.desc_dpp.replace(",",".")
          // totales.sub_total = totales.sub_total.replace(",",".")
          // totales.impuesto  = totales.impuesto.replace(",",".")
          // totales.total  = totales.total.replace(",",".")
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
            "title": "Información",
            "msg" : "Si no alcanza el monto mínimo para pick-up su pedido sera procesado como tipo normal ¿Está seguro de finalizarlo? ",
            "color": "warning"
          },
          {
            "title": "Confirmación",
            "msg" : "¿Desea conservar este pedido para editarlo posteriormente?",
            "color": "alert"
          }
        ]

        proveedores()
        getCategorias()

        $scope.timerRunning = false;

        $scope.$on('timer-tick', function (event, args) {
          // $scope.timerConsole += $scope.timerType  + ' - event.name = '+ event.name + ', timeoutId = ' + args.timeoutId + ', millis = ' + args.millis +'\n';
          // console.log(args.millis)
          var s = args.millis
          var ms = s % 1000;
          s = (s - ms) / 1000;
          // console.log($scope.msToTime(args.millis));
          if(s <= 900){
            $scope.msgOrdCancel =  true
          }
          if(s == 1 ){
            console.log("cancelo");
            $scope.cancel_pedido()
          }

        });
        $scope.imgTitle = null;
        $scope.viewImg = null;
        $scope.zoomImg = function ( src, nombreProd) {

          console.log("zoom")
          $scope.imgTitle = nombreProd;
          $scope.viewImg = src;
          // Get the image and insert it inside the modal - use its "alt" text as a caption
          $(function(){
            $("#modalImg").modal("show");

          })

          
        }




    }
])
// .config(function(IdleProvider, KeepaliveProvider) {
//   KeepaliveProvider.interval(10);
//   IdleProvider.windowInterrupt('focus');
// })
.run(function($rootScope, Idle, $log, Keepalive){
  Idle.watch();
})
;
 