angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings',
    url: '/settings'
    abstract: true
    templateUrl: 'settings/template.html'
    controller: 'SettingsController'
    controllerAs: 'vm'
