angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.profile.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'firms/profile/recommendations/template.html'
    controller: 'FirmProfileRecommendationsController'
    controllerAs: 'vm'

  $stateProvider.state 'app.monitor.my_firm.profile.recommendations',
    url: '/recommendations?recommendationId'
    templateUrl: 'firms/profile/recommendations/template.html'
    controller: 'FirmProfileRecommendationsController'
    controllerAs: 'vm'
