angular.module('diligenceVault').directive 'spreadsheetCreator', ($parse) ->
  restrict: 'E'
  templateUrl: 'shared/directives/spreadsheetCreator/template.html'
  link: (scope, element, attrs) ->
    scope.rows = scope.$eval(attrs.rows)
    scope.columns = scope.$eval(attrs.columns)

    #setting dynamicElement to null here to keep it consistent with the dynamic spreadsheet creator.
    scope.dynamicElement = null

    scope.assignValueToParent = () =>
      $parse(attrs.dynamicElement).assign(scope, scope.dynamicElement)

    scope.assignValueToParent()
