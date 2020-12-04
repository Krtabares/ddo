'use strict';

angular.module('app.mySidebar', ['ngRoute', 'ngNotify','cgNotify',  'ngMap', 'angular-bind-html-compile', 'ngStorage', 'ngIdle'])
.component("mySidebar", {
    templateUrl: "comps/sidebar/sidebar.html",
    controller: 'sidebarCtrl'
  })

  .controller('sidebarCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'notify', 'localstorage', 'request', 'NgMap','$localStorage','Idle',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify,notify, localstorage,  request, NgMap, $localStorage, Idle) {



      $scope.events = [];
      $scope.idle = 60;
      $scope.timeout = 60;
      $scope.idleCount = 0

        $scope.$on('IdleStart', function() {
          // addEvent({event: 'IdleStart', date: new Date()});
        });

        $scope.$on('IdleEnd', function() {
          // addEvent({event: 'IdleEnd', date: new Date()});
          // if($scope.timeout >= 120 ){
          //   $scope.timeout = 60
          //   return
          // }
          // if($scope.timeout <= 60 && $scope.timeout > 10){
          //   $scope.timeout -= 5
          //   $scope.idle = 1
          //   return
          // }
          // if($scope.timeout <=10){
          //   $scope.timeout -= 1
            
          //   return
          // }
          // if($scope.timeout == 1){
          //   $scope.timeout = 0
          //   $scope.idle =  0
          //   return
          // }
         
        });
      

        $scope.$on('IdleWarn', function(e, countdown) {
          // addEvent({event: 'IdleWarn', date: new Date(), countdown: countdown});
          if(countdown < 10){
            notify({ message: countdown + ' Segundos para cierre de session', position:'left', duration:1000, classes:'alert-danger'});
            
          }else if((countdown % 10 == 0)){
            notify({ message: countdown + ' Segundos para cierre de session', position:'left', duration:1000, classes:'alert-danger'});
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
          addEvent({event: 'Keepalive', date: new Date()});
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
