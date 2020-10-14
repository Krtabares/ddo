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
    $scope.loading = false
    $scope.user = {};
    localstorage.clear()
    function init() {
      $(function(){
        $('.modal-backdrop').remove();
      })
    }
    init()

    $scope.creditoClient = {}
    function getClientDispService(body) {
      $scope.loading = true
      request.post(ip+'/disponible_cliente', body,{})
      .then(function successCallback(response) {
        console.log("====================================================================================================")

        $scope.creditoClient = response.data.obj
        $scope.creditoClient.disp_bs_format = (isNaN(parseFloat(response.data.obj.disp_bs)))? 0:parseFloat(response.data.obj.disp_bs)
        $scope.creditoClient.disp_usd_format = (isNaN(parseFloat(response.data.obj.disp_usd)))? 0 : parseFloat(response.data.obj.disp_usd)
        console.log($scope.creditoClient)
        $scope.loading = false

      }, function errorCallback(response) {
        // console.log(response)
        $scope.loading = false
      });
    }


    $scope.getClientNew = function (client) {
      console.log("getClientNew");



      var body = {}
      body.pNoCia = client.COD_CIA
      body.pNoGrupo = client.GRUPO_CLIENTE
      body.pCliente = client.COD_CLIENTE

      getClientDispService(body)

       // body = {};

      // body.pCliente = client.COD_CLIENTE




      request.post(ip+'/procedure_clientes', body,{})
      .then(function successCallback(response) {
        // response.data.obj[0].creditoClient = $scope.creditoClient.disp_bs_format
        localstorage.set('creditoClient',  JSON.stringify($scope.creditoClient.disp_bs_format));
        localstorage.set('client_info',  JSON.stringify(response.data.obj[0]));
        // $scope.clientes = response.data.obj
        ngNotify.set('¡Bienvenido! '+response.data.obj[0].nombre_cliente ,'success')
        window.location.href = "#!/home";

      }, function errorCallback(response) {
        console.log(response)
      });
    }


	  $scope.login = function(){
		  //console.log($scope.user);
      // $scope.user.password = CryptoJS.MD5($scope.user.password).toString();
      var body = {
        username: $scope.user.username,
        password:  CryptoJS.MD5($scope.user.password).toString()
      }
		  request.post(ip+'/login',body,{})
		  .then(function successCallback(response) {
        //console.log(response.data.access_token);

        localstorage.set('user', JSON.stringify(response.data.user));
        localstorage.set('token', response.data.access_token);

        var client = {}
        client.COD_CIA = response.data.user.COD_CIA
        client.GRUPO_CLIENTE = response.data.user.GRUPO_CLIENTE
        client.COD_CLIENTE = response.data.user.COD_CLIENTE

        localstorage.set('client',  JSON.stringify(client));
        console.log(response.data.user)
        if(response.data.user.role=='root'){
          ngNotify.set('¡Bienvenido! ','success')
          window.location.href = "#!/home";
        }else
          $scope.getClientNew(client)

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
