'use strict';

// Declare app level module which depends on views, and components
angular.module('app', [
               'ngRoute',
               'ngMap',
               'ngStorage',
               'angular-bind-html-compile',
               'ngNotify',
               'cgNotify',
               'timer',
               'ngIdle',
               'app.login',
               'app.home',
               'app.perfil',
               'app.deuda',
               'app.saldo',
               'app.clientes',
               'app.generar',
               'app.consulta',
               'app.usuarios',
               'app.config',
               'app.pedidos',
               'app.facturado',
               'app.mySidebar',
               'app.myFooter',
               'app.myLoading',
               'app.headerClient',
               'app.olvidoPass',
               'app.estadisticas'
     ])
     .factory('request', ['$http','$q', function($http,$q) {
          return {
               get : function(url){
                    var defered = $q.defer();
                    $http({
                         method: "GET",
                         url: url
                    }).then(function(response) {
                         defered.resolve(response);
                    }, function(errorMsg) {
                         defered.reject(errorMsg);
                    });
                    return defered.promise;
               },
               post : function(url,data,headers){
                    var defered = $q.defer();
                    $http({
                         method: "POST",
                         url: url,
                         data: data,
                         headers: headers
                    }).then(function(response) {
                         defered.resolve(response);
                    }, function(errorMsg) {
                         defered.reject(errorMsg);
                    });
                    return defered.promise;
               }
          }
     }])
	 .factory('localstorage', ['$window', function($window) {
          return {
            set: function(key, value) {
              $window.localStorage[key] = value;
            },
            get: function(key, defaultValue) {
              return $window.localStorage[key] || defaultValue || false;
            },
            setObject: function(key, value) {
              $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key, defaultValue) {
              if($window.localStorage[key] != undefined){
                  return JSON.parse($window.localStorage[key]);
              }else{
                return defaultValue || false;
              }
            },
            remove: function(key){
              $window.localStorage.removeItem(key);
            },
            clear: function(){
              $window.localStorage.clear();
            }
          }
     }])
     .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
          $locationProvider.hashPrefix('!');

          $routeProvider.otherwise({
               redirectTo: '/login'
          });
     }]);
