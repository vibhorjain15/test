angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.aum_tr',
    url: '/aum_tr'
    templateUrl: 'funds/profile/aum_tr/template.html'
    controller: 'FundProfileAUMTRController'
    controllerAs: 'vm'
