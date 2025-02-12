angular.module('diligenceVault').directive 'jsdiffCompare', ($compile) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    textProperty = attrs.textProperty
    current = null
    previous = null
    consider_null = angular.isDefined attrs.considerNull

    scope.$watch attrs.current, (value) ->
      current = value

      if textProperty? && current?
        current = current[textProperty]

      if consider_null
        current ||= ''

      render()

    scope.$watch attrs.previous, (value) ->
      previous = value

      if textProperty? && previous?
        previous = previous[textProperty]

      if consider_null
        previous ||= ''

      render()

    editDistance = (s1, s2) ->
      s1 = s1.toLowerCase()
      s2 = s2.toLowerCase()
      costs = new Array
      i = 0
      while i <= s1.length
        lastValue = i
        j = 0
        while j <= s2.length
          if i == 0
            costs[j] = j
          else
            if j > 0
              newValue = costs[j - 1]
              if s1.charAt(i - 1) != s2.charAt(j - 1)
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
              costs[j - 1] = lastValue
              lastValue = newValue
          j++
        if i > 0
          costs[s2.length] = lastValue
        i++
      costs[s2.length]

    similarity = (s1, s2) ->
      longer = s1
      shorter = s2
      if s1.length < s2.length
        longer = s2
        shorter = s1
      longerLength = longer.length
      if longerLength == 0
        return 1.0
      (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)

    render = ->
      if current? and previous?
        percentageOfSimilarity = Math.round(similarity(previous , current) * 10000) / 100
        if (percentageOfSimilarity > 70)
            tokens = Diff.diffWordsWithSpace(previous, current)
        else
            tokens = Diff.diffWordsWithSpace(previous, current)

        element.empty()

        angular.forEach tokens, (token) ->
          value = token.value

          if /^\n+$/.test(value)
            value = value.replace(/\n/g, ' \n')

          if token.added
            element.append "<ins>#{value}</ins>"
          else if token.removed
            element.append "<del>#{value}</del>"
          else
            element.append "<span>#{value}</span>"
