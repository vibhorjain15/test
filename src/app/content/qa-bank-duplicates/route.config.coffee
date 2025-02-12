angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.content.duplicates',
    url: '/duplicates'
    template: '<ng2-qa-bank-duplicates></ng2-qa-bank-duplicates>'
