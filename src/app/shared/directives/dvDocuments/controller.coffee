class DvDocumentsController extends BaseController
  @register 'DvDocumentsController'

  @inject 'BaseDataService', '$attrs', '$scope', 'Restangular', 'ModalFactory', 'toaster', 'SweetAlert'

  initialize: ->
    deregisterer = @$scope.$parent.$watchGroup [@$attrs.entityType, @$attrs.entityId], (values) =>
      if values[0] && values[1]
        @entity_type = values[0]
        @entity_id = values[1]
        @getDocuments()
        deregisterer()

    @$scope.$on 'documents:load', (events) =>
      @getDocuments()

  getDocuments: ->
    @loadingDocuments = true
    @Restangular.all('attachmentassignments').getList(entity_type: @entity_type, entity_id: @entity_id).then (response) =>
      @documents = response
      @loadingDocuments = false

  addDocument: ->
    @ModalFactory.invokeModal 'manage_document',
      resolve:
        documentOptions: =>
          editAccessGranted: true
          entityType: @entity_type
          entityId: @entity_id
          mode: 'update'
      success: (file) =>
        @getDocuments()