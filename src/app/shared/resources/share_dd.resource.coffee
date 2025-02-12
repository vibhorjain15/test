angular.module('diligenceVault').factory 'ShareDDResource', (GridResourceService, BaseDataService, GridsDataService) ->

  new class ShareDDResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.name 'diligences/share_project',
        lastTouchPointDate: ->
          @lastTouchPoint and new Date(@lastTouchPoint)

      resource.addTransformer (collection) ->
        BaseDataService.getTeamMembers().then (team_members) ->
          _(collection).each (response) ->
            user = _(team_members).findWhere(id: response.owner_user_id)

            if user?
              response.ownerName = _([user.firstName, user.lastName]).compact().join(' ')

      resource.addTransformer (collection) ->
        _(collection).each (response) ->
          response.tofirm_name = response.tofirm_name
          response.created_at = response.created_at
          response.created_by = response.created_by_name
          response.view_count = response.view_count
          response.acknowledged_at = response.acknowledged_at
          response.lastupdated_at = response.lastupdated_at

      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.setRowTemplate("dd-project-row-template")

      resource.column('action').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).title('Actions').align('center').disableSorting().setTemplate('shared-action').disableColumnMenu()

      resource.column('tofirm_name').showAggregationOptions(false).enableHiding(false).title('Investor Name').setWidth(grid_widths_map['sm_column_lg']).setTemplate('shared-name').align('left').filterable(true, {
        placeholder: 'Search by name'
      })

      resource.column('status').showAggregationOptions(false).enableHiding(false).title('Status').setWidth(grid_widths_map['sm_column_xm']).setTemplate('shared-status').align('center').filterable(true, {
        placeholder: 'Search by status'
      })

      resource.column('created_by').showAggregationOptions(false).enableHiding(false).title('Shared By').setWidth(grid_widths_map['sm_column_sm']).setTemplate('shared-created-by').align('center').filterable(true, {
        placeholder: 'Search by contact'
      })
      resource.column('shared_at').disableColumnMenu().disableGrouping().title('Shared At').setWidth(grid_widths_map['sm_column_sm']).setTemplate('shared-at').align('center')

      resource.column('lastupdated_at').disableColumnMenu().disableGrouping().title('Last Updated').setWidth(grid_widths_map['sm_column_sm']).setTemplate('shared-lastupdated').align('center')

      resource.column('acknowledged_at').disableColumnMenu().disableGrouping().title('Acknowledged').setWidth(grid_widths_map['sm_column_sm']).setTemplate('shared-acknowledged').align('center')

      resource.column('view_count').disableColumnMenu().disableGrouping().title('View Count').setWidth(grid_widths_map['sm_column_sm']).setTemplate('shared-count').align('center')

      resource
