angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.contacts',
    url: '/contacts/:Id'
    templateUrl: 'contacts/template.html'
    controller: 'MonitorContactController'
    controllerAs: 'vm'
    hidden_from: ['securityAdmin']
