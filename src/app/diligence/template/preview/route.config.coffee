angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.template.preview',
    url: '/preview?refresh'
    templateUrl: 'diligence/template/preview/template.html'
    controller: 'DiligenceTemplatePreviewController'
    controllerAs: 'vm'
