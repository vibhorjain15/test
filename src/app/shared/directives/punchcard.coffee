angular.module('diligenceVault').directive 'punchcard', ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    data = undefined
    opts = scope.$eval(attrs.punchcardOptions)
    deregisterer = scope.$watch(attrs.punchcard, (value) ->
      if value and value.length > 0
        data = value
        draw()
        deregisterer()
    )

    draw = ->
      options = _(attrs).pick('rowHeaderLabel', 'colHeaderLabel', 'cellValueLabel')
      width = if data[0].length > 18 then data[0].length * 150 else element.outerWidth()
      _(options).extend {
        data: data
        element: element[0]
      }, opts
      chart = new D3punchcard(options)
      chart.draw width: width
      return
