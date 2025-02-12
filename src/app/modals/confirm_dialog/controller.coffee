class ConfirmDialogController extends ModalController

  @register 'ConfirmDialogController'

  @inject 'Restangular'

  initialize: ->
    @params = {}

  onSave: ->
    @close(@params.value)
