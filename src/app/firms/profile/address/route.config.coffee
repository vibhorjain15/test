angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.profile.address',
    url: '/address'
    templateUrl: 'firms/profile/address/template.html'
    controller: 'FirmProfileAddressController'
    controllerAs: 'vm'
