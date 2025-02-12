class ViewResponseController extends ModalController

  @register 'ViewResponseController'

  @inject '$uibModalInstance', 'response', 'Restangular', 'toaster', 'selected_tab'

  initialize: ->

    if @response
      @response_text = @response.response_text

  copyResponse: =>
    @toaster.pop 'success', '', 'Response copied to clipboard', 5000

  cancel: ->
    @$uibModalInstance.dismiss 'cancel'
