class NestedQuestionsDirectiveController extends BaseController
  @register 'NestedQuestionsDirectiveController'

  @inject '$scope', '$attrs', 'd3', '$stateSuccessText', '$parse', '$stateDangerText', '$timeout'

  initialize: ->
    name = @$attrs.name
    @question = @$scope.$eval(@$attrs.question)
    @previous_selection = null

    @height = null
    @width = null
    @lastElem = null
    @viewPort = 400

    if name?
      @$parse(name).assign(@$scope.$parent, @)

    @$scope.$on '$destroy', ->
      d3.selectAll(".d3-tip").remove()

  setSvgElement: (svg) ->
    @svg = svg

  setTree: (tree) ->
    @tree = tree

  getMaxNodesAtDepth: (tree, max)=>
    if tree.children and tree.children.length > max
      max =  tree.children.length
    _(tree.children).each (node)=>
      max = @getMaxNodesAtDepth(node, max)
    max



  onAdd: (d) ->
    return if d.is_leaf_node

    @$timeout =>
      @$scope.$eval(@$attrs.onAdd, {question: d})

  onRemove: (d) ->
    return if d.is_root

    @$timeout =>
      @$scope.$eval(@$attrs.onRemove, {question: d})

  revealNodeControls: (d) =>
    return if d.selected

    if @previous_selection? and @previous_selection isnt d
      @previous_selection.selected = false

    d.selected = true

    @previous_selection = d

    @update(d)

  hideNodeControls: (d) =>
    return unless d.selected

    d.selected = false

    @update(d)

  toggleNodeSelection: (d) =>
    return if d is @root

    if @previous_selection? and @previous_selection isnt d
      @previous_selection.selected = false

    d.selected = !d.selected

    @previous_selection = d

    @update(d)

  setHeightWidth: (size) ->
    @height = size.height
    @width = size.width

  getHeight: (length) ->
    minHeight = 100
    if @lastElem >= @viewPort
      @height = length * minHeight
      svg = $('#nested-questions-svg')
      if svg
        svg.attr('height', "#{@height}px")
        svg.attr('width', "#{@width}px")

  draw: (root) ->
    @root = root
    @root.is_root = true
    @i = 0
    @lastElem = @root.x
    @update(root, true)

  getNodeCountByDepth: (root) ->
    nodes = @tree.nodes(@root)

    depth_values = _(nodes).pluck('depth')
    depth_count_map = {}

    _(depth_values).each (value) ->
      unless depth_count_map[value]
        depth_count_map[value] = 0

      depth_count_map[value] += 1

    depth_count_map

  update: (source, recalculate_node_count_by_depth) ->
    if recalculate_node_count_by_depth
      @node_count_by_depth = @getNodeCountByDepth(@root)
      #node_count_by_depth has the deepest path and its length will get us the number of nodes in that path.
      @getHeight(Object.keys(@node_count_by_depth).length)

    nodes = @tree.nodes(@root).reverse()
    links = @tree.links(nodes)
    nodeColor = @$stateSuccessText
    leafNodeColor = @$stateDangerText
    duration = 300
    diagonal = @d3.svg.diagonal().projection (d) -> [d.x, d.y]
    rectWidth = 60 #2*controlWidth + nodeWidth = 2 *(2*control_radius) + 2*node_circle_radius + some spacing = 2*2*10 + 2*4.5 + 10 = 59 + 1
    rectHeight = 40 #1*controlHeight + nodeHeight = 2*2*control_radius + 2*node_circle_radius + some spacing = 2*10 + 2*4.5 + 10 = 39
    nodeColorPicker = (d) ->
      if d.selected
        if d.is_leaf_node then leafNodeColor else nodeColor
      else
        '#fff'

    nodes.forEach (d) -> d.y = d.depth * 100

    nodeWrapper = @svg
            .selectAll('g.node-wrapper')
            .data(nodes, (d) => (d.id or d.id = ++@i))

    nodeWrapperEnter = nodeWrapper
                        .enter()
                        .append('g')
                        .attr('class', 'node-wrapper')
                        .attr('transform', (d) -> "translate(#{source.x0}, #{source.y0})")

    svg_width = @$scope.getSVGWidth()
    node_count_by_depth = @node_count_by_depth

    wrap = (d) ->
      self = d3.select(@)
      text = d.node_label
      text_max_width = (svg_width/node_count_by_depth[d.depth]) - 20
      width = text_max_width - 50 # 20px padding

      if (text isnt self.text())
        # this is when you delete/add a child node, you need to
        # recalculate existing node text width
        self.text(text)

      text_length = self.node().getComputedTextLength()
      while (text_length > width and text.length > 0)
        text = text.slice(0, -1)
        self.text("#{text}...")
        text_length = self.node().getComputedTextLength()

    node_label_tooltip = d3.tip().attr('class', 'd3-tip').html((d) -> d.node_label)

    @svg.call(node_label_tooltip)

    node_label_text_nodes = nodeWrapperEnter
      .append('text')
      .attr('y', (d) ->
        if d.children
          -20
        else
          20
      )
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .text((d) -> d.node_label)
      .attr('class', 'question-text')
      .style('fill-opacity', 1e-6)
      .each(wrap)
      .style('cursor', (d) ->
        text = d3.select(@).text()
        if text isnt d.node_label
          'auto'
        else
          'auto'
      )
      .on('mouseover', (d) ->
        text = d3.select(@).text()

        if text isnt d.node_label
          node_label_tooltip.show.apply(@, arguments)
      )
      .on('mouseout', node_label_tooltip.hide)

    nodeWrapperEnter
      .append('text')
      .attr('y', (d) ->
        -45
      )
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('class', 'response-value')
      .text((d) -> d.branch_label)
      .style('fill', '#777')

    nodeWrapper
      .selectAll('.question-text')
      .each(wrap)

    node = nodeWrapperEnter
              .append('g')
              .attr('class', (d) ->
                if d.is_leaf_node
                  'node leaf-node'
                else
                  'node'
              )

    node
      .append('rect')
      .attr('class', 'event-capturer')
      .attr('x', -rectWidth/2)
      .attr('y', -rectHeight/2)
      .attr('width', rectWidth)
      .attr('height', rectHeight)

    node
      .append('circle')
      .on("mouseenter", @revealNodeControls)
      .attr('r', 1e-6)
      .style('fill', nodeColorPicker)

    node
      .on('mouseleave', @hideNodeControls)

    plusButton = node
                  .append('g')
                  .attr('class', 'node-controls plus-button hidden')
                  .on('click', (d) => @onAdd(d))

    plusButton
      .append('circle')
      .attr('cx', -20)
      .attr('cy', -25)
      .attr('r', 1e-6)

    plusButton
      .append('text')
      .attr('x', -20)
      .attr('y', -25)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .text('+')

    minusButton = node
                    .append('g')
                    .attr('class', 'node-controls minus-button hidden')
                    .on('click', (d) => @onRemove(d))

    minusButton
      .append('circle')
      .attr('cx', 20)
      .attr('cy', -25)
      .attr('r', 1e-6)

    minusButton
      .append('text')
      .attr('x', 20)
      .attr('y', -25)
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .text('-')

    nodeUpdate = nodeWrapper
                  .transition()
                  .duration(duration)
                  .attr('transform', (d) -> "translate(#{d.x}, #{d.y})")

    nodeUpdate
      .select('circle')
      .attr('r', 9)
      .style('fill', nodeColorPicker)

    nodeUpdate
      .select('text')
      .style('fill-opacity', 1)

    nodeUpdate
      .selectAll('.node-controls')
      .attr('class', (d) -> if d.selected then 'node-controls' else 'node-controls hidden')

    nodeUpdate
      .selectAll('.plus-button')
      .attr('class', (d) ->
        if d.is_leaf_node then 'node-controls plus-button disabled' else 'node-controls plus-button'
      )

    nodeUpdate
      .selectAll('.minus-button')
      .attr('class', (d) ->
        if d.is_root then 'node-controls minus-button disabled' else 'node-controls minus-button'
      )

    nodeUpdate
      .selectAll('.node-controls circle')
      .attr('r', (d) -> if d.selected then 10 else 1e-6)

    nodeExit = nodeWrapper
                .exit()
                .transition()
                .duration(duration)
                .attr('transform', (d) -> "translate(#{source.x}, #{source.y})")
                .remove()

    nodeExit.select('circle').attr('r', 1e-6)
    nodeExit.select('text').style('fill-opacity', 1e-6)

    link = @svg.selectAll('path.link').data(links, (d) -> return d.target.id)

    linkEnter = link
                  .enter()
                  .insert('path', 'g')
                  .attr('class', 'link')
                  .attr('id', (d, i) -> "link_#{i}")
                  .attr('d', (d) ->
                    o = {x: source.x0, y: source.y0}
                    diagonal({source: o, target: o})
                  )

    linkEnter
      .append('text')
        .attr('x', 10)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .append('textPath')
      .attr('xlink:href', (d, i) -> "#link_#{i}")
      .text((d) -> d.answer)

    link
      .transition()
      .duration(duration)
      .attr('d', diagonal)

    link
      .exit()
      .transition()
      .duration(duration)
      .attr('d', (d) ->
        o = {x: source.x, y: source.y}
        diagonal({source: o, target: o})
      )
      .remove()

    nodes.forEach((d) ->
      d.x0 = d.x
      d.y0 = d.y
    )

    if source.children?
      source.children.forEach (child) =>
        @update(child)
