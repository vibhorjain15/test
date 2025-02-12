angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.settings.my_admins',
    url: '/my-admins'
    templateUrl: 'settings/my_admins/template.html'
    controller: 'MyAdminsController'
    controllerAs: 'vm'
