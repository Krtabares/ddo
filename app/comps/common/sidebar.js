'use strict';

angular.module('app.mySidebar', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])
.component("mySidebar", {
    templateUrl: "comps/common/sidebar.htmml"
  })

  .controller('sidebarCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, NgMap, $localStorage) {

        console.log("sidebarCtrl")
    }
  ]);
