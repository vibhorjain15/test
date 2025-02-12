angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.template.scoring',
    url: '/scoring'
    templateUrl: 'diligence/template/scoring/template.html'
    controller: 'DiligenceTemplateScoringController'
    controllerAs: 'vm'
    hidden_from: ['manager']
