angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.manage_opportunity',
    url: '/manage_opportunity'
    templateUrl: 'firm/settings/manage_opportunity/template.html'
    controller: 'ManageOpportunityController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin','manager']