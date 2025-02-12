angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.contacts',
    url: '/contacts'
    templateUrl: 'monitor/contacts/template.html'
    controller: 'MonitorContactsController'
    controllerAs: 'vm'
