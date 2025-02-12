angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.inbound.investor_pitch',
    url: '/investor_pitch'
    templateUrl: 'inbound/investor_pitch/template.html'
    controller: 'InvestorPitchController'
    controllerAs: 'vm'