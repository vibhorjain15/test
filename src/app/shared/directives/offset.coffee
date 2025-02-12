angular.module('diligenceVault').directive 'offset', ->
  restrict: 'A'
  compile: (element, attributes) ->
    offset_type = attributes.offsetType or 'md'

    element.addClass "col-#{offset_type}-offset-#{attributes.offset}"
