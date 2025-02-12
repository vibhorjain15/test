angular.module('diligenceVault').factory 'ExcelSyncResource', (GridResourceService, Utils, GridsDataService, BaseDataService) ->

  entity_sub_type = Utils.getEntitySubType()
  grid_widths_map = GridsDataService.getGridWidthsMap()

  new class ExcelSyncResource
    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'excelsynctransactions'

      resource.addTransformer (collection) ->
        BaseDataService.getTeamMembers().then (team_members) ->
          _(collection).each (response) ->
            downloaded_by_user = _(team_members).findWhere(id: response.downloaded_by)
            uploaded_by_user = _(team_members).findWhere(id: response.uploaded_by)

            if downloaded_by_user?
              response.downloaded_by_name = _([downloaded_by_user.firstName, downloaded_by_user.lastName]).compact().join(' ')

            if uploaded_by_user?
              response.uploaded_by_name = _([uploaded_by_user.firstName, uploaded_by_user.lastName]).compact().join(' ')

            response.upload_params = {
              transaction_id: response.id
            }
            response.upload_files = []


      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setGridNullLabel("Ungrouped")

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.column('LeftAction').disableColumnMenu().disableGrouping().title('').disableSorting().setTemplate('excel-sync-upload-action-icon').setWidth(grid_widths_map['icon_lg']).setEmptyTitle()
      resource.column('file_name').disableColumnMenu().disableGrouping().title('File Name').setWidth(grid_widths_map['sm_column_xxl']).align('left').setTemplate('excel-sync-file-name')
        .filterable(true, {
            placeholder: 'Search File Name'
          })
      resource.column('status').showAggregationOptions(false).enableHiding(false).title('Status').setTemplate('excel-sync-status').setWidth(grid_widths_map['sm_column_xm'])
      resource.column('investor_name').showAggregationOptions(false).enableHiding(false).title('Client').setWidth(grid_widths_map['sm_column_lg'])
      .filterable(true, {
            placeholder: 'Search Client'
          })
      resource.column('template_name').showAggregationOptions(false).enableHiding(false).title('Questionnaire').setWidth(grid_widths_map['sm_column_lg'])
      .setTemplate('dd-questionnaire-name').filterable(true, {
            placeholder: 'Search Questionnaire'
          })
      resource.column('project_count').disableColumnMenu().disableGrouping().title('Projects').setWidth(grid_widths_map['sm_column_xm'])
      resource.column('downloaded_by_name').showAggregationOptions(false).enableHiding(false).title('Downloaded by').setWidth(grid_widths_map['sm_column_sm']).setTemplate('empty-cell')
      resource.column('downloaded_at').disableColumnMenu().disableGrouping().title('Downloaded on').setWidth(grid_widths_map['sm_column_xm']).format('date')
      resource.column('uploaded_by_name').showAggregationOptions(false).enableHiding(false).title('Uploaded by').setWidth(grid_widths_map['sm_column_sm']).setTemplate('empty-cell')
      resource.column('uploaded_at').disableColumnMenu().disableGrouping().title('Uploaded on').setWidth(grid_widths_map['sm_column_xm']).format('date')

      resource
