angular.module('diligenceVault').filter 'trusthtml', ($sce) ->
  (html) ->
    $sce.trustAsHtml html
