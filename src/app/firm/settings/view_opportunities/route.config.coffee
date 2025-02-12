angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.firm.settings.view_opportunities',
    url: '/view_opportunities'
    templateUrl: 'firm/settings/view_opportunities/template.html'
    controller: 'ViewOpportunitiesController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin', 'manager']