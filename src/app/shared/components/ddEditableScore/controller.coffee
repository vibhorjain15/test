class ddEditableScoreController extends BaseController
    @register 'ddEditableScoreController'

    @inject '$attrs', '$scope', 'Restangular','$timeout', '$injector','Utils','ModalFactory','toaster','ratingConstants'

    initialize: ->
        @current_user = @Utils.getCurrentUser()
        @diligenceTypeId = 1105
        @maxScore = 100
        @score_invalid = false

        @loadCustomFields()
        @$scope.$watchGroup ['vm.ratingScale', 'vm.naValue'], (values)=>
            if values[0] and values[1]
                @init(@selection.attributes,@selection.attributes.score_value, @total, @show_total, @ratingScale, @naValue)

    init: (selection_attrs, score, total, show_total, ratingScale, naValue) ->
        if score == null || score == undefined
            score = 0
            score_class = naValue.color_code
            font_color = @Utils.pickTextColorBasedOnBgColorAdvanced(naValue.color_code)
        else
            _(ratingScale).each (scale)=>
                if score >= scale.range_min_value and score <= scale.range_max_value
                    score_class =  scale.color_code
                    font_color = @Utils.pickTextColorBasedOnBgColorAdvanced(scale.color_code)

        @score_class = score_class
        @font_color = font_color
        @score_tooltip = selection_attrs.description
        @show_total = (total && show_total)

    loadCustomFields : ->
      @Restangular.all('service/dvapi_service/get_custom_fields_data').post({entity_id : Number(@diligenceId), entity_type: @diligenceTypeId, schema_type: 'rating', sub_entity_id: @ratingId}).then (response) =>
        @customFields = response.data
        @getCustomFieldsWithValue(@customFields)

    getCustomFieldsWithValue : (value)=>
      @fieldsWithValue = _(value).filter (field)=>
        if field.type == 'link'
          @linkHasValue(field.value)
        else
          @fieldHasValue(field.value)

    linkHasValue : (field)=>
      fieldsWithValue = _(field).filter (item)=>
        item.value_url
      fieldsWithValue.length > 0

    fieldHasValue : (field)=>
      fieldsWithValue = _(field).filter (item)=>
        item.value
      fieldsWithValue.length > 0

    allowEdit: =>
        @editAllowed = true

    onScoreChanged: (rating)=>
        if rating.attributes.score_value <= @maxScore
            @score_invalid = false
            if !@disableSave 
                params=
                    value: rating.attributes.score_value
                    entity_id: @diligenceId
                    entity_type: 'Duediligence'
                    ratingCategoryID: @ratingId
                    response_id: @responseId if @responseId

                @Restangular.all('ratings').customPUT(params).then =>
                    @selection = rating
                    @toaster.pop 'success', '', 'Your score has been recorded successfully'
                    @$scope.$emit 'refresh:counts'
                    @init(rating.attributes, rating.attributes.score_value, @total, @show_total, @ratingScale, @naValue)
                    @editAllowed = false
            else
                @init(rating.attributes, rating.attributes.score_value, @total, @show_total, @ratingScale, @naValue)
        else
            @score_invalid = true

    openCustomFieldsModal : (rating, view_mode)=>
        if (@customFields and @customFields.length > 0) or @reviewEnabled
            @selection.mode = @ratingConstants.ScoreBand
            @ModalFactory.invokeModal 'manage_rating_custom_fields',
                resolve:
                    entityType: => @diligenceTypeId
                    entityId: => Number(@diligenceId)
                    subEntityId: => @ratingId
                    rating: => angular.copy @selection
                    readonly: => @readonly
                    ratingScales: => @ratingScale
                    naValue: => @naValue
                    enableReview: => @reviewEnabled && @selection.attributes.score_value
                    enable_tracking: => @enableTrackChanges
                    functions: => @functions
                    assignedFunctions: => @assignedFunctions
                    parentScope: => @
                success: (response)=>
                    @onScoreChanged(response.rating) if !view_mode
                    @saveCustomFields(response.rating.attributes,response.customFields)
                dismiss: (response)=>
                    @selection.attributes.score_value = @previousRating.score_value if !view_mode
        else
            @recordRating(rating)

    saveCustomFields : (rating,customFields)=>
        params =
            'entity_id': Number(@diligenceId)
            'owner_user_id': @current_user.id
            'entity_type': @diligenceTypeId
            'schema_type': 'rating'
            'sub_entity_id': rating.rating_id
            'custom_fields': []
        cFields = angular.copy customFields
        for selectedField in cFields
            switch selectedField.type
                when 'link'
                    if @linkHasValue(selectedField.value)
                        params.custom_fields.push selectedField
                    else
                        selectedField.value = []
                        params.custom_fields.push selectedField
                when "checkbox"
                    if @fieldHasValue(selectedField.value)
                        if selectedField.otherOption
                            otherOptionIndex = _(selectedField.value).findIndex (item)=>
                                item.id == selectedField.otherOption.id
                            if otherOptionIndex > -1
                                otherOption = angular.copy selectedField.value[otherOptionIndex]
                                otherOption.value = selectedField.textExplanation
                            selectedField.value[otherOptionIndex] = otherOption
                        params.custom_fields.push selectedField
                    else
                        selectedField.value = []
                        params.custom_fields.push selectedField
                when "dropdown"
                    if selectedField.value and selectedField.value.id
                        field = angular.copy selectedField
                        if field.otherOption and field.value.id == field.otherOption.id
                            otherOption = angular.copy field.value
                            otherOption.value = field.textExplanation
                            field.value = otherOption
                        field.value = [field.value]
                        params.custom_fields.push field
                    else
                        selectedField.value = []
                        params.custom_fields.push selectedField
                when "numeric", "int"
                    if selectedField.value.length > 0
                        values = []
                        _(selectedField.value).each (field)=>
                            if !_(parseFloat(field.value)).isNaN()
                                field.value = Number(field.value)
                                values.push field
                        selectedField.value = values
                        params.custom_fields.push selectedField
                else
                    if selectedField.value.length > 0
                        values = []
                        _(selectedField.value).each (field)=>
                            if field.value
                                values.push field
                        selectedField.value = values
                        params.custom_fields.push selectedField

      
        if params.custom_fields.length > 0
            @Restangular.all('service/dvapi_service/post_custom_fields_data').post(params).then (response) =>
                @toaster.pop 'success','','Custom fields saved successfully'
                @customFields = response.data
                @getCustomFieldsWithValue(response.data)