'use strict';

angular.module('app.myFooter', ['ngRoute', 'ngNotify', 'ngMap', 'angular-bind-html-compile', 'ngStorage'])
.component("myFooter", {
    templateUrl: "comps/footer/footer.html",
    controller: 'footerCtrl'
  })

  .controller('footerCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', '$timeout', 'ngNotify', 'localstorage', 'request', 'NgMap','$localStorage',
    function($scope, $rootScope, $routeParams, $interval, $timeout, ngNotify, localstorage, request, NgMap, $localStorage) {

        console.log("footerCtrl entro")

        function init() {

          $(function(){
            $(document).ready(function() {

              // INITIATE THE FOOTER
              siteFooter();
              // COULD BE SIMPLIFIED FOR THIS PEN BUT I WANT TO MAKE IT AS EASY TO PUT INTO YOUR SITE AS POSSIBLE
              $(window).resize(function() {
                siteFooter();
              });

              function siteFooter() {
                var siteContent = $('#wrapper');
                var siteContentHeight = siteContent.height();
                var siteContentWidth = siteContent.width();

                var siteFooter = $('#site-footer');
                var siteFooterHeight = siteFooter.height();
                var siteFooterWidth = siteFooter.width();


                // console.log('Content Height = ' + siteContentHeight + 'px');
                // console.log('Content Width = ' + siteContentWidth + 'px');
                //
                // console.log('Footer Height = ' + siteFooterHeight + 'px');
                // console.log('Footer Width = ' + siteFooterWidth + 'px');

                siteContent.css({
                  "margin-bottom" : siteFooterHeight
                });
              };
            });

          })

        }
        init()


    }
  ]);
