angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.funds.profile.contacts',
    url: '/contacts'
    templateUrl: 'funds/profile/contacts/template.html'
    controller: 'FundProfileContactsController'
    controllerAs: 'vm'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.funds.profile.contacts',
    url: '/contacts'
    templateUrl: 'funds/profile/contacts/template.html'
    controller: 'FundProfileContactsController'
    controllerAs: 'vm'
