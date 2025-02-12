angular.module('diligenceVault').component 'filteredEntitySelector',{
  bindings:{
      entitySearchMap: '='
      templates: '<'
      checkboxLabel: '<'
      selectedEntities: '='
      globalTernaryOperator: '<'
      selectedFilters: '<'
      showFilterBasedSelection: '='
      allFilterTemplateId: '='
      entityType: '<'
      unfilteredSelectedEntities: '='
      isFilterFormValid: '='
      templateForm: '<'
      onChange: '&'
      maxSelectedTemplates: '='
  }
  templateUrl: 'shared/components/filteredEntitySelector/template.html'
  controller: 'FilteredEntitySelectorController'
  controllerAs: 'vm'
}
