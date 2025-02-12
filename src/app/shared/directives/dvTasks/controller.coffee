class DvTasksController extends BaseController
  @register 'DvTasksController'

  @inject 'BaseDataService', '$attrs', '$scope', 'Restangular', 'ModalFactory', 'toaster', 'SweetAlert', '$timeout','Utils','RestangularHeaderService'

  initialize: ->
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.entityType, @$attrs.entityId, @$attrs.pageUrl], (values) =>
      if values[0] && values[1]
        @entity_type = values[0]
        @entity_id = values[1]
        @pageUrl = values[2]
        if (@$attrs.dateFilter and @customDateFilter) or not @$attrs.dateFilter
          @getTasks()
        deregisterer()

    @$scope.$parent.$watch @$attrs.refreshTasks, (newValue, oldValue) =>
      if newValue isnt oldValue
        @getTasks()

    @$scope.$parent.$watch @$attrs.dateFilter, (newValue) =>
      if newValue
        @customDateFilter = newValue
        @getTasks() if @entity_id and @entity_type

  getTasks: ->
    @loadingTasks = true

    params = {
      entity_type: @entity_type
      entity_id: @entity_id
      openToDos: true
    }
    if @customDateFilter
      params.start_date = @customDateFilter.startDate
      params.end_date = @customDateFilter.endDate

    @RestangularHeaderService.RestangularWithHeader(@pageUrl).all('todos').getList(params).then (response) =>
      @tasks = response
      @loadingTasks = false

  addTask: ->
    @ModalFactory.invokeModal 'manage_task',
      resolve:
        task: =>
          entity_type: @entity_type
          entity_id: @entity_id
          pageUrl: @pageUrl
      success: (task) =>
        @tasks.push task

  editTask: (task, idx) =>
    task.pageUrl = @pageUrl
    @ModalFactory.invokeModal 'manage_task',
      resolve:
        task: task
      success: (response) =>
        @tasks[idx] = response

  markTaskAsComplete: (task) =>
    task.is_complete = true
    task.completed_at = new Date()
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('todos', task.id).customPUT(task).then (response) =>
      message = 'The task has been marked as completed!'
      @toaster.pop 'success', '', message
      task = response

      @$timeout =>
        taskIndex = _.findIndex(@tasks, (taskItem) ->
          taskItem.id == task.id
        )
        @tasks.splice taskIndex, 1
      , 2000


  deleteTask: (task) =>
    @RestangularHeaderService.RestangularWithHeader(@pageUrl).one('todos', task.id).remove().then (response) =>
      message = 'The task has been marked as deleted!'
      @toaster.pop 'success', '', message
      taskIndex = _.findIndex(@tasks, (taskItem) ->
        taskItem.id == task.id
      )
      @tasks.splice taskIndex, 1
      swal.close()

  confirmDeleteTask: (task) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this task?"
      confirmButtonText: 'Yes'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @deleteTask(task)
    })
