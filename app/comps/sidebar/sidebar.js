'use strict';

angular.module('app.mySidebar', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])
.component("mySidebar", {
    templateUrl: "comps/sidebar/sidebar.html",
    controller: 'sidebarCtrl'
  })

  .controller('sidebarCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, NgMap, $localStorage) {

        console.log("sidebarCtrl entro")

        $scope.hasUserClient = false;
        $scope.user = {};
        $scope.permisos = {}
        init()
        function init() {
          var user = localStorage.getItem('user')
           $scope.user = JSON.parse(user);
           $scope.permisos = $scope.user.permisos  ;


           // console.log($scope.user)
        }

/** comienza el encript*/

$(function(){
  var keySize = 256;
  var ivSize = 128;
  var iterations = 100;

  var message = "1";
  var password = "Secret Password";


  function encrypt (msg, pass) {
    var salt = CryptoJS.lib.WordArray.random(128/8);

    var key = CryptoJS.PBKDF2(pass, salt, {
        keySize: keySize/32,
        iterations: iterations
      });

    var iv = CryptoJS.lib.WordArray.random(128/8);

    var encrypted = CryptoJS.AES.encrypt(msg, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC

    });

    // salt, iv will be hex 32 in length
    // append them to the ciphertext for use  in decryption
    var transitmessage = salt.toString()+ iv.toString() + encrypted.toString();
    return transitmessage;
  }

  function decrypt (transitmessage, pass) {
    var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
    var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32))
    var encrypted = transitmessage.substring(64);

    var key = CryptoJS.PBKDF2(pass, salt, {
        keySize: keySize/32,
        iterations: iterations
      });

    var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC

    })
    return decrypted;
  }
  // 
  // $('#encrypted').text("Encrypted: "+ encrypted);
  // console.log(encrypted)
  // $('#decrypted').text("Decrypted: "+ decrypted.toString(CryptoJS.enc.Utf8) );
  // console.log(decrypt);


})


/** termina el encript*/

        $scope.side = true

        $scope.showSidebar = function(){
          var myEl = angular.element( document.querySelector( '#wrapper' ) );
              myEl.addClass('active');
              $scope.side = true
        }
        $scope.hideSidebar = function(){
          var myEl = angular.element( document.querySelector( '#wrapper' ) );
              myEl.removeClass('active');
              $scope.side = false
        }


        $scope.trigger = angular.element('.hamburger')
        $scope.overlay = angular.element('.overlay')
        $scope.isClosed = false;

        $scope.hamburger_cross = function () {
            console.log("hamburger_cross");

            if ($scope.isClosed == true) {
              // $scope.overlay.hide();
              $scope.trigger.removeClass('is-open');
              $scope.trigger.addClass('is-closed');
              $scope.isClosed = false;
            } else {
              // $scope.overlay.show();
              $scope.trigger.removeClass('is-closed');
              $scope.trigger.addClass('is-open');
              $scope.isClosed = true;
            }


            $(function(){
              // $('[data-toggle="offcanvas"]').click(function () {
                    $('#wrapper').toggleClass('toggled');
              // });
            })
        }

    }
  ]);
