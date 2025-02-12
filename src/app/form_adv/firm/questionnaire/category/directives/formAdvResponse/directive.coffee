angular.module('diligenceVault').directive 'formAdvResponse', ($compile, QuestionnaireWidgetFactory) ->
  restrict: 'E'
  scope: true
  replace: true
  templateUrl: 'form_adv/firm/questionnaire/category/directives/formAdvResponse/template.html'
  link: (scope, element, attrs) ->
    response = scope.$eval(attrs.response)
    responseType = response.question.attributes.responseType
    scope.response = response

    template = QuestionnaireWidgetFactory.getWidgetTemplate(responseType, true)

    element.find('.js-qa-response').html($compile(template)(scope))
