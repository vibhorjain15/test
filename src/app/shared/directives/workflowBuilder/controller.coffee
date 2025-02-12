class WorkflowBuilderController extends BaseController
  @register 'WorkflowBuilderController'
  @inject '$scope', '$attrs', 'Restangular', 'BaseDataService', 'toaster', '$state', '$q','DueDiligenceDataservice','ModalFactory', '$window', '$timeout','SweetAlert','Utils'

  initialize: ->
    @readonly_mode = angular.isDefined(@$attrs.readonlyMode)
    @edit_mode = angular.isDefined(@$attrs.editMode)
    @workflow_steps_loading = false
    @assignedUsers = []
    @current_user = @Utils.getCurrentUser()

    @workflowId = @$scope.$parent.$eval @$attrs.id
    @getWorkflow(@workflowId)

    @getActionsTypes()
    @getTeamMembers()
    @getDurationTypes()
    @getMyFunctions()

    @$scope.sortableOptions =
      axis: 'y'
      handle: '.sort-handle'
      cursor: 'move'
      placeholder: 'sortable-placeholder'

    @reorder_resource = @Restangular.one('workflows', @workflowId)

  addNewTodo: (event,action,newTodo)=>
    if newTodo and newTodo.length > 1
      if (event.which == 13 or event.keyCode == 13)
        todo = {
          text: newTodo
          is_complete: false
          is_active: true
          entity_id: action.id
          entity_type: "Workflow_action"
        }
        action.checklist.push todo
        action.new_todo = ""
        @actionChanged(action,'checklist')

  getAllWorkFlows: () =>
    @Restangular.all('workflows').customGET('', null).then (response) =>
      @all_workflows_list = response.results
      if @readonly_mode or @edit_mode
        workflowIndex = _(@all_workflows_list).findIndex (workflow_item) =>
          workflow_item.id == @workflow.id
        @all_workflows_list.splice(workflowIndex, 1)

  getActionsTypes: () =>
    @Restangular.all('workflow_actions').getList().then (response) =>
      @action_types = response

  getTeamMembers: () =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = _(teamMembers).map (teamMember) ->
        teamMember.fullname = _([teamMember.firstName, teamMember.lastName]).compact().join(' ')
        teamMember

  getMyFunctions: =>
    @Restangular.all('function_assignments').getList({entity_id:@current_user.firmInfo.id,entity_type:'Firm'}).then (response)=>
      @functions = response

  getWorkflow: (id) =>
    @Restangular.one('workflows', id).get().then (response) =>
      @workflow = response
      @getWorkflowSteps(id)

  getWorkflowSteps: (workflowId) =>
    @loading_workflow_steps = true
    @Restangular.one('workflows',workflowId).customGET('workflow_steps').then (response) =>
      @workflow_steps = response
      @loading_workflow_steps = false
      @getWorkflowStepActions(@workflow_steps[0]) if @workflow_steps.length > 0

  getDurationTypes: =>
    @Restangular.all('duration_types').getList().then (response) =>
      @duration_types = response
      for duration_type in @duration_types
        duration_type['show_value'] = @Utils.standardPluralize(duration_type.value)

  getWorkflowStepActions: (step)=>
    @loading_workflow_actions = true
    @selectedStep = step
    @Restangular.one('workflows', @workflowId).one('workflow_steps',step.id).customGET('workflow_steps_actions').then (response) =>
      @workflowactions = response
      @loading_workflow_actions = false
      _(@workflowactions).each ((action,index)=>
        if index == 0
          action.isOpen = true
        @getAssignedUserList(action)
        @convertHoursToDays(action)
        action.unsaved = {}
        action.previous = angular.copy action
      )

  getWorkflowActions: (step) =>
    if @selectedStep != step
      unsavedActions = @getUnsavedActions()
      if unsavedActions.length > 0
        @SweetAlert.confirm({
          title: "Are you sure you want to continue?"
          text: 'You have '+unsavedActions.length+' unsaved change. All your changes will be lost'
          confirmButtonText: 'Save and exit'
          cancelButtonText: 'Do not Save'
          customClass: 'danger-on-cancel'
          showCloseButton: true
          reverseButtons: false
          showLoaderOnConfirm: true
          preConfirm: =>
            promises = []
            _(unsavedActions).each ((action,index)=>
              promise = @getWorkflowSavePromises(action,action.formIndex)
              if promise
                promises.push promise
            )
            if promises.length == unsavedActions.length
              @$q.all(promises).then =>
                @toaster.pop 'success','','Changes saved successfully'
                @getWorkflowStepActions(step)
              .finally => swal.close()
            else
              @toaster.pop 'error','','Some of your changes failed validation'
              swal.close()
        }).then (isConfirm) =>
          if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
            @getWorkflowStepActions(step)
      else
        @getWorkflowStepActions(step)

  getWorkflowSavePromises: (action,index)=>
    return if !action.formArea || action.formArea.$invalid

    @setAssignedUsers(action) if !action.is_owner_task
    @resetAssignedUsers(action) if action.is_owner_task
    @convertDaysToHours(action)
    @removeRouteChangeNagger()

    if action.id
      param = _(action).pick('id','duration_type','duration_hours','action_id','users','workflow_audit_id','workflow_steps_actions_id','workflow_steps_id','checklist','is_owner_task')
      return @Restangular.one('workflows',@workflowId).one('workflow_steps',@selectedStep.id).one('workflow_steps_actions',action.id).customPUT(param)
    else
      param = _(action).pick('action_id','duration_type','duration_hours','users','workflow_steps_id','checklist','is_owner_task')
      return @Restangular.one('workflows',@workflowId).one('workflow_steps',@selectedStep.id).all('workflow_steps_actions').customPOST(param)

  getUnsavedActions: =>
    unsavedActions = []
    _(@workflowactions).each ((action,index)=>
      if action.has_unsaved_changes
        action.formIndex = index
        unsavedActions.push action
    )
    unsavedActions

  convertHoursToDays:(action)=>
    action.duration_days = parseInt(action.duration_hours / 24)

  convertDaysToHours:(action)=>
    action.duration_hours = action.duration_days * 24

  getAssignedUserList: (action)=>
    action.assigned_users_id = []
    _(action.users).each (user)=>
      if user.user_id
        teammember = _(@teamMembers).findWhere(id: user.user_id)
        if teammember
          teammember.type = 'user'
          action.assigned_users_id.push teammember
      else if user.function_id
        func = _(@functions).findWhere(function_id: user.function_id)
        if func
          action.assigned_users_id.push
            id: func.function_id
            fullName: func.function_name
            type: 'function'

  manageWorkflowStep: (step,index)=>
    if step
      edit_mode = true
      stepChanges = angular.copy step
    else
      edit_mode = false
      stepChanges = {
        name: ""
        description: ""
        workflow_id: @workflowId
      }
    @ModalFactory.invokeModal 'manage_workflow_step',
      resolve:
        workflowId: => @workflowId
        step: => stepChanges
        edit_mode: => edit_mode
        allSteps: => @workflow_steps
      success: (response) =>
        if edit_mode
          @workflow_steps[index] = response
          @getWorkflowActions(@workflow_steps[index])
        else
          @workflow_steps =  @workflow_steps.concat response
          @getWorkflowActions(response[0]) if response.length > 0

  confirmRemoveStep: (step)=>
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this step?"
      focusCancel: true
      showLoaderOnConfirm: true
      preConfirm: =>
        @removeStep(step)
    })

  removeStep: (step)=>
    @Restangular.one('workflows',@workflowId).one('workflow_steps',step.id).remove().then (response) =>
      @toaster.pop 'success','','Workflow Step deleted successfully'
      index = @workflow_steps.indexOf step
      @workflow_steps.splice index,1
      
      if step.id == @selectedStep.id
        @removeRouteChangeNagger()
        @workflowactions = null
      if @workflow_steps.length > 0
        @getWorkflowActions(@workflow_steps[0])

  removeRouteChangeNagger: ->
    # This function is called when chanegs are saved

    # remove the beforeunload listner
    @$window.onbeforeunload = null
    # if check is there is a nagger (route change listner)
    if @route_change_nagger?
      @route_change_nagger() #deregisters the listener
      @route_change_nagger = null

  addRouteChangeNagger: ->
    return if @route_change_nagger?

    # get unsaved changes
    unsavedActions = @getUnsavedActions()
    if unsavedActions.length > 0
      leaving_state = false
      SweetAlert = @SweetAlert
      $state = @$state
      getTitle = =>
        "You have unsaved change"

      # beforeunload event is fired when the window, the document and its resources are about to be unloaded.
      # The document is still visible and the event is still cancelable at this point
      @$window.onbeforeunload = ->
        "#{getTitle()}. All your unsaved changes will be lost"

      # here we are listen to route/state change event. Before state is changed this event is fired
      @route_change_nagger = @$scope.$on '$stateChangeStart', (event, toState, toParams) =>
        return if leaving_state
        event.preventDefault()
        @SweetAlert.confirm({
          title: "Are you sure you want to continue?"
          text: 'You have '+unsavedActions.length+' unsaved change. All your changes will be lost'
          confirmButtonText: 'Save and exit'
          cancelButtonText: 'Do not Save'
          showCloseButton: true
          reverseButtons: false
          customClass: 'danger-on-cancel'
          showLoaderOnConfirm: true
          preConfirm: =>
            promises = []
            _(unsavedActions).each ((action,index)=>
              promise = @getWorkflowSavePromises(action,action.formIndex)
              if promise
                promises.push promise
            )
            if promises.length == unsavedActions.length
              @$q.all(promises).then =>
                swal.close()
                @toaster.pop 'success','','Changes saved successfully'
                leaving_state = true
                @$timeout =>
                  # pass state name with params, if we don't pass to params it will create problems
                  @$state.go toState.name , toParams
            else
              swal.close()
              leaving_state = true
              @toaster.pop 'error','','Some of your changes failed validation'
              @$timeout =>
                @$state.go toState.name, toParams
        }).then (isConfirm) =>
          if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
            swal.close()
            leaving_state = true
            @$timeout =>
              @$state.go toState.name, toParams

  saveWorkflowAction: (action,index)=>
    action.formArea.$setSubmitted true
    promise = @getWorkflowSavePromises(action,index)
    return if promise == undefined
    @saving_action = true

    if action.id
      promise.then (response) =>
        @workflowactions[index] = response
        @toaster.pop 'success','','Action updated successfully'
        @getAssignedUserList(@workflowactions[index])
        @convertHoursToDays(@workflowactions[index])
        @workflowactions[index].unsaved = {}
        @workflowactions[index].previous = angular.copy @workflowactions[index]
        @workflowactions[index].isOpen = true
      .finally => @saving_action = false
    else
      promise.then (response) =>
        @workflowactions[index] = response
        @toaster.pop 'success','','Action added successfully'
        @getAssignedUserList(@workflowactions[index])
        @convertHoursToDays(@workflowactions[index])
        @workflowactions[index].unsaved = {}
        @workflowactions[index].previous = angular.copy @workflowactions[index]
        @workflowactions[index].isOpen = true
      .finally => @saving_action = false

  resetAssignedUsers: (action)=>
    if action.id
      _(action.users).each ((user)=>
        user.is_active = false
      )
    else
      action.users = []

  setAssignedUsers: (action)=>
    assignedUsers = angular.copy action.assigned_users_id
    _(action.users).each ((user)=>
      userIndex = _(assignedUsers).findIndex (assignedUser)=>
        user.user_id == assignedUser.id or user.function_id == assignedUser.id
      if userIndex > -1
        assignedUsers.splice(userIndex,1)
      else
        user.is_active = false
    )

    _(assignedUsers).each ((user)=>
      newUser = {
        user_id: user.id if user.type == 'user'
        function_id: user.id if user.type == 'function'
        is_active:true
      }
      newUser.workflow_steps_actions_id = action.id if action.id
      action.users.push newUser
    )

  confirmRemoveAction:(action)=>
    title = 'Are you sure you want to delete this action?'
    if @workflowactions.length > 1
      @SweetAlert.confirm({
        title: title
        text:''
        confirmButtonText: 'Okay'
        focusCancel: true
        showLoaderOnConfirm: true
        preConfirm: =>
          @deleteStepAction(action)
      })

  deleteStepAction: (action,index)=>
    if action.id
      @Restangular.one('workflows', @workflowId).one('workflow_steps',@selectedStep.id).one('workflow_steps_actions',action.id).remove().then =>
        swal.close()
        @toaster.pop 'success', '', 'Workflow deleted successfully'
        @workflowactions.splice index,1
    else
      swal.close()
      @workflowactions.splice index,1

  removeTask:(action,task,index)=>
    if task.id
      task.is_active = false
    else
      action.checklist.splice index,1

  addNewAction: () =>
    newAction = {
      action_id: null     #if we initialse to "" then it creates problem with the chosen directive.
      checklist: []
      duration_days: 1
      duration_hours: 24
      duration_type: "Day"
      is_owner_task: false
      users: []
      workflow_steps_id: @selectedStep.id
      isOpen: true
      has_unsaved_changes: true
      unsaved : {}
    }
    @getAssignedUserList(newAction)
    @workflowactions.push newAction

  cancelUpdate: (action,index)=>
    if action.has_unsaved_changes
      @SweetAlert.confirm({
        title: "Are you sure you want to continue?"
        text: 'You have 1 unsaved change. All your changes will be lost'
        showCloseButton: true
        reverseButtons: false
        cancelButtonText: 'Do Not Save'
        confirmButtonText: 'Save & Exit'
        customClass: 'danger-on-cancel'
        showLoaderOnConfirm: true
        preConfirm: =>
          @saveWorkflowAction(action,index)
          swal.close()
      }).then (isConfirm) =>
        if isConfirm.dismiss and isConfirm.dismiss == 'cancel'
          @$timeout =>
            @resetAction(action,index)
    else
      @resetAction(action,index)

  actionChanged:(action,attribute)=>
    return if action.id == undefined or action.id == null

    if attribute == 'assigned_users_id'
      assignedUserIds = _(action.assigned_users_id).pluck 'id'
      previousAssignedUserIds = _(action.previous.assigned_users_id).pluck 'id'
      if @compareAssignedUsers(previousAssignedUserIds,assignedUserIds)
        action.unsaved[attribute] = true
      else
        delete action.unsaved[attribute]
    else if attribute == 'checklist'
      if @compareCheckList(action.previous.checklist,action.checklist)
        action.unsaved[attribute] = true
      else
        action.has_unsaved_changes = false
    else if action[attribute] != action.previous[attribute]
      action.unsaved[attribute] = true
    else
      delete action.unsaved[attribute]
    action.has_unsaved_changes = @checkActionUnsavedChanges(action)

  checkActionUnsavedChanges:(action)=>
    unsavedAttributes = Object.keys(action.unsaved)
    if unsavedAttributes.length > 0
      has_unsaved_changes = _(unsavedAttributes).reduce((has_unsaved,attribute)=>
        action.unsaved[attribute] or has_unsaved
      ,false)
    else
      false

  compareAssignedUsers: (previous,current)=>
    current = [] if current == undefined
    if previous.length == current.length and _(current).difference(previous).length > 0
      return true
    if previous.length != current.length
      return true
    return false

  compareCheckList: (previous,current)=>
    if previous.length != current.length
      return true

    status = false
    if previous.length == current.length
      _(current).each ((task)=>
        if task.id
          oldTask = _(previous).find ((old)=>
            old.id == task.id
          )
          if oldTask.text != task.text or oldTask.is_active != task.is_active
            status = true
        else
          status = true
      )
    return status

  resetAction: (action,index)=>
    if action.id
      @workflowactions[index] = angular.copy @workflowactions[index].previous
      @getAssignedUserList(@workflowactions[index])
      @convertHoursToDays(@workflowactions[index])
      @workflowactions[index].previous = angular.copy @workflowactions[index]
      @workflowactions[index].isOpen = false
    else
      @workflowactions.splice index,1
