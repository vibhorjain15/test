class FormADVFilingComparisonController extends BaseController
  @register 'FormADVFilingComparisonController'

  @inject 'Restangular', '$attrs', '$scope', 'materialThresholds'

  initialize: ->
    parent_scope = @$scope.$parent

    @firmCrd = parent_scope.$eval(@$attrs.firmCrd)
    @question = parent_scope.$eval(@$attrs.question)
    @dateRange = parent_scope.$eval(@$attrs.dateRange)

    @view_mode = 'table'
    @pagination_enabled = angular.isDefined @$attrs.paginationEnabled
    @changes_visible_inline = angular.isDefined @$attrs.changesVisibleInline
    @is_loading = true

    @rows = []
    @blackline_rows = []
    @filings_histories = []

    @thresholds = parent_scope.$eval(@$attrs.thresholds)
    @threshold_types = parent_scope.$eval(@$attrs.thresholdTypes)
    @threshold_question_rules = []

    parent_scope.$watch @$attrs.question, (question) =>
      if question?
        @question = question

        @loadFilingsHistory()

        if @thresholds && @thresholds.length
          _(@thresholds).each (threshold, key) =>
            if threshold.question_id == @question.id
              @threshold_question_rules.push(threshold)

    parent_scope.$watch @$attrs.dateRange, (dateRange) =>
      if dateRange?
        @dateRange = dateRange

  toggleViewMode: ->
    if @view_mode is 'table'
      @view_mode = 'blackline'
    else
      @view_mode = 'table'

  loadFilingsHistory: =>
    page_number = (@current_page || 0) + 1
    params =
      pageNumber: page_number
      questionId: @question.id
      firmCrd: @firmCrd
      response_type: @question.response_type

    if @dateRange
      params.start_at = @dateRange.start_at
      params.end_at = @dateRange.end_at

    @is_loading = true

    @Restangular.one('formadv_filings', null).all('history').customGET('', params).then (response) =>
      meta = response.meta

      @current_page = meta.pageNumber
      @total_pages = meta.totalPages

      @populateFilingsHistories(response.results)
      @computeRows(response.results)

      @is_loading = false

  computeMaterialChanges: (rows) =>
    @question.has_material_changes = false
    i = 0
    while i < @threshold_question_rules.length
      if @materialThresholds.isThresholdsValid(@threshold_question_rules[i], rows, @question.response_type)
        @question.has_material_changes = true
        break
      i++

  populateFilingsHistories: (histories) ->
    return if @filings_histories.length

    filings_histories = @filings_histories

    angular.forEach histories, (history) ->
      filings_histories.push(history)

  computeRows: (histories) =>
    rows = @rows
    blackline_rows = @blackline_rows

    if histories.length > 0
      angular.forEach histories[0].sequences, (sequence, idx) ->
        row = []

        angular.forEach histories, (filing_history, idx_new) ->
          row.push(filing_history.sequences[idx]?.response)

        rows.push(row)

        blackline_rows.push({
          current: row[0],
          previous: row[1]
        })

      col_length = if @changes_visible_inline then @rows[0].length+1 else @rows[0].length
      @$scope.setColumnLength(col_length)
      if @thresholds
        @computeMaterialChanges(rows)
