angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.project.investment_ratings',
    url: '/investment_ratings?categoryId'
    templateUrl: 'diligence/project/investment_ratings/template.html'
    controller: 'InvestmentRatingsController'
    controllerAs: 'vm'
    hidden_from: ['manager','FreeSubscription']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.firms.project.investment_ratings',
    url: '/investment_ratings?categoryId'
    templateUrl: 'diligence/project/investment_ratings/template.html'
    controller: 'InvestmentRatingsController'
    controllerAs: 'vm'
    hidden_from: ['manager','FreeSubscription']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.firms.funds.project.investment_ratings',
    url: '/investment_ratings?ategoryId'
    templateUrl: 'diligence/project/investment_ratings/template.html'
    controller: 'InvestmentRatingsController'
    controllerAs: 'vm'
    hidden_from: ['manager','FreeSubscription']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.firms.funds.vehicles.project.investment_ratings',
    url: '/investment_ratings?categoryId'
    templateUrl: 'diligence/project/investment_ratings/template.html'
    controller: 'InvestmentRatingsController'
    controllerAs: 'vm'
    hidden_from: ['manager','FreeSubscription']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.firms.strategies.project.investment_ratings',
    url: '/investment_ratings?categoryId'
    templateUrl: 'diligence/project/investment_ratings/template.html'
    controller: 'InvestmentRatingsController'
    controllerAs: 'vm'
    hidden_from: ['manager','FreeSubscription']

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.firms.strategies.funds.project.investment_ratings',
    url: '/investment_ratings?categoryId'
    templateUrl: 'diligence/project/investment_ratings/template.html'
    controller: 'InvestmentRatingsController'
    controllerAs: 'vm'
    hidden_from: ['manager','FreeSubscription']