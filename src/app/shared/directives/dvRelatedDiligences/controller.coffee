class DvRelatedDiligenceController extends BaseController
  @register 'DvRelatedDiligenceController'

  @inject '$attrs', '$scope', 'Restangular', 'ModalFactory','Utils', 'RestangularHeaderService', 'SweetAlert', '$timeout', 'toaster', '$state'

  # This is generic a directive for showing related diligences a given diligence
  # Pass diliegnceid as attribute
  # User will be able to view active and completed diligences, and navigate to detail
  # Implementation: <dv-related-diligences diligence-id="vm.diligenceId"></dv-related-diligences>

  initialize: ->
    @selectedDiligenceRecords = []
    @is_investor = @Utils.isInvestor()
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.relatedDiligences,@$attrs.isModal], (values) =>
      if values[0] 
        @diligences = values[0]
        @isModal = values[1]
        deregisterer()
  
  diligenceSelectionChanged: (diligence)->
    if diligence.isSelected
      @selectedDiligenceRecords.push diligence
    else
      for project,i in @selectedDiligenceRecords
        if project.id == diligence.id 
          @selectedDiligenceRecords.splice(i,1)

  confirmBulkAction: (action) ->
    custom_class = 'danger'
    confirm_button_text = 'Withdraw'
    @SweetAlert.confirm({
        title: "Are you sure you want to #{action} the selected  projects?"
        customClass: custom_class
        confirmButtonText: confirm_button_text
        showLoaderOnConfirm: true
        preConfirm: =>
          @performBulkActions(action)
    })

  performBulkActions: (action) =>
    request_payload = {}

    withdrawn_diligences = []

    _(@selectedDiligenceRecords).each (item) =>
      if (item.status == 'Sent' || item.status == 'Started')
        withdrawn_diligences.push(item.id)
    if withdrawn_diligences.length
      request_payload.entity_ids = withdrawn_diligences
      request_payload.status = 'Withdrawn'
      if withdrawn_diligences.length == @selectedDiligenceRecords.length
        if withdrawn_diligences.length == 1
          toaster_message = "Selected " + withdrawn_diligences.length + " project is  withdrawn"
        else
          toaster_message = "Selected " + withdrawn_diligences.length + " projects are withdrawn"
      else
        toaster_message = withdrawn_diligences.length + " out of " + @selectedDiligenceRecords.length + " project(s) withdrawn"
      
      @RestangularHeaderService.RestangularWithHeader('', request_payload.status).all('v2/diligences/bulk_actions').customPUT(request_payload).then (response) =>
        @toaster.pop 'success', '', toaster_message
        # @$state.reload()
        @$scope.refreshLinkedProjects()
    else
      @$timeout =>
        @toaster.pop 'error', '', 'No projects available for submission in the selection'
        @show_bulk_actions = false
        swal.close()
    


  
