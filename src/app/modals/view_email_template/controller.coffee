class ViewEmailTemplateController extends ModalController

  @register 'ViewEmailTemplateController'

  @inject '$uibModalInstance', 'id', 'Restangular'

  initialize: ->

    if @id?
      @Restangular.one('EmailTemplateMessages', @id).customGET().then (response) =>
        @name = response.name
        @email_text = response.content
    else
      @email_text = 'Oh snap! No Email Template found!'
