class WpUnmarkedItemsController extends ModalController

  @register 'WpUnmarkedItemsController'

  @inject '$uibModalInstance', 'items', 'Restangular', 'toaster'

  cancel: ->
    @$uibModalInstance.dismiss 'cancel'
