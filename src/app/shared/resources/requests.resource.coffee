angular.module('diligenceVault').factory 'RequestsResource', ($timeout, Restangular, GridResourceService, BaseDataService, Utils, GridsDataService) ->

  entity_type = Utils.getEntityType()
  entity_sub_type = Utils.getEntitySubType()
  current_user_id = Utils.getCurrentUser().id

  new class RequestsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->

      resource = GridResourceService.$new(options.options)

      resource.addTransformer (collection) ->
        _(collection).each (response) ->
          _(JSON.parse(response.author_json)).forEach (value,key) =>
            response[key] = value
          response['entities_count'] = JSON.parse(response.author_json).Entities.length
          if response.approver_ids.indexOf(current_user_id) != -1 && response.draft_status == 'InProgress' 
            response['draft_current_status'] = 'Pending approval'
          else if response.created_by == current_user_id && response.draft_status == 'InProgress'
            response['draft_current_status'] = 'Waiting for approval'
          else 
            response['draft_current_status'] = response.draft_status
      
      resource.name 'duediligence_drafts ',
        lastTouchPointDate: ->
          @lastTouchPoint and new Date(@lastTouchPoint)

      # resource.usePostMethod()
      
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )
      resource.setGridNullLabel("Ungrouped")

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.setRowTemplate("dd-project-row-template")

      resource.column('Name').disableColumnMenu().disableGrouping().title('Project Name').setWidth(grid_widths_map['sm_column_lg']).align('center').filterable(true, {
        placeholder: 'Search Project'
      })

      resource.column('draft_current_status').title('Status').showAggregationOptions(false).setWidth(grid_widths_map['sm_column_xm']).align('center').setTemplate('request-approval-status')

      resource.column('created_by_name').disableColumnMenu().disableGrouping().title('Created By').setWidth(grid_widths_map['sm_column_lg']).align('center').filterable(true, {
        placeholder: 'Search Name'
      })
      
      resource.column('Due_at').title('Due Date').disableGrouping().setWidth(grid_widths_map['sm_column_xm']).format('date').align('center')

      resource.column('As_of_date').title('As of Date').disableGrouping().format('date').setWidth(grid_widths_map['sm_column_xm']).align('center')

      resource.column('As_of_date').disableColumnMenu().disableGrouping().title('Last Updated').setWidth(grid_widths_map['sm_column_sm']).format('date').align('center')

      resource.column('entities_count').disableColumnMenu().disableGrouping().title('# of Entities').setWidth(grid_widths_map['sm_column_lg']).align('center')

      resource
