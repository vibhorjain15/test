angular.module('diligenceVault').directive 'tilesAdjuster', ($parse) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    averageTileWidth = undefined
    selector = attrs.tileSelector
    minTileWidth = parseInt(attrs.minTileWidth)
    useMaxTileWidth = attrs.useMaxTileWidth and JSON.parse(attrs.useMaxTileWidth)

    setAverageTileWidth = ->
      totalWidth = undefined
      tiles = element.find(selector)
      widthList = _(tiles).map((tile) ->
        $(tile).width('auto').outerWidth()
      )

      if minTileWidth
        widthList.push(minTileWidth)

      if useMaxTileWidth
        averageTileWidth = _.max(widthList)
      else
        totalWidth = _(widthList).reduce(((res, width) ->
          res + width
        ), 0)
        averageTileWidth = totalWidth / tiles.length

    adjustTiles = ->
      marginRight = 10
      tiles = element.find(selector)
      containerWidth = element.outerWidth()
      tileCountPerRow = Math.floor(containerWidth / averageTileWidth)

      ###
          For example: averageTileWidth = 200px & containerWidth = 1020px
          => tileCountPerRow = 5
          But we also need (tileCountPerRow - 1) * marginRight for space between tiles
          in the above example we need 40px which is greater thn 20px residual width (containerWidth - averageTileWidth * tileCountPerRow)

          In cases like these we need to recalculate tileCountPerRow based on it's previous prediction
      ###
      if containerWidth < averageTileWidth * tileCountPerRow + (tileCountPerRow - 1) * marginRight
        tileCountPerRow = Math.floor((containerWidth - ((tileCountPerRow - 1) * marginRight)) / averageTileWidth)

      # Previous count was excluding margin right, hence recalculating
      percentageWidth = 100 / tileCountPerRow

      return if isNaN(tileCountPerRow)

      ###
          For example, there are 3 tiles per row then width woulc become
          calc(33.333% - 6.66px); 3 tiles & last tile won't have margin => (2 * 10)/3
      ###
      tiles.width('calc(' + percentageWidth + '% - ' + (tileCountPerRow - 1) * marginRight / tileCountPerRow + 'px)').css 'margin-right', marginRight

      #if tileCountPerRow = 4 => tiles.filter(:nth-child(4n))
      tiles.filter(':nth-child(' + tileCountPerRow + 'n)').css 'margin-right', 0
      tiles.filter('.clear-both').removeClass 'clear-both'

      #if tileCountPerRow = 4 => tiles.filter(:nth-child(4n + 1))
      tiles.filter(':nth-child(' + tileCountPerRow + 'n + 1)').addClass 'clear-both'

    debouncedAdjustTiles = _.debounce(adjustTiles, 500)

    element.on 'resize', adjustTiles

    $(window).on 'resize', debouncedAdjustTiles

    scope.$on '$destroy', ->
      $(window).off 'resize', debouncedAdjustTiles
      element.off 'resize', adjustTiles

    scope.$watch attrs.tilesAdjuster, (newValue, oldValue) ->
      if newValue and newValue isnt oldValue
        setAverageTileWidth()
        adjustTiles()
        $parse(attrs.tilesAdjuster).assign scope, false
