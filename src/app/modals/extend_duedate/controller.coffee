class DueDateController extends ModalController
  @register 'DueDateController'

  @inject 'diligence', '$state', 'toaster', 'DueDiligenceDataservice', 'Utils','$rootScope'

  initialize: ->
    @dueDatePickerFormat = 'dd-MMMM-yyyy'
    @diligenceId = @diligence.id
    @minDate = new Date()

  extendDueDate: ->
    if !@extendDueDateForm.$valid
      return
    @extending = true
    dueDateParams = {
      dueDiligence_id: @diligenceId,
      requested_at: moment(@dueDateExtensionParams.extendedDueDate).format('M-D-YYYY'),
      reason: @dueDateExtensionParams.reason,
    }
    dueDateParams.status = if @diligence.is_internal then 'ExtensionApproved' else 'ExtensionRequested'
    @DueDiligenceDataservice.extendDueDate(dueDateParams).then ((response) =>
      @$uibModalInstance.dismiss response
      if @diligence.is_internal
        @daysDue = moment(response.requested_at).diff(moment().startOf('day'), 'days')
        @toaster.pop 'success', '', 'Updated due date'
        @extending = false
      else
        @diligence.status = 'ExtensionRequested'
        @toaster.pop 'success', '', 'Requested due date extension'
        @extending = false  
      @$rootScope.$emit 'update:audit'
      @$rootScope.$emit 'update:duedate'
    ), (error) =>
      @extending = false

  
  