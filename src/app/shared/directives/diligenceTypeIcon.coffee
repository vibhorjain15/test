angular.module('diligenceVault').directive 'diligenceTypeIcon', ($compile) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    tooltip_enabled = if attrs.enableTooltip then JSON.parse(attrs.enableTooltip) else false
    tooltip_placement = attrs.tooltipPlacement
    icon_size = attrs.iconSize

    init = (type) ->
      icon_map =
        'dd_doc': 'notepad'
        'dd_new': 'file-add'
        'dd_ongoing': 'clock-o'
        'dd_event_related': 'thunder'
        'dd_profile': 'manager'

      tooltip_map =
        'dd_doc': 'Digitized project for document sent by investor'
        'dd_new': 'Research and due diligence preceding the initial allocation'
        'dd_ongoing': 'Post investment, ongoing information request'
        'dd_event_related': 'Post investment request triggered by a specific event or circumstance, such as personnel change, drawdown, et al'
        'dd_profile': 'Internal profile of the manager'

      html = ''

      html += '<icon '
      html += 'name="' + icon_map[type] + '"'
      html += if tooltip_enabled then 'uib-tooltip="' + tooltip_map[type] + '"' else ''
      html += if tooltip_placement then 'tooltip-placement="' + tooltip_placement + '"' else ''
      html += if icon_size then 'size="' + icon_size + '"' else ''
      html += '></icon>'

      element.html $compile(html)(scope)

    deregisterer = scope.$watch(attrs.diligenceTypeIcon, (type) ->
      if type
        init type
        deregisterer()
    )
