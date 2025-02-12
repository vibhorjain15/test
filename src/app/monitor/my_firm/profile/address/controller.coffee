class MyFirmProfileAddressController extends BaseController

  @register 'MyFirmProfileAddressController'

  @inject '$stateParams', 'ModalFactory', '$scope', 'Utils', 'BaseDataService', 'toaster', 'SweetAlert', 'Restangular','angularEnabled'

  initialize: ->
    @firmId = @Utils.getCurrentFirm().id
    @is_admin = @Utils.isAdmin()
    @entity_type = 'Firm'
    @is_manager = @Utils.isManager()

    @$scope.getFirm().then (firm) =>
      @firm = firm

    @getAddresses()

  getAddresses: ->
    @BaseDataService.getAddresses(
      entity_id: @firmId
      entity_type: 'Firm'
    ).then (response) =>
      @addresses = response
      @getCountries()

  getCountries: =>
    @Restangular.all('country').getList().then (response) =>
      @countries = response
      _(@addresses).each (address) =>
        address.country_name = @getCountryNameFromId(address.country)

  getCountryNameFromId: (id) =>
    country = _(@countries).findWhere(id: id)
    return (if country then country.value else '')

  openAddressDialog: ->
    @ModalFactory.invokeModal 'manage_address',
      resolve:
        entity_id : => @firmId
        entity_type : => 'Firm'
      success: (new_address) =>
        new_address.country_name = @getCountryNameFromId(new_address.country)
        @addresses.unshift new_address

  openEditAddressDialogue: (address) =>
    @ModalFactory.invokeModal 'manage_address',
      resolve:
        address :=> address
      success: (response) =>
        response.country_name = @getCountryNameFromId(response.country)
        idx = _.indexOf(_.pluck(@addresses, 'id'), response.id)
        @addresses[idx] = response

  deleteAddress: (address) =>
    @SweetAlert.confirm({
      title: 'Are you sure you want to delete this address ?'
      confirmButtonText: 'Yes, please.'
      showLoaderOnConfirm: true
      customClass: 'danger'
      focusCancel: true
      preConfirm: =>
        @BaseDataService.deleteAddress(address.id).then (=>
          swal.close()
          idx = _.indexOf(_.pluck(@addresses, 'id'), address.id);
          @addresses.splice(idx, 1)
          @toaster.pop 'success', '', "Address deleted successfully"
        ), ((error) =>
          swal.close()
        )
    })
