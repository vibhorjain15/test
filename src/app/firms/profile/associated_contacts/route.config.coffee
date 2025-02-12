angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.profile.associated_contacts',
    url: '/associated_contacts'
    templateUrl: 'firms/profile/associated_contacts/template.html'
    controller: 'FirmProfileContactsController'
    controllerAs: 'vm'
