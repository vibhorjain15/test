#TODO: Add support for multiple sides

angular.module('diligenceVault').directive 'dvBorder', ($compile) ->
  restrict: 'A'
  link: (scope, element, attrs) ->

    colors =
      dvBlue: '#16A1AB'
      dvDanger: '#cd3333'
      dvMuted: '#777777'

    side = attrs.dvBorderSide
    thickness = attrs.dvBorderThickness or 5
    color = if colors[attrs.dvBorderColor] then colors[attrs.dvBorderColor] else colors.dvBlue
    style = attrs.dvBorderStyle or 'solid'
    show = scope.$eval(attrs.dvBorderShow) != false

    if !angular.isDefined side
      throw 'MissingArgumentException: dv-border-side is required by dv-border directive.'

    if show
      element.css("border-#{side}": "#{thickness}px #{style} #{color}")