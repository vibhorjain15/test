angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.releases.notes',
    url: '/notes?id'
    template: '<ng2-release-notes></ng2-release-notes>'
