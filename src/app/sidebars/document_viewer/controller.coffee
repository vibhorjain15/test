class SidebarDocumentViewerController extends BaseController
  @register 'SidebarDocumentViewerController'
  @inject 'dd_document', 'DocumentDataservice', 'signed_url'

  initialize: ->
    unless @dd_document.is_image
      @getHTMLUrl(@dd_document.id)

  getHTMLUrl: (id) ->
    @DocumentDataservice.getHTMLUrl(id).then (document_url) =>
      @document_url = document_url

  closeSpinner: ->
    @iframe_loaded = true
