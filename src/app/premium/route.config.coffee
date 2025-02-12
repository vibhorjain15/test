angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.premium',
    url: '/premium'
    template:'<ng2-premium-responder-page></ng2-premium-responder-page>'
    accessible_to: ['FreeManager']
