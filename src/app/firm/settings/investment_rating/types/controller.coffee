class FirmSettingsInvestmentRatingTypesController extends BaseController
  @register 'FirmSettingsInvestmentRatingTypesController'

  @inject 'Restangular', 'Utils', '$q', 'ModalFactory', '$scope','toaster','$timeout','SweetAlert', '$state', 'headerConstants', 'ratingConstants','angularEnabled', '$window'

  initialize: ->
    @ratingDef = {
      categories: []
      subcategories: []
      ratings:[]
    }
    @precision = 0.04000000000000625
    @negativePrecision = @precision * -1
    @loading_rating_schemes = true
    @Restangular.all('rating_types').getList().then (response) =>
      @rating_types = response
      selectedIndex = 0
      if @$state.params.rating_id
        selectedIndex = _(@rating_types).findIndex (rating)=>
          rating.id == parseInt(@$state.params.rating_id)
        if selectedIndex > -1
          @$timeout =>
            ratingElementId = "#rating_scheme_#{@$state.params.rating_id}"
            element = $(".rating-scroll-view ul #rating_scheme_#{@$state.params.rating_id}")
            $('.rating-scroll-view').animate({
              scrollTop: element.offset().top
            }, 500)
          ,2000
        else
          selectedIndex = 0
      @selectRatingType(@rating_types[selectedIndex])
    .finally =>
      @loading_rating_schemes = false
      @isManager = @Utils.isManager()
      if @isManager
        @$window.history.back()
        return
        
  fetchRatingSubTypes: (rating_type) ->
    @loading_categories = true
    #load the rating list and extract category, subcategory and ratings from it.
    @Restangular.all('rating_subtypes').getList(ratingTypeID: rating_type.id, rating_scheme_version: rating_type.version).then (response) =>
      @ratingList = response
      @getCategories()
    .finally => @loading_categories = false

  #generic method to get categories or subcategories or ratings from the rating list based on category_level and
  #parentID
  generateRatingMap:(ratings,parentID,category_level) =>
    return _(ratings).filter ((category) =>
      category.category_level == category_level && category.parent_id == parentID
    )

  selectRatingType: (type) =>
    if type.id
      @resetRating()
      @selectedType = type
      @fetchRatingSubTypes(@selectedType)

  resetRating:() =>
    @ratingDef = {
      categories: []
      subcategories: []
      ratings:[]
    }
    @selectedCategory = null
    @selectedSubCategory = null

  onAddRatingClick: () =>
    editingRatingType = {
      id: null
      name:""
    }
    @ModalFactory.invokeModal 'add_rating_scheme',
      resolve:
        rating_scheme: => editingRatingType
        rating_types: => @rating_types
      success: () =>
        #scroll to the newly added rating
        newRatingElement = $('.rating-scroll-view')
        newRatingElement[0].scrollTop = newRatingElement[0].scrollHeight
        jQuery(".rating-scroll-view").animate({ scrollTop: newRatingElement[0].scrollHeight }, 1000)
        @selectRatingType(@rating_types[@rating_types.length-1])

  onEditRatingType: (type) =>
    unless type.is_system
      editingRatingType = angular.copy type
      @ModalFactory.invokeModal 'add_rating_scheme',
        resolve:
          rating_scheme: => editingRatingType
          rating_types: => @rating_types

  removeRating :(type)=>
    unless type.is_system
      @Restangular.one('rating_types',type.id).remove().then (response) =>
        @toaster.pop 'success', '', 'Your rating type has been deleted successfully'
        index = @rating_types.indexOf type
        @rating_types.splice index,1
        if type.id == @selectedType.id and @rating_types.length > 0
          @selectRatingType(@rating_types[0])
        else if @rating_types.length == 0
          @selectedType = null
          @resetRating()
      .finally(=>
        @updating_rating_type = false
        swal.close()
      )

  getCategories :()=>
    #extract the categories from the rating list
    @ratingDef.categories = @generateRatingMap(@ratingList,null,1)
    #select the first item and get subcategories of that item.
    @getSubcategories(@ratingDef.categories[0])

    @validateCategoryWeightages(@ratingDef.categories)

  getSubcategories :(parent)=>
    if parent != undefined and parent != null
      @selectedCategory = angular.copy parent
      #extract subcategories from the rating list whose parent is the selected category
      @ratingDef.subcategories = @generateRatingMap(@ratingList,@selectedCategory.id,2)
      #select the first item and get ratings of that item
      @getRatings(@ratingDef.subcategories[0])

      @validateSubCategoryWeightages(@ratingDef.subcategories)
    else
      @ratingDef.subcategories = []
      @selectedCategory = null

  getRatings: (parent)=>
    if parent != undefined and parent != null
      @selectedSubCategory = angular.copy parent
      #extract ratings from the rating list whose parent is the selected subcategory
      @ratingDef.ratings = @generateRatingMap(@ratingList,@selectedSubCategory.id,3)
    else
      @ratingDef.ratings = []
      @selectedSubCategory = null

  putToRatingList :(list) =>
    #iterate the list and remove the deleted items from the ratingList, modify the existing items and
    #add new items
    _(list).each((item)=>
      index = _(@ratingList).findIndex ((rating)=>
        item.id == rating.id
      )
      if item.is_active
        @ratingList[index] = angular.copy item
      else
        @ratingList.splice(index,1)

      if index < 0
        @ratingList.push angular.copy item
    )

  confirmRatingDeletion: (type) ->
    unless type.is_system
      @SweetAlert.confirm({
        title: "Are you sure you want to remove this rating?"
        focusCancel: true
        showLoaderOnConfirm: true
        preConfirm: =>
          @removeRating(type)
      })

  openAddCategoryModal: =>
    if @selectedType and not @selectedType.is_system
      @ModalFactory.invokeModal 'manage_risk_rating_categories',
        resolve:
          rating_subtype: => @ratingDef.categories
          parent: => null
          category_level: => 1
          rating_scheme: => @selectedType
          category_type: => "Category"
          ratingList: => @ratingList
        success: (categories) =>
          @putToRatingList(categories)
          @getCategories()


  openAddSubCategoryModal: =>
    if @selectedType and @selectedCategory and not @selectedType.is_system
      @ModalFactory.invokeModal 'manage_risk_rating_categories',
        resolve:
          rating_subtype: => @ratingDef.subcategories
          parent: => @selectedCategory
          category_level: => 2
          rating_scheme: => @selectedType
          category_type: => "Subcategory"
          ratingList: => @ratingList
        success: (subcategories) =>
          @putToRatingList(subcategories)
          @getSubcategories(@selectedCategory)
          @validateCategoryWeightages(@ratingDef.categories)

  openAddRatingsModal: =>
    if @selectedType and @selectedSubCategory and not @selectedType.is_system and @selectedType.rating_level.toLowerCase() != 'section'
      @ModalFactory.invokeModal 'manage_risk_rating_categories',
        resolve:
          rating_subtype: => @ratingDef.ratings
          parent: => @selectedSubCategory
          category_level: => 3
          rating_scheme: => @selectedType
          category_type: => "Rating"
          ratingList: => @ratingList
        success: (ratings) =>
          @putToRatingList(ratings)
          @getRatings(@selectedSubCategory)
          @validateCategoryWeightages(@ratingDef.categories)
          @validateSubCategoryWeightages(@ratingDef.subcategories)

  validateCategoryWeightages:(categories)=>
    _(categories).each((category)=>
      if category.is_active
        ratings = []
        #get the subcategories under this category
        subcategories = @generateRatingMap(@ratingList,category.id,2)
        #calculate the total weightages of these subcategories
        subcategoryTotalWeightage = @getChildWeightages(subcategories)
        #get the subcategory difference
        subcategoryDifference = subcategoryTotalWeightage - category.weightage
        #compare the differences and set the exceeding value appropriately
        if subcategoryDifference > @precision
          category.exceeding_weight = subcategoryDifference
        else if subcategoryDifference < @negativePrecision
          category.exceeding_weight = subcategoryDifference
        else
          #if subcategories weightages doesnt exceed or deceed the category weightage then verify the rating weightages.
          #get the ratings inside all these subcategories
          _(subcategories).each((subcategory)=>
            ratings = ratings.concat @generateRatingMap(@ratingList,subcategory.id,3)
          )
          #get the total weightage of these ratings
          ratingTotalWeightage = @getChildWeightages(ratings)

          #get the rating difference
          ratingDifference = ratingTotalWeightage - category.weightage

          if ratingDifference > @precision
            category.exceeding_weight = ratingDifference
          else if ratingDifference < @negativePrecision
            category.exceeding_weight = ratingDifference
          else
            #if it is not exceeding then set the exceeding_weight to 0
            category.exceeding_weight = 0
    )

  validateSubCategoryWeightages: (subcategories)=>
    _(subcategories).each((subcategory)=>
      if subcategory.is_active
        #get the ratings under the subcategories
        ratings = @generateRatingMap(@ratingList,subcategory.id,3)
        #get total rating weightage
        ratingTotalWeightage = @getChildWeightages(ratings)
        #get the difference
        ratingDifference = ratingTotalWeightage - subcategory.weightage

        #compare the difference and set the exceeding value
        if ratingDifference > @precision
          subcategory.exceeding_weight = ratingDifference
        else if ratingDifference < @negativePrecision
          subcategory.exceeding_weight = ratingDifference
        else
          #otherwise set the exceeding_weight to 0
          subcategory.exceeding_weight = 0
    )


  getChildWeightages: (children)=>
    #method to calculate the weightages
    _(children).reduce(((sum, category) ->
      if category.is_active
        sum + category.weightage
      else
        sum + 0
    ), 0)

  openEditScaleModal: (category, selectedRating, index)=>
    @ModalFactory.invokeModal 'manage_rating_scale',
        resolve:
          category: => category
          selectedRating: => selectedRating
        success: (response) =>
          category.rating_scale_id = response
