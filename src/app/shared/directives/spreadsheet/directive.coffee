angular.module('diligenceVault').directive 'spreadsheet', ($compile, $timeout,Utils,CustomGridRenderer, ModalFactory, proprietaryLicenses) ->
  templateUrl: 'shared/directives/spreadsheet/template.html'
  controller: 'SpreadsheetController'
  controllerAs: 'vm'
  scope: 
    response: '='
    readonly: '='
    cellValueChange: '&'
    preview: '='
  link: (scope, element, attrs) ->
    scope.render = (response, readonly=false) ->
      # 150 is row header width
      scope.response_new = response
      scope.checkIfDropdown = false
      col_width = if response.columns.length < 6 then (element.parent().width() - 150) / (response.columns.length || 1) else 150
      scope.instance_id = "grid-response-table-#{response.question.id}"
      scope.handsontable_settings =
        licenseKey: proprietaryLicenses.Handsontable
        contextMenu: {
          items:{
            "undo":{}
            "redo":{}
          }
        }
        formulas : {
          engine: HyperFormula
        }
        #comments: true if scope.preview
        rowHeaderWidth: 150
        width: '100%'
        # height: if response.rows.length > 20 then 600 else 'auto'
        colWidths: col_width
        renderAllRows: false
        viewportRowRenderingOffset: 0
        maxCols: response.columns.length
        maxRows: response.rows.length
        mergeCells: response.mergeCells
        columns: _(response.columns).map (column, idx) =>
          column_name = column.name
          if column.type == 'dropdown'
            scope.checkIfDropdown = true
            if column.type_options.enable_multiselection
              sourceMap = _(column.type_options.source).map (column, index)=>
                col = 
                  id : column
                  label: column
              
              newColumn =
                data: "column_#{column.id}.cell.attributes.value"
                editor: 'MultiSelectEditor',
                renderer: CustomGridRenderer.MultiSelectRenderer,
                select:
                  config: {
                    separator: ',',
                    valueKey: 'id',
                    labelKey: 'label'
                  }
                  options: sourceMap
                title: column_name
            else
              newColumn = 
                data: "column_#{column.id}.cell.attributes.value"
                type: "dropdown"
                source: column.type_options.source
                title: column_name
                allowInvalid:false
                strict:true
                trimDropdown:false
              
            newColumn.placeholder = "Please select an option" if not readonly

          else if column.type == 'numeric'
            column['format'] = '0,0'
            if column.type_options.format == undefined
              column.type_options.format = null
            newColumn =
              data: "column_#{column.id}.cell.attributes.value"
              renderer: CustomGridRenderer.customNumericRenderer
              editor: 'GridNumericEditor'
              validator: CustomGridRenderer.customNumericValidator
              type: 'text'
              format: '0,0'
              title: column_name
            newColumn.placeholder = "Please enter numeric value" if not readonly
          else if column.type == 'percentage'
            newColumn =
              data: "column_#{column.id}.cell.attributes.value"
              renderer: CustomGridRenderer.customPercentageRenderer
              validator: CustomGridRenderer.customNumericValidator
              editor: 'GridNumericEditor'
              type: 'text'
              title: column_name
            newColumn.placeholder = "Please enter percentage value" if not readonly
          else if column.type == 'integer'
            newColumn =
              data: "column_#{column.id}.cell.attributes.value"
              renderer: CustomGridRenderer.customNumericRenderer
              editor: 'GridNumericEditor'
              type: 'text'
              title: column_name
              validator: (query, callback)->
                if (query and query != "" and !Utils.numberIsInteger(query))
                    callback(false)
                else
                    callback(true)
            newColumn.placeholder = "Please enter integer value" if not readonly
          else if column.type == 'date'
            newColumn =
              data: "column_#{column.id}.cell.attributes.value"
              type: 'date'
              dateFormat: column.type_options.dateFormat
              correctFormat: false
              defaultDate: column.type_options.defaultDate
              title: column_name
            newColumn.placeholder = "Please enter date value" if not readonly
          else
            newColumn=
              data: "column_#{column.id}.cell.attributes.value"
              type: 'text'
              title: column_name
              renderer: CustomGridRenderer.customTextRenderer
            newColumn.placeholder = "Please enter text value" if not readonly
          newColumn
        afterChange: ->
          sourceData = @getSourceData()
          scope.setCalculatedValue(sourceData, @)
          scope.cellValueChange()
        afterValidate: (isValid, value, row, prop, source)->
          cellProp = prop.split('.')[0]
          gridResponse = scope.datarows[row][cellProp].cell
          gridResponse.setValid(isValid)
          scope.cellValueChange()
          isValid
        afterCellMetaReset: ->
          sourceData = @getSourceData()
          scope.setCalculatedValue(sourceData, @)
        beforePaste: (data, coords)->
          coordinates = coords[0]
          for i in [0...data.length]
            for j in [0...data[i].length]
              #remove line breaks, carriage returns, unwanted tags, etc
              data[i][j] = data[i][j].replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '').replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '').replace(/\r?\n|\r/g,'') if data[i][j]
              j++
            i++
          data

      if scope.checkIfDropdown
        if response.rows.length < 6
          scope.handsontable_settings.height = (response.rows.length * 25) + 150
        else if response.rows.length < 20
          scope.handsontable_settings.height = (response.rows.length * 25)
        else
          scope.handsontable_settings.height = 500
      else
        if response.rows.length < 20
          scope.handsontable_settings.height = 'auto'
        else
          scope.handsontable_settings.height = 500
        
      # if response.columns.length > 5
      #   scope.handsontable_settings.autoRowSize = {
      #     syncLimit: '100%'
      #   }
        #oColSize: true
      grid_responses = response.attributes.grid_responses
      
      scope.handsontable_settings.rowHeaders = _(response.rows).pluck('name')
      scope.datarows = _(response.rows).map((row) ->
        datarow = {}

        _(response.columns).each (column) ->
          datarow["column_#{column.id}"] =
            cell: _(grid_responses).findWhere(column: column, row: row)

        datarow
      )
      

    scope.handleCell = (rowIndex, colIndex, column, reference)->
      rowVisualIndex = reference.toVisualRow(rowIndex)
      colVisualIndex = reference.toVisualColumn(colIndex)
      if column.cell.attributes.formula or scope.readonly
        reference.setCellMeta(rowVisualIndex, colVisualIndex, 'readOnly', true)
      else
        reference.setCellMeta(rowVisualIndex, colVisualIndex, 'readOnly', false)

      cellHasError = scope.cellHasError(column.cell.attributes)
      if cellHasError
        column.cell.setFormulaValid(false)
        reference.setCellMeta(rowVisualIndex, colVisualIndex, 'className', 'htDangerBackground')
        #reference.getPlugin('comments').setCommentAtCell(rowVisualIndex, colVisualIndex, scope.getCellError(column.cell.attributes))
      else
        column.cell.setFormulaValid(true)
        reference.setCellMeta(rowVisualIndex, colVisualIndex, 'className', '')
        #reference.getPlugin('comments').setCommentAtCell(rowVisualIndex, colVisualIndex, '')
      #comment out the comment plugin related changes for now.
      # if scope.preview
      #   formula = column.cell.attributes.formula
      #   if formula
      #     reference.getPlugin('comments').setCommentAtCell(rowVisualIndex, colVisualIndex, formula)
      #   else
      #     reference.getPlugin('comments').setCommentAtCell(rowVisualIndex, colVisualIndex, '')

    scope.setCalculatedValue = (sourceData, reference)->
      _(sourceData).each (row, rowIndex)=>
        columnIndex = 0
        _(row).each (column)=>
          instantFormula = reference.getSourceDataAtCell(rowIndex, columnIndex)
          if column.cell.attributes.formula
            column.cell.attributes.calculatedValue = reference.getDataAtCell(rowIndex,columnIndex)
          else if instantFormula and instantFormula.toString().startsWith('=')
            column.cell.attributes.instantFormula = instantFormula
            column.cell.attributes.calculatedValue = reference.getDataAtCell(rowIndex,columnIndex)
          else
            column.cell.attributes.instantFormula = null
            column.cell.attributes.calculatedValue = null
          @handleCell(rowIndex, columnIndex, column, reference)
          columnIndex++
      reference.render()

    scope.cellHasError = (cell)=>
      if cell.calculatedValue and (cell.calculatedValue.toString().indexOf('ERROR.TYPE') > -1 or cell.calculatedValue.toString().startsWith('#'))
        true
      else
        false

    scope.getCellError = (cell)=>
      errorCode = cell.calculatedValue.match(/ERROR.TYPE\((.*)\)/)[1]
      switch errorCode
        when "1"
          "Value is null"
        when "2"
          "Divide by zero error"
        when "3"
          "No value present"
        when "4"
          "Reference Error"
        when "5"
          "Column is not present"
        when "6"
          "Not a number"
        when "7"
          "Not Applicable"
        when "8"
          "Getting Data"
        else
          errorCode