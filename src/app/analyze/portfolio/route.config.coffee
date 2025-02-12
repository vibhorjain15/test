angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.analyze.portfolio',
    url: '/portfolio'
    templateUrl: 'analyze/portfolio/template.html'
    controller: 'PortfolioController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin','manager']
