angular.module('diligenceVault').directive 'rbHeaderRow', ($compile) ->
  restrict: 'E'
  template: '<div></div>'
  replace: true
  link: (scope, element) ->

    generateTemplate = (styleParams) ->
      template = """
          <h4 class="header-title" ng-style="{ 'color': '#{styleParams.fontColor}',
                          'background-color': '#{styleParams.backgroundColor}',
                          'font-size': '#{styleParams.size}px',
                          'text-align': '#{styleParams.alignment}'}">#{styleParams.text}</h4>
        """

      return template

    scope.$render = ->
      template = generateTemplate(scope.component.options)
      element.html($compile(template)(scope))

    scope.$render()
