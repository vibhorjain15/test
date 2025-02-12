angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.analyze.compare.due_diligence_list',
    url: '/due_diligence_list?keepData'
    templateUrl: 'analyze/compare/due_diligence_list/template.html'
    controller: 'CompareDueDiligenceListController'
    controllerAs: 'vm'
