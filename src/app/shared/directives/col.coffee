###*
 * @ngdoc directive
 * @name col
 * @restrict A
 *
 * @param {number} col Any value between 1 & 12
 * @param {string=} [colType] Either of `sm`, `lg`, `xl`(`md` is default)
 *
 * @description
 * A convenient directive to specify bootstrap columns
 *
 * @example
 * ## Default Columns
 * `<dic col="4"></div>`
 *
 * Gets compiled to
 *
 * `<dic class="col-md-4"></div>`
 *
 * ## Other column types
 * `<dic col="4" col-type="sm"></div>`
 *
 * Gets compiled to
 *
 * `<dic class="col-sm-4"></div>`
###
angular.module('diligenceVault').directive 'col', ->
  restrict: 'A'
  compile: (element, attributes) ->
    col_type = attributes.colType or 'md'

    element.addClass "col-#{col_type}-#{attributes.col}"
