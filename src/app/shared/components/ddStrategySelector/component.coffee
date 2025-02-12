angular.module('diligenceVault').component 'ddStrategySelector',{
  bindings:{
    selectedStrategies: '='
    standalone:'='
    search_criterias: '=searchCriterias'
    global_ternary_operator: '=globalTernaryOperator'
  }
  templateUrl: 'shared/components/ddStrategySelector/template.html'
  controller: 'ddStrategySelectorController'
  controllerAs: 'vm'
}