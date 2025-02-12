angular.module('diligenceVault').directive 'dynamicSpreadsheet', ($compile, $timeout, SweetAlert,QuestionnaireGridResponseFactory,Utils,CustomGridRenderer, proprietaryLicenses) ->
  templateUrl: 'shared/directives/dynamic-spreadsheet/template.html'
  controller: 'DynamicSpreadsheetController'
  controllerAs: 'vm'
  scope:
    response: '='
    readonly: '='
    cellValueChange: '&'
  link: (scope, element, attrs) ->
    instance_id = null
    
    scope.render = (response, readonly=false) =>

      scope.instance_id = "grid-response-table-#{response.question.id}"
      scope.response_new = response
      scope.minSpareRows = response.rows.length
      scope.checkIfDropdown = false

      scope.showInsertButton = !(scope.printPreview or readonly)

      scope.datarowEmptyRows = {}
      _(response.columns).each (column) ->
        gridObj = QuestionnaireGridResponseFactory.$new({id: 1, name:"name",grid_id: column.grid_id, elementType: "Row"}, column, {}, true)
        gridObj.value = ""
        scope.datarowEmptyRows["column_#{column.id}"] =
          cell: gridObj

      col_width = if response.columns.length < 6 then (element.parent().width() - 150) / (response.columns.length || 1) else 150
      scope.handsontable_settings =
        licenseKey: proprietaryLicenses.Handsontable
        rowHeaderWidth: 150
        colWidths: col_width # 150 is row header width
        rowHeaders: true
        width: '100%'
        autoRowSize: true
        maxCols: response.columns.length
        maxRows: response.rows.length
        afterChange: ->
          scope.cellValueChange()
        afterValidate: (isValid, value, row, prop, source)->
          cellProp = prop.split('.')[0]
          gridResponse = scope.datarows[row][cellProp].cell
          gridResponse.setValid(isValid) if gridResponse
          scope.cellValueChange()
          isValid
        beforePaste: (data, coords)->
          coordinates = coords[0]
          for i in [0...data.length]
            for j in [0...data[i].length]
              #remove line breaks, carriage returns, unwanted tags, etc
              data[i][j] = data[i][j].replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '').replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '').replace(/\r?\n|\r/g,'') if data[i][j]
              j++
            i++
          data

      grid_responses = response.attributes.grid_responses
      
      if response.rows.length > 0
        scope.datarows = _(response.rows).map((row) ->
          datarow = {}

          _(response.columns).each (column) ->
            datarow["column_#{column.id}"] =
              cell: _(grid_responses).findWhere(column: column, row: row)

          datarow
        )
      else
        scope.handsontable_settings.hiddenRows =
          rows: [0]
        scope.datarows = [scope.datarowEmptyRows]
       
      scope.dynamic_element = response.attributes.dynamic_element

      scope.renderTable(scope.response_new, readonly)

    scope.addRowOrColumn = (num_of_elements) =>
      if scope.dynamic_element == 'Row'
        lastRow = scope.response_new.rows[scope.response_new.rows.length - 1]
        lastRowId = if lastRow != undefined or lastRow? then Number(lastRow.id) else 0
        i = 0
        while i < num_of_elements
          #Create new row
          lastRowId += 1
          new_row = {
            name: lastRowId.toString()
            id: lastRowId
            group_id: lastRowId
            elementType:'Row'
            grid_id: scope.response_new.question.attributes.grid_id
          }
          scope.datarows = [] if scope.response_new.rows.length == 0
          scope.response_new.rows.push(new_row)
          datarow = {}

          #Add row to the grid_reponses and datarows array
          _(scope.response_new.columns).each (column) ->
            attributes = {
              value:null
            }
            cell = QuestionnaireGridResponseFactory.$new(new_row,column,attributes, true)
            #Need to call this to initialise the previous attributes
            cell.copyCurrentAttributes()
            datarow["column_#{column.id}"] =
              cell : cell
            scope.response_new.attributes.grid_responses.push cell
          scope.handsontable_settings.maxRows = scope.response_new.rows.length
          scope.handsontable_settings.colWidths = if scope.response_new.columns.length < 6 then (element.parent().width() - 150) / (scope.response_new.columns.length || 1) else 150
          scope.datarows.push datarow
          if scope.response_new.rows.length > 0
            scope.handsontable_settings.hiddenRows = false
          i++
      else if scope.dynamic_element == 'Column'
        j = 0
        while j < num_of_elements
          #Create new column object
          new_column = {
            name: (scope.response_new.columns.length + 1).toString()
            id: scope.response_new.columns.length + 1
            group_id: scope.response_new.columns.length + 1
            elementType:'Column'
            grid_id: scope.response_new.question.attributes.grid_id
          }
          #Update datarows array
          scope.response_new.columns.push(new_column)
          _(scope.datarows).each (datarow,index) =>
            currentRow = scope.response_new.rows[index]
            attributes = {
              value: null
            }
            gridCell = QuestionnaireGridResponseFactory.$new(currentRow,new_column,attributes, true)
            gridCell.copyCurrentAttributes()
            datarow["column_#{new_column.id}"] =
              cell: gridCell
          j++

        #Update grid_responses
        gridResponses = []
        _(scope.response_new.rows).each (row,index) =>
          _(scope.response_new.columns).each (column) =>
            gridResponses.push  scope.datarows[index]["column_#{column.id}"].cell
        scope.response_new.attributes.grid_responses = gridResponses
        scope.handsontable_settings.maxCols = scope.response_new.columns.length
        scope.handsontable_settings.colWidths = if scope.response_new.columns.length < 6 then (element.parent().width() - 150) / (scope.response_new.columns.length || 1) else 150
      
      
      
      if scope.checkIfDropdown
        if scope.response_new.rows.length == 0
          scope.handsontable_settings.height = 'auto'
        else if scope.response_new.rows.length > 0 and scope.response_new.rows.length < 5
          scope.handsontable_settings.height = (scope.response_new.rows.length * 30) + 200
        else if scope.response_new.rows.length < 50 && scope.response_new.rows.length > 5
          scope.handsontable_settings.height = (scope.response_new.rows.length * 24) + 150
        else
          scope.handsontable_settings.height = 'auto'
      else
        scope.handsontable_settings.height = 'auto'
      return true

    scope.renderTable = (response, readonly) =>
      #after adding new rows it calls this method again and it needs
      #the new length of the rows for maxRows.
      scope.handsontable_settings.maxRows = response.rows.length
      scope.handsontable_settings.colWidths = if response.columns.length < 6 then (element.parent().width() - 150) / (response.columns.length || 1) else 150
      if scope.showInsertButton
        scope.handsontable_settings.contextMenu = {
          items:{
            "undo":{}
            "redo":{}
            "deleteRow":{
              name: 'Remove Selected Row'
              callback: (key, options)->
                scope.deleteRowConfirm(options)
              disabled: ->
                response.rows.length == 0
            }
          }
        }
      #after adding new rows it calls this method again and it needs
      #the new length of the rows for maxRows.
      
      scope.columns = []
      _(response.columns).each (column, idx) =>
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
          if column.type_options.format == undefined
            column.type_options.format = null
          newColumn =
            data: "column_#{column.id}.cell.attributes.value"
            renderer: CustomGridRenderer.customNumericRenderer
            validator: CustomGridRenderer.customNumericValidator
            editor: 'GridNumericEditor'
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
            type: 'numeric'
            title: column_name

          newColumn.placeholder = "Please enter percentage value" if not readonly
        else if column.type == 'integer'
            newColumn =
              data: "column_#{column.id}.cell.attributes.value"
              renderer: CustomGridRenderer.customNumericRenderer
              editor: 'GridNumericEditor'
              type: 'numeric'
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
        newColumn.readOnly = readonly
        scope.columns.push newColumn
      if scope.checkIfDropdown
        if scope.response_new.rows.length == 0
          scope.handsontable_settings.height = 'auto'
        else if scope.response_new.rows.length > 0 and scope.response_new.rows.length < 5
          scope.handsontable_settings.height = (scope.response_new.rows.length * 30) + 200
        else if scope.response_new.rows.length < 50 && scope.response_new.rows.length > 5
          scope.handsontable_settings.height = (scope.response_new.rows.length * 24) + 150
        else
          scope.handsontable_settings.height = 'auto'
      else
        scope.handsontable_settings.height = 'auto'

    scope.confirmAddRowOrColumn = (num_of_elements) =>
      if Number(scope.response_new.rows.length) + Number(num_of_elements) > 2000
        SweetAlert.error({'title':'You can only add a total of 2000 rows','text': ''})
      else
        if num_of_elements >= 5
          title = "Are you sure you want to add #{num_of_elements} #{scope.dynamic_element}s?"
          SweetAlert.confirm({
            title: title
            showLoaderOnConfirm: true
            confirmButtonText: 'Ok'
            cancelButtonText: 'Cancel'
            focusCancel: true
            preConfirm: =>
              scope.addRowOrColumn(num_of_elements)
          })
        else
          scope.addRowOrColumn(num_of_elements)

    scope.deleteRowConfirm = (rows)=>
      SweetAlert.confirm({
        title: "Are you sure you want to delete the selected row(s)?"
        showLoaderOnConfirm: true
        confirmButtonText: 'Ok'
        cancelButtonText: 'Cancel'
        focusCancel: true
        preConfirm: =>
          scope.deleteMultipleRows(rows)
      })

    scope.deleteMultipleRows = (rows)=>
      rowsToDelete = 0
      for i in [rows[0].start.row..rows[0].end.row]
        scope.deleteRow(i)
        rowsToDelete++

      for i in [0...rowsToDelete]
        index = _(scope.response_new.rows).findIndex (row)=>
          row.delete
        scope.response_new.rows.splice(index,1)
        scope.datarows.splice(index,1)
      scope.handsontable_settings.maxRows = scope.response_new.rows.length
      if scope.response_new.rows.length == 0
        scope.handsontable_settings.hiddenRows = 
          rows: [0]
        scope.datarows = [scope.datarowEmptyRows]
      
      if scope.checkIfDropdown
        if scope.response_new.rows.length == 0
          scope.handsontable_settings.height = 'auto'
        else if scope.response_new.rows.length > 0 and scope.response_new.rows.length < 5
          scope.handsontable_settings.height = (scope.response_new.rows.length * 30) + 200
        else if scope.response_new.rows.length < 50 && scope.response_new.rows.length > 5
          scope.handsontable_settings.height = (scope.response_new.rows.length * 24) + 150
        else
          scope.handsontable_settings.height = 'auto'
      else
        scope.handsontable_settings.height = 'auto'

    scope.deleteRow = (rowIndex)=>
      rowToDelete = scope.response_new.rows[rowIndex]
      _(scope.response_new.attributes.grid_responses).each((response)=>
        if response.row.id == rowToDelete.id
          response.attributes.mode = "delete"
      )
      scope.response_new.rows[rowIndex].delete = true
      scope.datarows[rowIndex].delete = true