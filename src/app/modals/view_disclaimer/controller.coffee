class ViewDisclaimerController extends ModalController

  @register 'ViewDisclaimerController'

  @inject '$uibModalInstance', 'id', 'Restangular'

  initialize: ->

    if @id?
      @Restangular.one('disclaimers', @id).customGET().then (response) =>
        @disclaimer_text = response.text
    else
      @disclaimer_text = 'Oh snap! No disclaimer found!'