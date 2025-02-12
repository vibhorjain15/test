class NestedQuestionsController extends ModalController
  @register 'NestedQuestionsController'

  @inject 'Restangular', 'question', 'templateId', '$q', 'BaseDataService', 'subCategoryId', 'toaster', 'SweetAlert','$filter', '$scope', '$rootScope'

  initialize: ->
    @getOperators().then =>
      @loading_questions = true

      @loadNestedQuestions(@templateId, @question.id).then (response) =>
        @tree = @buildTree(@question, response.data, response.included)
        @loading_questions = false

        @revealAddQuestionPanel(@tree) unless @tree.children?

  loadNestedQuestions: (templateID, questionID) ->
    @Restangular.all('nestedquestions').customGET('', {
      templateId: templateID,
      questionId: questionID
    }).then (response) =>
      unless @questions?
        @questions = response.data
        @questions.push(@question)
      else
        _(response.data).each (question) =>
          unless _(@questions).findWhere(id: question.id)
            @questions.push(question)

      response

  getOperators: ->
    @BaseDataService.getOperators().then (operators) =>
      @operators = operators

  buildTree: (root_question, questions, rules) ->
    tree_root = @createNode([root_question])

    @appendChildrenToNode(tree_root, questions, rules)

    tree_root

  appendChildrenToNode: (node, questions, rules) ->
    children = []
    remaining_rules = []
    operators = @operators

    _(rules).each (rule) =>
      operator = _(operators).findWhere(id: rule.attributes.operatorID)

      if rule.attributes.questionID is node.question.id
        nested_question = _(questions).findWhere(id: rule.attributes.nestedQuestionId)

        children.push @createNode([nested_question], operator, rule)
      else
        remaining_rules.push(rule)

    if children.length
      node.children = children

      _(children).each (child) =>
        if child.question?
          @appendChildrenToNode(child, questions, remaining_rules)
        else
          _(child.children).each (grand_child) =>
            @appendChildrenToNode(grand_child, questions, remaining_rules)

  getBranchLabel: (operator, rule) ->
    return unless operator? and rule?

    "if #{operator.display_symbol} #{rule.attributes.displayValue}"

  getNodeLabel: (question) ->
    label = if question.attributes? then question.attributes.text else question.text
    @$filter('plaintext')(label)

  createNode: (nested_questions, operator, rule) ->
    return if nested_questions.length is 0

    isLeafNode = (question) ->
      responseType = if question.attributes then question.attributes.responseType else question.responseType

      responseType in ['Bookends', 'Grid', 'CheckBox', 'aumTable',
                        'ReturnTable','Identifier','DynamicGrid', 'Attachment']

    if nested_questions.length > 1
      {
        branch_label: @getBranchLabel(operator, rule),
        children: _(nested_questions).map (nested_question) =>
          {
            node_label: @getNodeLabel(nested_question),
            question: nested_question,
            is_leaf_node: isLeafNode(nested_question)
          }
      }
    else
      question = nested_questions[0]

      {
        node_label: @getNodeLabel(question),
        branch_label: @getBranchLabel(operator, rule),
        question: question,
        is_leaf_node: isLeafNode(question)
      }

  attachRulesToQuestions: (response) ->
    rules = response.included

    _(response.data).each (question) ->
      question.rules = _(rules).where(questionID: question.id)

  revealAddQuestionPanel: (parentNode) ->
    @slide_toggle = true
    @parentNode = parentNode

  promptUserForQuestionRemoval: (node) ->
    title = 'Are you sure you want to delete this question ?'

    if node.children?
      text = "This will also delete the nested/conditional questions"

    @SweetAlert.confirm({
      title: title
      text: text
      confirmButtonText: 'Yes, delete it!'
      showLoaderOnConfirm: true
      focusCancel: true
      preConfirm: =>
        @removeNestedQuestions(node).then =>
          @toaster.pop 'success', '', 'Question deleted successfully!'
        .finally => swal.close()
    })

  removeNestedQuestions: (node) ->
    @Restangular.one('sections', @subCategoryId).one('nestedquestions', node.question.id).remove().then =>
      parent = node.parent
      children = parent.children

      children.splice(children.indexOf(node), 1)

      @chart.update(node, true)
      @$rootScope.$emit 'refresh:template'
      @has_changes = true

  hideAddQuestionPanel: ->
    @slide_toggle = false

  updateTree: (questionID) ->
    @hideAddQuestionPanel()
    parentNode = @parentNode
    @has_changes = true

    @loadNestedQuestions(@templateId, questionID).then (response) =>
      question = _(@questions).findWhere(id: questionID)
      tree = @buildTree(question, response.data, response.included)

      if parentNode.children?
        question_ids = _(parentNode.children).map((node) -> node.question.id)

        _(tree.children).each (child) ->
          unless _(question_ids).contains(child.question.id)
            parentNode.children.push(child)
      else
        parentNode.children = tree.children

      parentNode.selected = false
      @chart.update(parentNode, true)

  cancel: ->
    if @has_changes
      super({reload: true})
    else
      super()

  close: ->
    if @has_changes
      super(reload: true)
    else
      super()
