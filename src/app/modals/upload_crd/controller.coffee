class CRDUploadController extends ModalController
  @register 'CRDUploadController'

  @inject 'toaster', 'Restangular', 'selectedUser'
            
  submit: ->
    arrayMapping = []
    arrayCRD = []

    arrayCRD = @crds.split('\n')

    _(arrayCRD).each (CRD) =>
      if parseInt(CRD)
        arrayMapping.push({firmCRD:parseInt(CRD)})

    params =
      assigned_to: if @selectedUser then @selectedUser else null
      mappings: arrayMapping
    
    @Restangular.all('Firm_FirmCRD_Mappings/bulk').post(params).then((response) =>
      @toaster.pop 'success', '', "Tracking added for #{arrayMapping.length} CRDs"
      @close()
    ).finally(=>

    )
