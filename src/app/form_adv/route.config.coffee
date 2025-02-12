 angular.module('diligenceVault').config ($stateProvider) ->
   $stateProvider.authorizedState 'app.form_adv',
     url: '/form_adv'
     abstract: true
     template: '<ui-view/>'
     hidden_from: ['securityAdmin']
