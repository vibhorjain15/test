class ViewApproverNotesController extends ModalController

  @register 'ViewApproverNotesController'

  @inject '$uibModalInstance', 'approver_notes', 'Restangular', '$timeout'

  initialize: ->
