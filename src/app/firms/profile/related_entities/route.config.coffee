angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.firms.profile.related_entities',
    url: '/related_entities'
    templateUrl: 'firms/profile/related_entities/template.html'
    controller: 'FirmProfileEntitiesController'
    controllerAs: 'vm'
