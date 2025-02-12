angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.settings.access_level_map',
    url: '/access-level-map'
    templateUrl: 'settings/access_level_map/template.html'
    controller: 'UserRolesMapController'
    controllerAs: 'vm'
