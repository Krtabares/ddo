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
            'pedido':[]
        };
        $scope.articulo = {};
        $scope.nombre_cliente = null;
        $scope.clientes = [{}];
        $scope.productos = [{}];
        var ip = "http://192.168.168.170:3500";
        //list pedido
        $scope.listPedido = [];

        // $('.my-select').selectpicker();

        $scope.initModal = function () {
          console.log("initmodal")
          $scope.getClientNew();
          
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
			// $scope.reset();
			// $scope.getPedidos(1);
            /*if (response.data.exist) {
              ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
            } else if (response.data.email_flag) {
              ngNotify.set('¡Ya el correo está registrado!','error')
            }*/
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

        $scope.addPedido = function(pedido){
          console.log(pedido);
          var body = $scope.buildBody();
          request.post(ip+'/add/pedido', body,{})
          .then(function successCallback(response) {
            console.log(response)
			$scope.reset();
			$scope.getPedidos(1);
            /*if (response.data.exist) {
              ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
            } else if (response.data.email_flag) {
              ngNotify.set('¡Ya el correo está registrado!','error')
            }*/
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
                 error = true;
              }
               if(isEmpty( $scope.articulo.PRECIO ) || $scope.articulo.PRECIO < 1 ){
                console.log('¡Complete todos los campos!PRECIO','error')
                 error = true;
              }
              console.log(error);
              if(!error)          
                $scope.pedido.pedido.push($scope.articulo)
            }
           
            if(!error)
            $scope.articulo = {};
            
          }

          function isEmpty(str) {
            return (!str || 0 === str.length);
          }

          $scope.buildBody = function(){
           var body = {
              "COD_CIA": $scope.pedido.no_cia,
              "GRUPO_CLIENTE": $scope.pedido.grupo,
              "COD_CLIENTE": $scope.pedido.no_cliente,
              "FECHA": $scope.pedido.fecha,
              "NO_PEDIDO_CODISA": "324",
              "OBSERVACIONES": $scope.pedido.observacion,
              "ESTATUS": "0",
              "pedido": $scope.pedido.pedido
            }
            return body
          }

		$scope.reset = function(){
			$scope.pedido = {'no_cia':'',
						'grupo':'',
						'no_cliente':'',
						'no_factu':'',
						'no_arti':'',
						'cantidad':'',
						'precio':'',
						'fecha':'',
                        'observacion':'',
                        'pedido':[],
                    };
		}

        $scope.getPedidos = function(page){
          var obj = {'page': page};
		  console.log($localStorage.token);
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

        $scope.getPedidos_filtering = function(no_client){
          var obj = {'no_client':no_client};
          request.post(ip+'/get/pedidos_filtered', obj,{})
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
          console.log(pedido);
          $scope.pedido = pedido;
        }

        $scope.removeArt = function(i){
          $scope.pedido.pedido.splice( i, 1 );
        }

		
		
		
		$scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        request.post(ip+'/get/pedidos', {'page': 1}, {'Authorization': 'Bearer ' + localstorage.get('token')})
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
			DTColumnBuilder.newColumn('no_arti').withTitle('Número articulo'),
			DTColumnBuilder.newColumn('cantidad').withTitle('Cantidad')
        ];
		
		/*$('#pedidos_table').DataTable( {
			  buttons: [
				  'copy', 'excel', 'pdf'
			  ]
			});*/
		
		//$scope.getPedidos(1);
		//$scope.getPedidos_filtering("12")
        //$scope.getPedidos_filtering('123');
		//$scope.getProductos('01');
    }
]);s