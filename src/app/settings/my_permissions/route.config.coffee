angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.settings.my_permissions',
    url: '/my-permissions'
    templateUrl: 'settings/my_permissions/template.html'
    controller: 'MyPermissionsController'
    controllerAs: 'vm'
