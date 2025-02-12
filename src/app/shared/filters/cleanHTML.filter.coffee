angular.module('diligenceVault').filter 'cleanhtml', ($sce) ->
  (html) ->
    if html
      trimmedHtml = html.replace(/&nbsp;/g, ' ')
      trimmedHtml
