angular.module('diligenceVault').filter 'website', ->
  (input) ->
    httpString = 'http://'
    httpsString = 'https://'

    finalUrl = if (input.indexOf(httpString) == 0 || input.indexOf(httpsString) == 0) then input else (httpString + input)

    return finalUrl
