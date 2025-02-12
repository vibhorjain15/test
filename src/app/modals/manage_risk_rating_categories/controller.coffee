class ManageRiskRatingCategoriesController extends ModalController

  @register 'ManageRiskRatingCategoriesController'

  @inject 'rating_subtype', '$scope', '$timeout', 'Restangular','parent','category_level','rating_scheme','category_type','$filter','ratingList','SweetAlert'

  initialize: ->
    @rating_categories = angular.copy(@rating_subtype)
    @maxWeightage = if @parent == null then 'Infinite' else @parent.weightage
    ###
      How did we arrive at this value?

      Assuming users won't add more than 15 categories & if they are using "Assign weightage equally" checkbox
      We'll do the division ourselves for them &  the weightage can have only 2 digits after decimal point

      100/1 = 100
      100/2 = 50
      100/3 = 33.33
      .
      .
      .
      100/15 = 6.66

      Now in case of 3 equally weighed categories, they won't sum up to 100 :(
      33.33 * 3 = 99.99 (0.01 missing)

      Now we found out the max "missing" value for all these 15 numbers & it is 0.04000000000000625

      What if there are 16 categories? Let's decide when the usecase comes up
    ###
    @precision = 0.04000000000000625
    @addRatingCategory() unless @rating_categories.length

    @piechartConfig =
      data:
        type: 'pie'
        columns: []
        colors:
          'Unallocated Weightage': '#DD2C00'
      color:
        pattern: ['#AA00FF','#6200EA','#2962FF','#00B8D4','#00C853','#64DD17','#FFD600','#FFAB00','#455A64']
      pie:
        label:
            format: (value, ratio, id) =>
                @$filter('number')(value,1)+"%"
      tooltip:
        format:
            value: (value, ratio, id) =>
                @$filter('number')(value,1)+"%"


    setPieChartColumns = _.debounce(@setPieChartColumns, 300)

    @$scope.$watch 'vm.rating_categories', (rating_categories) =>
      #its a valid category only if it has a name, weightage and the name is unique in the list
      valid_categories = _(rating_categories).filter (item) =>
        item.name && item.weightage >= 0 && @isUniqueCategoryName(item.name)

      @setValidationMessage()

      return if @valid_categories?.length is 0 and valid_categories.length is 0

      @manage_rating_categories_form.$setPristine() if @manage_rating_categories_form.$submitted

      @valid_categories = valid_categories

      setPieChartColumns()
    , true

    @$scope.$watch 'vm.weigh_categories_equally', (value) =>
      @weighCategoriesEqually() if value


  initializePieChart: ->
    columns = _(@rating_categories).map (category) ->
      [category.name, category.weightage]

  setPieChartColumns: =>
    @$scope.$apply => #because this method is being debounced, which takes the context outside of angular digest loop
      columns = _(@valid_categories).map (category) ->
        [category.name, category.weightage]

      @unallocated_weightage = @getUnallocatedWeightage(@valid_categories)

      if @unallocated_weightage > 0 and @unallocated_weightage > @precision
        columns.push ['Unallocated Weightage', @getUnallocatedWeightage(@valid_categories)]

      @piechartConfig.data.columns = columns

  removeCategory: (category) ->
    #set category is_active attribute to false if it has an id attribute, otherwise remove the item from the list
    if category.id
      @confirmRatingDeletion(category)
    else
      index = @rating_categories.indexOf category
      @rating_categories.splice(index, 1)
      @weighCategoriesEqually() if @weigh_categories_equally

  confirmRatingDeletion: (category) ->
    message = ""
    if category.category_level == 1
      message = "All the subcategories and ratings under this category will be lost"
    else if category.category_level == 2
      message = "All the ratings under this subcategory will be lost"
    else
      message = ""
    @SweetAlert.confirm({
      title: "Are you sure you want to remove this item?"
      text: message
      showLoaderOnConfirm: true
      confirmButtonText: 'Confirm'
      cancelButtonText: 'Cancel'
      focusCancel: true
      preConfirm: =>
        category.is_active = false
        @weighCategoriesEqually() if @weigh_categories_equally
    })

  getUnallocatedWeightage: (rating_categories) ->
    if @maxWeightage != 'Infinite'
      totalWeightage = _(rating_categories).reduce(((sum, category) ->
        if category.is_active
          sum + category.weightage
        else
          sum + 0
      ), 0)
      totalWeightage = Math.floor(100 * totalWeightage) / 100
      unallocated = @maxWeightage - totalWeightage
      unallocated
    else
      0

  weighCategoriesEqually: ->
    if @maxWeightage != 'Infinite'
      weight = @maxWeightage/@rating_categories.filter((category)=>category.is_active).length

    _(@rating_categories).each (category) ->
      # (6.666666666).toFixed() => 6.67
      # using the formular below we get 6.66
      category.weightage = Math.floor(100 * weight) / 100 if category.is_active

  addRatingCategory: ->
    @rating_categories.push {
        ratingSubTypeID: @rating_subtype.id
        is_active:true
        category_level : @category_level
        parent_id : if @parent then @parent.id else null
        rating_scheme_id : @rating_scheme.id
      }
    @weighCategoriesEqually() if @weigh_categories_equally

  isUniqueCategoryName: (categoryName) =>
    status = @rating_categories.filter((category) => category.is_active and category.name == categoryName).length == 1
    status

  setValidationMessage: =>
    _(@manage_rating_categories_form.$$controls).each((formItem)=>
      if formItem.$name and formItem.$name.indexOf('categories_') > -1 and formItem.$modelValue
        map = _(@rating_categories).filter((category)=>
          category.is_active and category.name == formItem.$modelValue
        )
        occurence = map.length
        formItem.$setValidity('duplicateCategory', occurence < 2)
    )

  submit: ->
    if @unallocated_weightage >= 0 and @unallocated_weightage <= @precision and @valid_categories.length > 0 and @manage_rating_categories_form.$valid
      params = _(@rating_categories).map (category) =>
        map = _(category).pick('id', 'name','description', 'weightage', 'ratingSubTypeID','category_level','parent_id','rating_scheme_id','is_active', 'rating_scheme_version')
        map
      @saving = true
      url = 'rating_schems/' + @rating_scheme.id + '/versions/' + @rating_scheme.version + '/categories'
      @Restangular
        .all(url).post(params)
        .finally => @saving = false
        .then (response) =>
          @close(response)

  generateRatingMap:(ratings,parentID,category_level) =>
    return _(ratings).filter ((category) =>
      category.category_level == category_level && category.parent_id == parentID
    )
