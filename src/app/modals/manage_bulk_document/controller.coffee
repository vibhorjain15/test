class DocumentBulkManageController extends ModalController
  @register 'DocumentBulkManageController'

  @inject '$stateParams', 'toaster', 'DueDiligenceDataservice', '$state', '$uibModalInstance', 'Restangular', 'BaseDataService','FileHandlerFactory', 'DocumentDataservice', 'FundDataservice', 'entityTypeValue', 'FirmDataservice', '$q', 'documentOptions', 'Utils', '$http','baseUrl', '$timeout', 'RestangularHeaderService','keywordConstants','VehicleDataService', 'hierarchyConstants'

  initialize: ->
    promises = []
    @loading = true
    @savingDocument = false
    @destinationEntityType = 'Firm'
    @actionType = @documentOptions.type
    @sourceEntityType = @documentOptions.sourceEntityType
    @documentsList = @documentOptions.documentsList
    @sourceEntityId = @documentOptions.sourceEntityId
    promises.push @getFirmsList()
    promises.push @getFunds()
    promises.push @getVehicles()
    promises.push @getAllStrategies()

    @$q.all(promises).then (response)=>
      @loading = false
    ,(error)=>
      @loading = false

  getFirmsList: () =>
    @FirmDataservice.getFirms({skip_pagination: true}).then (firms) =>
      @firms = firms
      for firm,index in @firms
        if firm.id == @sourceEntityId
          @firms.splice(index, 1)

  getAllStrategies: () ->
    params =
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {}
        search_for: @global_hierarchy_option
    @Restangular.all('service/dvapi_service/product_search').post(params).then (response) =>
        @strategies = angular.copy response.data
        for strategy,index in @strategies
          if strategy.id == @sourceEntityId
            @strategy.splice(index, 1)

  getVehicles: () =>
    @VehicleDataService.getVehicles().then (response) =>
      @vehicles = response
      for vehicle,index in @vehicles
        if vehicle.id == @sourceEntityId
          @vehicles.splice(index, 1);

  getFunds: ->
    @FundDataservice.getFunds().then (response) =>
      @funds = response
      for fund,index in @funds
        if fund.id == @sourceEntityId
          @funds.splice(index, 1);

  submit: () =>
    if @documentForm.$valid
      if @actionType == 'move'
        @moveAllDocuments()
      else if @actionType == 'copy'
        @copyAllDocuments()
      else if @actionType == 'remove'
        @removeAllDocuments()

  moveAllDocuments: () =>
    @savingDocument = true
    filter_params =
      operation: 'CUT_PASTE'
      attachment_ids: @documentsList
      source_entity_id: @sourceEntityId
      source_entity_type: @entityTypeValue[@sourceEntityType]
      destination_entity_type: @entityTypeValue[@destinationEntityType]
      destination_entity_id: @destinationEntityId
    @Restangular.all('service/dvapi_service/update_attachment_assignment').post(filter_params).then (response) =>
      @Restangular.all('attachments/update_metadata').post({attachment_ids:@documentsList}).then (response_meta) =>
        @savingDocument = false
        @toaster.pop 'success', 'Document(s) successfully moved.'
        @close()
      ,(error)=>
        @savingDocument = false
    ,(err)=>
      @savingDocument = false

  copyAllDocuments: () =>
    @savingDocument = true
    filter_params =
      operation: 'COPY_PASTE'
      attachment_ids: @documentsList
      source_entity_id: @sourceEntityId
      source_entity_type: @entityTypeValue[@sourceEntityType]
      destination_entity_type: @entityTypeValue[@destinationEntityType]
      destination_entity_id: @destinationEntityId
    @Restangular.all('service/dvapi_service/update_attachment_assignment').post(filter_params).then (response) =>
      @Restangular.all('attachments/update_metadata').post({attachment_ids:@documentsList}).then (response_meta) =>
        @savingDocument = false
        @toaster.pop 'success', 'Document(s) successfully copied.'
        @close()
      ,(error)=>
        @savingDocument = false
    ,(err)=>
      @savingDocument = false

  removeAllDocuments: () =>
    @savingDocument = true
    filter_params =
      operation: 'remove'
      attachment_ids: @documentsList
      source_entity_id: @sourceEntityId
      source_entity_type: @entityTypeValue[@sourceEntityType]
      destination_entity_type: @entityTypeValue[@destinationEntityType]
      destination_entity_id: @destinationEntityId
    @Restangular.all('service/dvapi_service/update_attachment_assignment').post(filter_params).then (response) =>
      @Restangular.all('attachments/update_metadata').post({attachment_ids:@documentsList}).then (response_meta) =>
        @savingDocument = false
        @toaster.pop 'success', 'Document(s) successfully removed.'
        @close()
      ,(error)=>
        @savingDocument = false
    ,(err)=>
      @savingDocument = false


