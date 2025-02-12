angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.configure_opportunity',
    url: '/configure_opportunity'
    templateUrl: 'firm/settings/configure_opportunity/template.html'
    controller: 'ConfigureOpportunityController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin','manager']