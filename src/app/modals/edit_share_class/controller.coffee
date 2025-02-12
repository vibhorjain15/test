class EditShareClassController extends ModalController
  @register 'EditShareClassController'

  @inject 'share_class', 'BaseDataService', 'Restangular', 'toaster'

  initialize: ->
    @params = angular.copy(@share_class)

    if @params.inceptionDate?
      @params.inceptionDate = new Date(@params.inceptionDate)

    @getCurrencies()

  submit: ->
    if @edit_share_class_form.$valid
      id = @share_class.id

      @saving = true

      @Restangular.one('shareclasses', id).customPUT(@params).then((response) =>
        @toaster.pop 'success', '', 'ShareClass successfully updated'

        @close(response)
      ).finally(=> @saving = false)

  getCurrencies: ->
    @BaseDataService.getCurrencies().then (response) =>
      @currencies = response
