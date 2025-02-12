angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.releases.details',
    url: '/:releaseId'
    template: '<ng2-release-details></ng2-review-release-details>'
    accessible_to: ['DiligenceVaultUser']
