'use strict';

angular.module('app.estadisticas', ['ngRoute', 'cgNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/estadisticas', {
      templateUrl: 'comps/estadisticas/estadisticas.html',
      controller: 'estadisticasCtrl'
    });
  }])

  .controller('estadisticasCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'notify', 'request', 'NgMap', 'localstorage', '$localStorage', '$sessionStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, notify, request, NgMap, localstorage, $localStorage, $sessionStorage) {

      // CARGA INICIAL DE CHART

      $scope.client = {};
      $scope.client_info = {};
      $scope.hasUserClient = false;

      var ip = IP_SERVER_PYTHON;

      $scope.token_valid = false
      // validate_token()
      function validate_token() {
        $scope.loading = true
        // console.log("validaClienteDDO");
        request.post(ip+'/validate_token', {},{'Authorization': 'Bearer ' + localstorage.get('token', '')})
        .then(function successCallback(response) {
          console.log(response.data)
          $scope.loading = false
          $scope.token_valid = true
        }, function errorCallback(response) {
          // console.log(response)
          $scope.loading = false
          window.location.href = "#!/login";

        });
      }

      verificClient()

      function verificClient(){
        // notify({ message:'My message', position:'right', duration:100000, classes:'   alert-danger'});
        var client = localStorage.getItem('client')
        var client_info = localStorage.getItem('client_info')
        console.log(client)
         if ( client=='{}' ){
          $scope.hasUserClient = false;
        }else{
          $scope.hasUserClient = true;
          $scope.client_info = JSON.parse(client_info);
          $scope.client = JSON.parse(client);

        }
        console.log($scope.client)
      }



      var ctx = document.getElementById('myChart').getContext('2d');
      var ctx2 = document.getElementById('myChart2').getContext('2d');
      var ctx3 = document.getElementById('myChart3').getContext('2d');
	  $scope.$storage = $localStorage;

	  // console.log(localstorage.get('token', ''));
     //
     //
     // console.log("2017", CryptoJS.MD5("ddo.2017").toString());
     // console.log("admin", CryptoJS.MD5("ddo.admin").toString());


      var myLineChart = new Chart(ctx3, {
        type: 'pie',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235,   0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });

      var myLineChart = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235,   0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });

      var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });




    }
  ]);
