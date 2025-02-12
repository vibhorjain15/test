angular.module('diligenceVault').directive 'nestedQuestions', ($timeout, d3) ->
  restrict: 'A'
  scope: true
  require: 'nestedQuestions'
  controller: 'NestedQuestionsDirectiveController'

  link: (scope, element, attrs, nestedQuestionsController) ->
    scope.$watch attrs.tree, (root) ->
      if root?
        $timeout ->
          margin =
            top: 35,
            right: 120,
            bottom: 20,
            left: 120
          maxNodesAtDepth = nestedQuestionsController.getMaxNodesAtDepth(root, 0)
          width = maxNodesAtDepth*60 + element.outerWidth()
          treeWidth = maxNodesAtDepth*60 + element.outerWidth()
          height = 600
          tree = d3.layout.tree().size([treeWidth, height])

          scope.getSVGWidth = -> width

          element
            .addClass('nested-questions')

          treeLength = tree.nodes(root)
          minHeight = 50
          viewPort = 400
          lastNode = treeLength.length - 1
          lastElem = treeLength[lastNode].x
          if (lastElem > viewPort)
            height = lastElem + 200

          svg = d3
                  .select(element[0])
                  .append('svg')
                  #Viewbox doesnt work properly in IE hence using the height and width attributes
                  .attr('height', "#{height}px")
                  .attr('width', "#{width}px")
                  .attr('id', 'nested-questions-svg')
                  .append('g')
                  .attr('transform', "translate(0, #{margin.top})")

          d3.select(self.frameElement).style('height', '600px')

          root.x0 = height / 2
          root.y0 = 0

          nestedQuestionsController.setSvgElement(svg)
          nestedQuestionsController.setTree(tree)
          nestedQuestionsController.setHeightWidth({height: height, width: width})
          nestedQuestionsController.draw(root)
