class ManageRatingCustomFieldController extends ModalController
    @register 'ManageRatingCustomFieldController'

    @inject '$scope','Restangular', 'Utils', 'toaster', '$state', '$timeout', 'SweetAlert','entityId','entityType','entityTypeId','subEntityId','rating','ratingScales','readonly','enableReview','ModalFactory','diligenceStatusConstant','responseStatus','RatingDataservice','dvThresholds','enable_tracking','parentScope','naValue','ratingConstants','functions','assignedFunctions'

    initialize: ->
        @current_user = @Utils.getCurrentUser()
        @reviewButtonShow = {
            edit: false
            decline: false
            accept: false
            updateverifier: false
            addverifier: false
        }
        if @rating.mode == @ratingConstants.Absolute
            @value_attr = 'rating_value'
        else
            @value_attr = 'score_value'
        @loadCustomFields()

    loadCustomFields: ->
        @loading_custom_fields = true
        @Restangular.all('service/dvapi_service/get_custom_fields_data').post({entity_id : @entityId, entity_type: @entityType, schema_type: 'rating', sub_entity_id: @subEntityId}).then (response) =>
            @customFields = response.data
            @previousFields = angular.copy response.data
            @loading_custom_fields = false
        , (error)=>
            @loading_custom_fields = false

    linkHasValue: (field)=>
        fieldsWithValue = _(field).filter (item)=>
            item.value_url
        fieldsWithValue.length > 0

    fieldHasValue: (field)=>
        fieldsWithValue = _(field).filter (item)=>
            item.value
        fieldsWithValue.length > 0

    saveCustomFields: =>
        @fieldselectionForm.$setSubmitted true if @fieldselectionForm
        if ((@fieldselectionForm and @fieldselectionForm.$valid) or @customFields.length == 0) and ((@rating.mode == @ratingConstants.ScoreBand and @rating.attributes.score_value <= 100) or @rating.mode == @ratingConstants.Absolute)
            response =
                rating: @rating
                customFields: @customFields
            @rating.verifierEdit = false
            @close(response)

    checkConditionsForDisplayingReview: (button)=>
        @reviewButtonShow[button] = false
        @rating.timeDiff = moment().diff(@Utils.getLocalDateTime(@rating.verifier.attributes.completed_at),'milliseconds') if @rating.verifier and @rating.verifier.attributes.is_complete
        canResponseVerify = @rating.verifier and @Utils.isAssignedToUser(@rating.verifier, @assignedFunctions)
        switch button
            when 'edit'
                if !@rating.verifierEdit and (canResponseVerify) and @rating.attributes.rating_status == @responseStatus.INREVIEW
                    @reviewButtonShow[button] = true
                    true

            when 'decline'
                if (canResponseVerify) and @rating.attributes.rating_status == @responseStatus.INREVIEW
                    @reviewButtonShow[button] = true
                    true

            when 'addverifier'
                if !@rating.verifier
                    @reviewButtonShow[button] = true
                    true

            when 'updateverifier'
                if @rating.verifier and !@Utils.isAssignedToUser(@rating.verifier, @assignedFunctions) and !@rating.verifier.attributes.is_complete
                    @reviewButtonShow[button] = true
                    true

            when 'accept'
                canResponseVerifyFailed = @rating.verifier and !@Utils.isAssignedToUser(@rating.verifier, @assignedFunctions)
                if (@rating.attributes.rating_status == @responseStatus.INREVIEW and canResponseVerify) or (@rating.attributes.rating_status ==  @responseStatus.REVIEWFAILED and canResponseVerifyFailed and (typeof @rating.timeDiff == 'number' && @rating.timeDiff > @dvThresholds.REVIEW_TIMELIMIT))
                    @reviewButtonShow[button] = true
                    true

            when 'sendForVerify'
                if @rating.attributes.rating_status == @responseStatus.REVIEWFAILED && (typeof @rating.timeDiff == 'number' && @rating.timeDiff > @dvThresholds.REVIEW_TIMELIMIT)
                    @reviewButtonShow[button] = true
                    true

            when 'undo'
                if @rating.attributes.rating_status in [@responseStatus.REVIEWSUCCESS,@responseStatus.REVIEWFAILED] && @rating.verifier && @current_user.id == @rating.verifier.attributes.completed_by && (typeof @rating.timeDiff == 'number' && @rating.timeDiff <= @dvThresholds.REVIEW_TIMELIMIT)
                    @reviewButtonShow[button] = true
                    true

            when 'editable'
                if (!@enableReview and !@readonly) or (@enableReview and (@rating.attributes.rating_status == @responseStatus.STARTED or @rating.verifierEdit or (@rating.attributes.rating_status == @responseStatus.REVIEWSUCCESS and @rating.verifier.attributes.is_complete and (typeof @rating.timeDiff == 'number' && @rating.timeDiff > @dvThresholds.REVIEW_TIMELIMIT)) or (@rating.attributes.rating_status == @responseStatus.REVIEWFAILED and (typeof @rating.timeDiff == 'number' && @rating.timeDiff > @dvThresholds.REVIEW_TIMELIMIT))))
                    @reviewButtonShow[button] = true
                    true

    openVerifierModal: =>
        if @rating.attributes[@value_attr]
            response = 
                diligenceId: @entityId
                id: @rating.attributes.rating_id
                verifier: @rating.verifier
            @ModalFactory.invokeModal 'add_verifier',
                resolve:
                    response: => response
                    verificationLevel: => 'rating'
                    verificationType: => @diligenceStatusConstant.PRECOMPLETIONREVIEW
                    diligenceType: => @type
                    functions: => @functions
                success: (verifier)=>
                    @rating.attributes.rating_status = @responseStatus.INREVIEW
                    @rating.verifier = {
                        id: verifier.id
                        type: "rating_verify"
                        attributes: verifier
                    }
                    @parentScope.$emit 'refresh:counts' if @parentScope

    editResponse: =>
        @rating.verifierEdit = true

    checkCustomFieldsHasTracking: =>
        has_track_changes = false
        _(@previousFields).each (field)=>
            if field.type == 'textmultiline' and field.value[0].value.indexOf('<span class="ice') > -1
                has_track_changes = true

        has_track_changes

    verifyRequest: =>
        if @checkCustomFieldsHasTracking()
            @showTrackingWarning()
        else
            @verifyRating()

    showTrackingWarning: =>
        @SweetAlert.error
            'title':'You have pending tracking changes'
            'text':'Please accept or reject the changes and save before marking this rating as reviewed'

    verifyRating: =>
        @rating.verifierEdit = false
        @RatingDataservice.updateResponseStatus(@rating.attributes.rating_id, @responseStatus.REVIEWSUCCESS, @entityId).then (response)=>
            @rating.attributes.rating_status = @responseStatus.REVIEWSUCCESS
            @rating.verifier.attributes.is_complete = true
            @rating.verifier.attributes.completed_by_name = @current_user.fullName
            @rating.verifier.attributes.completed_by = @current_user.id
            @rating.verifier.attributes.completed_at = @Utils.formatDatetimeUtc(moment.utc())
            message = 'Rating successfully verified'
            @toaster.pop 'success', '', message
            @parentScope.$emit 'refresh:counts' if @parentScope

    rejectRating: =>
        @rating.verifierEdit = false
        @RatingDataservice.updateResponseStatus(@rating.attributes.rating_id, @responseStatus.REVIEWFAILED, @entityId).then (response)=>
            @rating.attributes.rating_status = @responseStatus.REVIEWFAILED
            @rating.verifier.attributes.is_complete = true
            @rating.verifier.attributes.completed_by_name = @current_user.fullName
            @rating.verifier.attributes.completed_by = @current_user.id
            @rating.verifier.attributes.completed_at = @Utils.formatDatetimeUtc(moment.utc())
            @parentScope.$emit 'refresh:counts' if @parentScope

    reviewAgain: =>
        @RatingDataservice.updateResponseStatus(@rating.attributes.rating_id, @responseStatus.INREVIEW, @entityId).then (response)=>
            @rating.attributes.rating_status = @responseStatus.INREVIEW
            @rating.verifier.attributes.is_complete = false
            @rating.verifier.attributes.completed_by_name = ""
            @rating.verifier.attributes.completed_by = ""
            @rating.verifier.attributes.completed_at = null
            @parentScope.$emit 'refresh:counts' if @parentScope

    undoVerification: =>
        @RatingDataservice.updateResponseStatus(@rating.attributes.rating_id, @responseStatus.INREVIEW, @entityId).then (response)=>
            @rating.attributes.rating_status = @responseStatus.INREVIEW
            @rating.verifier.attributes.is_complete = false
            @rating.verifier.attributes.completed_by_name = ""
            @rating.verifier.attributes.completed_by = ""
            @rating.verifier.attributes.completed_at = null
            @parentScope.$emit 'refresh:counts' if @parentScope

    getRemainingTime: (diff)=>
        remainingtimeinms = Number(@dvThresholds.REVIEW_TIMELIMIT) - diff
        remainingtimeinsecs = parseInt(remainingtimeinms / 1000)
        if remainingtimeinsecs < 60
            message = remainingtimeinsecs + " sec left"
        else
            message = parseInt(remainingtimeinsecs/60) + " min left"
        message

    cancel: =>
        response =
            rating: @rating
            customFields: @customFields
        @rating.verifierEdit = false
        @$uibModalInstance.dismiss response