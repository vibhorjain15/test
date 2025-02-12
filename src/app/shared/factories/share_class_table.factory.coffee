angular.module('diligenceVault').factory 'ShareClassTableFactory', (FundDataservice) ->
  new class ShareClassTableFactory
    getYearsForShareClassTableValues: (share_class_table_values) ->
      years = _(share_class_table_values).map (value) ->
        moment(value.start_date).year()

      _(years).uniq()

    getYearsBasedOnInceptionDate: (inception_date) ->
      return [] unless inception_date?

      inception_year = moment(inception_date).year()
      current_year = moment().year()

      if current_year - inception_year > 20
        min_year = current_year - 20
      else
        min_year = inception_year

      [min_year..current_year]

    getYears: (values, share_class) ->
      inception_date_years = @getYearsBasedOnInceptionDate(share_class.inceptionDate)
      value_years = @getYearsForShareClassTableValues(values)

      years = _.union(inception_date_years, value_years)

      _(years).sortBy((year) -> -year)

    calculateNetReturn: (returns) ->
      net = 1

      _(returns).each (value) ->
        net *= (1 + value/100)

      net -= 1
      net *= 100

      net

    calculateNetAUM: (returns) ->
      _(_(returns).compact()).last()

    getColumns: (share_class_table, include_total_column, readonly=false) ->
      col_defaults = {readonly: readonly}
      months = moment.months()

      switch share_class_table.period
        when 'Monthly'
          columns = _(months).map (name, idx) ->
            column =
              name: name.slice(0, 3),
              start_month_idx: idx,
              end_month_idx: idx

            _(column).extend(col_defaults)

            column
        when 'Quarterly'
          quarters = [1..4]
          idx = 0

          columns = _(quarters).map ->
            start_month_idx = idx
            end_month_idx = idx + 2

            column =
              name: "#{months[start_month_idx].slice(0,3)}-#{months[end_month_idx].slice(0,3)}"
              start_month_idx: start_month_idx
              end_month_idx: end_month_idx

            _(column).extend(col_defaults)

            idx+=3

            column

      if include_total_column or (share_class_table.type is 'track_record')
        columns.push(name: 'YTD', readonly: true)

      columns

    getRows: (share_class_table, values, share_class, include_total_column) ->
      years = @getYears(values, share_class)
      columns = @getColumns(share_class_table, include_total_column)

      unless years.length
        years.push(moment().year())

      _(years).map (year) =>
        row =
          year: year

        _(columns).each (column) =>
          cell = @findOrCreateCell(
            start_month_idx: column.start_month_idx
            end_month_idx: column.end_month_idx
            values: values
            year: year
            shareclass_table_id: share_class_table.id
          )

          row[column.name] = cell

          row.total_cell = cell if cell.is_total_cell

        @computeTotal(row, share_class_table)

        row

    findOrCreateCell: (options) ->
      start_month_idx = options.start_month_idx
      end_month_idx = options.end_month_idx
      shareclass_table_id = options.shareclass_table_id
      year = options.year

      cell = _(options.values).find (value) ->
        start_date = moment(value.start_date)
        end_date = moment(value.end_date)

        (start_date.month() is start_month_idx) and
        (end_date.month() is end_month_idx) and
        (start_date.year() is year) and
        (end_date.year() is year)

      if cell?
        #_value is the value that is saved on the server
        cell._value = cell.value
      else
        cell = @createNewCell(year, start_month_idx, end_month_idx, shareclass_table_id)

      cell

    computeTotal: (row, share_class_table) ->
      total_cell = row.total_cell
      type = share_class_table.type

      return unless total_cell?

      returns = []

      for own key, cell of row
        if cell isnt total_cell
          if type is 'track_record'
            ret = cell.value || 0
          else if type is 'aum'
            ret = cell.value

          returns.push(ret)

      if type is 'track_record'
        total_cell.value = @calculateNetReturn(returns)
      else if type is 'aum'
        total_cell.value = @calculateNetAUM(returns)

      total_cell.value = Number(total_cell.value.toFixed(2))

    createNewCell: (year, start_month_idx, end_month_idx, aumtrackrecord_defintion_id) ->
      date_format = "YYYY-MM-DDTHH:mm:ss"

      if not start_month_idx? && not end_month_idx?
        return {is_total_cell: true}
      else
        cell =
          start_date: moment(new Date(year, start_month_idx)).startOf('month').format(date_format)
          end_date: moment(new Date(year, end_month_idx)).endOf('month').format(date_format)
          aumtrackrecord_defintion_id: aumtrackrecord_defintion_id

        FundDataservice.newShareClassTableValue(aumtrackrecord_defintion_id,cell)
