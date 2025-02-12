angular.module('diligenceVault').directive 'dynamicSpreadsheetCreator', ($parse) ->
  restrict: 'E'
  templateUrl: 'shared/directives/dynamicSpreadsheetCreator/template.html'
  link: (scope, element, attrs) ->
    scope.rows = scope.$eval(attrs.rows)
    scope.columns = scope.$eval(attrs.columns)
    #scope.dynamicElement = if scope.$eval(attrs.dynamicElement) then scope.$eval(attrs.dynamicElement) else 'Row'
    scope.dynamicElement = 'Row'
    #scope.dynamicSwitch = false

    # deregisterer1 = scope.$watch attrs.dynamicElement, (newValue, oldValue) =>
    #   if newValue != oldValue
    #     scope.dynamicElement = newValue
    #     scope.dynamicSwitch = scope.dynamicElement == "Column"
    #     deregisterer1()

    scope.assignValueToParent = () =>
      $parse(attrs.dynamicElement).assign(scope, scope.dynamicElement)

    scope.assignValueToParent()

    # scope.$watch 'dynamicSwitch', (newValue, oldValue) =>
    #   if newValue != oldValue
    #     scope.switchDynamicElement()

    # scope.switchDynamicElement = () =>
    #   scope.dynamicElement = if scope.dynamicSwitch then "Column" else "Row"
    #   scope.assignValueToParent()
