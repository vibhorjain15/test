angular.module('diligenceVault').factory 'GridsDataService', () ->
  new class GridsDataService

    grid_widths_map =
      icon_xs: 20
      icon_sm: 30
      icon_lg: 60
      icon_xl: 80
      sm_column_xxxm: 35
      sm_column_xxm: 100
      sm_column_xm: 150
      sm_column_sm: 200
      sm_column_lg: 250
      sm_column_xl: 300
      sm_column_xxl: 350
      lg_column_xxm: 400
      lg_column_sm: 450
      lg_column_lg: 500
      lg_column_xl: 550
      lg_column_xxl: 600

    getGridWidthsMap: ->
      grid_widths_map
