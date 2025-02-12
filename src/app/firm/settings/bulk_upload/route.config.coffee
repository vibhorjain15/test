angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.bulk_upload',
    url: '/bulk_upload'
    abstract: true
    template: '<ui-view />'
    hidden_from: ['securityAdmin']
