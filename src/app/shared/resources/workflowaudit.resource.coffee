angular.module('diligenceVault').factory 'WorkflowAuditResource', (GridResourceService, BaseDataService, GridsDataService) ->
  new class WorkflowAuditResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.addTransformer (collection) =>
        BaseDataService.getAttachmentTypes().then (response) =>
          document_types = response
          _(collection).each (item) =>
            tag_ids = []
            _(document_types).each (doc_type) =>
              if doc_type.id  == item.entity_sub_type
                tag_ids.push(doc_type.name)

            item.tag_ids = tag_ids

      resource.name 'workflow_audits'
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.column('context').setDefaultSort('asc').title('Name').align('left').setWidth(grid_widths_map['sm_column_xl']).filterable(true, {
        placeholder: 'Search...'
      }).setTemplate('workflow-status-name')
      resource.column('tag_ids').title('Document Type').setTemplate('workflow-tags').setWidth(grid_widths_map['sm_column_xl']).filterable(true, {
        placeholder: 'Search document type'
      })
      resource.column('owner_name').title('Owner').setWidth(grid_widths_map['sm_column_xl']).showTooltip()
      resource.column('pct_complete').title('% Complete').setTemplate('workflow-percentage').setWidth(grid_widths_map['sm_column_xl']).format 'number'

      resource
