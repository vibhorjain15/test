angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile.summary',
    url: '/summary'
    templateUrl: 'funds/profile/summary/template.html'
    controller: 'FundProfileSummaryController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.summary',
    url: '/summary'
    templateUrl: 'funds/profile/summary/template.html'
    controller: 'FundProfileSummaryController'
    controllerAs: 'vm'
