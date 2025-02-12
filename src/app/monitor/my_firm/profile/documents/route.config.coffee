angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.monitor.my_firm.profile.documents',
    url: '/documents'
    templateUrl: 'monitor/my_firm/profile/documents/template.html'
    controller: 'MyFirmProfileDocumentsController'
    controllerAs: 'vm'

