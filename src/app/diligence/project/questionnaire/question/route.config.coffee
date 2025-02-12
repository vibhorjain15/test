angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.project.questionnaire.category.question',
    url: '/question/:questionId'
    #template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.project.questionnaire.category.question',
    url: '/question/:questionId'
    #template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.project.questionnaire.category.question',
    url: '/question/:questionId'
    #template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.funds.vehicles.project.questionnaire.category.question',
    url: '/question/:questionId'
    #template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.project.questionnaire.category.question',
    url: '/question/:questionId'
    #template: '<ui-view/>'

angular.module('diligenceVault').config ($stateProvider) ->
  $stateProvider.state 'app.diligence.firms.strategies.funds.project.questionnaire.category.question',
    url: '/question/:questionId'
    #template: '<ui-view/>'
