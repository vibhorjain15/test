angular.module('diligenceVault').factory 'ddWidgetsFactory', ->

  new class DDWidgetsFactory
    getDirectiveConfig: (type, link) ->
      restrict: 'E'
      templateUrl: "diligence/project/questionnaire/directives/#{type}/template.html"
      link: link
      require: '^?ddFormControl'
