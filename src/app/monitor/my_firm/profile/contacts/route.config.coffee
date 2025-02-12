angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.my_firm.profile.contacts',
    url: '/contacts'
    templateUrl: 'monitor/my_firm/profile/contacts/template.html'
    controller: 'MyFirmProfileContactsController'
    controllerAs: 'vm'
