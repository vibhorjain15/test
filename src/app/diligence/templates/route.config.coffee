angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.templates',
    url: '/templates'
    templateUrl: 'diligence/templates/template.html'
    controller: 'DiligenceTemplatesController'
    controllerAs: 'vm'
