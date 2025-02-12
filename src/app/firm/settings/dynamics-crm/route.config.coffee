angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.dynamics-crm',
    url: '/dynamics-crm'
    templateUrl: 'firm/settings/dynamics-crm/template.html'
    controller: 'DynamicsCRMController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin','FreeSubscription']