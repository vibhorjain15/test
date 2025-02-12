angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.help.formula',
    url: '/formula'
    templateUrl: 'help/formula/template.html'
    controller: 'FormulaHelpController'
    controllerAs: 'vm'