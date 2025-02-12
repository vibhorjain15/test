angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.salesforce-crm',
    url: '/salesforce-crm'
    templateUrl: 'firm/settings/salesforce-crm/template.html'
    controller: 'SalesforceCRMController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin','FreeSubscription']
