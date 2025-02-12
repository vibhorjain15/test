class C3ChartFactoryProvider
  config = {}

  ensure = (path) ->
    keys = path.split('.')
    previousValue = null

    angular.forEach keys, (key) ->
      valueAtPath = previousValue || config

      valueAtPath[key] = {} unless valueAtPath[key]?

      previousValue = valueAtPath[key]

  getObjectAtPath = (obj, path) ->
    keys = path.split('.')

    _(keys).reduce (result, key) ->
      result[key]
    , obj

  # setConfigAtPath('bar.width.ratio', 0.8)
  setConfigAtPath: (path, value) ->
    keys = path.split('.') # ['bar', 'width', 'ratio']
    sub_path = keys.slice(0, keys.length - 1).join('.') #bar.width

    if sub_path
      ensure sub_path

      obj = getObjectAtPath(config, sub_path) #returns the value(obj) at config.bar.width

      obj[keys[keys.length - 1]] = value #sets config.bar.width['ratio'] = 0.8
    else #when path doesn't have a dot, example: setConfigAtPath("foo", "bar")
      config[path] = value

    @

  setPadding: (args...) ->
    if angular.isObject(args[0])
      config.padding = args[0]

      @

    direction = args[0]
    value = args[1]

    @setConfigAtPath("padding.#{direction}", value)

  setPaddingTop: (value) ->
    @setPadding('top', value)

  setPaddingBottom: (value) ->
    @setPadding('bottom', value)

  setPaddingLeft: (value) ->
    @setPadding('left', value)

  setPaddingRight: (value) ->
    @setPadding('right', value)

  setColorPattern: (pattern) ->
    @setConfigAtPath('color.pattern', pattern)

  setInteractionEnabled: (value) ->
    @setConfigAtPath('interaction.enabled', value)

  setTransitionDuration: (value) ->
    @setConfigAtPath('transition.duration', value)

  disableTransition: ->
    @setTransitionDuration(null)

  showDataLabels: -> #default value is false, hence not adding hideDataLabels
    @setConfigAtPath('data.labels', true)

  setDataEmptyLabelText: (value) ->
    @setConfigAtPath('data.empty.label.text', value)

  showGridsAlongXAxis: ->
    @setConfigAtPath('grid.x.show', true)

  showGridsAlongYAxis: ->
    @setConfigAtPath('grid.y.show', true)

  showGrids: ->
    @showGridsAlongXAxis()
    @showGridsAlongYAxis()

  hideLegends: ->
    @setConfigAtPath('legend.show', false)

  setLegendPosition: (position) ->
    @setConfigAtPath('legend.position', position) #bottom, right, inset

  hideTooltip: ->
    @setConfigAtPath('tooltip.show', false)

  setTooltipGrouped: (value) ->
    @setConfigAtPath('tooltip.grouped', value)

  enableZoom: ->
    @setConfigAtPath('zoom.enabled', true)

  hidePoints: ->
    @setConfigAtPath('point.show', false)

  setPointRadius: (value) ->
    @setConfigAtPath('point.r', value)

  setPointFocusExpandEnabled: (value) ->
    @setConfigAtPath('point.focus.expand.enabled', value)

  setPointFocusExpandRadius: (value) ->
    @setConfigAtPath('point.focus.expand.r', value)

  setPointSelectRadius: (value) ->
    @setConfigAtPath('point.select.r', value)

  setBarWidth: (value) ->
    @setConfigAtPath('bar.width', value)

  setBarWidthRatio: (value) ->
    @setConfigAtPath('bar.width.ratio', value)

  hidePieLabel: ->
    @setConfigAtPath('pie.label.show', false)

  setPieLabelThreshold: (value) ->
    @setConfigAtPath('pie.label.threshold', value)

  setPieExpand: (value) ->
    @setConfigAtPath('pie.expand', value)

  hideDonutLabel: ->
    @setConfigAtPath('donut.label.show', false)

  setDonutLabelThreshold: (value) ->
    @setConfigAtPath('donut.label.threshold', value)

  setDonutExpand: (value) ->
    @setConfigAtPath('donut.expand', value)

  setDonutWidth: (value) ->
    @setConfigAtPath('donut.width', value)

  $get: ->
    getDefaultConfig = -> config

    {
      getDefaultConfig: getDefaultConfig,
    }

angular
  .module('diligenceVault')
  .provider 'C3ChartFactory', C3ChartFactoryProvider
