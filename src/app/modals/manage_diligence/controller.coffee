class ManageDiligenceController extends ModalController
  @register 'ManageDiligenceController'

  @inject '$scope','Restangular','$uibModalInstance','FirmDataservice', 'diligence', 'toaster', 'Utils'

  initialize: ->
    @maxAsOfDate = @Utils.getMaxAsOfDateDiligence()
    @minDate = new Date()
    @new_contacts = []

    if @Utils.isInvestor()
      @types = [{id: 1241, type: 'Standard'},{id: -1, type:'Profile'}]
    else
      @types = [{id: 1241, type: 'Standard'},{id: -1, type:'Pre-approved'}]

    if (@diligence)
      @manage_diligence = {
        name: @diligence.name
        due_at: moment(@diligence.due_at).toDate()
        as_of_date: moment(@diligence.as_of_date).toDate()
        type: @diligence.type
      }
      @diligenceId = @diligence.id

  validateDueDate: =>
    @manage_diligence_form['due-date'].$setValidity('validDueDate',moment(@manage_diligence.due_at).isSameOrAfter(@manage_diligence.as_of_date, 'day'))

  submit: =>
    if @manage_diligence_form.$valid
      @saving_diligence = true
    else
      return
    temp_diligence = angular.copy @diligence
    temp_diligence.name = @manage_diligence.name
    temp_diligence.due_at = moment(@manage_diligence.due_at).format('YYYY-MM-DD')
    temp_diligence.as_of_date = moment(@manage_diligence.as_of_date).format('YYYY-MM-DD')
    temp_diligence.diligence_type = @manage_diligence.type
    @Restangular.one('diligences',@diligenceId).all('update_data').customPUT(temp_diligence).then (response)=>
      message = 'Diligence project updated'
      @toaster.pop 'success', message
      @close(response)
      @saving_diligence = false
    ,(error)=>
      @saving_diligence = false

  cancel: ->
    @$uibModalInstance.dismiss 'cancel'

