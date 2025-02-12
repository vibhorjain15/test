class HeatmapComponentController extends BaseController

    @register 'HeatmapComponentController'

    @inject '$http', 'baseUrl', 'Restangular', 'Utils', '$rootScope', 'DashboardActionsResource', '$state', 'ModalFactory', '$q', '$timeout', '$stateParams', 'WorkflowStatusResource', 'FlagScoreResource', 'HeatmapDataService','keywordConstants', 'DueDiligenceInvestor', '$scope','$timeout'

    initialize: ->
        @heatmap_options = {}
        @heatmap_data = undefined
        @colorScheme = @HeatmapDataService.getColorScheme()
        @heatMapChartId = @HeatmapDataService.getHeatmapChartId()
        @heatmapChartContainer = "heatmapChartContainer"
        @chartWidthDiv = "chartWidthDiv"
        @plotWidth = @HeatmapDataService.getPlotWidth()
        @plotHeight = @HeatmapDataService.getPlotHeight()
        @showDecimalPlaces = false
        @showAverageFirst = true
        @showWeightages = false

        @cellWidth = @HeatmapDataService.getDefaultCellWidth()
        @cellHeight = @HeatmapDataService.getDefaultCellHeight()

        @filename = "HeatMap"
        @maxScore = undefined
        @SORT_STATE = @HeatmapDataService.getSortState()
        @entity_type = undefined
        @TEXT_DISPLAY_STATE = @HeatmapDataService.getTextDisplayState()
        @DATES_DISPLAY_STATE = false
        @RE_INIT_HEATMAP = false
        @eventDateFormat = 'YYYY-MM-DDThh:mm:ssZ'
        @entity_sub_type = @Utils.getEntitySubType()

        @defaultColorScheme = @Utils.getFirmColorScheme()
        @dashType = @$stateParams.dashType || 'Activity'
        @dashFilterMap = ['Activity', 'Monitor']
        @is_freeSubscription = @Utils.isFreeSubscription()
        @selected_rating_scheme_id = undefined
        @heatMapApiData = undefined
        @categoryOnly = false

        @$scope.$watchGroup ['vm.heatmapResponse','vm.naColor','vm.ratingScales'], (value)=>
            if value[0] and value[1] and value[2]
                @loading = true
                @$timeout =>
                    @unratedColorCode = value[1].color_code
                    userColorScheme = []
                    _(value[2]).each((scale)=>
                        if scale.color_code
                            userColorScheme.push scale.color_code
                    )
                    if value[2].length == 1
                        @maxScore = 5
                    else
                        @maxScore = value[2].length

                    if userColorScheme.length == @maxScore
                        @colorScheme = userColorScheme

                    @resetHeatmapDimensions()
                    @getHeatMapData()

    resetHeatmapDimensions: =>
        @plotWidth = @HeatmapDataService.getPlotWidth()
        @plotHeight = @HeatmapDataService.getPlotHeight()

    getMaxHeaderLength: (arr) ->
        if @heatmapOptions.heatmap_orientation == "X"
            maxlen = 0
            i = 0
            while i < arr.length
                tmplen = arr[i].length * 10
                if tmplen > maxlen
                    maxlen = tmplen
                i++
            Math.floor maxlen + 30
        else
            maxlen = 0
            i = 0
            while i < arr.length
                tmplen = arr[i].length * 8
                if tmplen > maxlen
                    maxlen = tmplen
                i++
            Math.floor maxlen + 30

    setDirectiveFn: (drawHeatMapSvg) ->
        @$scope.drawHeatMapSvg = drawHeatMapSvg

    sortHeatmap: (sortBy) =>
        if @SORT_STATE isnt sortBy
            @SORT_STATE = sortBy
            @loading = true

            @$timeout =>
                @resetHeatmapDimensions()
                @getHeatMapData()

    toggleTextDisplay: (mode) =>
        @TEXT_DISPLAY_STATE = if @TEXT_DISPLAY_STATE is true then false else true
        @getHeatMapData()

    toggleDatesDisplay: =>
        @DATES_DISPLAY_STATE = if @DATES_DISPLAY_STATE then false else true
        @getHeatMapData()

    toggleCategoryOnly: (categoryOnly)=>
        @categoryOnly = categoryOnly
        @getHeatMapData()

    toggleDecimalPlaces: =>
        @showDecimalPlaces = !@showDecimalPlaces
        @getHeatMapData()

    toggleAverageFirst: =>
        @showAverageFirst = !@showAverageFirst
        @getHeatMapData()

    toggleWeightage: =>
        @showWeightages = !@showWeightages
        @getHeatMapData()

    getHeatMapData:  =>
        $hiddenDiv = $("#" + @chartWidthDiv)
        @plotWidth = $hiddenDiv.outerWidth()
        if @heatmapResponse.data.length > 0
            @predictedHeight = (@heatmapResponse.data.length + @heatmapResponse.computed.length) * @cellHeight
            if @heatmapOptions.heatmap_orientation != "X" and (@heatmapResponse.data.length + @heatmapResponse.computed.length) > 9
                @plotHeight = @predictedHeight

            heatMapObj =
                members: []
                computed: []
                textleftcol: []

            i = 0
            while i < @heatmapResponse.computed.length
                protoObj = {}
                protoObj.name = @heatmapResponse.computed[i].entity_name
                protoObj.name_without_dates = @heatmapResponse.computed[i].entity_name_without_dates
                protoObj.total_score = if @showDecimalPlaces then @heatmapResponse.computed[i].total_score else Math.round(@heatmapResponse.computed[i].total_score)
                protoObj.total_rating = @heatmapResponse.computed[i].total_rating
                protoObj.rating = @heatmapResponse.computed[i].ratings
                protoObj.is_highlighted = false
                heatMapObj.computed.push protoObj
                i++

            i = 0
            while i < @heatmapResponse.data.length
                protoObj = {}
                protoObj.name = @heatmapResponse.data[i].entity_name
                protoObj.name_without_dates = @heatmapResponse.data[i].entity_name_without_dates
                protoObj.total_score = if @showDecimalPlaces then @heatmapResponse.data[i].total_score else Math.round(@heatmapResponse.data[i].total_score)
                protoObj.total_rating = @heatmapResponse.data[i].total_rating
                protoObj.rating = @heatmapResponse.data[i].ratings
                protoObj.is_highlighted = false
                heatMapObj.members.push protoObj
                i++

            @heatMapApiData = heatMapObj
            @heatmap_options.managerAxis = @heatmapOptions.heatmap_orientation
            @heatmap_options.textColLength = @heatMapApiData.textleftcol.length
            @heatmap_options.plotHeight = @plotHeight
            @heatmap_options.plotWidth = @plotWidth
            @heatmap_options.max_score = @maxScore
            @heatmap_options.invertColor = @heatmapOptions.invertColor
            @heatmap_options.sortState = @SORT_STATE
            @heatmap_options.colorScheme = @colorScheme
            @heatmap_options.textDisplayState = @TEXT_DISPLAY_STATE
            @heatmap_options.hide_dates = @DATES_DISPLAY_STATE
            @heatmap_options.heatmapChartContainer = @heatmapChartContainer
            @heatmap_options.unrated_color_code = @unratedColorCode
            @heatmap_options.displayAttr = @displayAttr
            @heatmap_options.displayTotalAttr = @displayTotalAttr
            @heatmap_options.categoryOnly = @categoryOnly
            @heatmap_options.showDecimalPlaces = @showDecimalPlaces
            @heatmap_options.showAverageFirst = @showAverageFirst
            @heatmap_options.showWeightages = @showWeightages
            @$scope.drawHeatMapSvg @heatmap_options, @heatMapApiData, @heatmapChartContainer
        @loading = false

    toggleOrientation: (orientation)=>
        @heatmapOptions.heatmap_orientation = orientation
        @getHeatMapData()

    svg_to_pdf: () =>
      svgAsPngUri document.getElementById(@heatMapChartId), {canvg:window.canvg}, (svg_uri) =>
        image = document.createElement('img')
        image.src = svg_uri
        image.onload = =>
          HTML_Width = image.width
          HTML_Height = image.height
          top_left_margin = 15
          PDF_Width = HTML_Width + top_left_margin * 2
          PDF_Height = PDF_Width * 1.5 + top_left_margin * 2
          canvas_image_width = HTML_Width
          canvas_image_height = HTML_Height
          totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1
          # canvas.getContext '2d'
          # imgData = canvas.toDataURL('image/jpeg', 1.0)
          imgData = image
          pdf = new jsPDF('p', 'pt', [
            PDF_Width
            PDF_Height
          ])
          pdf.addImage imgData, 'JPG', top_left_margin, top_left_margin, canvas_image_width, canvas_image_height
          i = 1
          while i <= totalPDFPages
            pdf.addPage [
              PDF_Width
              PDF_Height
            ], 'p'
            pdf.addImage imgData, 'JPG', top_left_margin, -(PDF_Height * i) + top_left_margin * 4, canvas_image_width, canvas_image_height
            i++
          pdf.save 'HTML-Document.pdf'


    saveAsPng: () =>
        svg = document.getElementById(@heatMapChartId)
        height = svg.getBBox().height
        width = svg.getBBox().width
        saveSvgAsPng svg, @filename + '.png' , {canvg:window.canvg, height: height, width: width}
