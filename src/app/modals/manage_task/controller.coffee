class ManageTaskController extends ModalController

  @register 'ManageTaskController'

  @inject '$uibModalInstance', 'toaster', 'Restangular','BaseDataService', 'task', 'Utils', 'RestangularHeaderService'

  initialize: ->
    @edit_mode = false
    @minDate = new Date()
    @getTypes().then (response) =>
      @task_types = response

      if (@task.id)
        @params = angular.copy(@task)
        if @params.assigned_to_function_id
          @params.assigned_to_user = 
            id: @params.assigned_to_function_id
            fullName: @params.assigned_to_function_name
            type:' function'
        else if @params.assigned_to
          @params.assigned_to_user = 
            id: @params.assigned_to
            fullName: @params.assigned_to_name
            type: 'user'
        if @params.due_date?
          @params.due_date = new Date(@params.due_date)
        @edit_mode = true
      else
        @params = {}
        @params.due_date =  moment().add(7, 'days').toDate()
        @params.assigned_to_user = @Utils.getCurrentUser()
        @params.type = @task_types[6].id #Defaulting to update
        @params.entity_id = @task.entity_id
        @params.entity_type = @task.entity_type

    @getFrequencies()
    @getTeamMembers()
    @getMyFunctions() if @task.entity_type not in ['User','Attachment']

  getTypes: () =>
    @RestangularHeaderService.RestangularWithHeader(@task.pageUrl).all('task_types').getList()

  getFrequencies: () =>
    @RestangularHeaderService.RestangularWithHeader(@task.pageUrl).all('frequency').getList().then (response) =>
      @frequencies = response

  getTeamMembers: () =>
    @BaseDataService.getTeamMembers().then (teamMembers) =>
      @teamMembers = teamMembers

  getMyFunctions: =>
    @Restangular.all('function_assignments').getList({entity_id:@task.entity_id,entity_type:@task.entity_type}).then (response)=>
      @functions = response

  save: ->
    if !@params.assigned_to_user
      @toaster.pop 'error','','Please assign to a user role/team member'
      return

    if @task_form.$valid
      @saving = true
      if @params.assigned_to_user.type == 'function'
        @params.assigned_to_function_id = @params.assigned_to_user.id
        @params.assigned_to = null
      else
        @params.assigned_to = @params.assigned_to_user.id
        @params.assigned_to_function_id = null
      if @edit_mode
        @RestangularHeaderService.RestangularWithHeader(@task.pageUrl).one('todos',@params.id).customPUT(@params)
          .then (response) =>
            @toaster.pop 'success', '', 'Task successfully updated'
            @close(response)
          .finally => @saving = false

      else
        @RestangularHeaderService.RestangularWithHeader(@task.pageUrl).all('todos').post(@params)
          .then (response) =>
            @toaster.pop 'success', '', 'Task successfully added'
            @close(response)
          .finally => @saving = false
