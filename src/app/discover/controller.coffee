class DiscoverController extends BaseController

  @register 'DiscoverController'

  @inject 'dataservice', '$stateParams', '$timeout', 'Utils'

  initialize: ->
    names = []
    cities = []
    options =
      enableCellNavigation: true
      enableColumnReorder: false
    structure = {
      hedge: 'HF'
      'private-equity': 'PE'
      'long-only': 'LO'
    }[@$stateParams.structure]
    dataset = @dataservice.getSearchData(structure)
    columns = @dataservice.getGridColumns()

    @entity_sub_type = @Utils.getEntitySubType()

    @filters =
      category: []
      aum: '0,500'
    @categories = ['Fund Raising', 'Closed', 'Liquidating']
    @is_collapsed = false
    @dataset = dataset

    for item in dataset
      names.push item.name
      cities.push item.city

    cities = _(cities).uniq()

    @$timeout((=>
      $('.js-aum-slider').slider
        formatter: ((value) -> "#{value[0]} Cr : #{value[1]} Cr")

      $('[name=name]').typeahead({
        highlight: true
        minLength: 1
      }, {
        source: @textMatcher(names)
        displayKey: 'value'
      })

      $('.js-location').typeahead({
        highlight: true
        minLength: 1
      }, {
        source: @textMatcher(cities)
        displayKey: 'value'
      })

      @grid = new (Slick.Grid)('#results-table', dataset, columns, options)
      @gridSorter 'percentage_complete', false, @grid, dataset
      @grid.setSortColumn 'percentage_complete', false
      @performSearch true, ''

      @grid.onSort.subscribe (e, args) =>
        @gridSorter args.sortCol.field, args.sortAsc, @grid, @grid.getData()
    ), 0)

  toggleSearchPanel: ->
    $panel = $('.js-search-panel')
    @is_collapsed = not @is_collapsed
    $panel.find('.panel-body').slideToggle()

  resetSearch: ->
    @filters =
      category: []
      aum: '0,500'

    $('.js-aum-slider').slider 'setValue', [0, 500]

    @$timeout (=>
      @performSearch(false)
    ), 0

  performSearch: (prevent_toggle) ->
    filters = @getFilters()
    keys = @getKeys(filters)

    results = $(@dataset).filter (idx, item) =>
      @every keys, (key) ->
        value = filters[key]
        regex = undefined
        if key == 'aum'
          value = value.split(',')
          item[key] >= Number(value[0]) and item[key] <= Number(value[1])
        else if key == 'category'
          if value.length then value.indexOf(item['category']) >= 0 else true
        else
          regex = new RegExp(value, 'i')
          regex.test item[key]

    @grid.setData results
    @grid.invalidate()

    @toggleSearchPanel() unless prevent_toggle

  getFilters: ->
    angular.extend @filters,
      name: $('[name=name]').val()
      city: $('[name=city]').val()

  getKeys: (obj) ->
    keys = []
    for key of obj
      if obj.hasOwnProperty(key)
        keys.push key
    keys

  every: (items, cb) ->
    i = 0
    while i < items.length
      if !cb(items[i])
        return false
      i++
    true

  gridSorter: (columnField, isAsc, grid, gridData) ->
    sign = if isAsc then 1 else -1
    field = columnField

    gridData.sort (row1, row2) ->
      val1 = row1[field]
      val2 = row2[field]
      result = if val1 == val2 then 0 else (if val1 > val2 then 1 else -1) * sign
      result

    grid.invalidate()
    grid.render()

  textMatcher: (items) ->
    (q, cb) ->
      matches = undefined
      regex = undefined
      matches = []
      regex = new RegExp(q, 'i')
      $.each items, (i, str) ->
        if regex.test(str)
          matches.push value: str

      cb matches
