class DocumentActionController extends BaseController

  @register 'DocumentActionController'

  @inject 'Utils'

  showUpdate: (document) ->
    @Utils.isDocumentUploadByCurrentFirm(document.owner_firm_id)