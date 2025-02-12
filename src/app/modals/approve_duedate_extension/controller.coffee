class DueDateApprovalController extends ModalController
  @register 'DueDateApprovalController'

  @inject 'diligence', '$state', 'toaster', 'DueDiligenceDataservice','$rootScope'

  initialize: ->
    @dueDatePickerFormat = 'dd-MMMM-yyyy'
    @diligenceId = @diligence.id
    @getExtendedDueDate()

  showExtendDueDatePanel: ->
    @isExtendDueDatePanelOpen = true
    @isRejectDueDatePanelOpen = false
    @newDueDate = null

  showRejectDueDatePanel: ->
    @isRejectDueDatePanelOpen = true
    @isExtendDueDatePanelOpen = false
    @dueDateRejectionReason = ''

  getExtendedDueDate: ->
    @DueDiligenceDataservice.getExtendedDueDate(@diligenceId).then (response) =>
      if response.results.length
        @dueDateDetails = response.results[0]
        @dueDateExtensionId = response.results[0].id

  acceptExtendedDueDate: ->
    @isExtendDueDatePanelOpen = false
    @isRejectDueDatePanelOpen = false
    @extending = true
    @toaster.pop 'info', '', 'Accepting extension of due date...'
    @DueDiligenceDataservice.updateDueDate(@dueDateExtensionId, {status: 'ExtensionApproved'}).then () =>
      @DueDiligenceDataservice.getDiligence(@diligenceId).then (response) =>
        @$uibModalInstance.dismiss response
        @toaster.pop 'success', '', 'Accepted extension of due date'
        @diligence.status = response.status
        @$rootScope.$emit 'update:duedate'
        @$rootScope.$emit 'update:audit'

  rejectDueDateExtension: ->
    if !@rejectDueDateExtensionForm.$valid
      return
    @rejecting = true
    @toaster.pop 'info', '', 'Rejecting extension of due date...'
    @DueDiligenceDataservice.updateDueDate(@dueDateExtensionId, {status: 'ExtensionDeclined', action_reason: @dueDateRejectionReason}).then () =>
      @DueDiligenceDataservice.getDiligence(@diligenceId).then (response) =>
        @rejecting = false
        @$uibModalInstance.dismiss response
        @diligence.status = response.status
        @toaster.pop 'success', '', 'Rejected extension of due date'
        @$rootScope.$emit 'update:audit'

  extendDueDateExtension: =>
    if !@modifyDueDateExtensionForm.$valid      
      return

    @extending = true
    @toaster.pop 'info', '', 'Providing new extended due date...'
    @DueDiligenceDataservice.updateDueDate(@dueDateExtensionId, {status: 'ExtensionDeclined', action_reason: 'Investor-Rejected'}).then () =>
      @DueDiligenceDataservice.extendDueDate({
        dueDiligence_id: @diligenceId,
        requested_at: moment(@newDueDate).format('M-D-YYYY'),
        reason: null,
        status: 'ExtensionApproved'
      }).then () =>
        @DueDiligenceDataservice.getDiligence(@diligenceId).then (response) =>
          @$uibModalInstance.dismiss response
          @toaster.pop 'success', '', 'Provided new due date'
          @diligence.status = response.status
          @$rootScope.$emit 'update:duedate'
          @$rootScope.$emit 'update:audit'
