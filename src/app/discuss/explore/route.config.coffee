angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.discuss.explore',
    url: '/explore?sort&category&q'
    templateUrl: 'discuss/explore/template.html'
    controller: 'DiscussExploreController'
    controllerAs: 'vm'
    title: 'DV Discuss'
