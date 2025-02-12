class QuestionnaireSubmitButtonController extends BaseController
  @register 'QuestionnaireSubmitButtonController'

  @inject '$scope', '$attrs', 'Utils', 'SweetAlert',
          'DueDiligenceDataservice', 'toaster', '$state', 'keywordConstants','ModalFactory', 'DiligenceDataSaveService','$rootScope','diligenceStatusConstant','Restangular'

  initialize: ->
    @$scope.$parent.$watch @$attrs.diligence, (value) =>
      if value?
        @diligence = value

      @is_readonly = @Utils.isReadOnly()
      
      if @diligence.is_internal
        @submitText = 'Finish'
        @title = 'Are you ready to mark this as completed? This project will be locked, and you will not be able to make any more edits.'
        @successMessage = 'Project is marked as completed'
        @confirmButtonText = 'Yes, please complete'
      else
        @submitText = 'Submit to Investor'
        @title = 'Are you sure you want to submit this for investor review? You will not be able to make any more edits.'
        @successMessage = 'Sent to investor for review'
        @confirmButtonText = 'Yes, please submit!'

    deregistererRelated = @$scope.$parent.$watch @$attrs.relatedDiligences, (value) =>
      if value?
        @related_diligences = value
        deregistererRelated()

  getFinishButtonToolTipText: (mandatory_count, wip_count, totalReviewPending, totalReviewFailed, totalTrackChangesCount, totalReviewAssignmentPending, totalRatingTrackChangesCount, totalRatingReviewPending, totalRatingReviewAssignmentPending, totalRatingReviewFailed, totalUnResolvedComments, validationRequiredCount) ->
    message = ""
    if wip_count > 0 and mandatory_count > 0
       message = mandatory_count + ' Mandatory Question(s) Pending and '+wip_count+' question(s) marked as draft. Please resolve these before submitting.'
    else if wip_count > 0
       message = 'You have '+wip_count+' questions marked as draft. Please finalize these before submitting.'
    else if mandatory_count > 0
        message = mandatory_count + ' Mandatory Question(s) Pending.'
    else if totalReviewFailed > 0
        message = totalReviewFailed + ' Review(s) Failed. Please resolve these before submitting.'
    else if @diligence and @diligence.review_mandatory and totalReviewAssignmentPending > 0
        message = totalReviewAssignmentPending + ' Response(s) are not reviewed yet. Please review them before submitting.'
    else if @diligence and @diligence.review_mandatory and totalReviewPending > 0
        message = totalReviewPending + ' Review(s) Pending. Please review these before submitting.'
    else if totalUnResolvedComments > 0
        message = totalUnResolvedComments + ' Response(s) have review comments. Please resolve these before submitting.'
    else if totalTrackChangesCount > 0
        message = totalTrackChangesCount + ' Response(s) have tracking changes. Please resolve these before submitting.'
    else if totalRatingReviewFailed > 0
        message = totalRatingReviewFailed + ' Rating Review(s) Failed. Please resolve these before submitting.'
    else if validationRequiredCount > 0
        message = validationRequiredCount + ' responses require validation. Please validate these before submitting.'
    else if @diligence and @diligence.review_mandatory and totalRatingReviewAssignmentPending > 0
        message = totalRatingReviewAssignmentPending + ' Rating Review(s) are not reviewed yet. Please review them before submitting.'
    else if @diligence and @diligence.review_mandatory and totalRatingReviewPending > 0
        message = totalRatingReviewPending + ' Rating Review(s) Pending. Please review these before submitting.'
    else if totalRatingTrackChangesCount > 0
        message = totalRatingTrackChangesCount + ' Rating(s) have tracking changes. Please resolve these before submitting.'
    message

  hasUnsavedChanges: =>
    unsaved_count = @DiligenceDataSaveService.unsaved_count
    messageText = "You have #{unsaved_count} unsaved change#{if unsaved_count is 1 then '' else 's' }"
    if unsaved_count
      @SweetAlert.confirm({
        title: "Are you sure you want to submit? You have unsaved changes."
        text: "#{messageText}"
        cancelButtonText: 'Submit without saving'
        confirmButtonText: 'Save & Submit'
        customClass: 'danger-on-cancel'
        showCloseButton: true
        reverseButtons: false
        showLoaderOnConfirm: true
        preConfirm: =>
          leaving_state = true
          response = @DiligenceDataSaveService.commitUnsavedChanges(true)
          if response?.then?
            @toastInstance = @toaster.pop({type: 'info', title: 'Please Wait...', body: 'The system is saving your responses.', timeout: 0})
            response.then =>
              swal.close()
              @toaster.clear(@toastInstance)
              @changeDDStatus()
            ,(error)=>
              swal.close()
              @toaster.clear(@toastInstance)
      }).then (isConfirm) =>
        if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
          @$rootScope.$emit 'response:revert'
          @changeDDStatus()
    else
      @showConfirmationAlert()

  showConfirmationAlert: =>
    pct_complete = @diligence.percentage_completed #need to fetch latest values as this is picking from initial page load
    messageText = ""
    if pct_complete == 0
      messageText = 'Did you click this by mistake? You are yet to start answering.'
    else if pct_complete < 50
      messageText = 'You have only partially completed this questionnaire, less than 50% of the questions, which is below industry average.'
    else if pct_complete < 75
      messageText = 'Great effort in completing the questionnaire. Although, it is still less than 75% complete, and below industry average.'
    else if pct_complete < 100
      messageText = 'You are almost there! Only a few % more, and you will be at 100%.'
    
    if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW
      reviewMessageText = ""
      if @$scope.$parent.vm.totalReviewPending > 0
        reviewMessageText += 'You have '+@$scope.$parent.vm.totalReviewPending+' reviews pending.'
      if @$scope.$parent.vm.totalReviewFailed > 0
        reviewMessageText += @$scope.$parent.vm.totalReviewPending+' failed reviews. '
      if @$scope.$parent.vm.totalRatingReviewPending > 0
        reviewMessageText += @$scope.$parent.vm.totalRatingReviewPending+' rating reviews pending.'
      if @$scope.$parent.vm.responseCommentsCounts > 0
        reviewMessageText += @$scope.$parent.vm.responseCommentsCounts+' review comments pending to be resolved. All unresolved comments will be marked as resolved.'
      messageText = reviewMessageText if reviewMessageText.length > 0
      
    title = @title
    confirmButtonText = @confirmButtonText
    if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW and (@$scope.$parent.vm.totalReviewPending > 0 || @$scope.$parent.vm.totalReviewFailed > 0 || @$scope.$parent.vm.totalRatingReviewPending > 0)
      title = "Are you sure you want to cancel review and mark this project as completed? You will not be able to make any more edits."
      confirmButtonText = "Yes, please cancel"

    @SweetAlert.confirm({
      title: title
      text: messageText
      confirmButtonText: confirmButtonText
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @changeDDStatus()
    })
  
  submit: =>
    if !(!(@diligence.status == 'Started' || @diligence.status == 'Followup' || @diligence.status == 'ExtensionRequested' || @diligence.status == 'InReview') || @is_readonly || @$scope.$parent.vm.mandatoryUnansweredCount > 0 || @$scope.$parent.vm.wipCount> 0 || @$scope.$parent.vm.totalTrackChangesCount > 0 || (@diligence.review_mandatory && (@$scope.$parent.vm.totalReviewAssignmentPending > 0 || @$scope.$parent.vm.totalReviewPending > 0 || @$scope.$parent.vm.totalReviewFailed > 0)) || @$scope.$parent.vm.totalRatingTrackChangesCount > 0 || (@diligence.review_mandatory && (@$scope.$parent.vm.totalRatingReviewAssignmentPending > 0 || @$scope.$parent.vm.totalRatingReviewPending)) || @$scope.$parent.vm.totalUnResolvedComments > 0 || @$scope.$parent.vm.validationRequiredCount > 0)
      if @related_diligences and @related_diligences.length > 0 and @diligence.entity_type != @keywordConstants.Vehicle
        @openRelatedVehiclesModal()
      else
        @hasUnsavedChanges()

  changeDDStatus: -> #manager
    id = @diligence.id
    if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW
      @DueDiligenceDataservice.exitReview(id).then (response)=>
        @DueDiligenceDataservice.setStatus(id, 'Completed').then (response) =>
          @toaster.pop 'success', @successMessage
          if @diligence.entity_type == @keywordConstants.Vehicle and @diligence.linked_duediligence_id
            @$state.go 'app.diligence.firms.funds.vehicles.project.summary', {firmId: @diligence.fromfirm_id, fundId: @diligence.parent_entity_id, vehicleId: @diligence.entity_id, diligenceId: @diligence.linked_duediligence_id}
          else if @diligence.is_internal
            @$state.reload()
          else
            @$state.go 'app.diligence.projects.activity', type: 'in-progress'
          swal.close()
        ,(error)=>
          if error.status == 400
            @SweetAlert.error({
              title: error.data.message
              confirmButtonText: 'Okay'
            })
          else
            swal.close()
    else
      @DueDiligenceDataservice.setStatus(id, 'Completed').then (response) =>
        @toaster.pop 'success', @successMessage
        if @diligence.entity_type == @keywordConstants.Vehicle and @diligence.linked_duediligence_id
          @$state.go 'app.diligence.firms.funds.vehicles.project.summary', {firmId: @diligence.fromfirm_id, fundId: @diligence.parent_entity_id, vehicleId: @diligence.entity_id, diligenceId: @diligence.linked_duediligence_id}
        else if @diligence.is_internal
          @$state.reload()
        else
          @$state.go 'app.diligence.projects.activity', type: 'in-progress'
        swal.close()
      ,(error)=>
        if error.status == 400
          @SweetAlert.error({
            title: error.data.message
            confirmButtonText: 'Okay'
          })
        else
          swal.close()

  openRelatedVehiclesModal: =>
    disabled = !(@diligence.status == 'Started' || @diligence.status == 'Followup' || @diligence.status == 'ExtensionRequested' || @diligence.status == 'InReview') || @is_readonly || @$scope.$parent.vm.mandatoryUnansweredCount > 0 || @$scope.$parent.vm.wipCount> 0 || @$scope.$parent.vm.totalTrackChangesCount > 0 || (@diligence.review_mandatory && (@$scope.$parent.vm.totalReviewAssignmentPending > 0 || @$scope.$parent.vm.totalReviewPending > 0 || @$scope.$parent.vm.totalReviewFailed > 0)) || @$scope.$parent.vm.totalRatingTrackChangesCount > 0 || (@diligence.review_mandatory && (@$scope.$parent.vm.totalRatingReviewAssignmentPending > 0 || @$scope.$parent.vm.totalRatingReviewPending)) || @$scope.$parent.vm.totalRatingReviewFailed > 0 || @$scope.$parent.vm.validationRequiredCount > 0
    @ModalFactory.invokeModal 'view_related_diligences',
      resolve:
        diligence: => @diligence
        disabled: => disabled
        disabledTooltip: => @getFinishButtonToolTipText(@$scope.$parent.vm.mandatoryUnansweredCount,@$scope.$parent.vm.wipCount, @$scope.$parent.vm.totalReviewPending, @$scope.$parent.vm.totalReviewFailed, @$scope.$parent.vm.totalTrackChangesCount, @$scope.$parent.vm.totalReviewAssignmentPending, @$scope.$parent.vm.totalRatingTrackChangesCount, @$scope.$parent.vm.totalRatingReviewPending, @$scope.$parent.vm.totalRatingReviewAssignmentPending, @$scope.$parent.vm.totalRatingReviewFailed, @$scope.$parent.vm.totalUnResolvedComments, @$scope.$parent.vm.validationRequiredCount)