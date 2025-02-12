angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile.address',
    url: '/address'
    templateUrl: 'funds/profile/address/template.html'
    controller: 'FundProfileAddressController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.address',
    url: '/address'
    templateUrl: 'funds/profile/address/template.html'
    controller: 'FundProfileAddressController'
    controllerAs: 'vm'
