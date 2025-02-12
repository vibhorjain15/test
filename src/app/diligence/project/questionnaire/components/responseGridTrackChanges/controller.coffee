class ResponseGridTrackChangesController extends BaseController
    @register 'ResponseGridTrackChangesController'

    @inject 'Restangular', '$timeout', 'Utils','QuestionnaireGridResponseFactory','trackChangeStatus','responseStatus'

    initialize: ->
      if @response?
        @response.initialized.then =>
          @response.responses_history.rows = angular.copy(@response.rows)
          @response.responses_history.columns = angular.copy(@response.columns)
          @generateGridResponsePrevious(@response.attributes) if @response.attributes.grid_responses and @response.attributes.grid_responses[0].hasOwnProperty('column_id') and @response.attributes.grid_responses[0].hasOwnProperty('row_id')
          @generateGridResponsePrevious(@response.responses_history) if @response.responses_history.grid_responses and @response.responses_history.grid_responses[0].hasOwnProperty('column_id') and @response.responses_history.grid_responses[0].hasOwnProperty('row_id')
          @response.newGrid = @Utils.generateTable(@response.rows, @response.columns, @response.attributes.grid_responses, @response.responseType)
          @response.previousGrid = @Utils.generateTable(@response.rows, @response.columns, @response.responses_history.grid_responses, @response.responseType)

    acceptChanges: =>
      @response.attributes.track_change_status = @trackChangeStatus.ACCEPTED
      @onResponseChanged()

    rejectChanges: =>
      temp = @response.responses_history
      @response.responses_history = @response.attributes
      @response.attributes = temp
      @response.attributes.track_change_status = @trackChangeStatus.REJECTED
      @response.deserializeAttributes()
      @onResponseChanged()
      @response.newGrid = @Utils.generateTable(@response.rows, @response.columns, @response.attributes.grid_responses, @response.responseType)
      @response.previousGrid = @Utils.generateTable(@response.rows, @response.columns, @response.responses_history.grid_responses, @response.responseType)

    editResponse: =>
      @onResponseEdit()

    generateGridResponsePrevious: (response)=>
      grid_values = response.grid_responses || []
      serialized_grid_responses = []

      _(@response.rows).each (row, rowIndex) =>
        _(@response.columns).each (column, colIndex) =>
          #grid_response = _(grid_values).findWhere(row_id: row.id, column_id: column.id) || {}
          if response.grid_responses
            gridResponse = _(grid_values).findWhere(row_id: row.id, column_id: column.id) || {}

          if response.formulas_json
            formulaResponse = _(JSON.parse(response.formulas_json)).findWhere(row_id: rowIndex, column_id: colIndex)

          grid_response = {
            row_id: row.id
            column_id: column.id
            formula: if formulaResponse then formulaResponse.value else null
            id: if gridResponse and gridResponse.id then gridResponse.id else row.id + " "+ column.id
          }

          if formulaResponse and formulaResponse.value
            grid_response.value = formulaResponse.value 
          else if gridResponse
            grid_response.value = gridResponse.value
          else
            grid_response.value = null

          attrs = {
            id: grid_response.id,
            attributes: _(grid_response).omit('id')
          }

          serialized_grid_responses.push @QuestionnaireGridResponseFactory.$new(row, column, attrs, true)
      response.grid_responses = serialized_grid_responses