class ViewEntitiesController extends ModalController

    @register 'ViewEntitiesController'

    @inject '$uibModalInstance', 'entities', 'Restangular', 'toaster', '$timeout', '$state','entityType'

    initialize: ->