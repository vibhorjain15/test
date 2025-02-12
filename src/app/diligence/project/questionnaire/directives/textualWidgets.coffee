registerTextualWidget = (type) ->
  directiveFn = (ddWidgetsFactory) ->
    "ngInject"
    link = (scope, element, attrs, ddFormControlController) ->
      $input = element.find('.form-control')
      if scope.response
        scope.$watch 'response.textResponse', (newValue, oldValue) ->
          if newValue isnt oldValue
            ddFormControlController.saveResponse scope.response

    ddWidgetsFactory.getDirectiveConfig(type, link)

  angular.module('diligenceVault').directive type, directiveFn


registerTextualWidget 'textRw'
registerTextualWidget 'textmultilineRw'
