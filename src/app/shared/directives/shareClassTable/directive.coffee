angular.module('diligenceVault').directive 'shareClassTable', ($compile,proprietaryLicenses) ->
  templateUrl: 'shared/directives/shareClassTable/template.html'
  controller: 'ShareClassTableController'
  controllerAs: 'vm'
  scope: true
  require: 'shareClassTable'
  link: (scope, element, attrs, shareClassTableController) ->
    resource = scope.$eval attrs.resource

    deregister = scope.$watch 'vm.hotInstance', (hot_instance)=>
      if hot_instance
        hot_instance.addHook 'afterCreateRow', (rowIdx) ->
          inserted_row = @getSourceDataAtRow(rowIdx)

          inserted_row.year = @year_for_next_row

          shareClassTableController.initializeRowWithCells(inserted_row, scope.share_class_table)
          @setSourceDataAtCell(shareClassTableController.generateInsertionArray(rowIdx, inserted_row))

        hot_instance.addHook 'beforeRemoveRow', (rowIdx, amount, physicalRows) ->
          removable_rows = []
          _(physicalRows).each (rowIndex)=>
            removable_row = @getSourceDataAtRow(rowIndex)
            removable_row.idx = rowIndex
            removable_rows.push removable_row

          return true if removable_rows[0].is_deleted

          shareClassTableController.confirmRowDeletion(removable_rows, scope.share_class_table, @)

          return false

        hot_instance.updateSettings
          cells: (row_idx, col_idx) ->
            if scope.share_class_table.type is 'track_record'
              cell_properties =
                renderer: 'percentageRenderer'
            else
              cell_properties = {}

            today = moment()

            row = hot_instance.getSourceDataAtRow(row_idx)
            return unless row

            if (row.year isnt today.year())
              return cell_properties

            columns = hot_instance.getSettings().columns
            column = columns[col_idx]

            # column is usually not available when the nghandontable directive
            # is being destroyed
            return unless column?

            cell = hot_instance.getSourceDataAtCell(row_idx, column.title)

            if (moment(cell.end_date).month() > today.month())
              cell_properties.editor = false
              cell_properties.className = 'htDimmed'

            cell_properties

    scope.render = (share_class_table, rows, columns) ->
      scope.share_class_table = share_class_table
      scope.instance_id = attrs.shareClassTableId or "share-class-table-#{share_class_table.id}"

      scope.handsontable_settings =
        licenseKey: proprietaryLicenses.Handsontable
        contextMenu:
          items:
            remove_row: {}
            hsep2: '---------'
            undo: {}
            redo: {}
        stretchH: 'all'
        colHeaders: true
        width: 'auto'
        height: if rows.length > 20 then 500 else 'auto'
        maxCols: columns.length
        beforePaste: (data, coords)->
          coordinates = coords[0]
          for i in [0...data.length]
            for j in [0...data[i].length]
              data[i][j] = data[i][j].replace(/[^\d.-]/g, '')
              j++
            i++
          
          if data.length > scope.datarows.length
            diff = data.length - scope.datarows.length
            for i in [scope.datarows.length+diff-1..scope.datarows.length]
              data.splice(i,1)
          
          data
        rowHeaders: (idx) =>
          scope.vm.hotInstance.getSourceDataAtRow(idx).year if scope.vm.hotInstance
        afterChange: (changes, source) ->
          if source isnt 'loadData'
            angular.forEach changes, (change) =>
              shareClassTableController.commitCellChanges(change, @, share_class_table)
        afterValidate: (isValid, value, row, prop, source)->
          regex = /\.value/
          cellProp = prop.split('.')[0]
          cell = @getSourceDataAtCell(row, prop.replace(regex, ''))
          cell.valid = isValid

      scope.datarows = rows


      scope.columns = []
      angular.forEach columns, (column) ->
        newColumn =
          data: "#{column.name}.value"
          type: "numeric"
          title: column.name
          readOnly: column.readonly
          numericFormat: {
            pattern: '0,0.00',
            culture: 'en-US' 
          }
          className:'htCenter'
          validator: (query, callback)->
            decimalPart = query.toString().split('.')[1]
            if decimalPart and decimalPart.length > 4
              callback(false)
            else
              callback(true)
        scope.columns.push newColumn
          