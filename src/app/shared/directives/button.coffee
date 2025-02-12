###*
 * @ngdoc directive
 * @name button
 * @restrict E
 *
 * @param {string=} btnType If it is specified as `btn-type="default"`, Adds `btn-default` class
 * & so on. `<button type="submit"` need not add this property, because
 * to maintain consistent styling for primary actions, this directive adds
 * `btn-primary` to all `[type="submit"]` buttons.
 *
 * @param {string=} size If `size="sm"` is specified, adds `btn-sm` & so on
 *
 * @param {attribute=} block `<button block type="success"` will have `btn-block`, `btn-success` classes
 *
 * @description
 * A convenient directive which adds appropriate bootstrap `btn-*` classes.
 * Adds `btn` class in addition to style, size related classes which could be
 * specified via additional attributes
 *
 * @example
 * ## All buttons get `btn` class
 *
 * `<button>Action</button>`
 *
 * Gets compiled to
 *
 * `<button class="btn">Action</button>`
 *
 * ## Submit buttons in form
 * To maintain consistency all `submit` buttons are added `btn-primary` class
 *
 * `<button type="submit">Submit</button>`
 *
 * Gets compiled to
 *
 * `<button class="btn btn-primary">Submit</button>`
 *
 * ## Style attributes
 * Specify styled related classes using `btn-type` attribute
 *
 * `<button btn-type="success">Submit</button>`
 *
 * Gets compiled to
 *
 * `<button class="btn btn-success">Submit</button>`
 *
 * ## Size attributes
 * Specify styled related classes using `size` attribute
 *
 * `<button btn-type="default" size="sm">Small Button</button>`
 *
 * Gets compiled to
 *
 * `<button class="btn btn-default btn-sm">Small Button</button>`
 *
 * ## Block buttons
 * Just add the attribute `block`
 *
 * `<button btn-type="default" size="sm" block>Small Block Button</button>`
 *
 * Gets compiled to
 *
 * `<button class="btn btn-default btn-sm btn-block">Small Block Button</button>`
 *
 ###

angular.module('diligenceVault').directive 'button', ->
  restrict: 'E'
  compile: (element, attributes) ->
    if attributes.size
      element.addClass "btn-#{attributes.size}"

    if angular.isDefined(attributes.block)
      element.addClass 'btn-block'

    if attributes.type is 'submit' && !angular.isDefined(attributes.submitStyleOverride)
      element.addClass('btn').addClass('btn-primary')
      return

    if !angular.isDefined(attributes.type)
      element.attr('type', 'button')

    type = attributes.btnType

    return unless type?

    element.addClass 'btn' unless type is 'link'

    element.addClass "btn-#{type}"

