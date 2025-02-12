angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'funds/profile/recommendations/template.html'
    controller: 'FundProfileRecommendationsController'
    controllerAs: 'vm'
angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'funds/profile/recommendations/template.html'
    controller: 'FundProfileRecommendationsController'
    controllerAs: 'vm'
