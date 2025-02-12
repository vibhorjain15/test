angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile.related_entities',
    url: '/related_entities'
    templateUrl: 'funds/profile/related_entities/template.html'
    controller: 'FundProfileEntitiesController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.related_entities',
    url: '/related_entities'
    templateUrl: 'funds/profile/related_entities/template.html'
    controller: 'FundProfileEntitiesController'
    controllerAs: 'vm'
