import Handsontable from "handsontable";
import Choices from "choices.js";
import * as R from "ramda/dist/ramda.js";

var _handsontable = _interopRequireDefault(Handsontable);

var _choices = _interopRequireDefault(Choices);

var _ramda = _interopRequireDefault(R);

function _interopRequireDefault(obj) {
  return { default: obj };
}

function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj &&
        typeof Symbol === "function" &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? "symbol"
        : typeof obj;
    };
  }
  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);
      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);
      if (desc.get) {
        return desc.get.call(receiver);
      }
      return desc.value;
    };
  }
  return _get(target, property, receiver || target);
}

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf(object);
    if (object === null) break;
  }
  return object;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true },
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
      result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}

var TextEditor = _handsontable["default"].editors.TextEditor;
var _Handsontable$dom = _handsontable["default"].dom,
  addClass = _Handsontable$dom.addClass,
  removeClass = _Handsontable$dom.removeClass,
  hasClass = _Handsontable$dom.hasClass;
var TextCellType = _handsontable["default"].cellTypes.text;
var _Handsontable$helper = _handsontable["default"].helper,
  KEY_CODES = _Handsontable$helper.KEY_CODES,
  rangeEach = _Handsontable$helper.rangeEach;
var defaultSeparator = ",";
var EDITOR_HIDDEN_CLASS_NAME = "ht_editor_hidden";
var EDITOR_VISIBLE_CLASS_NAME = "ht_editor_visible";
var classNamesOverride = {
  containerOuter: "multi-select__choices",
  containerInner: "multi-select__choices__inner",
  input: "multi-select__choices__input",
  inputCloned: "multi-select__choices__input--cloned",
  list: "multi-select__choices__list",
  listItems: "multi-select__choices__list--multiple",
  listSingle: "multi-select__choices__list--single",
  listDropdown: "multi-select__choices__list--dropdown",
  item: "multi-select__choices__item",
  itemSelectable: "multi-select__choices__item--selectable",
  itemDisabled: "multi-select__choices__item--disabled",
  itemChoice: "multi-select__choices__item--choice",
  placeholder: "multi-select__choices__placeholder",
  group: "multi-select__choices__group",
  groupHeading: "multi-select__choices__heading",
  button: "multi-select__choices__button",
};

var getSeparator = _ramda["default"].path(["config", "separator"]);

var getLabelKey = _ramda["default"].path(["config", "labelKey"]);

var getValueKey = _ramda["default"].path(["config", "valueKey"]);

var getMaxItemCount = _ramda["default"].path(["config", "maxItemCount"]);

function numberComparator(a, b) {
  return a.value - b.value;
}

var isNumber = function isNumber(value) {
  return typeof value === "number" && isFinite(value);
};

function getTrimmingContainer(base) {
  var rootDocument = base.ownerDocument;
  var rootWindow = rootDocument.defaultView;
  var el = base.parentNode;
  while (el && el.style && rootDocument.body !== el) {
    if (el.style.overflow !== "visible" && el.style.overflow !== "") {
      return el;
    }
    var computedStyle = getComputedStyle(el, rootWindow);
    var allowedProperties = ["scroll", "hidden", "auto"];
    var property = computedStyle.getPropertyValue("overflow");
    var propertyY = computedStyle.getPropertyValue("overflow-y");
    var propertyX = computedStyle.getPropertyValue("overflow-x");
    if (
      allowedProperties.includes(property) ||
      allowedProperties.includes(propertyY) ||
      allowedProperties.includes(propertyX)
    ) {
      return el;
    }
    el = el.parentNode;
  }
  return rootWindow;
}

