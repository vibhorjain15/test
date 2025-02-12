angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile',
    url: '/profile'
    templateUrl: 'funds/profile/template.html'
    controller: 'FundProfileController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile',
    url: '/profile'
    template: '<ng2-entity-tabs></ng2-entity-tabs>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.strategies.funds.profile',
    url: '/profile'
    templateUrl: 'funds/profile/template.html'
    controller: 'FundProfileController'
    controllerAs: 'vm'