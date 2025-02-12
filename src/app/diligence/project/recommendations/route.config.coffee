angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'diligence/project/recommendations/template.html'
    controller: 'ProjectRecommendationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'diligence/project/recommendations/template.html'
    controller: 'ProjectRecommendationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'diligence/project/recommendations/template.html'
    controller: 'ProjectRecommendationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'diligence/project/recommendations/template.html'
    controller: 'ProjectRecommendationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'diligence/project/recommendations/template.html'
    controller: 'ProjectRecommendationsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'diligence/project/recommendations/template.html'
    controller: 'ProjectRecommendationsController'
    controllerAs: 'vm'
