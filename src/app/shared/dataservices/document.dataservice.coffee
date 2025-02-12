angular.module('diligenceVault').factory 'DocumentDataservice', (Restangular, RestangularHeaderService, $http, baseUrl) ->
  new class DocumentDataservice
    pageUrl = ""

    getNotes: (entityType, entityId,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('notes').getList({entity_type: entityType, entity_id: entityId}).then (response) =>
        _(response).map (note) =>
          Restangular.restangularizeElement null, note, 'notes'

        response

    createNote: (params,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('notes').post(params)

    getDocument: (id,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).one('attachments', id).get()

    setDocumentPageUrl: (url) ->
      pageUrl = url

    getDocumentPageUrl: ->
      pageUrl


    getDocumentsAssignment: (entity_type, entity_id) ->
      Restangular.all('attachmentassignments').customGET('', {entity_type: entity_type, entity_id: entity_id})

    getDocumentVersions: (id,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('attachmentversions').customGET('', {attachment_id: id})

    getDocumentAssignments: (id,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('attachmentassignments').customGET('', {attachment_id: id})

    getHTMLUrl: (id) ->
      Restangular.one('attachments', id).one('html_url').get()

    getDocumentQueue: () ->
      Restangular.all('documents').getList()

    getFirmRelationships: (id) ->
      Restangular.all('firm_relationships').customGET('', {entity_type: 'Firm', relationship_status_id: id})

    postAttachmentAssignment: (attachmentId, entityType, entityId, firmIds) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('attachmentassignments').post({
        attachment_id: attachmentId
        entity_type: entityType
        entity_id: entityId
        firm_ids: firmIds
      })


    getSignedEmailAttachmentUrl: (id) ->
      Restangular.one('attachments', id).one('signed_url', null).get()


    assignBulkDocuments: (params) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('AttachmentAssignments/bulk_assignment').post(params)

    getAttachmentReviews: (attachment_id,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('AttachmentReviews').customGET('', attachment_id: attachment_id)

    reviewAttachment: (attachment_id, pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).all('AttachmentReviews').post(attachment_id: attachment_id)

    getWorkflows: (entityType, entityId) ->
      Restangular.all('workflows').customGET('', {entity_type: entityType, entity_id: entityId})

    revokeAttachmentAccess: (id,pageUrl) ->
      RestangularHeaderService.RestangularWithHeader(pageUrl).one('AttachmentAssignments', id).remove()

    getAttachmentAssignmentCount: (entityType, id) ->
      Restangular.all('AttachmentAssignments').all('count').customGET('', { entity_type: entityType, entity_id: id})

    downloadAllDocuments: (documentsGrid)=>
      items_arr = []
      bulkDownloadArr = {
        "files": []
      }
      items_arr = documentsGrid.selection.getSelectedRows()
      grouping_structure = documentsGrid.grouping.getGrouping()
      if grouping_structure.grouping.length > 0 and grouping_structure.grouping[0].colName
        bulkDownloadArr.selected_group_name = grouping_structure.grouping[0].colName

      _(items_arr).each (item) =>
        itemsObj = {}
        itemsObj.as_of_date = item.as_of_date
        itemsObj.blob_name = item.blob_name
        itemsObj.container_name = item.container_name
        itemsObj.context = item.context
        itemsObj.created_at = item.created_at
        itemsObj.associated_Firm_Name = item.associated_Firm_Name
        itemsObj.created_by = item.created_by
        itemsObj.created_by_name = item.created_by_name
        itemsObj.entity_id = item.entity_id
        itemsObj.entity_type = item.entity_type
        itemsObj.group_ids = item.group_ids
        itemsObj.group_names = item.group_names
        itemsObj.id = item.id
        itemsObj.name = item.name
        itemsObj.owner_firm_id = item.owner_firm_id
        itemsObj.owner_firm_name = item.owner_firm_name
        itemsObj.source = item.source
        itemsObj.source_id = item.source_id
        itemsObj.tag_names = item.tag_names
        itemsObj.tags = item.tags
        itemsObj.updated_at = item.updated_at
        itemsObj.updated_by = item.updated_by
        itemsObj.updated_by_name = item.updated_by_name
        itemsObj.version = item.version
        itemsObj.associated_project_names = item.associated_project_names
        itemsObj.associated_template_names = item.associated_template_names
        itemsObj.associated_fund_names = item.associated_fund_names
        itemsObj.associated_strategy_names = item.associated_strategy_names
        itemsObj.associated_firm_names = item.associated_firm_names
        itemsObj.associated_vehicle_names = item.associated_vehicle_names
        bulkDownloadArr.files.push itemsObj

      $http.post(baseUrl + '/attachments/bulk_download', bulkDownloadArr)