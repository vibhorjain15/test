class ViewUnmarkedItemsController extends ModalController

  @register 'ViewUnmarkedItemsController'

  @inject '$uibModalInstance', 'items', 'Restangular', 'toaster'

  cancel: ->
    @$uibModalInstance.dismiss 'cancel'
