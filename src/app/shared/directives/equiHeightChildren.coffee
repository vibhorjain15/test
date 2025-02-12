angular.module('diligenceVault').directive 'equiHeightChildren', ($timeout) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    init = ->
      $timeout ->
        children = element.children()
        heights = _(children).map (child) -> $(child).height()

        children.height _(heights).max()

    if attrs.equiHeightChildren
      deregisterer = scope.$watch(attrs.equiHeightChildren, (value) ->
        if value
          init()
          deregisterer()
      )
    else
      init()
