class WorkflowAutomationDetailController extends BaseController

  @register 'WorkflowAutomationDetailController'

  @inject '$stateParams', 'Restangular', '$q', '$state', '$scope', '$filter', 'toaster', 'SweetAlert', 'Utils',
    'BaseDataService', 'ModalFactory', '$anchorScroll', '$location', 'MentionsFactory', '$timeout', '$rootScope', '$tinymceMentionsPlaceholderText','PopupCheckerService','keywordConstants','RestangularHeaderService','angularEnabled'

  initialize: ->
    @current_user = @Utils.getCurrentUser()
    @workflowId = @$stateParams.Id
    @completedActionCount = 0
    @getActionsTypes()
    @actionButtons = {}
    @pageUrl = ""

    @BaseDataService.getPermissionEntityDetails(@workflowId,'workflow_audit').then (permission)=>
      @generatePageUrl(permission)
    @dateFormat = 'DD MMMM YYYY'
    @today = new Date()

    @timeline_legend = [
      {action: 'Completed', type: 'action', class: 'done legend'},
      {action: 'legend-gap', type: 'gap', class: 'legend-gap'},
      {action: 'Pending', type: 'action', class: 'in-progress legend'},
      {action: 'legend-gap', type: 'gap', class: 'legend-gap'},
      {action: 'Invisible', type: 'action', class: 'upcoming legend'}
    ]

    @tinymceOptions =
      init_instance_callback: (editor) =>
        @tinymceEditor = editor
        editor.on 'paste', (e) =>
          @tinymceEditor.insertContent('')
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv'
      browser_spellcheck: true
      placeholder: @$tinymceMentionsPlaceholderText
      toolbar: false
      menubar: false
      statusbar: false
      content_css : 'assets/stylesheets/tiny_mce_custom.css'
      forced_root_block : ""

    @$scope.$on 'delete:notes', (evt, note) =>
      idx = @workflow_notes.indexOf(note)
      @workflow_notes.splice idx,1

  redirectToEntity: (entity_id,entity_type) ->
    switch entity_type
      when 'Duediligence'
        @$state.go 'app.diligence.project.questionnaire', {diligenceId: entity_id}
      when 'Fund'
        @$state.go 'app.funds.profile.monitor', {fundId: entity_id}
      when 'Firm'
        @$state.go 'app.firms.profile.monitor', {firmId: entity_id}
      when 'User'
        @$state.go 'app.contacts', {Id: entity_id}
      when 'Workflow'
        @$state.go 'app.workflow_automation.detail', {Id: entity_id}
      when 'Document'
        @$state.go 'app.content.document.detail', {documentId: entity_id}
      when 'FormADV'
        @$state.go 'app.form_adv.firm.filings_history', {firmCRD: entity_id}


  displayNotesController: (action) ->
    @sidebarTemplate = 'workflow_automation/detail/add_notes.html'
    @sidebarTitle = 'Add Notes'
    @sidebarContent = 'notes'
    @displaySidebarPanel = true
    @new_note = {}
    @noteAction = action
    @actionButtons.add_note = false
    @resetForm()

  closeSidebarPanel: =>
    if @$scope.hasOwnProperty('has_unsaved_changes')
      scope_has_unsaved_changes = false
      for key of @$scope.has_unsaved_changes
        if @$scope.has_unsaved_changes.hasOwnProperty(key)
          if @$scope.has_unsaved_changes[key]
            scope_has_unsaved_changes = true
            break
      if scope_has_unsaved_changes
        @SweetAlert.confirm({
          title: "You have unsaved changes on this page"
          text: "All your unsaved changes will be lost if you leave this page"
          cancelButtonText: 'Do Not Save'
          confirmButtonText: 'Save & Exit'
          showLoaderOnConfirm: true
          customClass: 'danger-on-cancel'
          showCloseButton: true
          reverseButtons: false
          preConfirm: =>
            @$rootScope.$broadcast('dv_input_alert:save_changes')
            @$timeout =>
              @displaySidebarPanel = false
              swal.close()
            , 1000
        }).then (isConfirm) =>
          if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
            @$rootScope.$broadcast('dv_input_alert:leave_page')
            @$timeout =>
              @displaySidebarPanel = false
              swal.close()
            , 1000
      else
        @displaySidebarPanel = false
    else
      @displaySidebarPanel = false

  resetForm: ->
    @new_note = {}
    @add_notes_form?.$setPristine()
    @add_notes_form?.$setUntouched()

  getActionsTypes: () =>
    @Restangular.all('workflow_actions').getList().then (response) =>
      @action_types = response
      @getFunctions()
      @getTeamMembers()
      @getMyFunctions()


  setCompletedCounts: (checklist) =>


  getTeamMembers: () =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullName = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  getFunctions: =>
    @BaseDataService.getFunctions().then (response)=>
      @functions = response

  getMyFunctions: =>
    @Restangular.one('workflow_audits',@workflowId).getList('MyFunctions').then (response)=>
      @myFunctions = response

  setActiveStep: (step)=>
    @activeStep = step
    @setActiveAction(@activeStep.actions[0])

  setActiveAction:(action)=>
    # @completedActionCount
    @activeAction = action
    _(@activeAction.checklist).each (list) =>
      if list.is_complete
        @completedActionCount += 1


  markTaskCompleted:(task)=>
    task.completed_at = new Date()
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('todos', task.id).customPUT(task).then (response) =>
      message = 'The task has been marked as completed!'
      @toaster.pop 'success', '', message
      task = response
      @activeAction.percentageCompletion = @calculatePercentage(@activeAction)


  getDaysInBetween: (end) ->
    today = moment()
    startDate = moment(today, "DD.MM.YYYY")
    endDate = moment(end, "DD.MM.YYYY").set({'hour':23,'minute':59,'second':59,'millisecond':999})
    diff = endDate.diff(startDate, 'days')
    diff


  calculatePercentage:(action)=>
    totalChecklist = action.checklist.length
    if totalChecklist > 0
      completedChecklist = _(action.checklist).reduce((sum,task)=>
        if task.is_complete
          sum += 1
        sum
      ,0)
      parseInt((completedChecklist * 100)/totalChecklist)
    else
      0

  getUserFullName:(user, type)=>
    if type == 'function'
      teamMember = _(@functions).find ((member)=>
        member.function_id == Number(user)
      )
      if teamMember
        return teamMember.function_name
      else
        return null
    else
      teamMember = _(@teamMembers).find ((member)=>
        member.id == Number(user)
      )
      if teamMember
        return teamMember.fullName
      else
        return null

  generatePageUrl: (permission)=>
    if permission.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
      @pageUrl = "app/firms/#{permission.entity_id}/workflow_automation/#{@workflowId}"
      @init()
    else if permission.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
      @BaseDataService.getPermissionEntityDetails(permission.entity_id, 'Fund').then (response) =>
        @pageUrl = "app/firms/#{response.entity_id}/funds/#{permission.entity_id}/workflow_automation/#{@workflowId}"
        @init()
    else if permission.entity_type.toLowerCase() == @keywordConstants.Vehicle.toLowerCase()
      @BaseDataService.getPermissionEntityDetails(permission.entity_id, 'Vehicle').then (response) =>
        @pageUrl = "app/firms/#{response.firm_id}/funds/#{response.fund_id}/vehicles/#{permission.entity_id}/workflow_automation/#{@workflowId}"
        @init()
    else if permission.entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()
      @BaseDataService.getPermissionEntityDetails(permission.entity_id, 'Strategy').then (response) =>
        @pageUrl = "app/firms/#{response.entity_id}/strategies/#{permission.entity_id}/workflow_automation/#{@workflowId}"
        @init()
    else if permission.entity_type.toLowerCase() == @keywordConstants.Project.toLowerCase()
      @BaseDataService.getPermissionEntityDetails(permission.entity_id,'Duediligence').then (diligence)=>
        if diligence.entity_type.toLowerCase() == @keywordConstants.Product.toLowerCase()
            fromfirmId = diligence.fromfirm_id
            tofirmId = diligence.tofirm_id
            fundId = diligence.entity_id
            @pageUrl = "app/diligence/#{fromfirmId}/firms/#{tofirmId}/funds/#{fundId}/projects/#{permission.entity_id}/workflow_automation/#{@workflowId}"
        else if diligence.entity_type.toLowerCase() == @keywordConstants.Firm.toLowerCase()
            fromfirmId = diligence.fromfirm_id
            tofirmId = diligence.entity_id
            @pageUrl = "app/diligence/#{fromfirmId}/firms/#{tofirmId}/projects/#{permission.entity_id}/workflow_automation/#{@workflowId}"
        else if diligence.entity_type.toLowerCase() == @keywordConstants.Vehicle.toLowerCase()
            fromfirmId = diligence.fromfirm_id
            tofirmId = diligence.tofirm_id
            fundId = diligence.parent_entity_id
            vehicleId = diligence.entity_id
            @pageUrl = "app/diligence/#{fromfirmId}/firms/#{tofirmId}/funds/#{fundId}/vehicles/#{vehicleId}/projects/#{permission.entity_id}/workflow_automation/#{@workflowId}"
        else if diligence.entity_type.toLowerCase() == @keywordConstants.Strategy.toLowerCase()
            fromfirmId = diligence.fromfirm_id
            tofirmId = diligence.tofirm_id
            strategyId = diligence.entity_id
            @pageUrl = "app/diligence/#{fromfirmId}/firms/#{tofirmId}/strategies/#{strategyId}/projects/#{permission.entity_id}/workflow_automation/#{@workflowId}"
        @init()
    else if permission.entity_type.toLowerCase() == @keywordConstants.Document.toLowerCase()
      @pageUrl = "app/content/docuemnt/#{permission.entity_id}"
      @init()
    else
      @init()

  init: =>
    @getWorkflowStatus(@workflowId)

  getWorkflowStatus: (id) =>
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('workflow_audits', id).get().then (response) =>
      @workflow_status = @groupWorkflowAudits(response)
      @workflow_status.entity_name = response.entity_name
      @workflow_status.due_at = moment.utc(response.due_at).toDate()
      @workflow_status.created_at = moment.utc(response.created_at).toDate()
      if @activeStep
        @setActiveStep(@activeStep)
      @workflow_status.owner_name = @getUserFullName(@workflow_status.owner_id)
      @workflow_pending_action_id = null
      @workflow_pending_user_id = null
      @entity_id = @workflow_status.entity_id
      @entity_type = @workflow_status.entity_type
      @getNotes()
      _(@workflow_status.workflow_steps_audit).each (action) =>
        if action.status == 'Pending'
          action.from_now = moment.utc(action.created_at).local().fromNow()
          if !@workflow_pending_action_id
            @workflow_pending_action_id = action.action_id
            @workflow_pending_user_id = action.user_id
            @workflow_steps_actions_id = action.workflow_steps_actions_id
            if (@workflow_pending_action_id == 'add_note') && (@workflow_pending_user_id == @current_user.id)
              @displayNotesController()
        if action.status == 'Completed'
          action.created_at_new = moment(action.updated_at).format(@dateFormat)

  groupWorkflowAudits: (response)=>
    steps = _(response.workflow_steps_audits).groupBy ((step)=>
        step.workflow_steps_id
    )
    newSteps = []
    _(steps).each ((step)=>
        actions = _(step).groupBy ((action)=>
            action.workflow_steps_actions_id
        )
        stepactions = []
        _(actions).each ((action)=>
            action[0].users = _(action).chain().filter((user)=>
              user.user_id
            ).pluck('user_id').value()
            action[0].functions = _(action).chain().filter((user)=>
              user.function_id
            ).pluck('function_id').value()
            action[0].due_at = moment.utc(action[0].due_at).toDate()
            action[0].percentageCompletion = @calculatePercentage(action[0])
            if action[0].users.indexOf(@current_user.id) > -1
              action[0].user_id = @current_user.id
            stepactions.push action[0]
        )
        newStep = _(step[0]).pick('id','name','order','description','status','workflow_steps_id','workflow_audit_id','created_at','updated_at','updated_by')
        pending_exists = _(stepactions).findWhere(status: 'Pending')
        invisible_exists = _(stepactions).findWhere(status: 'Invisible')
        # if any invisible action exists which makes step invisible
        if invisible_exists
          newStep.status = 'Invisible'
        # if any pending action exists which makes step pending/in-progress
        else if pending_exists
          newStep.status = 'Pending'
        else
          newStep.status = 'Completed'
        newStep.actions = stepactions
        if newStep.status == 'Pending' || newStep.status == 'Completed'
          @activeStep = newStep
        newSteps.push newStep
    )
    workflow = _(response).pick('entity_id','entity_type','firm_id','name','owner_id','pct_complete','source','updated_at','updated_by','workflow_id','created_at','created_by','entities','id','is_active')
    newSteps = _(newSteps).sortBy (eachStep) -> eachStep.order
    workflow.workflow_steps_audit = newSteps
    workflow

  getSignedURL: (doc) =>
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('attachments', doc.entity_id ).one('signed_url', null).get().then (response) =>
      popup = window.open(response, '_blank')
      PopupCheckerService.check(popup)

  getNotes: () =>
    @loading_notes = true
    temp_entity_type = @entity_type
    if @entity_type == 'Document'
      temp_entity_type = 'Attachment'
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('notes').getList(entity_id: @entity_id, entity_type: temp_entity_type, workflow_audit_id: @workflowId).then (response) =>
      @workflow_notes = response
      @loading_notes = false

  saveNotes: (noteAction)=>
    if @add_notes_form.$valid
      @saving_notes = true

      if angular.isDefined(@workflowId)
        @new_note.workflow_audit_id = @workflowId

      if angular.isDefined(@workflow_pending_action_id)
        @new_note.action_id = @workflow_pending_action_id

      if angular.isDefined(@workflow_steps_actions_id)
        @new_note.workflow_steps_actions_id = @workflow_steps_actions_id

      @performing_action = true

      if @new_note.text.length>0
        mentioned_members_ids = @MentionsFactory.getMentionedIds(@new_note.text, true)
        if mentioned_members_ids.length>0
          @new_note.mentions = mentioned_members_ids

      @new_note.entity_id = @entity_id

      temp_entity_type = @entity_type

      if @entity_type == 'Document'
        temp_entity_type = 'Attachment'

      @new_note.entity_type = temp_entity_type

      @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('notes').post(@new_note)
        .then (response) =>
          message = 'Your notes are added!'
          @workflow_notes.unshift(response)
          @saving_notes = false
          @completeAction(noteAction) if noteAction and noteAction.action_id == 'add_note'
          @toaster.pop 'success', '', message
          @resetForm()
          @getWorkflowStatus(@workflowId)
          @performing_action = false
        , (error) =>
          @saving_notes = false
          @performing_action = false
          @toaster.pop 'error', '', 'Something went wrong. Please try again.'
          avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
          if !(error.status in avoid_error_logging_statuses)
            @Utils.logError('Adding notes at workflow detail failed', error)

  filterTeamMembers: (term) =>
    @filteredTeamMembers = @MentionsFactory.getFilteredMembers(term)

  getDisplayName: (user) =>
    @$timeout =>
      @tinymceEditor.insertContent('')
    , 300
    return @MentionsFactory.getDisplayName(user, true)

  confirmApprovalAction: (isApproved, action_text,actionObj,action) ->
    @SweetAlert.confirm({
      title: "Are you sure you #{action_text} this workflow?"
      showLoaderOnConfirm: true
      confirmButtonText: 'Yes'
      focusCancel: true
      preConfirm: =>
        params = {}

        params.entity_id = @entity_id
        params.entity_type = @entity_type
        if angular.isDefined(@workflowId)
          params.workflow_audit_id = @workflowId

        if angular.isDefined(@workflow_pending_action_id)
          params.action_id = @workflow_pending_action_id

        if angular.isDefined(@workflow_steps_actions_id)
          params.workflow_steps_actions_id = @workflow_steps_actions_id

        @actionButtons[action] = true

        @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('entity_approvals').post(params)
        .then (response) =>
          @toaster.pop 'success', '', 'This workflow has been updated'
          @completeAction(actionObj)
        .finally =>
          @actionButtons[action] = false
          swal.close()
        , (error) =>
          @toaster.pop 'error', '', 'Something went wrong. Please try again.'
          avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
          if !(error.status in avoid_error_logging_statuses)
            @Utils.logError('Updating workflow failed', error)
      })


  showInitials: (user, type) ->
    fullName = @getUserFullName(user, type)
    if fullName
      firstName = fullName.split(' ').slice(0, -1).join(' ')
      lastName = fullName.split(' ').slice(-1).join(' ')
      if firstName and !lastName
        initials = firstName[0]
      if lastName and !firstName
        initials = lastName[0]
      if firstName and lastName
        initials = firstName[0] + lastName[0]
      initials
    else
      "N/A"

  displayUserName: (user, type)=>
    fullName = @getUserFullName(user, type)
    if fullName
      fullName
    else
      "User not active"

  recordAction: (action,actionObj) =>
    switch action
      when 'add_note'
        @displayNotesController(actionObj)
      when 'approve'
        @confirmApprovalAction(true, 'want to approve',actionObj, action)
      when 'non_approval'
        @confirmApprovalAction(false, 'do not want to approve',actionObj, action)
      when 'complete'
        foundPendingTask = false
        _(actionObj.checklist).each (list) =>
          if (list.is_complete == false || !list.is_complete)
            foundPendingTask = true

        if foundPendingTask
          @SweetAlert.confirm({
            title: "There are pending tasks in checklist. Are you sure you want to continue ?"
            confirmButtonText: 'Yes'
            cancelButtonText: 'Cancel'
            showLoaderOnConfirm: true
            focusCancel: true
            preConfirm: =>
              @actionButtons.complete = true
              @completeAction(actionObj)
              swal.close()
          })
        else
          @completeAction(actionObj)

        # @completeAction(actionObj)
      when 'review'
        params = {}

        params.entity_id = @entity_id
        params.entity_type = @entity_type
        if angular.isDefined(@workflowId)
          params.workflow_audit_id = @workflowId

        if angular.isDefined(@workflow_pending_action_id)
          params.action_id = @workflow_pending_action_id

        if angular.isDefined(@workflow_steps_actions_id)
          params.workflow_steps_actions_id = @workflow_steps_actions_id


        @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('entity_reviews').post(params)
        .then (response) =>
          @toaster.pop 'success', '', 'This workflow has been marked as reviewed'
          @completeAction(actionObj)
        .finally =>
          @actionButtons[action] = false
        , (error) =>
          @toaster.pop 'error', '', 'Something went wrong. Please try again.'
          avoid_error_logging_statuses = @BaseDataService.getAvoidErrorLoggingStatusList()
          if !(error.status in avoid_error_logging_statuses)
            @Utils.logError('Marking workflow as reviewed failed', error)

  deleteWorkflow: () =>
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('workflow_audits', @workflowId).remove().then () =>
      swal.close()
      @toaster.pop 'success', '', 'Workflow successfully has been deleted'
      @$state.go 'app.dash', {dashType: 'Activity'}
    , (error)=>
      swal.close()

  confirmDeleteWorkflow: () =>
    @SweetAlert.confirm({
      title: "Are you sure you want to delete this workflow?"
      showLoaderOnConfirm: true
      confirmButtonText: 'Yes'
      cancelButtonText: 'Cancel'
      focusCancel: true
      preConfirm: =>
        @deleteWorkflow()
    })


  disableActions: (action) ->
    disableAction = false
    # disable action for invisible and completed status. if status checks pass then we don't need to check users
    if(action.status == 'Invisible' || action.status == 'Completed')
      disableAction = true
    # check for all users, in order to make action disable
    else if (action.users.indexOf(@current_user.id) == -1) and !@isFunctionAssigned(action.functions)
      disableAction = true

    disableAction

  isFunctionAssigned: (functions) ->
    functionAssigned = false
    _(functions).each (func)=>
      if @myFunctions and func in @myFunctions
        functionAssigned = true
    functionAssigned

  openUploadDocumentModal: ->
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: =>
          editAccessGranted: true
          entityType: 'Workflow'
          entityId: @workflowId
          mode: 'update'
      success: =>
        @$scope.$broadcast 'documents:load'

  completeAction: (action) =>
    action.status = 'Completed'
    params = _(action).pick('id','name','workflow_audit_id','workflow_steps_id','workflow_steps_actions_id','user_id','order','action_id','status','created_at','updated_at','updated_by','due_at','is_owner_task')
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('workflow_steps_audits', action.id).customPUT(params).then (response) =>
      @toaster.pop 'success','','Completed action successfully'
      @getWorkflowStatus(@workflowId)
    .finally => @actionButtons.complete = false
