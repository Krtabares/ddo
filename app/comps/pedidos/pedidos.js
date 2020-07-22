'use strict';

angular.module('app.pedidos', ['datatables', 'datatables.buttons', 'datatables.bootstrap','ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])
  .config(['$routeProvider', function($routeProvider) {
  
    $routeProvider.when('/pedidos', {
      templateUrl: 'comps/pedidos/pedidos.html',
      controller: 'pedidosCtrl'
    });
  }])
  .controller('pedidosCtrl', ['$scope', '$q', 'localstorage', '$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'DTOptionsBuilder', 'DTColumnDefBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, DTOptionsBuilder, DTColumnDefBuilder, NgMap, $localStorage) {
        //init    

                

		
        $scope.pedido = {
            'fecha': new Date(),
            'pedido':[]
        };
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

        $scope.initModal = function () {
          console.log("initmodal")
          $scope.reset()
          
        }

        $scope.nuevoTotal = function () {
          // console.log($scope.totales.bolivares)
          // console.log( $scope.articulo.PRECIO )
          // console.log( $scope.articulo.CANTIDAD)
          var total =  parseFloat($scope.totales.bolivares)
                                           + parseFloat($scope.articulo.PRECIO | 0 )* ($scope.articulo.CANTIDAD | 0  )
          return $scope.formato(2, total)
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

        $scope.editPedido= function(){
          $scope.editView = true
        }

        $scope.selectCLient = function(){
          console.log($scope.client )
          // $scope.client = x
            $scope.client  = $scope.clientes[ $scope.clientIndex ];
            selectCLientCAP( $scope.client)

        }

        function selectCLientCAP(client){

          $scope.pedido.no_cia = client.COD_CIA;
            $scope.pedido.grupo = client.GRUPO_CLIENTE
            $scope.pedido.no_cliente = client.COD_CLIENTE

            console.log($scope.pedido, "pedido select" )  

        } 

        function listarPedidos(){
         var body = {}
           body.pCliente = $scope.client.COD_CLIENTE
           request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
             .then(function successCallback(response) {
               console.log(response.data)
   
               $scope.listaPedidos=response.data.data
               // defer.resolve(response.data.data);
            });
        }
   
        verificClient()

        function verificClient(){
          
         var client = localStorage.getItem('client')
         var client_info = localStorage.getItem('client_info')
         console.log(client)
         if( client ==  null){
           $scope.hasClient = false;
         }else{
           $scope.hasClient = true;
           $scope.client = JSON.parse(client);
           $scope.client_info = JSON.parse(client_info);
            selectCLientCAP( $scope.client)
         } 

         listarPedidos()
         console.log($scope.client_info)
        }


        $scope.selectProduct = function(){
          console.log($scope.product )
          // $scope.client = x
            $scope.product  = $scope.productos[ $scope.productIndex ];
            $scope.articulo.COD_PRODUCTO = $scope.product.cod_producto;
            $scope.articulo.PRECIO = $scope.product.precio.replace(",", ".");
            // $scope.articulo.PRECIO = $scope.product.precio
            $scope.articulo.existencia =$scope.product.existencia
            $scope.articulo.CANTIDAD = 1
            // $scope.articulo.no_cliente = $scope.client.cod_cliente

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

        $scope.getProdNew = function (filter = false) {
          console.log("getProdNew");
          var body = {};
          if(filter){
            body.pNombre = $scope.nombre_cliente
            body.pNoCia = $scope.client.COD_CIA
            body.pNoGrupo = $scope.client.GRUPO_CLIENTE
            body.pCliente = $scope.client.COD_CLIENTE
            body.pBusqueda = $scope.busqueda_prod
          }
          request.post(ip+'/procedure_productos', body,{})
          .then(function successCallback(response) {
            console.log(response)
            if(response.data.obj.length > 1){
              $scope.productos = response.data.obj
            }else{
              ngNotify.set('¡No se encontraron resultados!', 'warn')
            }

          }, function errorCallback(response) {
            console.log(response)
          });
        }
        
        
        $scope.getFarmacias = function(){
          request.get(ip+'/get/farmacias',{})
          .then(function successCallback(response) {
            console.log(response)
            /*if (response.data.exist) {
              ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
            } else if (response.data.email_flag) {
              ngNotify.set('¡Ya el correo está registrado!','error')
            }*/
          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.getClient = function(){
          request.get(ip+'/get/client',{})
          .then(function successCallback(response) {
            console.log(response)
            /*if (response.data.exist) {
              ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
            } else if (response.data.email_flag) {
              ngNotify.set('¡Ya el correo está registrado!','error')
            }*/
          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.addPedido = function(){
          // console.log(pedido);
          var body = $scope.buildBody();
          request.post(ip+'/add/pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)
              $scope.reset();
              $scope.getPedidos_filtering();
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

        $scope.updPedido = function(){
          // console.log(pedido);
          var body = $scope.buildBody();
          body.ID = $scope.ID
          request.post(ip+'/upd/pedido', body,{'Authorization': 'Bearer ' + localstorage.get('token', '')})
          .then(function successCallback(response) {
            console.log(response)
              $scope.reset();
              $scope.getPedidos_filtering();
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

              
               if( $scope.articulo.CANTIDAD > $scope.articulo.existencia  ){
                // console.log('¡Complete todos los campos!PRECIO','error')
                  ngNotify.set('¡La cantidad no puede ser mayor a la existencia!','error')
                 error = true;
              }
              $scope.articulo.PRECIO = $scope.articulo.PRECIO.replace(",", ".");
              // $scope.articulo.PRECIO = parseFloat($scope.articulo.PRECIO).toFixed(2);
               
              console.log($scope.articulo.PRECIO);
              if(!error)          
                $scope.pedido.pedido.push($scope.articulo)
                calcularTotales()
            }
           
            if(!error){
              $scope.articulo = {};
              $scope.productIndex = -1
              // $scope.productos = [];
              $scope.product = {}
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

          // $scope.pedido.no_cia = client.COD_CIA;
          // $scope.pedido.grupo = client.GRUPO_CLIENTE
          // $scope.pedido.no_cliente = client.COD_CLIENTE

          var body = {
            "COD_CIA": $scope.client.COD_CIA,
            "GRUPO_CLIENTE": $scope.client.GRUPO_CLIENTE,
            "COD_CLIENTE": $scope.client.COD_CLIENTE,
            "FECHA": fecha.getDate()+"-"+ fecha.getMonth()+"-"+ fecha.getFullYear(),
            "NO_PEDIDO_CODISA":($scope.editView)? $scope.pedido.no_factu:"---",
            "OBSERVACIONES": $scope.pedido.observacion || "",
            "ESTATUS": "0",
            "pedido": aux
          }
          console.log(body,"body")
          return body
        }

        $scope.reset = function(){
          $scope.totales.bolivares = 0
          $scope.busqueda_prod = null
          $scope.productIndex = -1
          $scope.clientes = null
          $scope.clientIndex = -1
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
        }
        $scope.getPedidos = function(page){
          var obj = {'page': page};
		  // console.log($localStorage.token);
          request.post(ip+'/get/pedidos', obj, {'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1ODk5Nzk2NTcsIm5iZiI6MTU4OTk3OTY1NywianRpIjoiZGFjNTZjM2QtZjM2ZC00NTRkLTkwNWYtZmZmZjFiYjI2ZTE5IiwiaWRlbnRpdHkiOiJhZG1pbiIsImZyZXNoIjpmYWxzZSwidHlwZSI6ImFjY2VzcyJ9.Ff_CfwXCIxLGinnAkS8C7vUxColNK_utxy-LzJt0188'})
          .then(function successCallback(response) {
            console.log(response.data)
            if(response.data.data.length > 0){
              $scope.listPedido = response.data.data;
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
          request.post(ip+'/get/pedido', obj, {'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1ODk5Nzk2NTcsIm5iZiI6MTU4OTk3OTY1NywianRpIjoiZGFjNTZjM2QtZjM2ZC00NTRkLTkwNWYtZmZmZjFiYjI2ZTE5IiwiaWRlbnRpdHkiOiJhZG1pbiIsImZyZXNoIjpmYWxzZSwidHlwZSI6ImFjY2VzcyJ9.Ff_CfwXCIxLGinnAkS8C7vUxColNK_utxy-LzJt0188'})
          .then(function successCallback(response) {
            console.log(response.data)
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
          
          var body = {}
          body.pCliente = $scope.client.COD_CLIENTE
          request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          .then(function successCallback(response) {
            console.log(response.data)

              $scope.listPedido = response.data.data;

          }, function errorCallback(response) {
            console.log(response)
          });
        }

        $scope.getProductos = function(no_cia){
          var obj = {'no_cia': no_cia};
          request.get(ip+'/get/productos' ,{})
          .then(function successCallback(response) {
            console.log(response.data)
            /*if (response.data.exist) {
              ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
            } else if (response.data.email_flag) {
              ngNotify.set('¡Ya el correo está registrado!','error')
            }*/
          }, function errorCallback(response) {
            console.log(response)
          });
        }
        $scope.totales = {
          'bolivares':0
        }
        $scope.showPedido = function(pedido){
          console.log(pedido);

          $scope.editView =false;
          pedido.fecha = new Date(pedido.fecha);
          $scope.pedido = pedido;
          
          
          calcularTotales()
        }

        $scope.removeArt = function(i){
          $scope.pedido.pedido.splice( i, 1 );
          calcularTotales()
        }
        
        function calcularTotales() {
          $scope.totales.bolivares = 0
          $scope.pedido.pedido.forEach(element => {
            
            $scope.totales.bolivares = parseFloat($scope.totales.bolivares)
                                           + (parseFloat(element.PRECIO) * element.CANTIDAD)
                                                          
          });
          console.log($scope.totales.bolivares)
          $scope.totales.bolivares = parseFloat($scope.totales.bolivares).toFixed(2)
        }

		
      $scope.dtOptions = DTOptionsBuilder.newOptions().withPaginationType('full_numbers').withOption('responsive', true).withButtons([
        'columnsToggle',
        'colvis',
        'copy',
        'print',
        'excel',
        ])
      // .withDisplayLength(2);

		// $scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
    //     var defer = $q.defer();
    //     var body = {}
    //     body.pCliente = $scope.client.COD_CLIENTE
    //     request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
    //       .then(function successCallback(response) {
    //         console.log(response.data)


		// 	      defer.resolve(response.data.data);
    //      });
		 
    //     return defer.promise;
		// })
		// .withDOM('frtip')
    //     .withPaginationType('full_numbers')
		// .withButtons([
    //         'colvis',
    //         'pdf',
    //         'excel'
    //     ])
		
        $scope.dtColumns = [
            DTColumnBuilder.newColumn('no_cia').withTitle('Número cia'),
            DTColumnBuilder.newColumn('grupo').withTitle('Grupo'),
            DTColumnBuilder.newColumn('no_cliente').withTitle('Número cliente'),
            DTColumnBuilder.newColumn('no_factu').withTitle('Número factura'),
            DTColumnBuilder.newColumn('estatus').withTitle('Estatus'),
            DTColumnBuilder.newColumn('precio').withTitle('Precio'),
            DTColumnBuilder.newColumn('cantidad').withTitle('Cantidad de Productos')
        ];
       $scope.dtColumnDefs = [
          DTColumnDefBuilder.newColumnDef(0).notVisible(),
          DTColumnDefBuilder.newColumnDef(1).notVisible(),
          DTColumnDefBuilder.newColumnDef(2).notVisible(),
          DTColumnDefBuilder.newColumnDef(3),
          DTColumnDefBuilder.newColumnDef(4),
          DTColumnDefBuilder.newColumnDef(5),
          DTColumnDefBuilder.newColumnDef(6).notSortable()
      ];



      //   $scope.$on('modal.closing', function(event, reason, closed) {
      //     console.log('modal.closing: ' + (closed ? 'close' : 'dismiss') + '(' + reason + ')');
      //     var message = "You are about to leave the edit view. Uncaught reason. Are you sure?";
      //     switch (reason){
      //         // clicked outside
      //         case "backdrop click":
      //             message = "Any changes will be lost, are you sure?";
      //             break;
      
      //         // cancel button
      //         case "cancel":
      //             message = "Any changes will be lost, are you sure?";
      //             break;
      
      //         // escape key
      //         case "escape key press":
      //             message = "Any changes will be lost, are you sure?";
      //             break;
      //     }
      //     if (!confirm(message)) {
      //         event.preventDefault();
      //     }
      // });
		

    }
]);


