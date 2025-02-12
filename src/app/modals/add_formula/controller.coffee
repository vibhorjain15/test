class AddFormulaController extends ModalController
    @register 'AddFormulaController'

    @inject '$stateParams', 'toaster', 'Restangular', 'BaseDataService', 'Utils','question','$scope','QuestionnaireResponseFactory','DueDiligenceDataservice','QuestionnaireGridResponseFactory','CustomGridRenderer','proprietaryLicenses'

    initialize: ->
        @formulaObj = {
            function: null
            formula: null
        }
        @question.attributes = 
            grid_id: @question.grid_id
            grid_version: @question.grid_version
            responseType: @question.responseType
            text: @question.text
        @gridLoaded = false
        @response = {}

        grid_id = @question.attributes.grid_id
        grid_version = @question.attributes.grid_version

        @DueDiligenceDataservice.getGridData(grid_id, grid_version).then (rows_and_columns) =>
            rows = _(rows_and_columns.rows_columns).where(elementType: 'Row')
            columns = _(rows_and_columns.rows_columns).where(elementType: 'Column')
            grid_values = if rows_and_columns.formulas_json then JSON.parse(rows_and_columns.formulas_json) else []
            serialized_grid_responses = []

            _(rows).each (row, rowIndex) =>
                _(columns).each (column, colIndex) =>
                    grid_response = _(grid_values).findWhere(row_id: rowIndex, column_id: colIndex) || {}
                    row.id = rowIndex
                    column.id = colIndex

                    attrs = {
                        id: row.id + " "+ column.id
                        attributes: grid_response
                    }
                    serialized_grid_responses.push @QuestionnaireGridResponseFactory.$new(row, column, attrs, true)

            @response.grid_responses = serialized_grid_responses
            @response.dynamic_element = rows_and_columns.dynamic_element
            @response.rows = rows
            @response.columns = columns
            @initializeGrid()
        
    initializeGrid: =>
        #if number of columns are more than 5 then use fixed width of 150 for the columns else calculate the width from the total width 
        col_width = if @response.columns.length < 6 then (angular.element('.formula-grid-container').width() - 150 - 30) / (@response.columns.length || 1) else 150
        @instance_id = "grid-response-table-#{@question.id}"
        @handsontable_settings =
            licenseKey: @proprietaryLicenses.Handsontable
            colWidths: col_width
            rowHeaderWidth: 150
            maxCols: @response.columns.length
            maxRows: @response.rows.length
            formulas: {
                engine: HyperFormula
            }
            width: 'auto'
            height: 'auto'
            autoRowSize: true
            columns: _(@response.columns).map (column, idx) =>
                data: "column_#{column.id}.cell.attributes.value"
                type: 'text'
                title: column.name + " (#{@Utils.getExcelColumnName(idx)})"
                renderer: @CustomGridRenderer.customFormulaRenderer
                readOnly: if column.type == 'dropdown' then true else false
                validator: (query, callback)->
                    sourceData = @instance.getSourceData()
                    sourceRow = sourceData[@row]
                    currentCol = @prop.split('.')[0]
                    cellContent = sourceRow[currentCol].cell.attributes.changedValue
                    if (query and query != "" and query.toString().startsWith('#') and query.toString() != '#VALUE!' and query.toString() != '#DIV/0!' and query.toString() != '#N/A') or (cellContent and !cellContent.toString().startsWith('='))
                        callback(false)
                    else
                        callback(true)
            beforeCopy: (data, coords)->
                dataArray = []
                coordinates = coords[0]
                i = coordinates.startRow
                while i <= coordinates.endRow
                    rows = []
                    j = coordinates.startCol
                    while j <= coordinates.endCol
                        rows.push @getSourceDataAtCell(i,j)
                        j++
                    dataArray.push rows
                    i++
                
                for row,rowIndex in dataArray
                    for col,colIndex in row
                        data[rowIndex][colIndex] = col
                data
                    
            beforeChange: (changes)->
                row = changes[0][0]
                col = changes[0][1].split('.')[0]
                sourceData = @getSourceData()
                sourceRow = sourceData[row]
                sourceRow[col].cell.attributes.changedValue = changes[0][3]
            afterValidate: (isValid, value, row, prop, source)=>
                cellProp = prop.split('.')[0]
                gridResponse = @datarows[row][cellProp].cell
                gridResponse.setValid(isValid)

        @datarows = _(@response.rows).map((row) =>
            datarow = {}

            _(@response.columns).each (column) =>
                datarow["column_#{column.id}"] =
                    cell: _(@response.grid_responses).findWhere(column: column, row: row)

            datarow
        )
        @handsontable_settings.rowHeaders = (index)=>
            row = @response.rows[index]
            row.name + " (#{index + 1})"

        @gridLoaded = true

    gridHasFormulas: (grid_responses)=>
        hasFormulas = _(@response.grid_responses).some (grid_response) ->
            grid_response.attributes.value
        hasFormulas

    save: =>
        is_valid = _(@response.grid_responses).all (grid_response) ->
            grid_response.isValid()
        if is_valid
            @saving = true
            if @gridHasFormulas(@response.grid_responses)
                grid_responses = _(@response.grid_responses).map (grid_response) ->
                    grid_response.serializeAttributes()
                grid_responses = JSON.stringify(grid_responses)
            else
                grid_responses = null
            @Restangular.one('grids',@question.grid_id).all('formulas').patch(formulas_json: grid_responses).then (response)=>
                @question.has_formulas = response.has_formulas
                @close response
                @saving = false
            , (error)=>
                @saving = false
        else
            @toaster.pop 'error','','Some of the formulas are not valid. Please fix.'

    copyAllCells: =>
        totalRows = @hotInstance.countRows()
        totalCols = @hotInstance.countCols()
        @hotInstance.selectCell(0,0,totalRows-1, totalCols-1)
        document.execCommand('copy')