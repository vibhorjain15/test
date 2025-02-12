class DocumentListConditionalActionController extends BaseController

  @register 'DocumentListConditionalActionController'

  @inject '$scope', 'Utils', '$state'

  showUpdate: (document) ->
    @Utils.isDocumentUploadByCurrentFirm(document.owner_firm_id)