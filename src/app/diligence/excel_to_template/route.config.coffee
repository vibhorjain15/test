angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.authorizedState 'app.diligence.excel_to_template',
    url: '/excel_to_template/:doc_id'
    templateUrl: 'diligence/excel_to_template/template.html'
    controller: 'DiligenceExcelTemplatesController'
    controllerAs: 'vm'
    hidden_from: ['investor']
