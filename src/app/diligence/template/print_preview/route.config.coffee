angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.template.print_preview',
    url: '/print_preview'
    templateUrl: 'diligence/template/print_preview/template.html'
    controller: 'DiligenceTemplatePrintPreviewController'
    controllerAs: 'vm'
