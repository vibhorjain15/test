 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.authorizedState 'app.data_hub',
     url: '/data_hub'
     abstract: true
     template: '<ui-view/>'
     hidden_from: ['securityAdmin']