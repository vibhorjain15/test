angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.settings.preferences',
    url: '/preferences'
    template: '<ng2-my-preference></ng2-my-preference>'