function offset(element) {
  var rootDocument = element.ownerDocument;
  var rootWindow = rootDocument.defaultView;
  var documentElement = rootDocument.documentElement;
  var elementToCheck = element;
  var offsetLeft;
  var offsetTop;
  var lastElem;
  var box;
  if (
    elementToCheck.firstChild &&
    elementToCheck.firstChild.nodeName === "CAPTION"
  ) {
    // fixes problem with Firefox ignoring <caption> in TABLE offset (see also export outerHeight)
    // http://jsperf.com/offset-vs-getboundingclientrect/8
    box = elementToCheck.getBoundingClientRect();
    return {
      top:
        box.top +
        (rootWindow.pageYOffset || documentElement.scrollTop) -
        (documentElement.clientTop || 0),
      left:
        box.left +
        (rootWindow.pageXOffset || documentElement.scrollLeft) -
        (documentElement.clientLeft || 0),
    };
  }
  offsetLeft = elementToCheck.offsetLeft;
  offsetTop = elementToCheck.offsetTop;
  lastElem = elementToCheck;

  /* eslint-disable no-cond-assign */
  while ((elementToCheck = elementToCheck.offsetParent)) {
    // from my observation, document.body always has scrollLeft/scrollTop == 0
    if (elementToCheck === rootDocument.body) {
      break;
    }
    offsetLeft += elementToCheck.offsetLeft;
    offsetTop += elementToCheck.offsetTop;
    lastElem = elementToCheck;
  }

  // slow - http://jsperf.com/offset-vs-getboundingclientrect/6
  if (lastElem && lastElem.style.position === "fixed") {
    // if(lastElem !== document.body) { //faster but does gives false positive in Firefox
    offsetLeft += rootWindow.pageXOffset || documentElement.scrollLeft;
    offsetTop += rootWindow.pageYOffset || documentElement.scrollTop;
  }
  return {
    left: offsetLeft,
    top: offsetTop,
  };
}

function outerHeight(element) {
  if (element.firstChild && element.firstChild.nodeName === "CAPTION") {
    // fixes problem with Firefox ignoring <caption> in TABLE.offsetHeight
    // jQuery (1.10.1) still has this unsolved
    // may be better to just switch to getBoundingClientRect
    // http://bililite.com/blog/2009/03/27/finding-the-size-of-a-table/
    // http://lists.w3.org/Archives/Public/www-style/2009Oct/0089.html
    // http://bugs.jquery.com/ticket/2196
    // http://lists.w3.org/Archives/Public/www-style/2009Oct/0140.html#start140
    return element.offsetHeight + element.firstChild.offsetHeight;
  }
  return element.offsetHeight;
}

var canFlipDropdown = function canFlipDropdown(handsontableObj, hot) {
  var trimmingContainer = (0, getTrimmingContainer)(
    handsontableObj.view._wt.wtTable.TABLE
  );
  var _element = hot.TEXTAREA_PARENT;
  var isWindowAsScrollableElement = trimmingContainer === hot.hot.rootWindow;
  // var preventOverflow = this.cellProperties.preventOverflow;
  // if (
  //   isWindowAsScrollableElement ||
  //   (!isWindowAsScrollableElement &&
  //     (preventOverflow || preventOverflow === "horizontal"))
  // ) {
  //   return false;
  // }
  var textareaOffset = (0, offset)(hot.TEXTAREA_PARENT);
  var textareaHeight = (0, outerHeight)(hot.TEXTAREA_PARENT);
  var dropdownHeight = 100;
  var trimmingContainerScrollTop = trimmingContainer.scrollTop;
  var headersHeight = (0, outerHeight)(handsontableObj.view._wt.wtTable.THEAD);
  var containerOffset = (0, offset)(trimmingContainer);
  var spaceAbove =
    textareaOffset.top -
    containerOffset.top -
    headersHeight +
    trimmingContainerScrollTop;
  var spaceBelow =
    trimmingContainer.scrollHeight -
    spaceAbove -
    headersHeight -
    textareaHeight;
  var flipNeeded = dropdownHeight > spaceBelow && spaceAbove > spaceBelow;
  return flipNeeded;
};

