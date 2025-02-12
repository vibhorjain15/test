class ShareClassTableController extends BaseController
  @register 'ShareClassTableController'

  @inject '$attrs', '$scope', 'toaster', 'debounce', 'FundDataservice',
          '$q', 'SweetAlert', 'ShareClassTableFactory', 'BaseDataService'

  initialize: ->
    deregisterer = @$scope.$parent.$watch @$attrs.resource, (share_class_table) =>
      return unless share_class_table?

      if @$attrs.readonlyAttr
        readonly = @$scope.$parent.$eval(@$attrs.readonlyAttr)
      else
        readonly = angular.fromJson(@$attrs.readonly)

      @readonly = readonly
      @sharedClassResource = @$scope.$parent.$eval(@$attrs.resource)
      share_class = @$scope.$parent.$eval(@$attrs.shareClass)

      @getShareClassTableValues(share_class_table).then (table_values) =>
        rows = @ShareClassTableFactory.getRows(share_class_table, table_values, share_class)
        columns = @ShareClassTableFactory.getColumns(share_class_table, false, readonly)

        @$scope.render(share_class_table, rows, columns)

      deregisterer()

    @notifySuccessfulSave = @debounce(=>
      @toaster.pop('success', '', 'Your changes have been saved', 1500)
    , 2000, true)

  getShareClassTableValues: (share_class_table) ->
    @BaseDataService.getShareClassTableValues(share_class_table.id)

  initializeRowWithCells: (row, share_class_table) ->
    columns = @ShareClassTableFactory.getColumns(share_class_table)
    year = row.year

    _(columns).each (column) =>
      start_month_idx = column.start_month_idx
      end_month_idx = column.end_month_idx

      cell = @ShareClassTableFactory.createNewCell(year, start_month_idx,
                                                   end_month_idx,
                                                   share_class_table.id)

      row.total_cell = cell if cell.is_total_cell

      row[column.name] = cell

  generateInsertionArray: (rowIdx, row)=>
    list = []
    _(row).each (item,key)=>
      list.push [rowIdx, key, item]
    list

  confirmRowDeletion: (rows, share_class_table, hot_instance) ->
    switch share_class_table.type
      when 'aum'
        title = "Are you sure you want to remove aum values for the years #{rows[0].year} to #{rows[rows.length-1].year}?"
      when 'track_record'
        title = "Are you sure you want to remove track record values for the years #{rows[0].year} to #{rows[rows.length-1].year}?"

    @SweetAlert.confirm({
      title: title
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @commitRowDeletion(rows, share_class_table, hot_instance)
    })

  commitRowDeletion: (rows, share_class_table, hot_instance) ->
    columns = @ShareClassTableFactory.getColumns(share_class_table)
    promises = []
    _(rows).each (row)=>
      year = row.year

      angular.forEach(columns, (column) ->
        cell = row[column.name]

        if cell.id?
          promises.push(cell.remove())
      )

    @$q.all(promises).then =>
      @toaster.pop 'success', "Returns successfully removed for the years #{rows[0].year} to #{rows[rows.length-1].year}"
      toDelete = []
      _(rows).each (row)=>
        hot_instance.setSourceDataAtCell(row.idx,'is_deleted',true)
        toDelete.push [row.idx, 1]
      hot_instance.alter('remove_row', toDelete)
      swal.close()

  commitCellChanges: (change, hot_instance, share_class_table) ->
    [row_idx, val_prop, old_value, new_value] = change
    regex = /\.value/
    #the value of change[1] is usually of the form column_name.value
    #since we need the entire object, it's better to strip '.value'
    cell = hot_instance.getSourceDataAtCell(row_idx, val_prop.replace(regex, ''))
    
    if isNaN(Number(new_value)) or !cell.valid
      return

    ###
      imagine a cell had a value as 8
      user changes the cell to have an invalid value:
        old_value => 8
        new_value => invalid value
        app prevents the save
      now user undoes his change:
        old_value => invalid value
        new_value => 8
      the check (cell._value is new_value) prevents this change being committed
      to server, because when the user changed the cell value to invalid value
      server still had 8, since we didn't make a request
    ###
    if (((!old_value && old_value !=0) && (!new_value && new_value !=0)) or
        (old_value is new_value) or
        (cell._value is new_value))
      return

    row = hot_instance.getSourceDataAtRow(row_idx)

    cell.save().then (response) =>
      unless cell.id?
        cell.id = response.id
        cell.fromServer = true #https://github.com/mgonto/restangular/issues/697#issuecomment-110841991

      cell._value = response.value

      @ShareClassTableFactory.computeTotal(row, share_class_table)
      @notifySuccessfulSave()

  addRowsSinceInception: (hot_instance) ->
    @SweetAlert.input({
      title: 'Enter the inception year'
      input: 'text'
      showCancelButton: true
      closeOnConfirm: false
    }).then (response) =>
      if response.value
        regex = /^\d{4}$/
        is_valid_four_digit_number = regex.test(response.value)
        inception_year = Number(response.value)
        rows = hot_instance.getSourceData()
        existing_years = _(rows).pluck('year')

        if !is_valid_four_digit_number
          @SweetAlert.error({'title':'Invalid input','text': 'Enter a valid inception year'})
        else if year > moment().year()
          @SweetAlert.error({'title':'Imaginary input','text': 'You cannot enter returns for a future year'})
        else
          current_year = moment().year()
          if inception_year < 1940
            inception_year = 1940
          total_years_to_add = current_year - inception_year
          i = 0
          while i <= total_years_to_add
            year = inception_year + i
            if _(existing_years).contains(year)
              ++i
            else
              hot_instance.year_for_next_row = year
              hot_instance.alter('insert_row', @getRowIdxToInsert(existing_years, year))
              ++i
          swal.close()
      else
        swal.close()

  addRowForSpecificYear: (hot_instance) ->
    @SweetAlert.input({
      title: 'Enter the year'
      input: 'text'
      showCancelButton: true
      closeOnConfirm: false
    }).then (response) =>
      if response.value
        regex = /^\d{4}$/
        is_valid_four_digit_number = regex.test(response.value)
        year = Number(response.value)
        rows = hot_instance.getSourceData()
        existing_years = _(rows).pluck('year')

        if !is_valid_four_digit_number
          @SweetAlert.error({'title':'Invalid input','text': 'Enter a valid year'})
        else if year > moment().year()
          @SweetAlert.error({'title':'Imaginary input','text': 'You cannot enter returns for a future year'})
        else if _(existing_years).contains(year)
          @SweetAlert.error({'title': 'Duplicate input','text': 'You already have a row for this year'})
        else
          hot_instance.year_for_next_row = year
          hot_instance.alter('insert_row', @getRowIdxToInsert(existing_years, year))
          swal.close()
      else
        swal.close()

  getRowIdxToInsert: (years, year) ->
    if years[0] < year
      return 0
    else if years[years.length - 1] > year
      return years.length
    else
      for _year, i in years
        if (years[i] < year) and (years[i-i] > year)
          return i
