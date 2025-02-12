class ProjectSummaryInvestorController extends BaseController

  @register 'ProjectSummaryInvestorController'

  @inject '$scope', '$state', '$rootScope', 'Utils', 'Restangular', '$stateParams', 'DueDiligenceDataservice', 'toaster', 'SweetAlert', 'ModalFactory', 'keywordConstants','diligenceStatusConstant', 'angularEnabled'

  initialize: ->
    @diligenceId = @$stateParams.diligenceId
    @diligenceTypeId = 1105
    @is_admin = @Utils.isAdmin()
    @is_freeSubscription = @Utils.isFreeSubscription()
    @is_smartSubscription = @Utils.isSmartSubscription()
    @DVEntityDisplayName = @Utils.getDVEntityDisplayName()
    @current_user = @Utils.getCurrentUser()
    @isFirmOwner = false
    if @current_user.firmwide_role == 'SuperOwner'
      @isFirmOwner = true
    @canStartReview = false
    @reviewStartedForUser = false

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
      @fetchHistoricDDs()

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
      
      @setActionFlags()

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
    @related_diligences = []
    @Restangular.one('diligences',@diligence.id).getList('linked_projects',{include_counts:true}).then ((response) =>
      @related_diligences = response
    )

  setActionFlags: ->
    status = @diligence.status
    internal_only = @diligence.is_internal
    always_open = @diligence.alwaysOpen

    @canFinishDD = internal_only and (status in ['Started', 'InReview']) and (!@canStartReview || @diligence.status == @diligenceStatusConstant.PRECOMPLETIONREVIEW)

    if internal_only
      @canApproveDD = (status is 'Completed' and !@canStartReview) or status is @diligenceStatusConstant.POSTCOMPLETIONREVIEW
      @canDeleteDD = true
    else
      @canApproveDD = @diligence.isReadOnly and (not always_open) and (!@canStartReview || (@canStartReview and !@diligence.review_mandatory) || @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW)
      @canDeleteDD = status is 'Started'

  viewHistory: ->
    if @diligenceIds
      @$state.go 'app.analyze.compare.due_diligences', ids: @diligenceIds

  fetchHistoricDDs: ->
    @Restangular.all('diligences').all('history').getList({entity_id: @diligence.entity_id, entity_type: 'Fund'}).then (response) =>

      if response.length > 1
        # right now we allow only 3 dd comparisons
        @diligenceIds = _(response).pluck('id').slice(0, 3).join(',')

  setPendingQuestionCount: ->
    if @diligence
      total = @diligence.question_count
      pct_complete = @diligence.percentage_completed
      @pending_question_count = Math.floor(total - (pct_complete * total / 100))

  displayExtensionModal: ->
    @ModalFactory.invokeModal 'approve_duedate_extension',
      resolve:
        diligence: @diligence

  displayDuedateExtensionModal: ->
    @ModalFactory.invokeModal 'extend_duedate',
      resolve:
          diligence: @diligence

  showRequestRevisionAlert: =>
    @SweetAlert.confirm({
      title: "Are you sure you want to unlock this project?"
      text: "The managers will be able to update responses and will have to resubmit the project again."
      confirmButtonText: 'Yes'
      cancelButtonText: 'No'
      focusCancel: true
    }).then (isConfirm)=>
      if isConfirm.value and isConfirm.value == true
        @requestRevision()

  requestRevision: ->
    @saveFollowupResponse()
    @changeDDStatus('Restarted')

  saveFollowupResponse: ->
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

  resetForm: () ->
    @new_followup_response.text = ""
    @followup_form.$setPristine()
    @followup_form.$setUntouched()

  exitAndChangeStatus: (status)=>
    if @diligence.status == @diligenceStatusConstant.POSTCOMPLETIONREVIEW
      @DueDiligenceDataservice.exitReview(@diligence.id).then (response)=>
        @changeDDStatus(status)
    else
      @changeDDStatus(status)

  changeDDStatus: (status) ->

    loader_property = {
      'Started':'restarting_dd'
      'Approved': 'approving_dd'
      'NotApproved': 'disapproving_dd'
    }[status]
    @[loader_property] = true

    @DueDiligenceDataservice.setStatus(@diligenceId, status).then (response) =>
      @[loader_property] = false
      action = {
      'Started' : 'started again'
      'Restarted' : 'started again'
      'Approved': 'approved successfully!'
      'NotApproved': 'not approved at this time'
      }[response.status]

      if status in ['Started', 'RestartApproved', 'Restarted']
        type= 'in-progress'
      else
        type = 'closed'

      @toaster.pop 'success', 'Due Diligence is ' + action

      if (@is_freeSubscription or @is_smartSubscription) and status == 'Approved'
        @$state.go 'app.diligence.projects.activity', type: type

        return

      switch status
        when 'Approved'
          if @diligence.entity_type == @keywordConstants.Product
            @$state.go 'app.firms.funds.profile.monitor', {firmId: @diligence.fromfirm_id, fundId: @diligence.entity_id}
          else if @diligence.entity_type == @keywordConstants.Strategy
            @$state.go 'app.firms.strategies.profile.monitor', {firmId: @diligence.fromfirm_id, strategyId: @diligence.entity_id}
          else if @diligence.entity_type == @keywordConstants.Firm
            @$state.go 'app.firms.profile.monitor', firmId: @diligence.entity_id
          else if @diligence.entity_type == @keywordConstants.Vehicle
            if @diligence.linked_duediligence_id
              @$state.go 'app.diligence.firms.funds.vehicles.project.summary', {firmId: @diligence.fromfirm_id, fundId: @diligence.parent_entity_id, vehicleId: @diligence.entity_id, diligenceId: @diligence.linked_duediligence_id}
            else
              @$state.go 'app.firms.funds.vehicles.profile.monitor', {firmId: @diligence.fromfirm_id, fundId: @diligence.parent_entity_id, vehicleId: @diligence.entity_id}
          else if @diligence.entity_type == @keywordConstants.Review
            @$state.go 'app.diligence.projects.activity', type: type

        when 'NotApproved'
          _(@diligence).extend response
          @$state.go '^.not_approval_reasons'
        else
          @$state.go 'app.diligence.projects.activity', type: type

  cancel: ->
    @isPopoverOpen = false

  triggerWorkflow: ->
    if !@is_freeSubscription
      @ModalFactory.invokeModal 'trigger_workflow',
      resolve:
        workflow: =>
          entity_type: 'Duediligence'
          entity_id: @diligenceId
          name: @diligence.name

  goBack: =>
    @$state.go 'app.diligence.projects.activity', type: 'in-progress'

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
