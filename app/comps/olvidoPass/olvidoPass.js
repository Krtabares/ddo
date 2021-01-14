'use strict';

angular.module('app.olvidoPass', ['ngRoute', 'cgNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/olvidoPass', {
      templateUrl: 'comps/olvidoPass/olvidoPass.html',
      controller: 'olvidoPassCtrl'
    });
  }])

  .controller('olvidoPassCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'notify', 'request', 'NgMap', 'localstorage', '$localStorage', '$sessionStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, notify, request, NgMap, localstorage, $localStorage, $sessionStorage) {

      // CARGA INICIAL DE CHART

      $scope.client = {};
      $scope.client_info = {};
      $scope.hasUserClient = false;

      var ip = IP_SERVER_PYTHON;

	  $scope.$storage = $localStorage

    $scope.user = {username:null}

    $scope.resetPass = function (user) {
      console.log("resetPass");
      console.log( $scope.user)
      var body = {}
      body.username = $scope.user.username.toUpperCase()
      body.newpass = makeid(30)
      body.password = CryptoJS.MD5(body.newpass).toString()
      request.post(ip+'/resetPass', body,{})
      .then(function successCallback(response) {
        console.log(response)

        notify({ message:'La nueva contraseña fue enviada a su correo electrónico', position:'right', duration:10000, classes:'   alert-success'});
        $scope.user = null;
      }, function errorCallback(response) {
        console.log(response)
        notify({ message:'No se pudo completar la acción verifique los datos', position:'right', duration:1000, classes:'   alert-danger'});

      });
    }

    function makeid(length) {
      var result           = '';
      var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
         result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
   }
   
  //  console.log(makeid(5));





    }
  ]);
