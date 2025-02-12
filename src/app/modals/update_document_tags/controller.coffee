class DocumentUpdateTagsController extends ModalController
  @register 'DocumentUpdateTagsController'

  @inject '$stateParams', 'toaster', 'DueDiligenceDataservice', '$state',
          'document', 'Restangular', 'BaseDataService', 'FundDataservice', '$q','Utils'

  initialize: ->
    @maxDate = new Date()
    @maxAsOfDate = @Utils.getMaxAsOfDate()

    @params = jQuery.extend(true, {}, @document)

    @params.as_of_date = new Date(@params.as_of_date)
    @params.tag_ids_copy = @params.tag_ids

    @getFunds()

    @getDocumentTypes()

  getDocumentTypes: () =>
    @BaseDataService.getAttachmentTypes().then (response) => 
      @document_types = response

  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response

  filterTags: (query) ->
    return @document_types unless query
    regex = new RegExp(query, 'i')
    _(@document_types).filter((tag) -> regex.test(tag.name))

  submit: () =>
    if @document_tags_update_form.$valid
      @params.tag_ids = []
      _(@params.tag_ids_copy).each (tag) =>
        @params.tag_ids.push(tag.value)
      
      @saving_document = true  
      @Restangular.one('document_queue', @document.id ).customPUT(@params).then (response) =>
        @saving_document = false
        @toaster.pop 'success', '', 'Document tags successfully updated'
        @close()
      , => @saving_document = false

  updateApproveDocument: () =>
    if @document_tags_update_form.$valid
      @params.tag_ids = []
      _(@params.tag_ids_copy).each (tag) =>
        @params.tag_ids.push(tag.value)

      @approving_document = true
      promises = []
      promises.push @Restangular.one('document_queue', @document.id ).customPUT @params
      
      @$q.all(promises).then =>
        approve_params =
          entity_type: "Document"
          entities: []
        approve_params.entities.push({entity_id: @document.id})  
        @Restangular.one('workflow_audits').customPOST(approve_params).then (response) =>
          @approving_document = false
          @toaster.pop 'success', '', 'Documents successfully updated and approved'
          @close()
        , => @approving_document = false
      , => @approving_document = false