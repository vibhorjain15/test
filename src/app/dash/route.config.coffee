angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.conditionalState 'app.dash',
    url: '/dash?dashType'
    templateForInvestor: 'dash/investor-template.html'
    templateForManager: 'dash/manager-template.html'
    controllerForInvestor: 'DashInvestorController'
    controllerForManager: 'DashManagerController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
