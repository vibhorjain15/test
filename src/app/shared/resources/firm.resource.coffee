angular.module('diligenceVault').factory 'Firm', ($resource, baseUrl) ->
  $resource baseUrl + '/firms/:firmId', firmId: '@id'
