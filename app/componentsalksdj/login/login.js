'use strict';

angular.module('app.login', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/login', {
      templateUrl: 'comps/login/login.html',
      controller: 'LoginCtrl'
    });
    $routeProvider.when('/login2', {
      templateUrl: 'components/login/select.html',
      controller: 'LoginCtrl'
    });
  }])

  .controller('LoginCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, NgMap, $localStorage) {

      $scope.url = [
        "http://www.rs21.com/wp-content/uploads/2015/11/Banner.jpg",
        "http://www.rs21.com/wp-content/uploads/2015/11/RS21-4-1-1.jpg",
        "http://www.rs21.com/wp-content/uploads/2015/11/RS21-4-2-1.jpg",
        "http://www.rs21.com/wp-content/uploads/2015/11/RS21-4-3-1.jpg",
        "http://www.rs21.com/wp-content/uploads/2015/11/Banner1.jpg",
        "http://www.rs21.com/wp-content/uploads/2015/11/rs21-fijo-zapatos.png"
      ]

      $scope.i = -1;

      $scope.changeFlyer = function(){
        $scope.i += 1;

        if($scope.i >= $scope.url.length)
          $scope.i = 0;

        $scope.urlFlyer = $scope.url[$scope.i];
      }

      $interval($scope.changeFlyer,2*1000);

      $scope.urlFlyer = "";

    }
  ]);
