angular.module('diligenceVault').factory 'FlagScoreResource', (GridResourceService, GridsDataService, Restangular, $q, ratingConstants) ->
  new class FlagScoreResource

    grid_widths_map = GridsDataService.getGridWidthsMap()

    $new: (options) ->
      resource = GridResourceService.$new(options)

      resource.addTransformer (collection) ->
        ratingScaleMap = {}
        ratingScaleIds = _(collection).chain().pluck('rating_scale_id').uniq().without(null)
        promises = []
        _(ratingScaleIds).each (scale) =>
          promises.push Restangular.one('v2/rating_scales',scale).one('versions',0).getList('rating_scale_definitions').then (response)=>
            ratingScaleMap[scale] = {}
            ratingScaleMap[scale].ratingScaleDefinition = response
            noValueIndex = _(ratingScaleMap[scale].ratingScaleDefinition).findIndex (scale)=>
              parseInt(scale.value) == ratingConstants.naValue
            
            if noValueIndex > -1
              ratingScaleMap[scale].naValue = ratingScaleMap[scale].ratingScaleDefinition[noValueIndex]
              ratingScaleMap[scale].ratingScaleDefinition.splice(noValueIndex,1)

        $q.all(promises).then (response)=>
          _(collection).each (flag_score) ->
            if flag_score.rating_scale_id
              flag_score.ratingScaleDefinition = ratingScaleMap[flag_score.rating_scale_id].ratingScaleDefinition
              flag_score.naValue = ratingScaleMap[flag_score.rating_scale_id].naValue

      resource.name 'flags_scores_summary'
      resource.enableFiltering()
      resource.colDefaults(
        align: 'center'
        filterable: false
      )

      resource.column('entity_name').setDefaultSort('asc').setWidth(grid_widths_map['sm_column_lg']).setTemplate('scores-dd-firm-name').title('Entity Name').align('left').filterable(true, {
        placeholder: 'Search...'
      })
      resource.column('flag_count').title('# of Flags').setTemplate('scores-flag').setWidth(grid_widths_map['sm_column_xm']).format 'number'
      resource.column('score').title('Aggregate Score/Rating').setTemplate('scores-badge').setWidth(grid_widths_map['sm_column_xm']).format 'number'
      resource.column('as_of_date').title('As of Date').disableColumnMenu().disableGrouping().setTemplate('scores-creation-date').setWidth(grid_widths_map['sm_column_xm']).format 'date'

      resource
