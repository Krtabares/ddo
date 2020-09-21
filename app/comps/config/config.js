'use strict';

angular.module('app.config', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/config', {
      templateUrl: 'comps/config/config.html',
      controller: 'ConfigCtrl'
    });
  }])

  .controller('ConfigCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, NgMap, $localStorage) {


            console.log("ConfigCtrl");
            $scope.hamburger_cross = function () {
                console.log("hamburger_cross");
                var trigger = angular.element('.hamburger'),
                      overlay = angular.element('.overlay')
                      isClosed = false;

                if (isClosed == true) {
                  overlay.hide();
                  trigger.removeClass('is-open');
                  trigger.addClass('is-closed');
                  isClosed = false;
                } else {
                  overlay.show();
                  trigger.removeClass('is-closed');
                  trigger.addClass('is-open');
                  isClosed = true;
                }
            }

    }
  ]);
