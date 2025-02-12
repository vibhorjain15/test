class DvTemplateBuilderController extends BaseController
  @register 'DvTemplateBuilderController'

  @inject '$attrs', '$scope', 'TemplatesDataService',
          'uiSortableMultiSelectionMethods', 'toaster'

  initialize: ->
    @sortableOptions = @uiSortableMultiSelectionMethods.extendOptions
      connectWith: '.js-questions-container'
      placeholder: 'sortable-placeholder'
    @categories = []

    @$scope.$parent.$watch @$attrs.questions, (value) =>
      @questions = value

    deregisterer = @$scope.$parent.$watch @$attrs.template, (value) =>
      @template = value

      if @template?
        @template.id = @template.templateInfo.id

        @getSections().then (response) =>
          @categories = response

          unless @categories.length
            @addNewCategory()

        deregisterer()

    @watchForEvents()

  moveUp: (list, item, idx) ->
    @swapItems(list, item, list[idx - 1], idx, idx - 1)

  moveDown: (list, item, idx) ->
    @swapItems(list, item, list[idx + 1], idx, idx + 1)

  swapItems: (list, item1, item2, idx1, idx2) ->
    list[idx2] = item1
    list[idx1] = item2

  getNewSubcategory: ->
    {
      name: 'Untitled Subcategory'
      questions: []
    }

  getNewCategory: ->
    {
      name: 'Untitled Category'
      subcategories: [@getNewSubcategory()]
    }

  addNewCategory: ->
    params =
      templateID: @template.id
      name: "Untitled Section"

    @adding_category = true

    @TemplatesDataService.createSection(params).then((response) =>
      @categories.push(response)
    ).finally(=> @adding_category = false)

  getSections: ->
    @TemplatesDataService.getSections(@template.id, {
      isParent: true
    })

  saveTemplate: ->
    params =
      name: @template.templateInfo.name

    @TemplatesDataService
      .saveTemplate(@template.id, params)
      .then (=>
        message = 'Template name is updated'

        @toaster.pop 'success', '', message
      )

  watchForEvents: ->
    @$scope.$on 'move_up:category', (event, category, idx) =>
      @moveUp(@categories, category, idx)

    @$scope.$on 'move_down:category', (event, category, idx) =>
      @moveDown(@categories, category, idx)

    @$scope.$on 'remove:category', (event, category) =>
      @categories.splice(@categories.indexOf(category), 1)

    @$scope.$on 'move_up:item', (event, subcategories, subcategory, idx) =>
      @moveUp(subcategories, subcategory, idx)

    @$scope.$on 'move_down:item', (event, subcategories, subcategory, idx) =>
      @moveDown(subcategories, subcategory, idx)
