'use strict';

angular.module('app.deuda', ['datatables', 'datatables.buttons', 'datatables.bootstrap', 'ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'swxLocalStorage'])

  .config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/deuda', {
      templateUrl: 'comps/deuda/deuda.html',
      controller: 'deudaCtrl'
    });
  }])

  .controller('deudaCtrl', ['$scope', '$q', 'localstorage','$http', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'request', 'DTOptionsBuilder', 'DTColumnBuilder', 'NgMap','$localStorage',
    function($scope, $q, localstorage, $http, $rootScope, $routeParams, $interval, $timeout, ngNotify, request, DTOptionsBuilder, DTColumnBuilder, NgMap, $localStorage) {

      var ip = "http://192.168.168.170:3500";

      $scope.deuda = {};
      $scope.tabsIndex = 0
      $scope.tabs = 1
      $scope.listDeuda = [{}];
      $scope.hasUserClient = false;
      $scope.client = {};
      $scope.client_info = {}
      $scope.listFact = []
      $scope.response = {
	"msj": "OK",
	"obj": [{
		"no_fisico": "1366160",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "06\/07\/20",
		"monto_inicial": "15806812.45",
		"monto_actual": "15806812.45",
		"monto_inicial_usd": "78.77",
		"monto_actual_usd": "78.77",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "200663.39",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "15\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366161",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "06\/07\/20",
		"monto_inicial": "1737086.64",
		"monto_actual": "1737086.64",
		"monto_inicial_usd": "8.66",
		"monto_actual_usd": "8.66",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "200663.39",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "15\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366162",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "06\/07\/20",
		"monto_inicial": "22656779.15",
		"monto_actual": "22656779.15",
		"monto_inicial_usd": "112.91",
		"monto_actual_usd": "112.91",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "200663.39",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "15\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366272",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "07\/07\/20",
		"monto_inicial": "14578860.16",
		"monto_actual": "14578860.16",
		"monto_inicial_usd": "71.82",
		"monto_actual_usd": "71.82",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202996.44",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "16\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366273",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "07\/07\/20",
		"monto_inicial": "5521387.97",
		"monto_actual": "5521387.97",
		"monto_inicial_usd": "27.20",
		"monto_actual_usd": "27.20",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202996.44",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "16\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366274",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "07\/07\/20",
		"monto_inicial": "13518437.55",
		"monto_actual": "13518437.55",
		"monto_inicial_usd": "66.59",
		"monto_actual_usd": "66.59",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202996.44",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "16\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366275",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "07\/07\/20",
		"monto_inicial": "575442.35",
		"monto_actual": "575442.35",
		"monto_inicial_usd": "2.83",
		"monto_actual_usd": "2.83",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202996.44",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "16\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366276",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "07\/07\/20",
		"monto_inicial": "569432.00",
		"monto_actual": "569432.00",
		"monto_inicial_usd": "2.81",
		"monto_actual_usd": "2.81",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202996.44",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "16\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366368",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "08\/07\/20",
		"monto_inicial": "12986515.98",
		"monto_actual": "12986515.98",
		"monto_inicial_usd": "63.93",
		"monto_actual_usd": "63.93",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "203130.54",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "17\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366369",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "08\/07\/20",
		"monto_inicial": "1330958.52",
		"monto_actual": "1330958.52",
		"monto_inicial_usd": "6.55",
		"monto_actual_usd": "6.55",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "203130.54",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "17\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366370",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "08\/07\/20",
		"monto_inicial": "8416417.68",
		"monto_actual": "8416417.68",
		"monto_inicial_usd": "41.43",
		"monto_actual_usd": "41.43",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "203130.54",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "17\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366371",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "08\/07\/20",
		"monto_inicial": "254673.63",
		"monto_actual": "254673.63",
		"monto_inicial_usd": "1.25",
		"monto_actual_usd": "1.25",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "203130.54",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "17\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366485",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "10\/07\/20",
		"monto_inicial": "10737535.46",
		"monto_actual": "10737535.46",
		"monto_inicial_usd": "53.06",
		"monto_actual_usd": "53.06",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202375.99",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "19\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366486",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "10\/07\/20",
		"monto_inicial": "6418154.04",
		"monto_actual": "6418154.04",
		"monto_inicial_usd": "31.71",
		"monto_actual_usd": "31.71",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202375.99",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "19\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366487",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "10\/07\/20",
		"monto_inicial": "3433438.61",
		"monto_actual": "3433438.61",
		"monto_inicial_usd": "16.97",
		"monto_actual_usd": "16.97",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202375.99",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "0",
		"fecha_documento": "19\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366624",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "14\/07\/20",
		"monto_inicial": "17396521.09",
		"monto_actual": "17396521.09",
		"monto_inicial_usd": "85.98",
		"monto_actual_usd": "85.98",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202331.79",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "23\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366625",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "14\/07\/20",
		"monto_inicial": "4594532.89",
		"monto_actual": "4594532.89",
		"monto_inicial_usd": "22.71",
		"monto_actual_usd": "22.71",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202331.79",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "23\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366626",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "14\/07\/20",
		"monto_inicial": "5499554.66",
		"monto_actual": "5499554.66",
		"monto_inicial_usd": "27.18",
		"monto_actual_usd": "27.18",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202331.79",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "23\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366627",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "14\/07\/20",
		"monto_inicial": "499462.47",
		"monto_actual": "499462.47",
		"monto_inicial_usd": "2.47",
		"monto_actual_usd": "2.47",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202331.79",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "23\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366719",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "17\/07\/20",
		"monto_inicial": "9314956.48",
		"monto_actual": "9314956.48",
		"monto_inicial_usd": "46.24",
		"monto_actual_usd": "46.24",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "201456.50",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "25\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366720",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "17\/07\/20",
		"monto_inicial": "3235421.83",
		"monto_actual": "3235421.83",
		"monto_inicial_usd": "16.06",
		"monto_actual_usd": "16.06",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "201456.50",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "25\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366785",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "17\/07\/20",
		"monto_inicial": "4452395.60",
		"monto_actual": "4452395.60",
		"monto_inicial_usd": "22.08",
		"monto_actual_usd": "22.08",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "201651.62",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "26\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366799",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "17\/07\/20",
		"monto_inicial": "1417556.41",
		"monto_actual": "1417556.41",
		"monto_inicial_usd": "7.03",
		"monto_actual_usd": "7.03",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "201651.62",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "26\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366800",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "17\/07\/20",
		"monto_inicial": "796320.00",
		"monto_actual": "796320.00",
		"monto_inicial_usd": "3.95",
		"monto_actual_usd": "3.95",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "201651.62",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "26\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366969",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "21\/07\/20",
		"monto_inicial": "8967174.83",
		"monto_actual": "8967174.83",
		"monto_inicial_usd": "44.43",
		"monto_actual_usd": "44.43",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "201825.68",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "30\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366970",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "21\/07\/20",
		"monto_inicial": "18590535.61",
		"monto_actual": "18590535.61",
		"monto_inicial_usd": "92.11",
		"monto_actual_usd": "92.11",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "201825.68",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "30\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366971",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "21\/07\/20",
		"monto_inicial": "7664229.69",
		"monto_actual": "7664229.69",
		"monto_inicial_usd": "37.97",
		"monto_actual_usd": "37.97",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "201825.68",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "30\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "1366972",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "21\/07\/20",
		"monto_inicial": "1676732.41",
		"monto_actual": "1676732.41",
		"monto_inicial_usd": "8.31",
		"monto_actual_usd": "8.31",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "01",
		"nombre_tipo_doc": "FACTURA",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "201825.68",
		"fecha_aviso": "",
		"docu_aviso": "",
		"serie_fisico": "0",
		"fecha_documento": "30\/06\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "184844",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "19\/05\/20",
		"monto_inicial": "56880.00",
		"monto_actual": "-56880.00",
		"monto_inicial_usd": "0.76",
		"monto_actual_usd": "-0.76",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "04",
		"nombre_tipo_doc": "NOTA CREDITO",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "75000.00",
		"fecha_aviso": "12\/05\/20",
		"docu_aviso": "244156",
		"serie_fisico": "00-",
		"fecha_documento": "21\/04\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "184901",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "19\/05\/20",
		"monto_inicial": "24688.33",
		"monto_actual": "-24688.33",
		"monto_inicial_usd": "0.33",
		"monto_actual_usd": "-0.33",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "04",
		"nombre_tipo_doc": "NOTA CREDITO",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "75000.00",
		"fecha_aviso": "12\/05\/20",
		"docu_aviso": "244156",
		"serie_fisico": "00-",
		"fecha_documento": "28\/04\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "184927",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "19\/05\/20",
		"monto_inicial": "6059.46",
		"monto_actual": "-6059.46",
		"monto_inicial_usd": "0.08",
		"monto_actual_usd": "-0.08",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "VENCIDA",
		"codigo_tipo_doc": "04",
		"nombre_tipo_doc": "NOTA CREDITO",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "75000.00",
		"fecha_aviso": "12\/05\/20",
		"docu_aviso": "244156",
		"serie_fisico": "00-",
		"fecha_documento": "30\/04\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "185024",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "",
		"monto_inicial": "294000.00",
		"monto_actual": "-294000.00",
		"monto_inicial_usd": "1.65",
		"monto_actual_usd": "-1.65",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "POR VENCER",
		"codigo_tipo_doc": "04",
		"nombre_tipo_doc": "NOTA CREDITO",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "178532.44",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "00-",
		"fecha_documento": "13\/05\/20",
		"aplica_corte": "N"
	}, {
		"no_fisico": "185163",
		"codigo_cliente": "MONTA2",
		"nombre_cliente": "FARMACIA LA BETHANIA, C.A.",
		"tipo_venta": "CREDITO",
		"fecha_vencimiento": "",
		"monto_inicial": "71342.61",
		"monto_actual": "-71342.61",
		"monto_inicial_usd": "0.35",
		"monto_actual_usd": "-0.35",
		"fecha_ultimo_pago": "",
		"monto_ultimo_pago": "",
		"estatus_deuda": "POR VENCER",
		"codigo_tipo_doc": "04",
		"nombre_tipo_doc": "NOTA CREDITO",
		"cia": "01",
		"grupo": "02",
		"tipo_cambio": "202331.79",
		"fecha_aviso": "23\/06\/20",
		"docu_aviso": "245457",
		"serie_fisico": "00-",
		"fecha_documento": "23\/06\/20",
		"aplica_corte": "N"
	}]
}
      $scope.aplica_corte = false
      $scope.listAvisos = [];


      $scope.nextStep = function () {
        $scope.goToTab($scope.tabsIndex + 1 );
      }

      $scope.goToTab = function (index) {
        if(index <= $scope.tabs )
          $scope.tabsIndex = index

      }

      $scope.getDeudas = function(){
        var body = {}
       body.pCLiente = ($scope.client.COD_CLIENTE)? $scope.client.COD_CLIENTE: $scope.client.cod_cliente;
       body.pNoCia = ($scope.client.COD_CIA)?  $scope.client.COD_CIA : $scope.client.cod_cia ;
       body.pNoGrupo = ($scope.client.GRUPO_CLIENTE)? $scope.client.GRUPO_CLIENTE: $scope.client.grupo_cliente;

         // request.post(ip+'/procedure_deudas', body, {'Authorization': 'Bearer ' + localstorage.get('token', '')})
         //  .then(function successCallback(response) {
            // console.log(response.data)
            var response = $scope.response
            console.log(response)
            response.obj.forEach((item, i) => {

              if(1==2 && item.aplica_corte=="S"){
                $scope.aplica_corte = true
                return
              }else{
                  $scope.listFact = response.obj;
                  return;
              }

            });
            // console.log($scope.listFact)
            if($scope.aplica_corte){

              $scope.listAvisos = {}
              //Recorremos el arreglo
              response.obj.forEach( x => {
                if( !$scope.listAvisos.hasOwnProperty(x.docu_aviso)){
                  $scope.listAvisos[x.docu_aviso] = {
                    facturas: [],
                    fecha_aviso: x.fecha_aviso,
                    docu_aviso: x.docu_aviso,
                    saldo: 0
                  }
                }

                $scope.listAvisos[x.docu_aviso].facturas.push(x)
                $scope.listAvisos[x.docu_aviso].saldo += parseFloat(x.monto_actual)
              })

            }

            // $scope.listDeuda = response.data.obj

         // });
      }
      $scope.avisoAct = {}
      $scope.selectAviso=function (row) {

          $scope.listFact = row.facturas;
          $scope.avisoAct.fecha_aviso= row.fecha_aviso


      }

      verificClient()

      function verificClient(){

       var client = localStorage.getItem('client')
       var client_info = localStorage.getItem('client_info')
       console.log(client)
        if ( client=='{}' ){
         $scope.hasUserClient = false;
       }else{
         $scope.hasUserClient = true;
         $scope.client = JSON.parse(client);
         $scope.client_info = JSON.parse(client_info);
         $scope.getDeudas();
       }
       console.log($scope.client_info)
     }
     const formatterVe = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    })
    // console.log(formatterVe.format(value))
    const formatterVeDECIMAL = new Intl.NumberFormat('es-VE', {
    })

    $scope.formato = function(tipo, valor){
      if(tipo == 1){
        return formatterVeDECIMAL.format(valor)
      }
      if(tipo==2){
        return formatterVe.format(valor)
      }
    }

	  $scope.arr_page = new Array(4);
      $scope.max = 4
      $scope.min = 0;
      $scope.aux = {'pages': '01', 'totalPages': 11};

      $scope.getNumber = function(num) {
		  console.log(num);
        return new Array(num);
      }

	  $scope.page = function(param){
        if(param == 'prev'){
          if($scope.min > 0){
            $scope.min = $scope.min - 1;
            $scope.max = $scope.max - 1;
          }
        }else if(param == 'next'){
          if($scope.max < $scope.aux.totalPages){
            $scope.min = $scope.min + 1;
            $scope.max = $scope.max + 1;
          }
        }
      }
      $scope.totales={
        'bolivares' : 0
      }
      function calcularTotales() {
        $scope.totales.bolivares = 0
        $scope.listDeuda.forEach(element => {

          $scope.totales.bolivares = parseFloat($scope.totales.bolivares)
                                         + (parseFloat(element.monto_actual))

        });
        console.log($scope.totales.bolivares)
        $scope.totales.bolivares = parseFloat($scope.totales.bolivares).toFixed(2)
      }


      $scope.getDeuda = function(param){
        console.log(param);
      }

    $scope.showDeuda = function(deuda){
      console.log(deuda);
      $scope.deuda = deuda;
    }



    $scope.getDeudas = function(page){
    var obj = {'page': page};
    //console.log(obj);
      request.post(ip+'/get/deuda', obj ,{'Authorization': 'Bearer ' + localstorage.get('token')})
      .then(function successCallback(response) {
        console.log(response);
    if(response.data.data.length > 0){
      $scope.listDeuda = response.data.data;
      $scope.aux.totalPages = 100;
      //console.log($scope.listDeuda);
    }
        /*if (response.data.exist) {
          ngNotify.set('¡Ya el nombre de usuario se encuentra registrado!','error')
        } else if (response.data.email_flag) {
          ngNotify.set('¡Ya el correo está registrado!','error')
        }*/
      }, function errorCallback(response) {
        console.log(response)
      });
    }
	$scope.listDeuda=[]
  $scope.dtOptions = DTOptionsBuilder.newOptions()
      .withPaginationType('full_numbers')
      .withOption('responsive', true)
      .withDOM('frtip').withPaginationType('full_numbers')

  $scope.dtOptionsAviso = DTOptionsBuilder.newOptions()
      .withPaginationType('full_numbers')
      .withOption('responsive', true)
      .withDOM('frtip').withPaginationType('full_numbers')

        $scope.dtColumns = [
            // DTColumnBuilder.newColumn('no_fisico').withTitle('N° de documento'),
            // DTColumnBuilder.newColumn('fecha_vencimiento').withTitle('Fecha de vencimiento'),
            // DTColumnBuilder.newColumn('tipo_venta').withTitle('Tipo de venta'),
            // DTColumnBuilder.newColumn('monto_actual').withTitle('Monto actual'),
            // DTColumnBuilder.newColumn('estatus_deuda').withTitle('Estatus deuda').withClass('none'),
            // DTColumnBuilder.newColumn('codigo_tipo_doc').withTitle('Código tipo doc').withClass('none'),
            // DTColumnBuilder.newColumn('nombre_tipo_doc').withTitle('Nombre tipo doc')
            DTColumnBuilder.newColumn('no_fisico').withTitle('N° de documento'),
            // DTColumnBuilder.newColumn('codigo_cliente').withTitle(''),
            // DTColumnBuilder.newColumn('nombre_cliente').withTitle(''),
            DTColumnBuilder.newColumn('tipo_venta').withTitle('Tipo venta'),
            DTColumnBuilder.newColumn('fecha_vencimiento').withTitle('Fecha vencimiento'),
            DTColumnBuilder.newColumn('monto_inicial').withTitle('Monto inicial'),
            DTColumnBuilder.newColumn('monto_actual').withTitle('Monto actual'),
            DTColumnBuilder.newColumn('fecha_ultimo_pago').withTitle('Fecha ultimo pago'),
            DTColumnBuilder.newColumn('monto_ultimo_pago').withTitle('Monto ultimo pago'),
            DTColumnBuilder.newColumn('estatus_deuda').withTitle('Estatus'),
            // DTColumnBuilder.newColumn('codigo_tipo_doc').withTitle('codio'),
            DTColumnBuilder.newColumn('nombre_tipo_doc').withTitle('Tipo documento'),
            DTColumnBuilder.newColumn('tipo_cambio').withTitle('Tipo cambio'),
            DTColumnBuilder.newColumn('fecha_aviso').withTitle('Fecha aviso'),
            DTColumnBuilder.newColumn('docu_aviso').withTitle('Documento aviso'),
            DTColumnBuilder.newColumn('serie_fisico').withTitle('Serie'),
            DTColumnBuilder.newColumn('fecha_documento').withTitle('Fecha documento')
        ];




	/*$('#deudas_table').DataTable( {
      dom: 'Bfrtip',
      buttons: [
          'copy', 'excel', 'pdf'
      ]
	});*/

   // $scope.getSaldo(1);

  }]);
