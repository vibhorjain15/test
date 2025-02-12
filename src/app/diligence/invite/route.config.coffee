angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.invite',
    url: '/invite?fundId&templateId&type&requestId'
    templateUrl: 'diligence/invite/investor.template.html'
    controller: 'DiligenceInviteInvestorController'
    controllerAs: 'vm'
    hidden_from: [ 'FreeSubscription','manager']
