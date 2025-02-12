angular.module('diligenceVault').factory 'GridColumnService', (uiGridConstants) ->

  class GridColumn
    constructor: (options) ->
      @field = options.field
      @visible = true

    title: (title) ->
      @displayName = title

      @

    align: (alignment) ->
      @cellClass = "text-#{alignment}"
      @headerCellClass = "text-#{alignment}"

      @

    disableSorting: ->
      @enableSorting = false

      @

    disableColumnMenu: ->
      @enableColumnMenu = false

      @

    showTooltip: ->
      @cellTooltip = true

      @

    enableEditing: ->
      @enableCellEdit = true

      @

    enableGrouping: (priority) ->
      @grouping = {
        groupPriority: priority
      }

      @

    setDefaultSort: (direction) ->
      unless direction.toLowerCase() in ['asc', 'desc']
        direction = 'asc'

      direction = uiGridConstants[direction.toUpperCase()]

      if @sort?
        @sort.direction = direction
      else
        @sort =
          direction: direction

      @

    setWidth: (value) ->
      @minWidth = value

      @

    setHeight: (value) ->
      @height = value

      @

    setCellClass: (value, alignment) ->
      #Don't use in conjunction with align method, use alignment paramter instead
      if @cellClass
        #if align method is already applied then pick alignment from the cellClass
        alignment = (@cellClass.match(/text-(center|right|justify)/) or [])[1]

      if _.isFunction(value)
        @cellClass = ->
          computed_class = value.apply(null, arguments)
          if alignment then computed_class + ' text-' + alignment else computed_class
      else
        @cellClass = value + (if alignment then '' else ' text-' + alignment)

      @

    setTemplate: (templateName) ->
      @cellTemplate = "shared/ui-grid-cell-templates/#{templateName}.html"

      @

    setHeaderTemplate: (templateName) ->
      @headerCellTemplate = "shared/ui-grid-header-templates/#{templateName}.html"

      @

    setFilterHeaderTemplate: (templateName) ->
      @filterHeaderTemplate = "shared/ui-grid-header-templates/#{templateName}.html"

      @

    filterable: (value, options) ->
      @enableFiltering = value

      if options?
        @filter = options

      @

    format: (format) ->
      @type = format

      if format is 'date'
        @cellFilter = 'date: \'MMM d, y\''

      @

    showAggregationOptions: (value) ->
      @groupingShowAggregationMenu = value
      @

    enableHiding: (value) ->
      @enableHiding = value
      @

    disableGrouping: ->
      @enableGrouping = false
      @

    setSortingAlgorithm: (algorithm)=>
      @sortingAlgorithm = algorithm
      @

    setEmptyTitle: =>
      @emptyTitle = true
      @

    setVisibility: (visibility)=>
      @visible = visibility
      @

  new class GridColumnService
    $new: (options) -> new GridColumn(options)
