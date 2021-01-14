'use strict';

angular.module('app.mySidebar', ['ngRoute', 'ngNotify','cgNotify',  'ngMap', 'angular-bind-html-compile', 'ngStorage', 'ngIdle'])
.component("mySidebar", {
    templateUrl: "comps/sidebar/sidebar.html",
    controller: 'sidebarCtrl'
  })

  .controller('sidebarCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', '$window', 'ngNotify', 'notify', 'localstorage', 'request', 'NgMap','$localStorage','Idle',
    function($scope, $rootScope, $routeParams, $interval, $timeout, $window, ngNotify,notify, localstorage,  request, NgMap, $localStorage, Idle) {


      $scope.width = $window.innerWidth;
      $scope.events = [];
      $scope.idle = 5;
      $scope.timeout = 60*15;
      $scope.idleCount = 0

      $scope.msToTime =  function(s) {
        // Pad to 2 or 3 digits, default is 2
        function pad(n, z) {
          z = z || 2;
          return ('00' + n).slice(-z);
        }

        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        var hrs = (s - mins) / 60;

        return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) //+ '.' + ms;
      }

        $scope.$on('IdleStart', function() {
          // addEvent({event: 'IdleStart', date: new Date()});
          // notify({ message: $scope.msToTime( $scope.timeout*1000) + ' para cierre de sesión', position:'left', duration:3000, classes:'   alert-danger'});
        });

        $scope.$on('IdleEnd', function() {
         
        });
      

        $scope.$on('IdleWarn', function(e, countdown) {
          // addEvent({event: 'IdleWarn', date: new Date(), countdown: countdown});
          // console.log($scope.msToTime(countdown*1000), countdown )
          if(countdown < 10){
            notify({ message: $scope.msToTime(countdown*1000) + ' Segundos para cierre de sesión', position:'left', duration:1000, classes:'   alert-danger'});
            return
          }else if((countdown % 60 == 0) && (countdown < 300)){

            notify({ message: $scope.msToTime(countdown*1000) + ' para cierre de sesión', position:'left', duration:3000, classes:'   alert-danger'});
            return
          
          }
          
          // $scope.showIdle = true;
          // $scope.idleCount = countdown
          
        });
        $scope.$on('IdleTimeout', function() {
          // addEvent({event: 'IdleTimeout', date: new Date()});
          // window.location.reload()
          window.location.href = "/ddo/app";
        });

        $scope.$on('Keepalive', function() {
          // addEvent({event: 'Keepalive', date: new Date()});
        });

        function addEvent(evt) {
          $scope.$evalAsync(function() {
            $scope.events.push(evt);
          })
        }

        $scope.reset = function() {
          Idle.watch();
        }

        $scope.$watch('idle', function(value) {
          if (value !== null) Idle.setIdle(value);
        });

        $scope.$watch('timeout', function(value) {
          if (value !== null) Idle.setTimeout(value);
        });

        $scope.hasUserClient = false;
        $scope.user = {};
        $scope.permisos = {}
        init()
        function init() {
          var user = localStorage.getItem('user','')

          if(user != null){
            $scope.user = JSON.parse(user);
            $scope.permisos = $scope.user.permisos  ;
          }

        }

        $scope.salir = function () {
          window.location.href = "/";
        }


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


            if ($scope.isClosed == false) {
              // $scope.overlay.hide();
              $scope.trigger.removeClass('is-open');
              $scope.trigger.addClass('is-closed');
              $scope.isClosed = true;
            } else {
              // $scope.overlay.show();
              $scope.trigger.removeClass('is-closed');
              $scope.trigger.addClass('is-open');
              $scope.isClosed = false;
            }


            $(function(){
              // $('[data-toggle="offcanvas"]').click(function () {
                    $('#wrapper').toggleClass('toggled');
              // });
            })
        }

  }]).config(function(IdleProvider, KeepaliveProvider) {
    KeepaliveProvider.interval(10);
    IdleProvider.windowInterrupt('focus');
  })
  .run(function($rootScope, Idle, $log, Keepalive){
    Idle.watch();

    // $log.debug('app started.');
  });
