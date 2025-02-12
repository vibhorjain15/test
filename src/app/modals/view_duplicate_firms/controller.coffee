class ViewDuplicateFirmsController extends ModalController

  @register 'ViewDuplicateFirmsController'

  @inject '$uibModalInstance', 'Restangular', 'duplicateFirms', 'source'

  initialize: ->


  addToPortfolio: (firm)=>
    @close(firm)


  selectFirm: (firm)=>
    @close(firm)
