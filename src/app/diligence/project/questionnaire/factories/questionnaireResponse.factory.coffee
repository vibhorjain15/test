angular.module('diligenceVault').factory 'QuestionnaireResponseFactory', (DueDiligenceDataservice, Utils,
  QuestionnaireGridResponseFactory, $q, BaseDataService, Restangular,$rootScope, responseStatus, $filter, trackChangeStatus) ->
  date_format = 'MM-DD-YYYY'

  class Response
    constructor: (attrs, @sequence, @question, @diligenceId, @is_mapped, mode) ->
      angular.extend(@, attrs)

      @cid = _.uniqueId('response_')
      @mode = mode

      if @isNew()
        #initialise these attributes to false for new objects. otherwise it will send their value as null.
        @attributes = {
          is_WIP:false
          is_NA:false
          is_validation_required: false
          response_status: responseStatus.STARTED
          track_change_status : trackChangeStatus.STARTED
        }

      @on_change_callbacks = []
      @responseType = @question.attributes.responseType

      deferred = $q.defer()
      @initialized = deferred.promise

      switch @responseType
        when 'Grid','DynamicGrid'
          @loadGridRowsAndColumns().then =>
            @initAttributes()
            deferred.resolve()
        else
          @initAttributes()
          deferred.resolve()

    initAttributes: ->
      @setValueAttrs()
      @setValue(response_type: @responseType)
      @deserializeAttributes()
      @copyCurrentAttributes()

      @is_empty = true
      @is_valid = true
      @is_dirty = false

    copyCurrentAttributes: ->
      _previousIsNA = @getPreviousIsNA()
      _previousIsWIP = @getPreviousIsWIP()
      _previousIsValidationRequired = @attributes.is_validation_required
      _previousTrackChangeStatus = @attributes.track_change_status
      _previousAttributes = @getValueAttributes()

      if @responseType is 'CheckBox' and _previousAttributes.listValueID?
        # you don't want the array reference else dirty checking that we do in hasUnsavedResponse() will fail
        # because both current & old will point to same array
        _previousAttributes.listValueID = [].slice.call(_previousAttributes.listValueID)

      if @responseType is 'Attachment' and _previousAttributes.attachmentIds?
        _previousAttributes.attachmentIds = [].slice.call(_previousAttributes.attachmentIds)

      if @responseType is 'Grid' or @responseType is 'DynamicGrid'
        _previousAttributes.rows = @attributes.rows
        _previousAttributes.columns = @attributes.columns
        angular.forEach @attributes.grid_responses, (grid_response) ->
          grid_response.copyCurrentAttributes()

        #copy the grid_responses
        _previousAttributes.grid_responses = angular.copy @attributes.grid_responses

      @_previousAttributes = _previousAttributes
      @_previousIsNA = _previousIsNA
      @_previousIsWIP = _previousIsWIP
      @_previousTrackChangeStatus = _previousTrackChangeStatus
      @_previousIsValidationRequired = _previousIsValidationRequired

    rollback: (skipNA) ->
      if @responseType is 'Grid' or @responseType is 'DynamicGrid'
        _(@attributes.grid_responses).each (grid_response) ->
          grid_response.rollback()
      else
        _(@attributes).extend(@_previousAttributes)
      if !skipNA
        @attributes.is_NA = @_previousIsNA
      @attributes.is_WIP = @_previousIsWIP
      @attributes.track_change_status = @_previousTrackChangeStatus
      @attributes.is_validation_required = @_previousIsValidationRequired

      @deserializeAttributes()
      @updateFlags()

    rollbackAttributes: =>
      @attributes = angular.copy @_previousAttributes
      #in case of dynamic grids, rows will change, so we need to revert it to the previous state
      if @responseType is 'DynamicGrid'
        @rows = @_previousAttributes.rows

      @attributes.is_NA = @_previousIsNA
      @attributes.is_WIP = @_previousIsWIP
      @attributes.track_change_status = @_previousTrackChangeStatus
      @attributes.is_validation_required = @_previousIsValidationRequired
      @deserializeAttributes()
      @updateFlags()

    deserializeAttributes: ->
      switch @responseType
        when 'Dropdown'
          if _.isArray(@attributes.listValueID)
            @attributes.listValueID = @attributes.listValueID[0]
        when 'Date'
          if @attributes.dateResponse?
            @attributes.dateResponse = moment(@attributes.dateResponse, date_format).toDate()

    serializeAttributes: (attrs) ->
      switch @responseType
        when 'Dropdown'
          if attrs.listValueID?
            attrs.listValueID = [attrs.listValueID]
        when 'Date'
          if attrs.dateResponse? and _.isDate(attrs.dateResponse)
            attrs.dateResponse = moment(attrs.dateResponse).format(date_format)
        when 'Numeric', 'Percentage', 'TextPhone', 'Identifier'
          if attrs.numericResponseA?
            attrs.numericResponseA = parseFloat(attrs.numericResponseA)
        when 'Integer'
          if attrs.numericResponseA?
            attrs.numericResponseA = parseInt(attrs.numericResponseA, 10)
        when 'Grid','DynamicGrid'
          attrs.grid_responses = _(attrs.grid_responses).map (grid_response) ->
            if typeof grid_response.serializeAttributes == 'function' then grid_response.serializeAttributes() else grid_response

      attrs

    onChange: (cb) ->
      @on_change_callbacks.push(cb)

    setValue: (attrs) ->
      _(@value_attrs).each (attr) =>
        if angular.isDefined(attrs[attr])
          @attributes[attr] = attrs[attr]

      @executeOnChangeCallbacks()

    executeOnChangeCallbacks: ->
      angular.forEach @on_change_callbacks, (cb) =>
        cb(@)

    setValueAttrs: ->
      switch @responseType
        when 'Date'
          attrs = ['dateResponse', 'textResponse','response_type']
        when 'Boolean'
          attrs = ['booleanResponse', 'textResponse',  'response_type']
        when 'Text', 'TextMultiLine', 'TextEmail'
          attrs = ['textResponse', 'textResponse', 'response_type']
        when 'Numeric', 'TextPhone', 'Integer', 'Percentage', 'Identifier'
          attrs = ['numericResponseA', 'textResponse',  'response_type']
        when 'Dropdown', 'CheckBox'
          attrs = ['listValueID', 'textResponse',  'response_type']
        when 'BooleanPlus', 'NoPlus'
          attrs = ['booleanResponse', 'textResponse',  'response_type']
        when 'Bookends'
          attrs = ['numericResponseA', 'numericResponseB', 'textResponse',  'response_type']
        when 'Grid','DynamicGrid'
          attrs = ['grid_responses', 'textResponse',  'response_type']
        when 'Attachment'
          attrs = ['attachmentIds', 'textResponse',  'response_type']
        when 'ReturnTable'
          attrs = ['returnTable_id', 'textResponse',  'response_type']
        when 'aumTable'
          attrs = ['aumTable_id', 'textResponse',  'response_type']
      @value_attrs = attrs

    isNew: -> not @id?

    update: (skip_retry, disable_track_status_update)->
      params =
        duediligence_id: @diligenceId
        SectionID: @sequence.section.id
        questionID: @question.id
        response: @getResponseAttributes()

      if params.response.listValueID and !_.isArray(params.response.listValueID)
        params.response.listValueID = [ params.response.listValueID ]

      if params.response.sequenceID
        DueDiligenceDataservice.saveResponse(params)
        .then (response) =>
          unless @id?
            @id = response.id
          @updateTrackChangeStatus() if @sequence.section.isReadonlyEditable and !disable_track_status_update

          angular.extend(@attributes, _(response).omit('grid_responses'))
          @deserializeAttributes()
          @copyCurrentAttributes()
          @updateFlags()
          #@removeCompletedfromVerifier()
          @removeCommentsForResponse()
          @scope.init() if @scope.isReadonlyEditable
          response
        , (error) =>
          avoid_error_logging_statuses = BaseDataService.getAvoidErrorLoggingStatusList()
          if !(error.status in avoid_error_logging_statuses)
            error.config.data.response.textResponse = null if error.config.data.response.textResponse
            Utils.logError('Response failed to save', error)
            unless skip_retry
              @sequence.create().then (seq) =>
                @update(true)
                .then null, ->
                  Utils.logError('Sequence create returned this', {
                    sequence: seq
                  })
          #throw the error again for it to be handled again to propagate the error to higher levels
          throw error
      else
        @sequence.create().then (seq) =>
          @update()

    updateTrackChangeStatus: =>
      DueDiligenceDataservice.updateTrackChangesStatus(@id, @attributes.track_change_status).then (response)=>
        @attributes.track_change_status = response.track_change_status
        @copyCurrentAttributes()

    removeCompletedfromVerifier: ->
      if @scope.isReadonlyEditable and @attributes.response_status == responseStatus.INREVIEW and @verifier and @verifier.attributes.is_complete
        @verifier.attributes.is_complete = false

    removeVerifier: ->
      if @verifier
        @verifier = null

    removeExpiry: ->
      if @expiry
        @expiry = null

    removeCommentsForResponse: ->
      if @id and !(@responseType in @scope.vm.unsupportedResponseTypes) and @responseType != 'TextMultiLine' and (@scope.isReadonlyEditable or @scope.isReadonlyNotEditable)
        Restangular.one('diligences',@diligenceId).one('responses',@id).all('mark_selected_text_removed').remove().then (response)=>
          Restangular.one('diligences',@diligenceId).one('responses',@id).all('notes_attributes').customPUT(response_with_notes_attributes:@attributes.responseDisplay).then (response)=>
            @attributes.response_with_notes_attributes = response.response_with_notes_attributes
            @attributes.response_comments_counts = response.response_comments_counts
            return
      else if @id and @responseType == 'TextMultiLine' and (@scope.isReadonlyEditable or @scope.isReadonlyNotEditable) and @editor
        currentComments = []
        $(@editor.contentDocument).find("[data-mce-annotation-uid]").each(()->
          currentComments.push $(this).attr('data-mce-annotation-uid')
        )
        Restangular.one('diligences', @diligenceId).one('responses',@id).all('bulk_resolve_comments').customPUT(current_comment_ids: currentComments).then (response)=>
          return

    resetValueAttrs: ->
      if @responseType is 'Grid'
        _(@attributes.grid_responses).each (grid_response) ->
          grid_response.resetValueAttrs()
      else if @responseType is 'DynamicGrid'
        @attributes.grid_responses.length = 0
        if @attributes.dynamic_element == 'Row'
          @rows.length = @attributes.rows.length = 0
        else if @attributes.dynamic_element == 'Column'
          @columns.length = @attributes.columns.length = 0

      else
        _(@value_attrs).each (attr) => @attributes[attr] = null

    remove: ->
      DueDiligenceDataservice.deleteResponse(@id, @diligenceId).then =>
        @id = null
        @attributes.is_NA = false
        @attributes.is_WIP = false
        @attributes.track_change_status = trackChangeStatus.STARTED
        @attributes.is_validation_required = false
        @removeExpiry()
        @removeVerifier()
        @resetValueAttrs()
        @copyCurrentAttributes()
        @updateFlags()

    getValueAttributes: ->
      attrs = _(@attributes).pick(@value_attrs)
      @serializeAttributes(attrs)

    getPreviousIsNA: =>
      @attributes.is_NA

    getPreviousIsWIP: =>
      @attributes.is_WIP

    ruleIsApplicable: ->
      @responseType not in ['Bookends', 'CheckBox', 'Grid', 'ReturnTable', 'aumTable','DynamicGrid']

    getValueForRule: ->
      # here we are making an assumptions that rules are applicable for responses
      # which doesn't have more than one value attribute. For example: No rules for
      # Bookends because it has numericResponseA & numericResponseB
      attr = @value_attrs[0]
      if @responseType == 'Date' and @attributes[attr]
        $filter('date')(@attributes[attr], 'mediumDate')
      else
        @attributes[attr]


    getIsNA: =>
      is_NA = false
      ###_(@sequence.responses).each((response) =>
        if response.question.id == @question.id
          is_NA = response.attributes.is_NA
      )###
      is_NA = @attributes.is_NA
      is_NA

    getIsWIP: =>
      is_WIP = false
      #commented following lines of code because if we go by this logic it will only get the attributes of the main questions
      #since sequence.responses only contains the main questions. For nested questions this will return null.
      # _(@sequence.responses).each((response) =>
      #   if response.question.id == @question.id
      #     is_WIP = response.attributes.is_WIP
      # )

      #instead get the current value of is_WIP from this object scope.
      is_WIP = @attributes.is_WIP
      is_WIP

    getResponseAttributes: ->
      is_NA = @getIsNA()
      is_WIP = @getIsWIP()
      is_validation_required = @attributes.is_validation_required
      _(@getValueAttributes()).extend({sequenceID: @sequence.id, is_NA: is_NA, is_WIP: is_WIP, is_validation_required: is_validation_required})


    isEmpty: ->
      is_NA = @getIsNA()
      if !is_NA
        if @responseType is 'Grid' or @responseType is 'DynamicGrid'
          _(@attributes.grid_responses).all (grid_response) -> grid_response.isEmpty()
        else if @responseType is 'Attachment'
          if @attributes.hasOwnProperty('attachmentIds')
            if @attributes.attachmentIds == null
              true
            else
              (@attributes.attachmentIds.length == 0)
          else
            true
        else
          value_attrs = _(@value_attrs).filter (response)=> response != 'response_type'
          isSameResponseType = _(value_attrs).unique().length == 1
          sameResponseType = _(value_attrs).unique()
          if isSameResponseType
            _(sameResponseType).all (attr) =>
              not @attributes[attr]?
          else
            _(value_attrs).all (attr) =>
              if attr == 'textResponse' && (@attributes[attr] != null || @attributes[attr] != undefined || !_(@attributes[attr]).isEmpty())
                return true
              else
               not @attributes[attr]?
      else
        !is_NA

    handleGridChanges: =>
      has_cell_changes = _(@attributes.grid_responses).any (grid_response) ->
        grid_response.hasUnsavedChanges() or grid_response.hasUnsavedModeChanges()

      old_grid = @_previousAttributes
      current_grid = @getValueAttributes()
      has_comment_changes = (old_grid['textResponse'] != current_grid['textResponse'])

      return has_cell_changes or has_comment_changes or @hasUnsavedColumnChanges() or @hasUnsavedRowChanges()

    hasUnsavedRowChanges:->
      @_previousAttributes.rows.length != @rows.length

    hasUnsavedColumnChanges:->
      @_previousAttributes.columns.length != @columns.length

    hasUnsavedChanges: ->
      currentIsNA = @getIsNA()
      currentIsWIP = @getIsWIP()
      currentTrackChangesStatus = @attributes.track_change_status
      currentIsValidationRequired = @attributes.is_validation_required
      if currentIsNA == @_previousIsNA
        if currentIsWIP != @_previousIsWIP
          return true

        if currentTrackChangesStatus != @_previousTrackChangeStatus
          return true

        if currentIsValidationRequired != @_previousIsValidationRequired
          return true

        #brought this check down, otherwise is_WIP check will not be done for grids.
        if @responseType is 'Grid' or @responseType is 'DynamicGrid'
          return @handleGridChanges()

        old = @_previousAttributes
        current = @getValueAttributes()
        responseType = @responseType
        ascending = (a, b) -> a > b

        _(@value_attrs).any (attr) ->
          current_value = current[attr]
          old_value = old[attr]

          unless current_value? or old_value?
            return false

          #Added response_type check becuase we dont need to compare the response type attribute.
          #It also creates problem when we try to sort the string response_type value in IE
          if (responseType in ['CheckBox', 'Dropdown', 'Attachment'] and
              attr isnt 'textResponse' and attr isnt 'response_type')
            sorted_current = _(current_value || []).sort(ascending)
            sorted_old = _(old_value || []).sort(ascending)

            !_.isEqual(sorted_current, sorted_old)
          else
            current_value isnt old_value
      else
        if (@_previousIsNA == undefined or @_previousIsNA == null) and currentIsNA == false
         false
        else
          true

    updateFlags: (otherOption) =>
      currentIsNA = @getIsNA()
      previous_flags = _(@).pick('is_valid', 'is_empty', 'is_dirty')

      @is_valid = @isValid(otherOption)

      @is_empty = @isEmpty()
      if @is_valid
        @is_dirty = @hasUnsavedChanges()
      else
        # Scenario: user enters 12345abc, previous numericResponseA: 12345
        # current numericResponseA is "12345abc" but we compare that with serialized value
        # which is parseInt("12345abc") => 12345
        @is_dirty = true

      if @onFlagChange?
        flag_did_change = _(['is_valid', 'is_empty', 'is_dirty']).any (flag) =>
          previous_flags[flag] isnt @[flag]

        @onFlagChange(@) if flag_did_change

    isConditionalResponse: ->
      false

    isValid: (otherOption) ->
      is_NA = @getIsNA()
      # taken from angular source code
      EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i
      NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))([eE][+-]?\d+)?\s*$/

      @error = null

      isValidNumber = (value) ->
        NUMBER_REGEXP.test(value) and not isNaN(parseFloat(value))

      switch @responseType
        when 'Date'
          dateResponse = @attributes.dateResponse

          if @isEmpty()
            is_valid = true
          else if Object.prototype.toString.call(dateResponse) is "[object Date]"
            is_valid = moment(dateResponse).isValid()
          else if _.isString(dateResponse)
            is_valid = moment(dateResponse, 'MM-DD-YYYY').isValid()

          @error = 'In not a valid date' unless is_valid
        when 'Boolean'
          value = @attributes.booleanResponse
          is_valid = value is true or value is false or (not value?) #since it's a radio button not sure this will ever be invalid
        when 'Text', 'TextMultiLine'
          is_valid = if @isConditionalResponse() then @attributes.textResponse? else true
          @error = 'This field is required' unless is_valid
          if @question.attributes.response_word_limit && @question.attributes.response_word_limit != null && @attributes.textResponse
            text = @attributes.textResponse
            text = Utils.removeHtmlStrings(text)
            noofWords = Utils.countWords(text)
            if noofWords > @question.attributes.response_word_limit
              is_valid = false
            else
              is_valid = true
            @error = 'You have exceeded the word count limit set for this question.' unless is_valid
        when'TextEmail'
          is_valid = @isEmpty() or EMAIL_REGEXP.test(@attributes.textResponse)
          @error = 'Please provide a valid email address' unless is_valid
        when 'Numeric', 'Percentage', 'TextPhone', 'Integer', 'Identifier'
        # eventually we'll have a separate validation for phone
          is_empty = @isEmpty()
          is_valid = is_empty or isValidNumber(@attributes.numericResponseA)
          @error = 'Must be a valid number' unless is_valid

          if @responseType is 'Integer' and not is_empty
            is_valid = is_valid and (parseFloat(@attributes.numericResponseA) % 1 is 0)
            @error = 'Must be a valid integer' unless is_valid
        when 'Dropdown'
          if @isEmpty() or (@attributes.listValueID isnt otherOption?.id)
            is_valid = true
          else
            is_valid = @attributes.textResponse?
            @error = 'Please specify other options' unless is_valid
        when 'CheckBox'
          if @isEmpty() or !_(@attributes.listValueID).contains(otherOption?.id)
            is_valid = true
          else
            is_valid = @attributes.textResponse?
            @error = 'Please specify other options' unless is_valid
        when 'BooleanPlus'
          if @isEmpty()
            is_valid = true
          else
            is_valid = if (@attributes.booleanResponse is true) then @attributes.textResponse? else true
            @error = 'Please provide an explanation' unless is_valid
        when'NoPlus'
          if @isEmpty()
            is_valid = true
          else
            is_valid = if (@attributes.booleanResponse is false) then @attributes.textResponse? else true
            @error = 'Please provide an explanation' unless is_valid
        when 'Bookends'
          numericResponseA = @attributes.numericResponseA
          numericResponseB = @attributes.numericResponseB

          if @isEmpty()
            is_valid = true
          else
            is_valid = _([numericResponseA, numericResponseB]).all(isValidNumber)

            @error = 'Must be valid numbers' unless is_valid

            if is_valid
              is_valid = (parseFloat(numericResponseA) <= parseFloat(numericResponseB))

              unless is_valid
                @error = "Maximum value cannot be less than minimum value"
        when 'Grid','DynamicGrid'
          is_valid = _(@attributes.grid_responses).all (grid_response) ->
            grid_response.isValid() and grid_response.isFormulaValid()
        when 'Attachment', 'ReturnTable','aumTable'
          is_valid = true

      is_valid or is_NA

    loadGridRowsAndColumns: ->
      grid_id = @question.attributes.grid_id
      grid_version = @question.attributes.grid_version

      DueDiligenceDataservice.getGridData(grid_id, grid_version, @id).then (rows_and_columns) =>
        rows = _(rows_and_columns.rows_columns).where(elementType: 'Row')
        columns = _(rows_and_columns.rows_columns).where(elementType: 'Column')
        grid_values = @attributes.grid_responses || []
        serialized_grid_responses = []

        _(rows).each (row, rowIndex) =>
          _(columns).each (column, colIndex) =>
            #grid_response = _(grid_values).findWhere(row_id: row.id, column_id: column.id) || {}
            if @attributes.grid_responses
              gridResponse = _(grid_values).findWhere(row_id: row.id, column_id: column.id) || {}

            if rows_and_columns.formulas_json and !@is_mapped
              formulaResponse = _(JSON.parse(rows_and_columns.formulas_json)).findWhere(row_id: rowIndex, column_id: colIndex)

            grid_response = {
              row_id: row.id
              column_id: column.id
              formula: if formulaResponse then formulaResponse.value else null
              id: if gridResponse and gridResponse.id then gridResponse.id else row.id + " "+ column.id
            }
            if formulaResponse and formulaResponse.value and @mode != 'print-preview'
              grid_response.value = formulaResponse.value
            else if gridResponse
              grid_response.value = gridResponse.value
            else
              grid_response.value = null

            attrs = {
              id: grid_response.id,
              attributes: _(grid_response).omit('id')
            }

            serialized_grid_responses.push QuestionnaireGridResponseFactory.$new(row, column, attrs, @responseType == 'DynamicGrid')

        @attributes.grid_responses = serialized_grid_responses
        @attributes.dynamic_element = rows_and_columns.dynamic_element
        @attributes.rows = angular.copy(rows)
        @attributes.columns = angular.copy(columns)
        @attributes.formulas_json = rows_and_columns.formulas_json
        @mergeCells = rows_and_columns.metadata?.mergeCells
        @rows = rows
        @columns = columns
        rows_and_columns.rows_columns

    getGridResponse : (formulaObj)=>
      if formulaObj
        gridResponse = _(JSON.parse(formulaObj)).map (obj, index)=>
          attrGridResponse = _(@attributes.grid_responses).find (gResponse)=>
            gResponse.row_id == obj.row_id and gResponse.column_id == obj.column_id

          if attrGridResponse
            response = attrGridResponse
            response.formula = obj.value
            response.value = obj.value if obj.value
            response
          else
            {
              row_id: obj.row_id
              column_id: obj.column_id
              formula: obj.value
              id: obj.row_id + " "+ obj.column_id
              value: obj.value
            }
        gridResponse
      else if @attributes.grid_responses
        @attributes.grid_responses
      else
        []


  new class QuestionnaireResponse
    $new: (attrs, sequence, question, diligenceId, is_mapped, mode) ->
      new Response(attrs, sequence, question, diligenceId, is_mapped, mode)
