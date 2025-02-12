class MonitorDocumentTypesController extends BaseController

  @register 'MonitorDocumentTypesController'

  @inject 'Restangular', 'toaster', 'FileHandlerFactory'

  initialize: ->
    @maxFileSize = @FileHandlerFactory.getMaxFileSize()

  getDocumentUploadResponse: (response) ->
    @toaster.pop 'success', '', 'Document successfully uploaded'
    @document = response[0][0]

