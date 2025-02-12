angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.releases.list',
    url: '/list'
    template: '<ng2-releases-list></ng2-releases-list>'
    accessible_to: ['DiligenceVaultUser']
