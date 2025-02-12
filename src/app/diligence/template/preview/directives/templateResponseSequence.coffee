getTemplateWidgetDirective = (question, mode, sectionId) ->
  controlType = question.responseType.toLowerCase()
  '<template-form-control control-type="' + controlType + '" mode="' + mode + '" section-id="' + sectionId + '">' + '</template-form-control>'

angular.module('diligenceVault').directive 'templateResponseSequence', ($compile) ->
  restrict: 'E'
  template: '<div class="response-sequence"></div>'
  replace: true
  link: (scope, element) ->
    questions = scope.sequence.questions

    appendFormControl = (question) ->
      childScope = scope.$new()
      childScope.question = question
      directive = getTemplateWidgetDirective(question, scope.mode, scope.section.id)

      element.append $compile(directive)(childScope)

    _(questions).each appendFormControl
