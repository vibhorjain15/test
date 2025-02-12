###*
 * @ngdoc directive
 * @name chosen
 * @restrict A
 *
 * @description
 * We use [chosen](https://github.com/leocaseiro/angular-chosen) to provide dropdown
 * autocomplete functionality. This is a wrapper for the same to handle how the dropdown
 * is shown(below/above the element).
 *
 * If your scroll position is at the bottom of the page, it's helpful if the dropdown
 * is shown above the element & vice versa.
 *
 * ## Gotchas
 * <p class="alert alert-warning">
 * The directive `chosen` won't work if you don't have `data-ng-model` specified
 * </p>
 *
 * <p class="alert alert-warning">
 * Also important: if your ngModel is `null` or `undefined`, you must manually
 * include an empty option inside your `<select>`, otherwise you'll encounter strange off-by-one errors:
 * </p>
 *
 * Basically always include
 * `<option value="">Select Item</option>`
 *
 * OR atleast the following
 *
 * `<option value=""></option>`
 *
 * In addition to `data-ng-options`
 *
 * @example
 *
 * More details on directive usage can be found at [angular-chosen](https://github.com/leocaseiro/angular-chosen)
###
angular.module('diligenceVault').directive 'chosen', ($timeout) ->
  restrict: 'A'
  link: (scope, element, attrs) ->
    $timeout ->
      if angular.isDefined(attrs.chosenCalculatedWidth)
        element.next().width(element.width())
      else
        element.next().width('100%')


    element.on 'chosen:showing_dropdown', (event, params) ->
       chosen_container = $( event.target ).next( '.chosen-container' )
       dropdown = chosen_container.find( '.chosen-drop' )
       dropdown_top = dropdown.offset().top - $(window).scrollTop()
       dropdown_height = dropdown.height()
       viewport_height = $(window).height()

       if (dropdown_top + dropdown_height > viewport_height)
          chosen_container.addClass( 'chosen-dropup' )

    element.on 'chosen:hiding_dropdown', (event, params) ->
      $( event.target ).next( '.chosen-container' ).removeClass( 'chosen-dropup' )
