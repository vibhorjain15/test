class DvProjectInfoController extends BaseController
  @register 'DvProjectInfoController'

  @inject '$attrs', '$scope', 'Restangular', 'Utils','$rootScope', 'SweetAlert', 'DueDiligenceDataservice', 'toaster'

  # This is a directive for diligence project meta data
  # Pass diligence object attribute
  # Implementation: <dv-project-info diligence="vm.diligence"></dv-project-info>

  initialize: ->
    @$rootScope.$on 'update:duedate', (event) =>
      @getDueDate()

    deregisterer = @$scope.$parent.$watchGroup [@$attrs.diligence], (values) =>
      if values[0]
        @diligence = values[0]
        @is_due =  @diligence.status in ['Started', 'Followup', 'ExtensionRequested','Completed', 'Approved']

        if @diligence.completed_at
          @completedDueDiff = moment(@diligence.due_at).diff(moment(@diligence.completed_at),'days')
        else
          @daysDue = moment(@diligence.due_at).diff(moment().startOf('day'), 'days')
        @is_investor = @Utils.isInvestor()
        @is_freeSubscription = @Utils.isFreeSubscription()
        @entity_type = @Utils.getEntityType()

        @getRecipients()

        deregisterer()

  getRecipients: ->
    @remaining = 0
    @Restangular.all('entitysubscribers').getList(entity_id: @diligence.id, entity_type: 'Duediligence', firm_id: @diligence.managerfirm_id).then (response) =>
      @sent_total = response.length
      @sentToContactsList = response
      if @sent_total
        if @sent_total > 5
          @remaining = @sent_total - 5

        @sentToTooltip = "Sent to #{@sent_total} contacts"
        @recipients = response.slice(0, 5)

  getDueDate: ->
    @Restangular.one('diligences',@diligence.id).get().then (response) =>
      @diligence = response
      @is_due =  @diligence.status in ['Started', 'Followup', 'ExtensionRequested', 'Completed', 'Approved']
      if @diligence.completed_at
        @completedDueDiff = moment(@diligence.due_at).diff(moment(@diligence.completed_at),'days')
      else
        @daysDue = moment(@diligence.due_at).diff(moment().startOf('day'), 'days')

  addSubscriber:(subscriber) =>
    @saving_contact = true
    subsciberIds = _(@sentToContactsList).pluck('user_id')
    if subscriber.id in subsciberIds
        @toaster.pop 'warning', '' , 'same user can not be assigned again' , 2000
        return
    user = subscriber.fullName
    message = "#{user} is now subscribed"
    if(!subscriber.firmId)
      subscriber.firmId = subscriber.firmInfo.id
    @Restangular.all('entitysubscribers').post(entity_id: @diligence.id, entity_type: 'Duediligence', user_id: subscriber.id, firm_id: subscriber.firmId).then (response) =>
      @getRecipients()
      @toaster.pop 'success', message
      @saving_contact = false

  displaySubscriberRemovalConfirmation: (subscriber) ->
    @SweetAlert.confirm({
      title: "Are you sure you want to unsubscribe #{subscriber.fullName}?"
      confirmButtonText: 'Yes'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @removeSubscriber(subscriber)
    })

  removeSubscriber:(subscriber) =>
    @saving_contact = true
    @Restangular.all('entitysubscribers', subscriber.id).remove(entity_id: @diligence.id, entity_type: 'Duediligence', user_id: subscriber.user_id,tofirm_id: @diligence.managerfirm_id).then ((response) =>
      message = "#{subscriber.fullName} is unsubscribed from this project!"
      @toaster.pop 'success',  message
      @getRecipients()
      @saving_contact = false
      subscriberIndex = _.findIndex(@sentToContactsList, (subscriberItem) ->
        subscriberItem.user_id == subscriber.user_id
      )
      @sentToContactsList.splice subscriberIndex, 1
      swal.close()
    ), (error) =>
      swal.close()
