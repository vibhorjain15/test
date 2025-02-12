angular.module('diligenceVault').directive 'questionnaireSection', ($controller, toaster, $timeout, $compile, DueDiligenceDataservice,$rootScope,$location,responseStatus,SweetAlert,diligenceStatusConstant,dvThresholds,$http,baseUrl,ratingConstants) ->
  restrict: 'E'
  templateUrl: 'diligence/project/questionnaire/new_directives/questionnaireSection/template.html'
  controllerAs: 'vm'
  require: [ '?^questionnaire', '?^displayQuestionnaire' ]
  replace: true
  link: (scope, element, attributes, questionnaireController) ->
    section = scope.section
    scope.questionnaireController = questionnaireController[0] || questionnaireController[1]
    section_can_have_multiple_sequences = scope.section.attributes.isMultiple && !section.readonly
    scope.printPreview = angular.isDefined attributes.printPreview
    scope.responseStatus = responseStatus
    scope.diligenceStatusConstant = diligenceStatusConstant
    scope.ratingConstants = ratingConstants

    if questionnaireController.analytics_mode
      element.find('.js-assign-section-dropdown').addClass('hidden')

    # headerText should be visible all the time, it should not depend on any role or project status
    if section.attributes.headerText
      header_text_html = $compile("<span class='word-break-break-word' ng-bind-html='section.attributes.headerText | trusthtml'></span>")(scope)

      element
        .find('.js-header-text')
        .html(header_text_html)
        .removeClass('hidden')

    $timeout -> #wait until the sequences are inserted in DOM using ng-repeat
      if section_can_have_multiple_sequences
        element.find('.js-sequence-controls').removeClass('hidden')
        element.addClass('has-multiple-sequences')
      else
        element.find('.js-sequence-controls').remove()

    section.onSequenceChange = (sequence_count) ->
      return unless section_can_have_multiple_sequences

      $remove_button = element.find('.js-remove-button')

      if sequence_count is 1
        # using class instead of disabled property because, button uses button-loader directive
        # which handles disabled attribute & even this code trying to change disabled attributes
        # was causing race conditions
        $remove_button.addClass('disabled')
      else if $remove_button.hasClass('disabled')
        $remove_button.removeClass('disabled')

    # manually calling this for the first load because this was triggered even before the section
    # came to the directive
    section.sequenceDidChange()

  controller: ($scope, Utils, Restangular, ModalFactory, toaster,SweetAlert,trackChangeStatus) ->
    section = $scope.section
    @section = section
    @Utils = Utils

    deregisterer = $scope.$watch 'questionnaireController.diligence', (value) =>
      if value?
        @type = $scope.questionnaireController.diligence.diligence_type
        @isEditable = !$scope.questionnaireController.diligence.isReadOnly and !$scope.questionnaireController.diligence.isLocked
        @ratingsNotEditable = $scope.questionnaireController.diligence.diligence_type == 'dd_review' and $scope.questionnaireController.firm_preferences.enable_rating_custom_fields_review and ($scope.questionnaireController.diligence.status == diligenceStatusConstant.COMPLETED or $scope.questionnaireController.diligence.status == diligenceStatusConstant.POSTCOMPLETIONREVIEW)
        deregisterer()

    @is_freeSubscription = Utils.isFreeSubscription()
    @current_user = Utils.getCurrentUser()
    @showForManager = Utils.isManager() && !@is_freeSubscription
    @showForInvestor = Utils.isInvestor() && !@is_freeSubscription

    @showTrackChangesButtons = =>
      hasTrackChangesResponses = false
      _(@section.sequences).each (sequence)=>
        _(sequence.responses).each (response)=>
          timeDiff = moment().diff(Utils.getLocalDateTime(response.verifier.attributes.completed_at),'milliseconds') if response.verifier and response.verifier.attributes.is_complete
          if response.responseType not in ['Attachment', 'ReturnTable','aumTable','TextMultiLine'] and (response.attributes.response_status == responseStatus.REVIEWFAILED and (typeof timeDiff == 'number' && timeDiff > dvThresholds.REVIEW_TIMELIMIT)) and !response.verifierEdit and response.attributes.track_change_status == trackChangeStatus.STARTED and response.responses_history
            hasTrackChangesResponses = true

      _($scope.questionnaireController.responses).each (response)=>
        timeDiff = moment().diff(Utils.getLocalDateTime(response.verifier.attributes.completed_at),'milliseconds') if response.verifier and response.verifier.attributes.is_complete
        if response.responseType not in ['Attachment', 'ReturnTable','aumTable','TextMultiLine'] and (response.attributes.response_status == responseStatus.REVIEWFAILED and (typeof timeDiff == 'number' && timeDiff > dvThresholds.REVIEW_TIMELIMIT)) and !response.verifierEdit and response.attributes.track_change_status == trackChangeStatus.STARTED and response.responses_history
          hasTrackChangesResponses = true

      hasTrackChangesResponses

    @openNotesDialog = ->
      $scope.questionnaireController.openNotesDialog(@section, 'Section')

    @updateAssignMember = (member, type) ->
      
      section_name = section.attributes.name
      if type == 'function'
        attr = "assigned_to_function"
        idAttr = "function_id"
        user = member.function_name
      else
        attr = "assigned_to"
        idAttr = "id"
        user = member.firstName + ' ' + member.lastName

      if member.is_removed
        message = "#{user} assignment removed from #{section_name}"

        params =
          entity_id: section.id
          entity_type: "section"
          duediligence_id: section.diligenceId
          "#{attr}": member[idAttr]
          is_removed: true

      else

        message = "#{user} is now assigned to #{section_name}"

        params =
          entity_id: section.id
          entity_type: "section"
          duediligence_id: section.diligenceId
          "#{attr}": member[idAttr]

      DueDiligenceDataservice.assignUserToEntity(params).then (response) =>
        if member.is_removed
          if type == 'user'
            memberIdx = _.findIndex(section.assignedUsers, (memberItem) ->
              memberItem.id == member.id
            )
            section.assignedUsers.splice(memberIdx, 1)
          if type == 'function'
            functionIdx = _.findIndex(section.assignedFunctions, (functionItem) ->
              functionItem.function_id == member.function_id
            )
            section.assignedFunctions.splice(functionIdx, 1)
          
        else
          if type == 'user'
            if !section.assignedUsers || !section.assignedUsers.length
              section.assignedUsers = []
            section.assignedUsers.push(member)

          if type == 'function'
            if !section.assignedFunctions || !section.assignedFunctions.length
              section.assignedFunctions = []
            section.assignedFunctions.push(member)
          
        toaster.pop 'success', '', message

        $scope.$emit 'refresh:counts'

    @removeSequence = (sequence) ->
      return if section.sequences.length is 1

      if sequence.isNew()
        section.removeSequence(sequence)
        $scope.questionnaireController.removeUnsavedSequence(sequence)
      else
        sequence.marked_for_deletion = true
        $scope.questionnaireController.addRemovableSequence(sequence)

    @undoSequenceDelete = (sequence) ->
      sequence.marked_for_deletion = false
      $scope.questionnaireController.removeRemovableSequence(sequence)

    @addNewSequenceBelow = (sequence) ->
      new_sequence = section.addNewSequenceBelow(sequence)
      $scope.questionnaireController.addUnsavedSequence(new_sequence)

    @toggleMode = ->
      section.readonly = !section.readonly

    @openVerifierModal = =>
      ModalFactory.invokeModal 'add_verifier',
        resolve:
          response: => @section
          verificationLevel: => 'section'
          verificationType: => if @section.isReadonlyEditable then diligenceStatusConstant.PRECOMPLETIONREVIEW else diligenceStatusConstant.POSTCOMPLETIONREVIEW
          diligenceType: => @type
          functions: => $scope.questionnaireController.entityFunctions
        success: (verifier)=>
          @section.verifier = {
            id: verifier.id
            type: "response_verify"
            attributes: verifier
          }
          if @section.isReadonlyNotEditable
            response_status_attr = 'post_response_status'
          else
            response_status_attr = 'response_status'

          DueDiligenceDataservice.getAllSectionVerifiers(@section.diligenceId, @section.id, @section.isReadonlyNotEditable).then (allverifiers)=>
            if @section.rating and allverifiers[@section.id].rating_todos.hasOwnProperty(@section.rating.attributes.rating_id)
              assignedTo = allverifiers[@section.id].rating_todos[@section.rating.attributes.rating_id]
              @section.rating.attributes.rating_status = responseStatus.INREVIEW
              @section.rating.verifier =
                type: 'rating_verify'
                id: assignedTo.id
                attributes: assignedTo

            _(@section.sequences).each (sequence)=>
              _(sequence.responses).each (response)=>
                if response.id and !response.verifier
                  if allverifiers[@section.id].hasOwnProperty('responses_todos') and allverifiers[@section.id].responses_todos.hasOwnProperty(response.id)
                    response.attributes[response_status_attr] = 'InReview'
                    assignedTo = allverifiers[@section.id].responses_todos[response.id]
                    response.verifier = {
                      type: 'response_verify'
                      id: assignedTo.id
                      attributes: assignedTo
                    }
                  response.scope.init() if response.scope
            _($scope.questionnaireController.responses).each (response)=>
              if response.id and !response.verifier
                section = response.sequence.section
                if allverifiers[section.id].hasOwnProperty('responses_todos') and allverifiers[section.id].responses_todos.hasOwnProperty(response.id)
                  response.attributes[response_status_attr] = 'InReview'
                  assignedTo = allverifiers[section.id].responses_todos[response.id]
                  response.verifier = {
                    type: 'response_verify'
                    id: assignedTo.id
                    attributes: assignedTo
                  }
                response.scope.init() if response.scope
            $scope.$emit 'refresh:counts'

    @checkResponsesHaveTrackChanges = =>
      haveTrackChanges = false
      _(@section.sequences).each (sequence)=>
        _(sequence.responses).each (response)=>
          if response.responseType == 'TextMultiLine' and response._previousAttributes.textResponse and response._previousAttributes.textResponse.indexOf('<span class="ice') > -1
            haveTrackChanges = true

      _($scope.questionnaireController.responses).each (response)=>
        if response.responseType == 'TextMultiLine' and response._previousAttributes.textResponse and response._previousAttributes.textResponse.indexOf('<span class="ice') > -1
          haveTrackChanges = true

      haveTrackChanges

    @checkResponsesHaveUnResolvedComments = =>
      haveUnResolvedComments = false
      _(@section.sequences).each (sequence)=>
        _(sequence.responses).each (response)=>
          if response.attributes.response_unresolved_comments_counts > 0
            haveUnResolvedComments = true

      _($scope.questionnaireController.responses).each (response)=>
        if response.attributes.response_unresolved_comments_counts > 0
          haveUnResolvedComments = true

      haveUnResolvedComments

    @showAlertforTrackChanges = =>
      SweetAlert.error
        'title':'You have pending tracking changes'
        'text':'Some of your responses have pending tracking changes. Please edit these responses and accept or reject the changes before marking them as reviewed.'

    @showAlertForUnresolvedComments = =>
      SweetAlert.error
        'title':'You have unresolved comments'
        'text':'Some of your responses have unresolved comments. Please resolve them before marking as reviewed.'

    @showUnsavedResponseAlert = (message)=>
      SweetAlert.error
        'title':'You have unsaved responses under this section'
        'text':'Please resolve these before marking this section as '+message+'.'

    @markAsReviewed = (status)=>
      @getUnsavedResponseInSection()
      if @section.isReadonlyEditable and @checkResponsesHaveTrackChanges()
        @showAlertforTrackChanges()
      else if @section.isReadonlyEditable and @checkResponsesHaveUnResolvedComments()
        @showAlertForUnresolvedComments()
      else if @getUnsavedResponseInSection().length > 0
        @showUnsavedResponseAlert('reviewed')
      else
        @verifyRequest(status)

    @verifyRequest = (status)=>
      params =
        status : status

      if @section.isReadonlyNotEditable
        response_status_attr = 'post_response_status'
      else
        response_status_attr = 'response_status'

      Restangular.one('diligences', $scope.questionnaireController.diligence.id).one('sections',@section.id).all('status').patch(params).then (response) =>

        Restangular.one('diligences', $scope.questionnaireController.diligence.id).one('sections',@section.id).all('status').customGET().then (section_status) =>
          @section.attributes.section_status = section_status.status
          @section.verifier.attributes.is_complete = true
          @section.verifier.attributes.completed_by_name = @section.verifier.attributes.assigned_to_name
          @section.verifier.attributes.completed_by = @section.verifier.attributes.assigned_to
          @section.verifier.attributes.completed_at = Utils.formatDatetimeUtc(moment.utc())
          _(@section.sequences).each (sequence)=>
            _(sequence.responses).each (response)=>
              if response.id and response.attributes[response_status_attr] == responseStatus.INREVIEW and (response.verifier.attributes.assigned_to == @section.verifier.attributes.assigned_to or response.verifier.attributes.assigned_to_function_id == @section.verifier.attributes.assigned_to_function_id)
                response.attributes[response_status_attr] = status
                response.verifier.attributes.is_complete = true
                response.verifier.attributes.completed_by_name = @section.verifier.attributes.completed_by_name
                response.verifier.attributes.completed_by = @section.verifier.attributes.completed_by
                response.verifier.attributes.completed_at = @section.verifier.attributes.completed_at
                if status == responseStatus.REVIEWFAILED
                  DueDiligenceDataservice.updateTrackChangesStatus(response.id, trackChangeStatus.STARTED).then (response)=>
                    response.attributes.track_change_status = trackChangeStatus.STARTED
                response.scope.init() if response.scope

          _($scope.questionnaireController.responses).each (response)=>
            if response.id and response.attributes[response_status_attr] == responseStatus.INREVIEW and (response.verifier.attributes.assigned_to == @section.verifier.attributes.assigned_to or response.verifier.attributes.assigned_to_function_id == @section.verifier.attributes.assigned_to_function_id)
              response.attributes[response_status_attr] = status
              response.verifier.attributes.is_complete = true
              response.verifier.attributes.completed_by_name = @section.verifier.attributes.completed_by_name
              response.verifier.attributes.completed_by = @section.verifier.attributes.completed_by
              response.verifier.attributes.completed_at = @section.verifier.attributes.completed_at
              if status == responseStatus.REVIEWFAILED
                DueDiligenceDataservice.updateTrackChangesStatus(response.id, trackChangeStatus.STARTED).then (response)=>
                  response.attributes.track_change_status = trackChangeStatus.STARTED
              response.scope.init() if response.scope

          $scope.$emit 'refresh:counts'
          if status == responseStatus.REVIEWSUCCESS
            message = 'The responses from this section are now verified.'
          else
            message = 'The responses from this section are now rejected.'
          toaster.pop 'success', '', message

    @showVerifyConfirmation = =>
      responsesWithDeclinedStatus = @getResponsesWithDeclinedStatus()
      if responsesWithDeclinedStatus > 0
        confirmText = "You have #{responsesWithDeclinedStatus} declined response(s). These responses will not be marked as reviewed"
        SweetAlert.confirm({
          title: "Are you sure you want to review this section?"
          text: confirmText
          focusCancel: true
        }).then (isConfirm)=>
          if isConfirm.value and isConfirm.value == true
            @markAsReviewed(responseStatus.REVIEWSUCCESS)
      else
        @markAsReviewed(responseStatus.REVIEWSUCCESS)

    @getResponsesWithDeclinedStatus = =>
      count = 0
      if @section.isReadonlyNotEditable
        response_status_attr = 'post_response_status'
      else
        response_status_attr = 'response_status'
      _(@section.sequences).each (sequence)=>
        _(sequence.responses).each (response)=>
          if response.id and response.attributes[response_status_attr] == responseStatus.REVIEWFAILED
            count++

      count

    @rejectRequest = =>
      if @getUnsavedResponseInSection().length > 0
        @showUnsavedResponseAlert('review failed')
      else
        @verifyRequest(responseStatus.REVIEWFAILED)

    @checkConditionsForDisplayingUndo = =>
      @section.timeDiff = moment().diff(Utils.getLocalDateTime(@section.verifier.attributes.completed_at),'milliseconds') if @section.verifier and @section.verifier.attributes.is_complete
      if (@section.isReadonlyEditable or @section.isReadonlyNotEditable) && @section.verifier && @current_user.id == @section.verifier.attributes.completed_by && (typeof @section.timeDiff == 'number' && @section.timeDiff <= dvThresholds.REVIEW_TIMELIMIT)
        true
      else
        false

    @getRemainingTime = (diff)=>
      remainingtimeinms = Number(dvThresholds.REVIEW_TIMELIMIT) - diff
      remainingtimeinsecs = parseInt(remainingtimeinms / 1000)
      if remainingtimeinsecs < 60
        message = remainingtimeinsecs + " sec left"
      else
        message = parseInt(remainingtimeinsecs/60) + " min left"
      message

    @getUnsavedResponseInSection = =>
      unsavedResponses = []
      _($scope.questionnaireController.response_bucket.requests).each (method)=>
        _(method).each (response)=>
          if response.sequence.section.id == @section.id
            unsavedResponses.push response
      unsavedResponses
      
    @showTrackChangesConfirmation = (action)=>
      SweetAlert.confirm({
          title: "Are you sure you want to #{action} all changes in this section?"
          text: 'Paragraph responses track changes wont be affected.'
          focusCancel: true
        }).then (isConfirm)=>
          if isConfirm.value and isConfirm.value == true
            @acceptRejectChanges(action)

    @acceptRejectChanges = (action)=>
      _(@section.sequences).each (sequence)=>
        _(sequence.responses).each (response)=>
          timeDiff = moment().diff(Utils.getLocalDateTime(response.verifier.attributes.completed_at),'milliseconds') if response.verifier and response.verifier.attributes.is_complete
          if response.responseType not in ['Attachment', 'ReturnTable','aumTable','TextMultiLine'] and ((response.attributes.response_status == responseStatus.REVIEWSUCCESS or response.attributes.response_status == responseStatus.REVIEWFAILED) and (typeof timeDiff == 'number' && timeDiff > dvThresholds.REVIEW_TIMELIMIT)) and !response.verifierEdit and (response.attributes.response_status == responseStatus.REVIEWFAILED and response.attributes.track_change_status == trackChangeStatus.STARTED) and response.responses_history
            if action == 'accept'        
              DueDiligenceDataservice.updateTrackChangesStatus(response.id, trackChangeStatus.ACCEPTED).then =>
                response.attributes.track_change_status = trackChangeStatus.ACCEPTED
                response.deserializeAttributes()
                response.copyCurrentAttributes()
            else
              temp = response.responses_history
              response_status = response.attributes.response_status
              response.responses_history = response.attributes
              response.attributes = temp
              if response.attributes
                response.attributes.track_change_status = trackChangeStatus.REJECTED
                response.attributes.response_status = response_status
              else
                response.attributes = 
                  track_change_status : trackChangeStatus.REJECTED
                  response_status : responseStatus.STARTED
              response.deserializeAttributes()
              if response.responseType in ['Grid','DynamicGrid']
                tempGrid = response.newGrid
                response.newGrid = response.previousGrid
                response.previousGrid = tempGrid
                response.attributes.rows = response.responses_history.rows if response.responses_history.rows
                response.attributes.columns = response.responses_history.columns if response.responses_history.columns
              # if response.question.rules.length > 0
              #   @computeRules(response)
              DueDiligenceDataservice.updateTrackChangesStatus(response.id, trackChangeStatus.REJECTED).then (res)=>
                response.attributes.track_change_status = res.track_change_status
                response.update(false, true).then =>
                  response.scope.vm.onResponseChange() if response.scope
      
      _($scope.questionnaireController.responses).each (response)=>
        timeDiff = moment().diff(Utils.getLocalDateTime(response.verifier.attributes.completed_at),'milliseconds') if response.verifier and response.verifier.attributes.is_complete
        if response.responseType not in ['Attachment', 'ReturnTable','aumTable','TextMultiLine'] and ((response.attributes.response_status == responseStatus.REVIEWSUCCESS or response.attributes.response_status == responseStatus.REVIEWFAILED) and (typeof timeDiff == 'number' && timeDiff > dvThresholds.REVIEW_TIMELIMIT)) and !response.verifierEdit and (response.attributes.response_status == responseStatus.REVIEWFAILED and response.attributes.track_change_status == trackChangeStatus.STARTED) and response.responses_history
          if action == 'accept'        
            DueDiligenceDataservice.updateTrackChangesStatus(response.id, trackChangeStatus.ACCEPTED).then =>
              response.attributes.track_change_status = trackChangeStatus.ACCEPTED
          else
            temp = response.responses_history
            response_status = response.attributes.response_status
            response.responses_history = response.attributes
            response.attributes = temp
            if response.attributes
              response.attributes.track_change_status = trackChangeStatus.REJECTED
              response.attributes.response_status = response_status
            else
              response.attributes = 
                track_change_status : trackChangeStatus.REJECTED
                response_status : responseStatus.STARTED
            response.deserializeAttributes()
            if response.responseType in ['Grid','DynamicGrid']
              tempGrid = response.newGrid
              response.newGrid = response.previousGrid
              response.previousGrid = tempGrid
            DueDiligenceDataservice.updateTrackChangesStatus(response.id, trackChangeStatus.REJECTED).then (res)=>
              response.attributes.track_change_status = res.track_change_status
              response.update(false, true)

    @undoVerification = =>
      if @section.isReadonlyNotEditable
        response_status_attr = 'post_response_status'
      else
        response_status_attr = 'response_status'
      Restangular.one('diligences', $scope.questionnaireController.diligence.id).one('sections',@section.id).all('undo_status').patch().then (affected_responses) =>
        Restangular.one('diligences', $scope.questionnaireController.diligence.id).one('sections',@section.id).all('status').customGET().then (response) =>
          @section.attributes.section_status = response.status
          @section.verifier.attributes.is_complete = false
          @section.verifier.attributes.completed_by_name = ""
          @section.verifier.attributes.completed_by = null
          @section.verifier.attributes.completed_at = null

          _(@section.sequences).each (sequence)=>
            _(sequence.responses).each (response)=>
              if response.id and response.id in affected_responses
                response.attributes[response_status_attr] = responseStatus.INREVIEW
                response.verifier.attributes.is_complete = false
                response.verifier.attributes.completed_by_name = ""
                response.verifier.attributes.completed_by = null
                response.verifier.attributes.completed_at = null
                response.scope.init() if response.scope

          _($scope.questionnaireController.responses).each (response)=>
            if response.id and response.id in affected_responses
              response.attributes[response_status_attr] = responseStatus.INREVIEW
              response.verifier.attributes.is_complete = false
              response.verifier.attributes.completed_by_name = ""
              response.verifier.attributes.completed_by = null
              response.verifier.attributes.completed_at = null
              response.scope.init() if response.scope

          $scope.$emit 'refresh:counts'

    return
