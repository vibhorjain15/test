angular.module('diligenceVault').directive 'heatmap', ($rootScope, HeatmapDataService, Utils) ->
  restrict: 'A'
  scope: { setFn: '&' }
  link: (scope, element, attrs) ->
    heatmap_data = undefined
    maxscore = undefined
    heatmapChartContainer = undefined
    heatmapOptions = {}
    # opts = scope.$eval(attrs.heatmapOptions)

    leftColCount = 0
    maxwidth = undefined
    maxheight = undefined
    redBgColor = "#cf382f"
    darkGreenBg = "#30a91b"
    colorScheme = []
    unrated_color_code = ""
    highlightedCellColor = "#3b83f7"
    greenColor = '#4CAF50'
    lowestScoreColor = null
    highestScoreColor = null
    greyBgColor = "#eee"
    darkBgColor = "#126b82" #this is DV Blue
    darkGreyBackground = "#dadada"
    maxTopHeaderHeight = 0
    columnHeaderOffset = 10
    columnSubHeaderOffset = 20
    heatMapChartId = HeatmapDataService.getHeatmapChartId()


    scope.generateHeatmap = (opts , data , heatmapChartContainer) ->
      heatmapOptions = opts
      heatmap_data = HeatmapDataService.setHeatMapData(data,opts)
      originalColorScheme = opts.colorScheme
      # clone original array with new reference
      invertedColorScheme = originalColorScheme.slice()
      # reverse the order
      invertedColorScheme = invertedColorScheme.reverse()

      maxscore = opts.max_score
      invertColor = opts.invertColor
      colorScheme = originalColorScheme
      unrated_color_code = opts.unrated_color_code

      if invertColor
        colorScheme = invertedColorScheme

      lowestScoreColor = colorScheme.length - 1
      lowestScoreColor = colorScheme[lowestScoreColor]

      heatmapChartContainer = heatmapChartContainer
      maxwidth = HeatmapDataService.getNewPlotWidth()
      if maxwidth < opts.plotWidth
        maxwidth = opts.plotWidth

      maxheight = HeatmapDataService.getNewPlotHeight()
      document.getElementById(heatmapChartContainer).innerHTML = ""
      draw()
      return

    scope.setFn theDirFn: scope.generateHeatmap


    renderCells = (colorscale) ->
      cells = @svg.selectAll('rect').data(heatmap_data).enter().append('g').append('rect').attr('class', 'bordered').attr('fill', '#fff').attr('stroke', '#bcbcbc').attr('stroke-width', '1px').attr('x', (d) ->
        d.xcoordinate
      ).attr('y', (d) ->
        d.ycoordinate
      ).attr('height', (d) ->
        d.height
      ).attr('width', (d) ->
        d.width
      )

      ### render colors in standard cells ###
      cells.filter((d) ->
        !d.isLeftHeader and !d.isTopHeader and d.colorValue
      ).attr('stroke', (d)->
        Utils.pickTextColorBasedOnBgColorAdvanced(colorscale(d.colorValue))
      ).attr('stroke-width', '0.1px').style 'fill', (d) ->
        score = d.colorValue
        hash = colorscale score
        hash

      cells.filter((d) ->
        d.hasDarkBackground
      ).attr('fill', darkBgColor).attr 'stroke', '#fff'


      cells.filter((d) ->
        d.hasWhiteBackground
      ).attr('fill', '#fff').attr 'stroke', '#fff'

      cells.filter((d) ->
        d.hasGreyBackground
      ).attr('fill', greyBgColor).attr 'stroke', '#9E9E9E'

      cells.filter((d) ->
        d.hasDarkGreyBackground
      ).attr('fill', darkGreyBackground).attr 'stroke', darkGreyBackground

      cells.filter((d) ->
        d.hasRedBackground
      ).attr('fill', lowestScoreColor).attr 'stroke', lowestScoreColor

      cells.filter((d) ->
        d.isNoValueCell
      ).attr('fill', unrated_color_code).attr('stroke', "#666").attr 'stroke-opacity', "0.5"

      cells.filter((d) ->
        d.hasDarkGreenBg
      ).attr('fill', darkGreenBg).attr 'stroke', darkGreenBg

      cells.filter((d) ->
        d.strokeWhite
      ).attr 'stroke', "#fff"

      return

    renderCellTexts = (colorscale) ->
      cellText = @svg.selectAll('.valuesText').data(heatmap_data).enter().append('text')

      ### all left rating headers & text columns ###
      div = d3.select("body").append("div")
          .attr("class", "heatmapTooltip")

      cellText.filter((d) ->
        d.isLeftHeader
      ).attr('x', (d) ->
        d.xcoordinate + (d.width / 2)
      ).attr('y', (d) ->
        (d.ycoordinate + d.height / 2) + 5
      ).on('mouseover', (d) ->
        div.transition().duration(200).style 'opacity', .9
        div.html(d.z).style('left', d3.event.pageX + 'px').style 'top', d3.event.pageY - 28 + 'px'
      ).on('mouseout', (d) ->
        div.transition().duration(500).style 'opacity', 0
      ).attr("text-anchor" , "middle"
      ).text (d) ->
        txt = d.z
        txt

      ### subcategory ratings -- indented ###
      cellText.filter((d) ->
        d.isLeftHeader and d.isIndented
      ).attr('x', (d) ->
        d.xcoordinate + (d.width / 2)
      ).attr('y', (d) ->
        d.ycoordinate + d.height / 2
      ).attr("text-anchor" , "middle")

      cellText.filter((d) ->
        d.isTopHeader
      ).attr('y', (d) ->
        d.ycoordinate + (d.height / d.topHeaderCoordinate)
      ).attr('x', (d) ->
        d.xcoordinate  + (d.width / 2)
      ).attr("text-anchor" , "middle"
      ).on('mouseover', (d) ->
        div.transition().duration(200).style 'opacity', .9
        div.html(d.z).style('left', d3.event.pageX + 'px').style 'top', d3.event.pageY - 28 + 'px'
      ).on('mouseout', (d) ->
        div.transition().duration(500).style 'opacity', 0
      ).tspans (d)->
        text = d.z
        d3.wordwrap(text, d.charsInHeaderCell)
      cellText.each (d)->
        d3.select(this).selectAll('tspan').attr('x', d.xcoordinate  + (d.width / 2))

      cellText.filter((d) ->
        !d.isLeftHeader and d.isTextDisplayed and !d.isTopHeader
      ).attr('x', (d) ->
        xcoor = d.xcoordinate + (d.width / 2)
        xcoor = xcoor - ((d.z.toString().length * 6)/2) if d.z
        xcoor = xcoor - (("#{'N/A'}".length*6)/2) if d.colorValue == 0
        xcoor = xcoor - (("(#{d.weightage}%)".length * 6)/2) if d.weightage
        xcoor
      ).attr('y', (d) ->
        d.ycoordinate + d.height / 2
      )


      cellText.filter((d) ->
        d.isBold
      ).attr 'font-weight', 'bold'

      cellText.filter((d) ->
        d.isItalicized
      ).attr 'font-size', 14

      cellText.filter((d) ->
        !d.isItalicized
      ).attr 'font-size', 14

      cellText.filter((d) ->
        d.isItalicized
      ).attr 'font-style', 'italic'


      cellText.filter((d) ->
        d.isTextDisplayed and !d.isLeftHeader and !d.isTopHeader
      ).text (d) ->
        score = d.z
        if d.colorValue == 0
          score = 'N/A'
          hash = unrated_color_code
        else
          hash = colorscale d.colorValue
        isDarkBg = if Utils.isColorLightOrDark(hash) == 'dark' then true else false
        if isDarkBg
          d.hasWhiteText = true
        score = score + " (#{d.weightage}%)" if d.weightage
        score


      cellText.filter((d) ->
        d.isTextDisplayed and d.hasWhiteText
      ).attr 'fill', 'white'

      return

    draw = () ->
      topRowCount = 2
      @svg = d3.select(element[0]).append("svg").attr('id', heatMapChartId).attr("width", maxwidth).attr("height", maxheight).attr('font-family', 'helvetica').append("g").attr("transform", "translate(0,0)")
      scaleArray = [1..maxscore]
      @colorScale = d3.scale.linear().domain(scaleArray).range(colorScheme)
      renderCells(@colorScale);
      renderCellTexts(@colorScale)
      #wrapText()
      return