var MultiSelectEditor = /*#__PURE__*/ (function (_TextEditor) {
  _inherits(MultiSelectEditor, _TextEditor);

  var _super = _createSuper(MultiSelectEditor);

  function MultiSelectEditor() {
    _classCallCheck(this, MultiSelectEditor);

    return _super.apply(this, arguments);
  }

  _createClass(MultiSelectEditor, [
    {
      key: "getValue",

      /**
       * Gets current value from editable element.
       *
       * @returns {String}
       */
      value: function getValue() {
        var valueArray = this.choices.getValue();

        var formattedValues = _ramda["default"].pluck("label", valueArray);

        return formattedValues.join(this.separator);
      },
      /**
       * Prepares editor's meta data.
       *
       * @param {Number} row
       * @param {Number} col
       * @param {Number|String} prop
       * @param {HTMLTableCellElement} td
       * @param {*} originalValue
       * @param {Object} cellProperties
       */
    },
    {
      key: "prepare",
      value: function prepare(
        row,
        col,
        prop,
        td,
        originalValue,
        cellProperties
      ) {
        _get(
          _getPrototypeOf(MultiSelectEditor.prototype),
          "prepare",
          this
        ).call(this, row, col, prop, td, originalValue, cellProperties);

        var type = cellProperties.type;
        this.type = type;

        var selectOptions = _ramda["default"].prop("select", cellProperties);

        this.selectOptions = _ramda["default"].defaultTo({}, selectOptions);
        this.valueKey = getValueKey(this.selectOptions) || "value";
        this.labelKey = getLabelKey(this.selectOptions) || "label";

        if (type === "numeric") {
          this.separator = "|";
          this.maxItemCount = 1;
          this.originalValue = isNumber(originalValue)
            ? originalValue.toString()
            : originalValue;
        } else {
          this.separator = getSeparator(this.selectOptions) || ",";
          this.maxItemCount = getMaxItemCount(this.selectOptions) || -1;
        }
      },
      /**
       * Creates an editor's elements and adds necessary CSS classnames.
       */
    },
    {
      key: "createElements",
      value: function createElements() {
        this.TEXTAREA = document.createElement("select");

        this.TEXTAREA.select = function () {};

        this.TEXTAREA.tabIndex = -1;
        addClass(this.TEXTAREA, "handsontableInput");
        this.TEXTAREA.setAttribute("multiple", true);
        this.TEXTAREA_PARENT = document.createElement("div");
        addClass(this.TEXTAREA_PARENT, "handsontableInputHolder");

        if (hasClass(this.TEXTAREA_PARENT, this.layerClass)) {
          removeClass(this.TEXTAREA_PARENT, this.layerClass);
        }

        addClass(this.TEXTAREA_PARENT, EDITOR_HIDDEN_CLASS_NAME);
        this.textareaStyle = this.TEXTAREA.style;
        this.textareaStyle.width = 0;
        this.textareaStyle.height = 0;
        this.textareaStyle.overflowY = "visible";
        this.textareaParentStyle = this.TEXTAREA_PARENT.style;
        this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
        this.instance.rootElement.appendChild(this.TEXTAREA_PARENT);
      },
      /**
       * Opens the editor and adjust its size.
       */
    },
    {
      key: "open",
      value: function open() {
        var _this = this;

        this.refreshDimensions();
        this.instance.addHook("beforeKeyDown", function (event) {
          return _this.onBeforeKeyDown(event);
        });
        if (this.choices) this.choices.destroy();
        var choicesOptions = {
          classNames: classNamesOverride,
          delimiter: this.separator,
          removeItemButton: true,
          position: "bottom",
          itemSelectText: "",
          maxItemCount: this.maxItemCount,
        };

        if (this.type === "numeric") {
          Object.assign(choicesOptions, {
            sorter: numberComparator,
          });
        }

        this.choices = new _choices["default"](this.TEXTAREA, choicesOptions);

        var getOptions = function getOptions() {
          var options = _this.selectOptions.options;
          var toResolve = typeof options === "function" ? options() : options;
          return Promise.resolve(toResolve).then(function (availableOptions) {
            var originalValue = _this.originalValue;

            if (
              _ramda["default"].isEmpty(originalValue) ||
              _ramda["default"].isNil(originalValue)
            ) {
              return availableOptions;
            }

            var selectedValues = originalValue.split(_this.separator);
            return _ramda["default"].map(function (item) {
              var label = "".concat(
                _ramda["default"].prop(_this.labelKey, item)
              );
              return _ramda["default"].any(
                _ramda["default"].identical(label),
                selectedValues
              )
                ? _ramda["default"].assoc("selected", true, item)
                : item;
            }, availableOptions);
          });
        };

        this.choices.setChoices(getOptions, this.valueKey, this.labelKey, true);
        //copy pasted the code from handsontable codebase to check whether dropdown can be flipped
        var canFlip = canFlipDropdown(this.instance, this);
        if (canFlip) {
          if (!hasClass(this.TEXTAREA_PARENT, "handsontableDropdownTop")) {
            addClass(this.TEXTAREA_PARENT, "handsontableDropdownTop");
          }
        } else {
          if (hasClass(this.TEXTAREA_PARENT, "handsontableDropdownTop")) {
            removeClass(this.TEXTAREA_PARENT, "handsontableDropdownTop");
          }
        }

        this.choices.passedElement.element.addEventListener(
          "change",
          this.onChoicesChange.bind(this)
        );
        this.choices.showDropdown();
        this.TEXTAREA.addEventListener("hideDropdown", this.close.bind(this));
        this.TEXTAREA_PARENT.querySelector("input").addEventListener(
          "keydown",
          this.onBeforeKeyDownOnInput.bind(this)
        );
      },
      /**
       * Closes the editor.
       */
    },
    {
      key: "close",
      value: function close() {
        this.choices.hideDropdown();
        this.autoResize.unObserve();
        this.hideEditableElement();
        this.clearHooks();
      },
    },
    {
      key: "focus",
      value: function focus() {
        this.instance.listen();
      },
      /**
       * Resets an editable element position.
       */
    },
    {
      key: "showEditableElement",
      value: function showEditableElement() {
        this.textareaParentStyle.height = "";
        this.textareaParentStyle.overflow = "";
        this.textareaParentStyle.position = "";
        this.textareaParentStyle.right = "auto";
        this.textareaParentStyle.opacity = "1";
        this.textareaParentStyle.width = "".concat(
          this.getEditedCell().getBoundingClientRect().width,
          "px"
        );
        this.textareaStyle.textIndent = "";
        this.textareaStyle.overflowY = "hidden";
        var childNodes = this.TEXTAREA_PARENT.childNodes;
        var hasClassHandsontableEditor = false;
        rangeEach(childNodes.length - 1, function (index) {
          var childNode = childNodes[index];

          if (hasClass(childNode, "handsontableEditor")) {
            hasClassHandsontableEditor = true;
            return false;
          }
        });

        if (hasClass(this.TEXTAREA_PARENT, EDITOR_HIDDEN_CLASS_NAME)) {
          removeClass(this.TEXTAREA_PARENT, EDITOR_HIDDEN_CLASS_NAME);
        }

        if (hasClassHandsontableEditor) {
          this.layerClass = EDITOR_VISIBLE_CLASS_NAME;
          addClass(this.TEXTAREA_PARENT, this.layerClass);
        } else {
          this.layerClass = this.getEditedCellsLayerClass();
          addClass(this.TEXTAREA_PARENT, this.layerClass);
        }
      },
      /**
       * onChoicesChange callback.
       *
       * @param {Event} event
       */
    },
    {
      key: "onChoicesChange",
      value: function onChoicesChange(event) {
        var choices = this.choices,
          maxItemCount = this.maxItemCount;
        var selected = choices.getValue();

        if (maxItemCount !== -1 && selected.length >= maxItemCount) {
          this.close();
          this.finishEditing();
        }
      },
      /**
       * onBeforeKeyDownOnInput callback.
       *
       * @param {Event} event
       */
    },
    {
      key: "onBeforeKeyDownOnInput",
      value: function onBeforeKeyDownOnInput(event) {
        switch (event.keyCode) {
          case KEY_CODES.ARROW_UP:
          case KEY_CODES.ARROW_DOWN:
            event.preventDefault();
            event.stopPropagation();
            break;

          default:
            break;
        }
      },
      /**
       * onBeforeKeyDown callback.
       *
       * @param {Event} event
       */
    },
    {
      key: "onBeforeKeyDown",
      value: function onBeforeKeyDown(event) {
        var keyCodes = _handsontable["default"].helper.KEY_CODES;
        var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
        // Process only events that have been fired in the editor

        if (event.target.tagName !== "INPUT") {
          return;
        }

        if (
          event.keyCode === 17 ||
          event.keyCode === 224 ||
          event.keyCode === 91 ||
          event.keyCode === 93
        ) {
          // when CTRL or its equivalent is pressed and cell is edited, don't prepare selectable text in textarea
          event.stopImmediatePropagation();
          return;
        }

        var target = event.target;

        switch (event.keyCode) {
          case keyCodes.ARROW_RIGHT:
            if (
              _handsontable["default"].dom.getCaretPosition(target) !==
              target.value.length
            ) {
              event.stopImmediatePropagation();
            }

            break;

          case keyCodes.ARROW_LEFT:
            if (_handsontable["default"].dom.getCaretPosition(target) !== 0) {
              event.stopImmediatePropagation();
            }

            break;

          case keyCodes.ENTER:
            event.stopImmediatePropagation();
            event.preventDefault();
            event.stopPropagation();
            break;

          case keyCodes.A:
          case keyCodes.X:
          case keyCodes.C:
          case keyCodes.V:
            if (ctrlDown) {
              event.stopImmediatePropagation(); // CTRL+A, CTRL+C, CTRL+V, CTRL+X should only work locally when cell is edited (not in table context)
            }

            break;

          case keyCodes.BACKSPACE:
            event.stopImmediatePropagation();
            break;

          case keyCodes.DELETE:
          case keyCodes.HOME:
          case keyCodes.END:
            event.stopImmediatePropagation(); // backspace, delete, home, end should only work locally when cell is edited (not in table context)

            break;

          default:
            break;
        }
      },
    },
  ]);

  return MultiSelectEditor;
})(TextEditor);

export default MultiSelectEditor;
