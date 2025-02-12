angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.settings.profile',
    url: '/profile'
    templateUrl: 'settings/profile/template.html'
    controller: 'ProfileSettingsController'
    controllerAs: 'vm'
