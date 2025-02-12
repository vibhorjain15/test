angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.download_audits',
    url: '/download_audits'
    template: '<ng2-download-audits></ng2-download-audits>'
