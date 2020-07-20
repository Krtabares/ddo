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
        $scope.articulo = {};
        $scope.nombre_cliente = null;
        $scope.busqueda_prod = null;
        $scope.clientes = null;
        $scope.client = {};
        $scope.clientIndex = -1;
        $scope.productos = null;
        $scope.product = {};
        $scope.productIndex = -1;
        var ip = "http://192.168.168.170:3500";
        //list pedido
        $scope.listPedido = [];

        // $('.my-select').selectpicker();

        $scope.initModal = function () {
          console.log("initmodal")
          // $scope.getClientNew();
          
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

        $scope.listaPedidos=[]
    
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
         console.log(client)
         if( client ==  null){
           $scope.hasClient = false;
         }else{
           $scope.hasClient = true;
           $scope.client = JSON.parse(client);
            selectCLientCAP( $scope.client)
         } 

         $scope.listarPedidos()
         console.log($scope.client)
       }


        $scope.selectProduct = function(){
          console.log($scope.product )
          // $scope.client = x
            $scope.product  = $scope.productos[ $scope.productIndex ];
            $scope.articulo.COD_PRODUCTO = $scope.product.cod_producto;
            $scope.articulo.PRECIO = $scope.product.precio
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
        $scope.addArtPedido = function(){
            console.log($scope.pedido.pedido);
            if(Object.keys($scope.articulo).length === 0)
              return
            
            var existe = false;
            $scope.pedido.pedido.forEach(element => {
              if($scope.articulo.COD_PRODUCTO == element.COD_PRODUCTO){
                 element.CANTIDAD = element.CANTIDAD + $scope.articulo.CANTIDAD;
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
              console.log(error);
              if(!error)          
                $scope.pedido.pedido.push($scope.articulo)
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
           var body = {
              "COD_CIA": $scope.pedido.no_cia,
              "GRUPO_CLIENTE": $scope.pedido.grupo,
              "COD_CLIENTE": $scope.pedido.no_cliente,
              "FECHA": fecha.getDate()+"-"+ fecha.getMonth()+"-"+ fecha.getFullYear(),
              "NO_PEDIDO_CODISA": "---",
              "OBSERVACIONES": $scope.pedido.observacion || "",
              "ESTATUS": "0",
              "pedido": $scope.pedido.pedido
            }
            console.log(body,"body")
            return body
          }

          $scope.reset = function(){
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
    // console.log($localStorage.token);
        request.post(ip+'/get/pedido', obj, {'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1ODk5Nzk2NTcsIm5iZiI6MTU4OTk3OTY1NywianRpIjoiZGFjNTZjM2QtZjM2ZC00NTRkLTkwNWYtZmZmZjFiYjI2ZTE5IiwiaWRlbnRpdHkiOiJhZG1pbiIsImZyZXNoIjpmYWxzZSwidHlwZSI6ImFjY2VzcyJ9.Ff_CfwXCIxLGinnAkS8C7vUxColNK_utxy-LzJt0188'})
        .then(function successCallback(response) {
          console.log(response.data)
          $scope.showPedido(response.data.obj)
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

        $scope.getPedidos_filtering = function(no_client){
          
          var body = {}
          body.pCliente = $scope.client.COD_CLIENTE
          request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          .then(function successCallback(response) {
            console.log(response.data)
			if(response.data.length > 0){
				$scope.pedido = response.data;
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


        $scope.showPedido = function(pedido){
          console.log(ID);
          $scope.pedido = pedido;
        }

        $scope.removeArt = function(i){
          $scope.pedido.pedido.splice( i, 1 );
        }

        

		
		

		$scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        var body = {}
        body.pCliente = $scope.client.COD_CLIENTE
        request.post(ip+'/get/pedidos', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
          .then(function successCallback(response) {
            console.log(response.data)


			      defer.resolve(response.data.data);
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