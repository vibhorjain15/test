class ViewSummaryController extends ModalController

  @register 'ViewSummaryController'

  @inject 'entity', 'entity_type', 'Restangular', '$uibModalInstance', 'Utils', '$rootScope', 'toaster','$scope' , '$timeout' , 'HeatmapDataService'

  initialize: ->
    @loading = false
    @currentUser = @Utils.getCurrentUser()
    @heatmap_orientation = "X"
    @currentFirm = @currentUser.firmInfo.id
    @entity_name = @entity.name
    @strategy_name = @entity.strategyName
    @heatMapApiData = undefined
    @heatmapResponse = []
    @heatmap_options = {}
    @cellWidth = @HeatmapDataService.getDefaultCellWidth()
    @cellHeight = @HeatmapDataService.getDefaultCellHeight()
    @colorScheme = @HeatmapDataService.getColorScheme()
    @heatMapChartId = @HeatmapDataService.getHeatmapChartId()
    @heatmapChartContainer = "heatmapChartContainer"
    @chartWidthDiv = "chartWidthDiv"
    @plotHeight = @HeatmapDataService.getPlotHeight()
    @plotWidth = @HeatmapDataService.getPlotWidth()
    @maxScore = undefined
    @SORT_STATE = @HeatmapDataService.getSortState()
    @TEXT_DISPLAY_STATE = @HeatmapDataService.getTextDisplayState()
    @RE_INIT_HEATMAP = false
    @colorScale = @HeatmapDataService.getColorScaleJson()
    @ratingTableColorScale = @HeatmapDataService.getRatingTableColorScale()
    @Restangular.all('firm_preferences').customGET().then (response) =>
      if response.enable_yaxis_entity
        @heatmap_orientation = "Y"

      if response.invert_color
        @invertColor = response.invert_color
    @loadRatingScales()
    if @strategy_name?
      @title = @strategy_name + " Peer Group Snapshot"
    else
      @title = "Peer Group Snapshot"

    @filename = @entity_name + " HeatMap"
    @getHeatMapData()
    @Restangular.all('rating_scales').getList().then (response) =>
      @scales = response.scales_data
      if @scales.length == 1
        @maxScore = 5
      else
        @maxScore = @scales.length

    @Restangular.all('ratings/profile').getList({entity_id: @entity.id, entity_type: @entity_type}).then (response) =>
      @grouped_ratings = response

  loadRatingScales:=>
    @Restangular.all('rating_scales').doGET().then (response) =>
      @scales = response.scales_data
      @unrated_color_code = response.unrated_color
      userColorScheme = []
      _(@scales).each((scale)=>
        if scale.color_code
          userColorScheme.push scale.color_code
      )
      if @scales.length == 1
        @maxScore = 5
      else
        @maxScore = @scales.length

      if userColorScheme.length == @maxScore
        @colorScheme = userColorScheme

  setDirectiveFn: (drawHeatMapSvg) ->
    @$scope.drawHeatMapSvg = drawHeatMapSvg

  getHeatMapData: =>
    @loading = true
    @Restangular.all('ratings/analytics').getList({entity_id: @entity.id, entity_type: @entity_type}).then (response) =>
      @heatmapResponse = response
      @loading = false
      if @heatmapResponse.length > 0
        @predictedHeight = @heatmapResponse.length * @cellHeight
        if @heatmap_orientation != "X" and @heatmapResponse.length > 9
          @plotHeight = @predictedHeight
        @plotWidth = document.getElementById(@heatmapChartContainer).offsetWidth
        if @heatmapResponse.length > 3
          @plotWidth = @cellWidth * @heatmapResponse.length

        heatMapObj =
          members: []
          textleftcol: []

        i = 0
        while i < @heatmapResponse.length
          protoObj = {}
          protoObj.name = @heatmapResponse[i].entity_name
          protoObj.total_score = @heatmapResponse[i].total_score
          protoObj.rating = @heatmapResponse[i].ratings
          protoObj.is_highlighted = false
          heatMapObj.members.push protoObj
          i++

        @heatMapApiData = heatMapObj
        @heatmap_options.managerAxis = @heatmap_orientation
        @heatmap_options.textColLength = @heatMapApiData.textleftcol.length
        @heatmap_options.plotHeight = @plotHeight
        @heatmap_options.plotWidth = @plotWidth
        @heatmap_options.max_score = @maxScore
        @heatmap_options.invertColor = @invertColor
        @heatmap_options.sortState = @SORT_STATE
        @heatmap_options.colorScheme = @colorScheme
        @heatmap_options.textDisplayState = @TEXT_DISPLAY_STATE
        @heatmap_options.heatmapChartContainer = @heatmapChartContainer
        @heatmap_options.unrated_color_code = @unrated_color_code
        @$scope.drawHeatMapSvg @heatmap_options, @heatMapApiData, @heatmapChartContainer


  addTableClasses: (rating) ->
    if rating <=1
      schemeColor =  @ratingTableColorScale[8]
      tdStyle = { 'background-color': schemeColor}
    else if rating > 1 and rating <= 2
      schemeColor =  @ratingTableColorScale[7]
      tdStyle = { 'background-color': schemeColor}
    else if rating > 2 and rating <= 3
      schemeColor =  @ratingTableColorScale[6]
      tdStyle = { 'background-color': schemeColor}
    else if rating > 3 and rating <= 4
      schemeColor =  @ratingTableColorScale[5]
      tdStyle = { 'background-color': schemeColor}
    else if rating > 4 and rating <= 5
      schemeColor =  @ratingTableColorScale[4]
      tdStyle = { 'background-color': schemeColor, 'color' : '#fff'}
    else if rating > 5 and rating <= 6
      schemeColor =  @ratingTableColorScale[3]
      tdStyle = { 'background-color': schemeColor, 'color' : '#fff'}
    else if rating > 6 and rating <= 7
      schemeColor =  @ratingTableColorScale[2]
      tdStyle = { 'background-color': schemeColor, 'color' : '#fff'}
    else if rating > 7 and rating <= 8
      schemeColor =  @ratingTableColorScale[1]
      tdStyle = { 'background-color': schemeColor, 'color' : '#fff'}
    else
      schemeColor =  @ratingTableColorScale[0]
      tdStyle = { 'background-color': schemeColor, 'color' : '#fff'}

    tdStyle

  @specialElementHandlers = '#editor': (element, renderer) ->
    true


  save_table_to: (type) =>
    mainDiv = $("#ratingsTable")
    @toaster.pop 'info', 'Processing '+type+' Download...', 'Please wait while the '+type+' file is being generated.', 3000
    html2canvas(document.getElementById('ratingsTable')).then (canvas) =>
      # Export the canvas to its data URI representation
      if type is "PNG"
        pngImage = canvas.toDataURL('image/png')
        if navigator.msSaveBlob
          blob = canvas.msToBlob();
          return navigator.msSaveBlob blob, 'heatmap-table.png'
        # create link for download
        link = document.createElement('a')
        # append link to body
        document.body.appendChild(link)
        # Add download attribute with file name
        link.download = 'heatmap-table.png'
        # reference to png image
        link.href = pngImage
        link.click()
        # remove link
        document.body.removeChild(link)
      else
        # get height/width fromcontainer element
        width  = mainDiv.width()
        height = mainDiv.height()
        # if width is greater , then set letter mode else portraite mode
        # jsPDF('orientation', 'measurement scale', [width, height])
        if width > height
          doc = new jsPDF('l', 'mm', [width, height])
        else
          doc = new jsPDF('p', 'mm', [height, width])
        doc.addImage(canvas, 'PNG', 10, 10, (width), (height), "NONE", 'FAST')
        doc.save 'heatmap-table.pdf'


  svg_to_pdf: () =>
    svgAsPngUri document.getElementById(@heatMapChartId), {canvg:window.canvg}, (svg_uri) =>
      image = document.createElement('img')
      image.src = svg_uri
      image.onload = =>
        canvas = document.createElement('canvas')
        context = canvas.getContext('2d')
        canvas.width = image.width
        canvas.height = image.height
        canvas.style.display = 'block'
        if canvas.width > canvas.height
          doc = new jsPDF('l', 'mm', [canvas.width, canvas.height])
        else
          doc = new jsPDF('p', 'mm', [canvas.height, canvas.width])

        context.drawImage image, 0, 0, image.width, image.height
        doc.addImage canvas, 'PNG', 20, 20, (canvas.width), (canvas.height), 'NONE', 'FAST'
        doc.save @filename + ".pdf"

  saveAsPng: () =>
    saveSvgAsPng document.getElementById(@heatMapChartId),  @filename + ".png" , {canvg:window.canvg}


  sortHeatmap: (sortBy) =>
    if @SORT_STATE isnt sortBy
      @SORT_STATE = sortBy
      @getHeatMapData()

  toggleTextDisplay: (mode) =>
    @TEXT_DISPLAY_STATE = if @TEXT_DISPLAY_STATE is true then false else true
    @getHeatMapData()

  drawInlineSVG = (svgElement, ctx, callback) ->
    svgURL = (new XMLSerializer).serializeToString(svgElement)
    img = new Image
    img.onload = ->
      ctx.drawImage this, 0, 0
      callback()
      return
    img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svgURL)
    return
