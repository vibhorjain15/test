angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.my_downloads',
    url: '/my_downloads'
    template: '<ng2-my-downloads></ng2-my-downloads>'
