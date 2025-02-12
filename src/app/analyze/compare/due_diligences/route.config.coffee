angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.analyze.compare.due_diligences',
    url: '/due_diligences?ids&activeTab&template_id'
    templateUrl: 'analyze/compare/due_diligences/template.html'
    controller: 'CompareDueDiligencesController'
    controllerAs: 'vm'
