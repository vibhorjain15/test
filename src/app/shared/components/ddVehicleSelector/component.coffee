angular.module('diligenceVault').component 'ddVehicleSelector',{
  bindings:{
    selectedVehicles: '='
    selectedFunds: '='
    standalone: '<'
    search_criterias: '=searchCriterias'
    global_ternary_operator: '=globalTernaryOperator'
  }
  templateUrl: 'shared/components/ddVehicleSelector/template.html'
  controller: 'ddVehicleSelectorController'
  controllerAs: 'vm'
}