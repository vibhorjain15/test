angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.recommendation',
    url: '/recommendation'
    templateUrl: 'diligence/project/recommendation/template.html'
    controller: 'ProjectRecommendationController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.recommendation',
    url: '/recommendation'
    templateUrl: 'diligence/project/recommendation/template.html'
    controller: 'ProjectRecommendationController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.recommendation',
    url: '/recommendation'
    templateUrl: 'diligence/project/recommendation/template.html'
    controller: 'ProjectRecommendationController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.recommendation',
    url: '/recommendation'
    templateUrl: 'diligence/project/recommendation/template.html'
    controller: 'ProjectRecommendationController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.recommendation',
    url: '/recommendation'
    templateUrl: 'diligence/project/recommendation/template.html'
    controller: 'ProjectRecommendationController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.recommendation',
    url: '/recommendation'
    templateUrl: 'diligence/project/recommendation/template.html'
    controller: 'ProjectRecommendationController'
    controllerAs: 'vm'