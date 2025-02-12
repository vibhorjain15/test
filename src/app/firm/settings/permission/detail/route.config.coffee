angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.permission.detail',
    url: '/detail'
    templateUrl: 'firm/settings/permission/detail/template.html'
    controller: 'FirmSettingsPermissionDetailsViewController'
    controllerAs: 'vm'
