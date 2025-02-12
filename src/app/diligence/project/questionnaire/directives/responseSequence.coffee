getDirectiveFor = (question, mode) ->
  controlType = question.responseType.toLowerCase()
  "<dd-form-control control-type=\"#{controlType}\" control-mode=\"#{mode}\"></dd-form-control>"

angular.module('diligenceVault').directive 'responseSequence', ($compile) ->
  restrict: 'E'
  template: '<div class="response-sequence"></div>'
  replace: true
  link: (scope, element) ->
    responses = scope.sequence.responses

    _(responses).each (response) ->
      # scope.mode will be available through prototypical inheritance
      directive = getDirectiveFor(response.question, scope.mode)
      childScope = scope.$new()
      childScope.response = response

      element.append $compile(directive)(childScope)
