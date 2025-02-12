angular.module('diligenceVault').factory 'AssignmentsResource', (GridResourceService, BaseDataService, GridsDataService) ->
  new class AssignmentsResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.addTransformer (collection) ->
        angular.forEach collection, (assignment) ->
          assignment.fullName = assignment.assigned_to.fullName
          if assignment.is_WIP
            assignment.status = 'WIP'
          else if assignment.answered_at?
            assignment.status = 'Answered'
          else
            assignment.status = 'Unanswered'

      resource.name 'v2/diligences/'+options.diligenceId+'/assignment_status',

      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )
      resource.enableGridGrouping({groupingShowCounts: true, enableGroupHeaderSelection: true})

      resource.columnDefs.push(
        {
          grouping: { groupPriority: 0},
          name:'fullName',
          field: 'fullName'
          displayName:'Team Member',
          sort: { priority: 0, direction: 'desc' }
          cellClass: 'text-left',
          headerCellClass: 'text-left',
          width: grid_widths_map['sm_column_xl'],
          enableFiltering: true,
          visible: true,
          filter: {
            placeholder: 'Search by name'
          }
        }
      )
      resource.column('question_text').title('Question(s)').align('left').setWidth(grid_widths_map['lg_column_xxl']).setTemplate('assignment-question-name').filterable(true, {
        placeholder: 'Search by keyword'
      })
      resource.column('status').title('Status').setWidth(grid_widths_map['sm_column_sm']).setTemplate 'assignment-status-label'

      resource
