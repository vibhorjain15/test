angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.to_external',
    url: '/to_external?entityId&entityType&diligenceId'
    templateUrl: 'diligence/to_external/template.html'
    controller: 'ToExternalController'
    controllerAs: 'vm'