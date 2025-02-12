angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile.ddq',
    url: '/ddq'
    templateUrl: 'funds/profile/ddq/template.html'
    controller: 'FundProfileDDQController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.ddq',
    url: '/ddq'
    templateUrl: 'funds/profile/ddq/template.html'
    controller: 'FundProfileDDQController'
    controllerAs: 'vm'
