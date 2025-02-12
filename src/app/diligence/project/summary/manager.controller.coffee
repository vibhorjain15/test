class ProjectSummaryManagerController extends BaseController

  @register 'ProjectSummaryManagerController'

  @inject '$scope', '$state', '$rootScope', 'Utils', 'Restangular', '$stateParams', 'DueDiligenceDataservice', 'toaster', 'SweetAlert','ModalFactory','diligenceStatusConstant','keywordConstants', 'angularEnabled'

  initialize: ->
    @diligenceId = @$stateParams.diligenceId
    @is_freeSubscription = @Utils.isFreeSubscription()
    @diligenceTypeId = 1105
    @is_admin = @Utils.isAdmin()
    @deleteDueDiligenceUrl = 'diligence/project/summary/delete.html'
    @DVEntityDisplayName = @Utils.getDVEntityDisplayName()
    @current_user = @Utils.getCurrentUser()

    @minDate = new Date()

    @$scope.$on 'delete:notes', (event, note) =>
      @removeNote(note)

    @$scope.getDueDiligence().then (response) =>
      @diligence = response

      if @diligence.is_internal
        if @diligence.status == @diligenceStatusConstant.COMPLETED
          @canStartReview = @diligence.postsubmission_review_enabled
        else
          @canStartReview = @diligence.presubmission_review_enabled
        if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW
          @reviewStartedForUser = @diligence.presubmission_review_enabled
        else
          @reviewStartedForUser = @diligence.postsubmission_review_enabled
      else
        if @current_user.firmInfo.id == @diligence.fromfirm_id
          @canStartReview = @diligence.postsubmission_review_enabled
          @reviewStartedForUser = true if @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW
        else if @current_user.firmInfo.id == @diligence.tofirm_id
          @canStartReview = @diligence.presubmission_review_enabled
          @reviewStartedForUser = true if @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW

      if @current_user and @current_user.firmInfo
        permissions_enabled = @current_user.firmInfo.hasPermissionEnabled
        if permissions_enabled
          @diligence.hasReadOnlyAccess = false
        else
          @diligence.isLocked = @diligence.isLocked || @diligence.hasReadOnlyAccess

      @getRelatedDiligences() if @diligence.entity_type != @keywordConstants.Firm
      @setActionFlags()

      @DueDiligenceDataservice.getFollowUps(@diligenceId, 'Duediligence').then (responses) =>
        @conversations = responses

      @getMandatoryQuestionCounts()
      @getCustomFields()
      @getFirmPref()
      @getMyFunctions()

  getFirmPref: =>
    @Restangular.all('firm_preferences').customGET().then (response) =>
      if @diligence.is_internal
        @diligence.review_mandatory = response.review_workflow_mandatory_for_internal_diligence
      else
        @diligence.review_mandatory = response.review_workflow_mandatory_for_external_diligence

  getCustomFields: =>
    @Restangular.all('service/dvapi_service/get_custom_fields_data').post({entity_id : @diligenceId, entity_type: @diligenceTypeId, schema_type: 'duediligence', sub_entity_id: 0}).then (response) =>
      @customFields = response.data

  getMyFunctions: =>
    if @diligence.entity_type == 'Review'
      params =
        entity_type: @keywordConstants.Project
        entity_id: @diligence.id
    else
      params =
        entity_type: @diligence.entity_type
        entity_id: @diligence.entity_id
    @Restangular.all('function_assignments').getList(params).then (response)=>
      @functions = response

  getRelatedDiligences: =>
    @Restangular.one('diligences',@diligence.id).getList('linked_projects',{include_counts:true}).then ((response) =>
      @related_diligences = response
    )

  setActionFlags: ->
    internal_only = @diligence.is_internal
    type = @diligence.dd_type
    @canRestartDD = (@diligence.is_internal and ((@diligence.status == 'Approved') or (@diligence.status == 'Completed') or @diligence.status == 'NotApproved'))
    @canApproveDD = if internal_only and ((@diligence.status is 'Completed' and !@canStartReview) || @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW) then true else false

    unless {'Started': true, 'ExtensionRequested': true, 'Followup': true,'PendingRestart':true,'InReview':true}[@diligence.status] && (!@canStartReview || @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW)
      @canFinishDD = false
      return
    else
      @canFinishDD = !@diligence.isReadOnly and !@diligence.alwaysOpen

  viewHistory: ->
    if @diligenceIds
      @$state.go 'app.analyze.compare.due_diligences', ids: @diligenceIds

  displayDeletionPopover: ->
    @delete_params = {}
    @isPopoverOpen = true

  displayExtensionModal: ->
    @ModalFactory.invokeModal 'extend_duedate',
      resolve:
          diligence: @diligence

  gotoProjectActivity: (type) ->
    @$state.go 'app.diligence.projects.activity', type: type

  requestRevision: (status) ->
    @saveFollowupResponse()
    @changeDDStatus(status)

  changeDDStatus: (status) ->
    if status in ['Approved','NotApproved'] and @totalReviewPending > 0
      return
    loader_property = {
      'Started':'restarting_dd'
      'Approved': 'approving_dd'
      'NotApproved': 'disapproving_dd'
    }[status]
    @[loader_property] = true
    @DueDiligenceDataservice.setStatus(@diligenceId, status).then (response) =>
      @[loader_property] = false
      switch response.status
        when 'Started'
          message = 'Project re-started successfully!'
        when 'PendingRestart'
          message = 'Restart request has been sent to the investor'
        when 'Approved'
          message = 'Project is approved successfully!'
        when 'NotApproved'
          message = 'Project is not approved at this time'

      @toaster.pop 'success', message

      @gotoProjectActivity('in-progress')

  goBack: =>
    @$state.go 'app.diligence.projects.activity', type: 'in-progress'


  saveFollowupResponse: =>
    if @followup_form.$valid
      @saving_notes = true
      params =
        text: @new_followup_response.text
        type: 'DiligenceFollowup'
        entity_id: @diligenceId
        entity_type: 'Duediligence'

      @DueDiligenceDataservice.saveFollowup(params).then((response) =>
        message = 'Your response was added!'
        @conversations.push response
        @toaster.pop 'success', '', message
        @resetForm()
      )
      .finally(=> @saving_notes = false)

  resetForm: ->
    @new_followup_response.text = ""
    @followup_form.$setPristine()
    @followup_form.$setUntouched()

  canEditNote: (note) ->
    note.created_by is @Utils.getCurrentUser().id


  triggerWorkflow: ->
    if !@is_freeSubscription
      @ModalFactory.invokeModal 'trigger_workflow',
      resolve:
        workflow: =>
          entity_type: 'Duediligence'
          entity_id: @diligenceId
          name: @diligence.name

  removeNote: (deletedNote) ->
    noteIndex = _(@conversations).findIndex (note) ->
      note.id == deletedNote.id
    @conversations.splice noteIndex, 1

  getMandatoryQuestionCounts: =>
    @DueDiligenceDataservice.getQuestionCounts(@diligenceId).then (response) =>
      _(response).each (count_info) =>
        switch count_info.id
          when 'MandatoryUnansweredTotal'
            @mandatoryUnansweredCount = count_info.value
          when 'WipTotal'
            @wipCount = count_info.value
          when 'TotalReviewPending'
            @totalReviewPending = count_info.value
          when 'ReviewFailed'
            @totalReviewFailed = count_info.value
          when 'UnAnsweredTotal'
            @unansweredCount = count_info.value
          when 'WithTrackChangesCount'
            @totalTrackChangesCount = count_info.value
          when 'TotalReviewerAssignmentPending'
            @totalReviewAssignmentPending = count_info.value
          when 'WithRatingTrackChangesCount'
            @totalRatingTrackChangesCount = count_info.value
          when 'RatingReviewpendingCount'
            @totalRatingReviewPending = count_info.value
          when 'RatingAssignmentpendingCount'
            @totalRatingReviewAssignmentPending = count_info.value
          when 'RatingReviewFailed'
            @totalRatingReviewFailed = count_info.value
          when 'TotalUnresolvedCommentsCount'
            @totalUnResolvedComments = count_info.value
          when 'ValidationRequired'
            @validationRequiredCount = count_info.value

  openConfirmationforVerifier: =>
    confirmText = ""
    if @diligence.status != @diligenceStatusConstant.COMPLETED
      if @unansweredCount > 0
        confirmText = "You have #{@unansweredCount} unanswered questions. Are you sure you want to continue?"
      else if @wipCount > 0
        confirmText = "You have #{@wipCount} questions marked as draft. Are you sure you want to continue?"
    @SweetAlert.confirm({
      title: "Are you sure you want to submit this project for review?"
      text: confirmText
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @openCopyVerifierModal()
    })

  openCopyVerifierModal: =>
    @ModalFactory.invokeModal 'copy_verifiers',
      resolve:
        diligence: => @diligence
      success: (response)=>
        @diligence.status = response.status
        @setActionFlags()

  toggleReviewButton: =>
    canStartReview = not @canStartReview
    params = angular.copy @diligence
    params.postsubmission_review_enabled = canStartReview
    params.presubmission_review_enabled = canStartReview
    @Restangular.one('diligences',@diligence.id).all('update_data').customPUT(params).then (response)=>
      @diligence = params
      @canStartReview = canStartReview
      @setActionFlags()
      message = "Review mode #{if @canStartReview then 'Enabled' else 'Disabled'}"
      @toaster.pop 'success','',message

  openUpdateDiligenceModal: ->
    @ModalFactory.invokeModal 'manage_diligence',
      resolve:
        diligence: @diligence
      success: (diligence) =>
        @diligence.name = diligence.name
        @diligence.due_at = diligence.due_at
        @diligence.as_of_date = diligence.as_of_date
        @diligence.type = diligence.type
        if @diligence.last_updated_at
          @diligence.last_updated_at = diligence.last_updated_at
        @$rootScope.$emit 'update:duedate'

  manageCustomfield: =>
    @ModalFactory.invokeModal 'manage_custom_fields',
      resolve:
        entityTypeId: => @diligenceTypeId
        entityType: => 'duediligence'
        entityId: => @diligenceId
        customFields: => angular.copy @customFields
        customUrl: => 'project_tags'
      success: (response)=>
        @customFields = response.data

  formatDateTimeFormat: (timeStamp) ->
    return @Utils.getLocalDateTime(timeStamp).format("MMM Do, YYYY h:mm a")
