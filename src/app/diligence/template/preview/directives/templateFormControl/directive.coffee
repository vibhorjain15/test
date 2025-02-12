angular.module('diligenceVault').directive 'templateFormControl', ($compile) ->
  restrict: 'E'
  replace: true
  templateUrl: 'diligence/template/preview/directives/templateFormControl/template.html'
  link: (scope, element, attrs) ->
    childScope = scope.$new()
    sectionId = attrs.sectionId

    controlDirectiveTag = "#{attrs.controlType}-rw"
    controlDirective = "<#{controlDirectiveTag}></#{controlDirectiveTag}>"

    element
      .find('.js-control-wrapper')
      .replaceWith($compile(controlDirective)(childScope))
