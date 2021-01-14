'use strict';

angular.module('app.perfil', ['ngRoute', 'cgNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/perfil', {
      templateUrl: 'comps/perfil/perfil.html',
      controller: 'perfilCtrl'
    });
  }])

  .controller('perfilCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'notify', 'request', 'NgMap', 'localstorage', '$localStorage', '$sessionStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, notify, request, NgMap, localstorage, $localStorage, $sessionStorage) {

      // CARGA INICIAL DE CHART
      var ip = IP_SERVER_PYTHON;
      $scope.client = {};
      $scope.client_info = {};
      $scope.hasUserClient = false;
      $scope.user = {};
      $scope.typeview = 'view'
      // $scope.numero = 0
      //
      // $scope.numeroChang = function () {
      //   $scope.numero++
      //   console.log("numeroChang"+ $scope.numero);
      // }

      $scope.goToEdit = function () {
        $scope.typeview = 'edit'
      }

      $scope.getUser = function (username) {
        var body = {}
        var user = localStorage.getItem('user')
        // body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
        // body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;
        // body.pCliente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
        // body.username = username
        //  request.post(ip+'/get/user', body, {'Authorization': 'Bearer ' + localstorage.get('token')})
        //   .then(function successCallback(response) {
        //     console.log(response.data)
        //     $scope.user = response.data
        //     // $scope.permisos = $scope.user.permisos
        //     $scope.typeview = 'view'
        //     // $scope.modalTitle = 'Ver usuario'
        //  });

        $scope.user = JSON.parse(user)
        console.log($scope.user);
      }


        $scope.updUserPass = function(){
          console.log($scope.user)
          var body = {
            username: $scope.user.username,
            password:  CryptoJS.MD5($scope.user.passwordConfirm).toString()
          }
          console.log($scope.user.passwordConfirm)
          request.post(ip+'/upd/user_pass', body,{'Authorization': 'Bearer ' + localstorage.get('token')})
              .then(function successCallback(response) {
                console.log(response)
                if (response.data == "OK")
                  notify({ message:'Contraseña modificada con éxito', position:'right', duration:1000, classes:'   alert-success'});

                $scope.newPass = null
                $scope.user.passwordConfirm = null
              }, function errorCallback(response) {
                console.log(response)
              });

          }

        $scope.passwordConfirm = null
        $scope.alertConfirm = null
        $scope.passwordIsValid = false
        $scope.newPass = null
        $scope.errorPass = function () {
          var ucase = new RegExp("[A-Z]+");
          var lcase = new RegExp("[a-z]+");
          var num = new RegExp("[0-9]+");

          if ($scope.user.password.length < 8) {
            $scope.passwordIsValid = false
          }

          if(!ucase.test($scope.user.password)){
            $scope.passwordIsValid = false
          }

          if(!lcase.test($scope.user.password)){
            $scope.passwordIsValid = false
          }

          if(!num.test($scope.user.password)){
            $scope.passwordIsValid = false
          }

          if($scope.user.password != $scope.passwordConfirm ){
            $scope.passwordIsValid = false
          }
          $scope.passwordIsValid = true
        }


        $(function(){
          $("input[type=password]").keyup(function(){
              var ucase = new RegExp("[A-Z]+");
          	var lcase = new RegExp("[a-z]+");
          	var num = new RegExp("[0-9]+");

          	if($("#password1").val().length >= 8){
          		$("#8char").removeClass("fa-times");
          		$("#8char").addClass("fa-check");
          		$("#8char").css("color","#00A41E");
          	}else{
          		$("#8char").removeClass("fa-check");
          		$("#8char").addClass("fa-times");
          		$("#8char").css("color","#FF0004");
          	}

          	if(ucase.test($("#password1").val())){
          		$("#ucase").removeClass("fa-times");
          		$("#ucase").addClass("fa-check");
          		$("#ucase").css("color","#00A41E");
          	}else{
          		$("#ucase").removeClass("fa-check");
          		$("#ucase").addClass("fa-times");
          		$("#ucase").css("color","#FF0004");
          	}

          	if(lcase.test($("#password1").val())){
          		$("#lcase").removeClass("fa-times");
          		$("#lcase").addClass("fa-check");
          		$("#lcase").css("color","#00A41E");
          	}else{
          		$("#lcase").removeClass("fa-check");
          		$("#lcase").addClass("fa-times");
          		$("#lcase").css("color","#FF0004");
          	}

          	if(num.test($("#password1").val())){
          		$("#num").removeClass("fa-times");
          		$("#num").addClass("fa-check");
          		$("#num").css("color","#00A41E");
          	}else{
          		$("#num").removeClass("fa-check");
          		$("#num").addClass("fa-times");
          		$("#num").css("color","#FF0004");
          	}

          	if($("#password1").val() == $("#password2").val()){
          		$("#pwmatch").removeClass("fa-times");
          		$("#pwmatch").addClass("fa-check");
          		$("#pwmatch").css("color","#00A41E");
          	}else{
          		$("#pwmatch").removeClass("fa-check");
          		$("#pwmatch").addClass("fa-times");
          		$("#pwmatch").css("color","#FF0004");
          	}


          });
        })

        $scope.getUser()

    }
  ]);
