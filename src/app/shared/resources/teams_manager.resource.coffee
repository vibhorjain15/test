angular.module('diligenceVault').factory 'TeamsManager', (GridResourceService, GridsDataService,uiGridConstants) ->
  new class TeamsManager

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new()
      resource.name 'firms/' +options.firm_id+ '/TeamMemberships',

      resource.enableFiltering()
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.setGridNullLabel("Ungrouped")
      # resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: false})
      resource.enableColumnMenus()

      resource.setRowTemplate("permissions-row-template")
      # resource.column('action').disableColumnMenu().disableGrouping().setWidth(grid_widths_map['sm_column_xxm']).setTemplate('teams-action').title 'Action'
      #When enabling inital grouping for a column, we also have to give initial sorting for it, otherwise it wont group properly
      resource.column('team_name').align('left').setDefaultSort('asc').enableGrouping(0).showAggregationOptions(false).enableHiding(false).title('Team').setWidth(grid_widths_map['sm_column_sm']).setTemplate('empty-cell').filterable(true, {
        placeholder: 'Search Team'
      })
      resource.column('user_name').showAggregationOptions(false).enableHiding(false).title('Members').setWidth(grid_widths_map['sm_column_sm']).setTemplate('team-member-name').filterable(true, {
        placeholder: 'Search Members'
      })
      resource.column('role_name').showAggregationOptions(false).enableHiding(false).setWidth(grid_widths_map['sm_column_xm']).setTemplate('empty-cell').title 'Access Level'
      resource.column('created_at').format('date').showAggregationOptions(false).enableHiding(false).setDefaultSort('desc').disableGrouping().title('Last updated').setTemplate('team-last-updated').setWidth(grid_widths_map['sm_column_sm'])

      resource
