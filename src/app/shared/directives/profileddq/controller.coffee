class ProfileDDQController extends BaseController
  @register 'ProfileDDQController'

  @inject 'SweetAlert', 'toaster', '$scope', '$attrs',
          'DueDiligenceDataservice', 'Utils', '$state'

  initialize: ->
    @entity_type = @Utils.getEntityType()
    empty_state_message = 'No DDQ available for this '+ @entity_type

    @is_admin = @Utils.isAdmin()
    @is_manager = @Utils.isManager()
    @isFreeSubscription = @Utils.isFreeSubscription()

    if angular.isDefined(@$attrs.readonly)
      @readonly = true
    else
      @readonly = !(@is_manager and @is_admin)

    @loadDdqs()
    @empty_state_message = @$scope.$parent.$eval(@$attrs.emptyStateMessage) || empty_state_message

  loadDdqs: ->
    deregisterer = @$scope.$parent.$watch @$attrs.ddqs, (value) =>
      if value?
        @ddqs = value
        deregisterer()

  # retireDDQ: (ddq) ->
  #   @SweetAlert.swal {
  #     title: 'Are you sure you want to retire this DDQ ?'
  #     text: 'You will not be able to recover this'
  #     type: 'warning'
  #     showCancelButton: true
  #     confirmButtonText: 'Yes, retire it!'
  #     closeOnConfirm: false
  #     showLoaderOnConfirm: true
  #     customClass: 'danger'
  #   }, (isConfirm) =>
  #     if isConfirm
  #       @DueDiligenceDataservice.setStatus(ddq.id, 'Retired').then (response) =>
  #         @toaster.pop 'success', '', "DDQ retired successfully"

  #         #removes the ddq from the local list, which in turn removes from UI
  #         @ddqs.splice(@ddqs.indexOf(ddq), 1)
  #         swal.close()
