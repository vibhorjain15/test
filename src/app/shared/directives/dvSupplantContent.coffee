angular.module('diligenceVault').directive 'dvSupplantContent', (Utils) ->
  restrict: 'A'
  link: (scope, element, attrs) ->

    scope.$watchGroup [attrs.supplantContent, attrs.supplantOptions], (values) =>
      if values[0] && values[1]
        content = values[0]
        options = values[1]

        element.html(Utils.supplant(content, options))
