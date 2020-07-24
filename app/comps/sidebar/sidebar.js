'use strict';

angular.module('app.mySidebar', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])
.component("mySidebar", {
    templateUrl: "comps/sidebar/sidebar.html",
    controller: 'sidebarCtrl'
  })

  .controller('sidebarCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, NgMap, $localStorage) {

        console.log("sidebarCtrl entro")

        $scope.hasClient = false;
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

        $scope.showSidebar = function(){
          var myEl = angular.element( document.querySelector( '.page-wrapper' ) );
              myEl.addClass('toggled');
        }
        $scope.hideSidebar = function(){
          var myEl = angular.element( document.querySelector( '.page-wrapper' ) );
              myEl.addClass('toggled');
        }
    }
  ]);
