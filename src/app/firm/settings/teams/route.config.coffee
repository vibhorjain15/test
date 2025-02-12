angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firm.settings.teams',
    url: '/teams'
    templateUrl: 'firm/settings/teams/template.html'
    controller: 'FirmSettingsTeamsController'
    controllerAs: 'vm'
