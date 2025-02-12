class ManageAddressController extends ModalController

  @register 'ManageAddressController'

  @inject '$uibModalInstance', 'entity_type', 'entity_id', 'address', 'toaster', 'Restangular'

  initialize: ->
    @edit_mode = false

    @Restangular.all('country').getList().then (response) =>
      @countries = response

    if (@address)
      @params = angular.copy(@address)
      @edit_mode = true
    else
      @params =
        entity_type: @entity_type
        entity_id: @entity_id


  save: ->
    if @address_form.$valid
      @saving = true

      if @edit_mode
        @Restangular
          .one('entity_addresses', @params.id).customPUT(@params)
          .then (response) =>
            @toaster.pop 'success', '', 'Address successfully updated'
            @close(response)
          .finally => @saving = false

      else
        @Restangular
          .all('entity_addresses').post(@params)
          .finally => @saving = false
          .then (response) =>
            @close(response)
