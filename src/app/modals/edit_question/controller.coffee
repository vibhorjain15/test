class EditQuestionController extends ModalController
  @register 'EditQuestionController'

  @inject 'templateId', 'question_params', 'Restangular', '$scope', '$rootScope', 'TemplatesDataService','Utils','ModalFactory'

  initialize: ->
    @question_params.editSectionOpened = true
    @questions = []
    @mappedQuestions = {}
    @questions.push(@question_params)
    @is_investor = @Utils.isInvestor()

    @edit_question_tree_template = 'modals/edit_question/edit_question_tree.html'
    @loadNestedQuestions()
    @getQuestionMapping() if @is_investor

  groupQuestions: (questions)=>
    @mappedQuestions = {}
    _(questions).each (mapping)=>
      if @mappedQuestions[mapping.mapped_template_id]
        @mappedQuestions[mapping.mapped_template_id].questions.push mapping
      else
        @mappedQuestions[mapping.mapped_template_id] = {
          questions: [mapping]
          mapped_template_id: mapping.mapped_template_id
          mapped_template_name: mapping.mapped_template_name
          mapped_template_version: mapping.mapped_template_version
          isOpen: false
        }

  getQuestionMapping: =>
    @TemplatesDataService.getMappedQuestions(@templateId, @question_params.id).then (response)=>
      @groupQuestions(response)

  loadNestedQuestions: =>
    @Restangular.all('nestedquestions').customGET('', {
      templateId: @templateId,
      questionId: @question_params.id
    }).then (response) =>
      @question_tree = @buildTree(@question_params, response.data, response.included)
      @nested_questions = response.data
      if @nested_questions.length>0
        _(@nested_questions).each (question) =>
          @questions.push(question.attributes)

  buildTree: (root_question, questions, rules) =>
    tree_root = @createNode([root_question])
    @appendChildrenToNode(tree_root, questions, rules)

    tree_root

  appendChildrenToNode: (node, questions, rules) =>
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


  createNode: (nested_questions, operator, rule) =>
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

  getNodeLabel: (question) =>
    if question.attributes? then question.attributes.text else question.text

  getBranchLabel: (operator, rule) ->
    return unless operator? and rule?

    "if #{operator.display_symbol} #{rule.attributes.displayValue}"

  closeAllEditSections: =>
    _(@questions).each (question) =>
      question.editSectionOpened = false

  toggleQuestionEdit: (question) =>
    if !question.editSectionOpened
      @closeAllEditSections()
    question.editSectionOpened = !question.editSectionOpened

  onSave: (question) =>
    question.editSectionOpened = false
    @$rootScope.$emit 'saved:question', question

  addFormula : (question)=>
    @ModalFactory.invokeModal 'add_formula',
      resolve:
        question: => question.attributes