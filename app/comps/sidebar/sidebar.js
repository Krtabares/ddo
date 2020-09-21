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
        init()
        function init() {
          var user = localStorage.getItem('user')
           $scope.user = JSON.parse(user);
           console.log($scope.user)
        }


        // jQuery(function ($) {
        //
        //       $(".sidebar-dropdown > a").click(function() {
        //     $(".sidebar-submenu").slideUp(200);
        //     if (
        //       $(this)
        //         .parent()
        //         .hasClass("active")
        //     ) {
        //       $(".sidebar-dropdown").removeClass("active");
        //       $(this)
        //         .parent()
        //         .removeClass("active");
        //     } else {
        //       $(".sidebar-dropdown").removeClass("active");
        //       $(this)
        //         .next(".sidebar-submenu")
        //         .slideDown(200);
        //       $(this)
        //         .parent()
        //         .addClass("active");
        //     }
        //   });
        //
        //   $("#close-sidebar").click(function() {
        //     $(".page-wrapper").removeClass("toggled");
        //   });
        //   $("#show-sidebar").click(function() {
        //     $(".page-wrapper").addClass("toggled");
        //   });
        //
        //
        //
        //
        // });
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
