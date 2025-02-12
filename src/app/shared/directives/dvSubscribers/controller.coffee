class DvSubscribersController extends BaseController
  @register 'DvSubscribersController'

  @inject '$attrs', '$scope', 'Restangular', 'toaster', 'SweetAlert','BaseDataService'

  # This is a common directive for subscribe / unsubscribe logic
  # Pass entity_id and entity_type attrbutes
  # User will able to pick a team member to subscribe or unsubscribe
  # Implementation: <dv-subscribers entity-type="'Duediligence'" entity-id="vm.diligenceId"></dv-subscribers>

  initialize: ->
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.entityType, @$attrs.entityId, @$attrs.functions, @$attrs.showHeader], (values) =>
      if values[0] && values[1] && values[2]
        @entity_type = values[0]
        @entity_id = values[1]
        @functions = values[2]
        @showHeader = values[3]
        @getSubscribers()
        deregisterer()

  getSubscribers: ->
    @loadingSubscribers = true
    @BaseDataService.getFunctions().then (functions)=>
      @Restangular.all('entitysubscribers').getList(entity_id: @entity_id, entity_type: @entity_type).then (response) =>
        @subscribers = []
        _(response).each (subscriber)=>
          if subscriber.function_id
            assignedFunction = _(functions).findWhere(function_id: subscriber.function_id)
            if assignedFunction
              subscriber.fullName = assignedFunction.function_name
              @subscribers.push subscriber
          else
            @subscribers.push subscriber
        @loadingSubscribers = false

  addSubscriber: (subscriber, type) =>
    subsciberIds = _(@subscribers).pluck('user_id')
    subscriberFunctionIds = _(@subscribers).pluck('function_id')
    if subscriber.id in subsciberIds
        @toaster.pop 'warning', '' , 'same user can not be assigned again' , 2000
        return

    if subscriber.function_id in subscriberFunctionIds
      @toaster.pop 'warning', '' , 'same user role can not be assigned again' , 2000
      return

    params =
      entity_id: @entity_id
      entity_type: @entity_type

    if type == 'function'
      params.function_id = subscriber.function_id
      user = subscriber.function_name
    else
      user = subscriber.firstName + ' ' + subscriber.lastName
      params.user_id = subscriber.id
    message = "#{user} is now subscribed"

    @Restangular.all('entitysubscribers').post(params).then (response) =>
      @getSubscribers()
      @toaster.pop 'success', message

  removeSubscriber: (subscriber) =>
    params =
      entity_id: @entity_id
      entity_type: @entity_type
      user_id: subscriber.user_id
      function_id: subscriber.function_id
    @Restangular.all('entitysubscribers', subscriber.id).remove(params).then ((response) =>
      message = "#{subscriber.fullName} is unsubscribed from this project!"
      @toaster.pop 'success',  message
      subscriberIndex = _.findIndex(@subscribers, (subscriberItem) =>
        (subscriberItem.user_id and subscriberItem.user_id == subscriber.user_id) or (subscriberItem.function_id and subscriberItem.function_id == subscriber.function_id)
      )
      @subscribers.splice subscriberIndex, 1
      swal.close()
    ), (error) =>
      swal.close()

  displaySubscriberRemovalConfirmation: (subscriber) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to unsubscribe #{subscriber.fullName}?"
      confirmButtonText: 'Yes'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @removeSubscriber(subscriber)
    })
