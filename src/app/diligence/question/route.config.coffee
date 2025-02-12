angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.question',
    url: '/questions/:questionId'
    abstract: true
    template: '<ui-view />'
