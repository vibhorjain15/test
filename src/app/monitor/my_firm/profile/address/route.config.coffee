angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.my_firm.profile.address',
    url: '/address'
    templateUrl: 'monitor/my_firm/profile/address/template.html'
    controller: 'MyFirmProfileAddressController'
    controllerAs: 'vm'
