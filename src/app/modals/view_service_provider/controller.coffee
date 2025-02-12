class ViewServiceProviderController extends ModalController

  @register 'ViewServiceProviderController'

  @inject '$uibModalInstance', 'Restangular'

  initialize: ->
    @sp_data = {}

    @Restangular.all('saml/provider').doGET().then (response) =>
      @sp_data = response
