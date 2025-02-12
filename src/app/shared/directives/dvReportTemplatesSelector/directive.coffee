angular.module('diligenceVault').directive 'dvReportTemplatesSelector', ->
  restrict: "E"
  scope:
      name: '='
      entityType: '='
      entities: '='
      filterParams: '='
      selection: '='
      displayParams: '='
      viewActionMethod: '&'
      templateName: '='

  templateUrl: 'shared/directives/dvReportTemplatesSelector/template.html'
  controller: 'DvReportTemplatesSelectorController'
  controllerAs: 'vm'
