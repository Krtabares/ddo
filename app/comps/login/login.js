'use strict';

angular.module('app.login', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/login', {
      templateUrl: 'comps/login/login.html',
      controller: 'LoginCtrl'
    });
  }])

  .controller('LoginCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, NgMap, $localStorage) {

      $scope.url = [
        "http://www.del-oeste.com/wp-content/uploads/2017/10/slider-n.jpg",
        "http://www.del-oeste.com/wp-content/uploads/2017/08/almacen-foto-cliente.jpg",
        "http://www.del-oeste.com/wp-content/uploads/2017/08/img-about.jpg",
      ]
	  var ip = "http://192.168.168.170:3500";
    $scope.user = {};
    localstorage.clear()


    $scope.getClientNew = function (client) {
      console.log("getClientNew");
      var body = {};

        body.pCliente = client.COD_CLIENTE

      request.post(ip+'/procedure_clientes', body,{})
      .then(function successCallback(response) {
        console.log(response)

        // $scope.clientes = response.data.obj

      }, function errorCallback(response) {
        console.log(response)
      });
    }
	
		
	  $scope.login = function(){
		  //console.log($scope.user);
		  request.post(ip+'/login', $scope.user ,{})
		  .then(function successCallback(response) {
        //console.log(response.data.access_token);
       
        localstorage.set('user', response.data.user);
        localstorage.set('token', response.data.access_token);
        
        var client = {}
        client.COD_CIA = response.data.user.COD_CIA
        client.GRUPO_CLIENTE = response.data.user.GRUPO_CLIENTE
        client.COD_CLIENTE = response.data.user.COD_CLIENTE

        localstorage.set('client',  JSON.stringify(client));

        $scope.getClientNew(client)
        window.location.href = "#!/home";
        /*if (response.data.exist) {
          ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
        } else if (response.data.email_flag) {
          ngNotify.set('¡Ya el correo está registrado!','error')
        }*/
		  }, function errorCallback(response) {
			console.log(response)
			if(response.status == 403){
				ngNotify.set('¡Credenciales erróneas!','error')
			}
			 
		  });
    }

      $scope.i = -1;

      $scope.changeFlyer = function(){
        $scope.i += 1;

        if($scope.i >= $scope.url.length)
          $scope.i = 0;

        $scope.urlFlyer = $scope.url[$scope.i];
      }

      $interval($scope.changeFlyer,2*1000);

      $scope.urlFlyer = $scope.url[0];

    }
  ]);
