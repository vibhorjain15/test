(function (global) {
  "use strict";

  function moduleDefinition(d3) {
    d3.functor = function (value) {
      return typeof value === "function"
        ? value
        : function () {
            return value;
          };
    };

    d3.tip = function () {
      var direction = d3_tip_direction,
        offset = d3_tip_offset,
        html = d3_tip_html,
        node = initNode(),
        svg = null,
        point = null,
        target = null;

      function tip(vis) {
        svg = getSVGNode(vis);
        point = svg.createSVGPoint();
        document.body.appendChild(node);
      }

      // Public - show the tooltip on the screen
      //
      // Returns a tip
      tip.show = function () {
        var args = Array.prototype.slice.call(arguments);
        if (args[args.length - 1] instanceof SVGElement) target = args.pop();

        var content = html.apply(this, args),
          poffset = offset.apply(this, args),
          dir = direction.apply(this, args),
          nodel = getNodeEl(),
          i = directions.length,
          coords,
          scrollTop =
            document.documentElement.scrollTop || document.body.scrollTop,
          scrollLeft =
            document.documentElement.scrollLeft || document.body.scrollLeft;

        nodel.html(content).style({ opacity: 1, "pointer-events": "all" });

        while (i--) nodel.classed(directions[i], false);
        coords = direction_callbacks.get(dir).apply(this);
        nodel.classed(dir, true).style({
          top: coords.top + poffset[0] + scrollTop + "px",
          left: coords.left + poffset[1] + scrollLeft + "px",
        });

        return tip;
      };

      // Public - hide the tooltip
      //
      // Returns a tip
      tip.hide = function () {
        var nodel = getNodeEl();
        nodel.style({ opacity: 0, "pointer-events": "none" });
        return tip;
      };

      // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
      //
      // n - name of the attribute
      // v - value of the attribute
      //
      // Returns tip or attribute value
      tip.attr = function (n, v) {
        if (arguments.length < 2 && typeof n === "string") {
          return getNodeEl().attr(n);
        } else {
          var args = Array.prototype.slice.call(arguments);
          d3.selection.prototype.attr.apply(getNodeEl(), args);
        }

        return tip;
      };

      // Public: Proxy style calls to the d3 tip container.  Sets or gets a style value.
      //
      // n - name of the property
      // v - value of the property
      //
      // Returns tip or style property value
      tip.style = function (n, v) {
        if (arguments.length < 2 && typeof n === "string") {
          return getNodeEl().style(n);
        } else {
          var args = Array.prototype.slice.call(arguments);
          d3.selection.prototype.style.apply(getNodeEl(), args);
        }

        return tip;
      };

      // Public: Set or get the direction of the tooltip
      //
      // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
      //     sw(southwest), ne(northeast) or se(southeast)
      //
      // Returns tip or direction
      tip.direction = function (v) {
        if (!arguments.length) return direction;
        direction = v == null ? v : d3.functor(v);

        return tip;
      };

      // Public: Sets or gets the offset of the tip
      //
      // v - Array of [x, y] offset
      //
      // Returns offset or
      tip.offset = function (v) {
        if (!arguments.length) return offset;
        offset = v == null ? v : d3.functor(v);

        return tip;
      };

      // Public: sets or gets the html value of the tooltip
      //
      // v - String value of the tip
      //
      // Returns html value or tip
      tip.html = function (v) {
        if (!arguments.length) return html;
        html = v == null ? v : d3.functor(v);

        return tip;
      };

      // Public: destroys the tooltip and removes it from the DOM
      //
      // Returns a tip
      tip.destroy = function () {
        if (node) {
          getNodeEl().remove();
          node = null;
        }
        return tip;
      };

      function d3_tip_direction() {
        return "n";
      }
      function d3_tip_offset() {
        return [0, 0];
      }
      function d3_tip_html() {
        return " ";
      }

      var direction_callbacks = new Map();
      direction_callbacks.set("n", direction_n);
      direction_callbacks.set("s", direction_s);
      direction_callbacks.set("e", direction_e);
      direction_callbacks.set("w", direction_w);
      direction_callbacks.set("nw", direction_nw);
      direction_callbacks.set("ne", direction_ne);
      direction_callbacks.set("sw", direction_sw);
      direction_callbacks.set("se", direction_se);
      var directions = direction_callbacks.keys();

      function direction_n() {
        var bbox = getScreenBBox();
        return {
          top: bbox.n.y - node.offsetHeight,
          left: bbox.n.x - node.offsetWidth / 2,
        };
      }

      function direction_s() {
        var bbox = getScreenBBox();
        return {
          top: bbox.s.y,
          left: bbox.s.x - node.offsetWidth / 2,
        };
      }

      function direction_e() {
        var bbox = getScreenBBox();
        return {
          top: bbox.e.y - node.offsetHeight / 2,
          left: bbox.e.x,
        };
      }

      function direction_w() {
        var bbox = getScreenBBox();
        return {
          top: bbox.w.y - node.offsetHeight / 2,
          left: bbox.w.x - node.offsetWidth,
        };
      }

      function direction_nw() {
        var bbox = getScreenBBox();
        return {
          top: bbox.nw.y - node.offsetHeight,
          left: bbox.nw.x - node.offsetWidth,
        };
      }

      function direction_ne() {
        var bbox = getScreenBBox();
        return {
          top: bbox.ne.y - node.offsetHeight,
          left: bbox.ne.x,
        };
      }

      function direction_sw() {
        var bbox = getScreenBBox();
        return {
          top: bbox.sw.y,
          left: bbox.sw.x - node.offsetWidth,
        };
      }

      function direction_se() {
        var bbox = getScreenBBox();
        return {
          top: bbox.se.y,
          left: bbox.e.x,
        };
      }

      function initNode() {
        var node = d3.select(document.createElement("div"));
        node.style({
          position: "absolute",
          top: 0,
          opacity: 0,
          "pointer-events": "none",
          "box-sizing": "border-box",
        });

        return node.node();
      }

      function getSVGNode(el) {
        el = el.node();
        if (el.tagName.toLowerCase() === "svg") return el;

        return el.ownerSVGElement;
      }

      function getNodeEl() {
        if (node === null) {
          node = initNode();
          // re-add node to DOM
          document.body.appendChild(node);
        }
        return d3.select(node);
      }

      // Private - gets the screen coordinates of a shape
      //
      // Given a shape on the screen, will return an SVGPoint for the directions
      // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
      // sw(southwest).
      //
      //    +-+-+
      //    |   |
      //    +   +
      //    |   |
      //    +-+-+
      //
      // Returns an Object {n, s, e, w, nw, sw, ne, se}
      function getScreenBBox() {
        var targetel = target || d3.event.target;

        while (
          "undefined" === typeof targetel.getScreenCTM &&
          "undefined" === targetel.parentNode
        ) {
          targetel = targetel.parentNode;
        }

        var bbox = {},
          matrix = targetel.getScreenCTM(),
          tbbox = targetel.getBBox(),
          width = tbbox.width,
          height = tbbox.height,
          x = tbbox.x,
          y = tbbox.y;

        point.x = x;
        point.y = y;
        bbox.nw = point.matrixTransform(matrix);
        point.x += width;
        bbox.ne = point.matrixTransform(matrix);
        point.y += height;
        bbox.se = point.matrixTransform(matrix);
        point.x -= width;
        bbox.sw = point.matrixTransform(matrix);
        point.y -= height / 2;
        bbox.w = point.matrixTransform(matrix);
        point.x += width;
        bbox.e = point.matrixTransform(matrix);
        point.x -= width / 2;
        point.y -= height / 2;
        bbox.n = point.matrixTransform(matrix);
        point.y += height;
        bbox.s = point.matrixTransform(matrix);

        return bbox;
      }

      return tip;
    };

    function D3punchcard(options) {
      var _this = this;
      // Reverse the data as we draw
      // from the bottom up.
      this.data = options.data.reverse();
      this.element = options.element;
      this.rowHeaderLabel = options.rowHeaderLabel || "value"; // first object in each array of array is row header
      this.colHeaderLabel = options.colHeaderLabel || "key"; //all other objects from second position in array of array are col headers and their values
      this.cellValueLabel = options.cellValueLabel || "value";
      this.disableRowHeadersHover = options.disableRowHeadersHover || false;
      this.disableOriginHover = options.disableOriginHover || false;
      this.originHoverAction = options.originHoverAction;
      this.tooltipText = options.tooltipText;
      this.rowHeaderTextToolTip = options.rowHeaderTextToolTip;
      this.originClick = options.originClick;
      this.originColor = options.originColor || "#000";

      // Find the max value to normalize the size of the circles.
      this.max = d3.max(this.data, function (array) {
        // we ignore the first element as it is metadata
        return d3.max(array.slice(1), function (obj) {
          // and we only return the interger verion of the value, not the key
          return parseFloat(obj[_this.cellValueLabel]);
        });
      });

      // set the upperlimit if we have it
      // otherwise use the max
      if (options.upperLimit) {
        this.upperLimit = options.upperLimit;
      } else {
        this.upperLimit = this.max;
      }
      return this;
    }

    D3punchcard.prototype.originHoverActionEnum = {
      text: 0, //not implemented. Like this - http://bl.ocks.org/kaezarrex/10122633
      tooltip: 1,
    };

    D3punchcard.prototype.draw = function (options) {
      //var origHoverAction = this.originHoverAction == 'text' ? this.originHoverActionEnum.text : this.originHoverActionEnum.tooltip;
      var origHoverAction = this.originHoverActionEnum.tooltip;

      var _this = this,
        margin = 10,
        lineHeight = 5,
        width = options.width,
        paneLeft = 40,
        paneRight = width - paneLeft,
        sectionHeight = 35,
        height = sectionHeight * this.data.length,
        sectionWidth = paneRight / this.data[0].length,
        circleRadius = 14,
        x,
        y,
        punchcard,
        punchcardRow,
        xAxis,
        rScale,
        rowCount = this.data.length;

      // X-Axis.
      x = d3
        .scaleLinear()
        .domain([0, this.data[0].length - 1])
        .range([paneLeft + sectionWidth / 2, paneRight + sectionWidth / 2]);

      // Y-Axis.
      y = d3
        .scaleLinear()
        .domain([0, this.data.length - 1])
        .range([0, height - sectionHeight]);

      rScale = d3
        .scaleLinear()
        .domain([0, this.upperLimit, this.max])
        .range([0, circleRadius, circleRadius]);

      // these functions hide and show the circles and text values
      // function handleRowMouseover() {
      //
      // }
      //
      // function handleRowMouseout() {
      //
      // }

      var tip = d3
        .tip()
        .attr("class", "d3-tip")
        .offset([-10, 0])
        .html(function (d) {
          if (_this.tooltipText || _this.rowHeaderTextToolTip) {
            // if row hdeaer label is hovered call rowHeaderTextToolTip
            if (d[_this.rowHeaderLabel]) {
              return _this.rowHeaderTextToolTip.call(null, d);
            } else {
              return _this.tooltipText.call(null, d);
            }
          } else {
            return "<strong>" + d[_this.cellValueLabel] + "</strong>";
          }
        });

      // The main SVG element.
      punchcard = d3
        .select(this.element)
        .html("")
        .append("svg")
        .attr("width", width)
        .attr("height", height + margin * 3)
        .append("g");

      // register tip function on svg element
      punchcard.call(tip);

      // create the x axis holder
      xAxis = punchcard
        .selectAll(".row")
        .data([this.data[0].slice(1)])
        .enter()
        .append("g")
        .attr("class", "xaxis");

      // create the x axis line
      xAxis
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", margin * 3)
        .attr("y2", margin * 3)
        .style("stroke-width", 1)
        .style("stroke", "#efefef");

      // create x-axis ticks
      xAxis
        .selectAll("line.tick")
        .data(function (d, i) {
          return d;
        })
        .enter()
        .append("line")
        .attr("class", "tick")
        .attr("x1", function (d, i) {
          return paneLeft + x(i);
        })
        .attr("x2", function (d, i) {
          return paneLeft + x(i);
        })
        .attr("y1", function (d, i) {
          return margin * 2;
        })
        .attr("y2", function (d, i) {
          return margin * 3;
        })
        .style("stroke-width", 1)
        .style("stroke", "#efefef");

      // create x-axis tick text.
      xAxis
        .selectAll(".rule")
        .data(function (d, i) {
          return d;
        })
        .enter()
        .append("text")
        .attr("class", "rule")
        .attr("x", function (d, i) {
          return paneLeft + x(i);
        })
        .attr("y", margin + lineHeight)
        .attr("text-anchor", "middle")
        .text(function (d) {
          return d[_this.colHeaderLabel];
        });

      // create rows
      punchcardRow = punchcard
        .selectAll(".row")
        .data(this.data)
        .enter()
        .append("g")
        .attr("class", "row")
        .attr("rowIdx", function (d, i) {
          return i;
        })
        .attr("transform", function (d, i) {
          var ty = height - y(i) - sectionHeight / 2 + margin * 3;
          return "translate(0, " + ty + ")";
        });

      // create row divinding lines
      punchcardRow
        .selectAll("line")
        .data([0])
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", sectionHeight / 2)
        .attr("y2", sectionHeight / 2)
        .style("stroke-width", 1)
        .style("stroke", "#efefef");

      // create row headers
      var textHeaders = punchcardRow
        .selectAll(".textheader")
        .data(function (d, i) {
          // we only return the first element of each array
          // which contains the header text
          return [d[0]];
        })
        .enter()
        .append("text")
        .attr("x", 0)
        .attr("y", function (d, i) {
          return lineHeight;
        })
        .attr("class", "textheader")
        .attr("text-anchor", "left")
        .style("cursor", "pointer")
        .text(function (d, i) {
          return d[_this.rowHeaderLabel];
        });

      if (!this.disableRowHeadersHover) {
        textHeaders.on("mouseover", function (data) {
          // call tip method on mouseover
          if (data) {
            tip.show(data);
          }
          var g = d3.select(this).node().parentNode;
          d3.select(g).selectAll("circle").style("display", "none");
          d3.select(g).selectAll("text.value").style("display", "block");
        });
        textHeaders.on("mouseout", function () {
          // Hide tooltip on mouseout
          tip.hide();
          var g = d3.select(this).node().parentNode;
          d3.select(g).selectAll("circle").style("display", "block");
          d3.select(g).selectAll("text.value").style("display", "none");
        });
      }

      // draw circles for each row
      var punchCardCircle = punchcardRow
        .selectAll("circle")
        .data(function (d, i) {
          return d.slice(1);
        })
        .enter()
        .append("circle")
        .style("fill", this.originColor)
        .attr("r", function (d, i) {
          return rScale(parseFloat(d[_this.cellValueLabel]));
        })
        .attr("transform", function (d, i) {
          var tx = paneLeft + x(i);
          return "translate(" + tx + ", 0)";
        });

      if (!this.disableOriginHover) {
        // draw labels for hover on circles
        var dotLabels = punchcardRow
          .selectAll(".dot-label")
          .data(function (d, i) {
            return d.slice(1);
          });

        var dotLabelEnter = dotLabels
          .enter()
          .append("g")
          .attr("class", "dot-label")
          .attr("colIdx", function (d, i) {
            return i + 1; //+1 for row header labels
          })
          .style("cursor", "pointer")
          .on("mouseover", tip.show)
          .on("mouseout", tip.hide);

        dotLabelEnter
          .append("text")
          .style("text-anchor", "middle")
          .style("fill", "#ffffff")
          .style("opacity", 0);

        if (this.originClick) {
          dotLabelEnter.on("click", function (d) {
            colIdx = d3.select(this).attr("colIdx");
            rowIdx = d3.select(this.parentNode).attr("rowIdx");
            _this.originClick.call(null, [
              _this.data[rowIdx][0],
              _this.data[rowIdx][colIdx],
            ]);
          });
        }
        dotLabels.exit().remove();
        dotLabels
          .attr("transform", function (d, i) {
            var tx = paneLeft + x(i);
            return "translate(" + tx + ", 5)";
          })
          .select("text")
          .text(function (d, i) {
            return d[_this.cellValueLabel];
          });
      }
      // draw text values for each row
      punchcardRow
        .selectAll("text.value")
        .data(function (d, i) {
          return d.slice(1);
        })
        .enter()
        .append("text")
        .attr("class", "value")
        .style("display", "none")
        .text(function (d, i) {
          return d[_this.cellValueLabel];
        })
        .attr("text-anchor", "middle")
        .attr("x", function (d, i) {
          return paneLeft + x(i);
        })
        .attr("y", function (d, i) {
          return lineHeight;
        });

      return this;
    };

    /**
     * Expose D3punchcard
     */

    return D3punchcard;
    // ---------------------------------------------------------------------------
  }

  if (typeof exports === "object") {
    // node export
    module.exports = moduleDefinition(require("d3"));
  } else if (typeof define === "function" && define.amd) {
    // amd anonymous module registration
    define(["d3"], moduleDefinition);
  } else {
    // browser global
    global.D3punchcard = moduleDefinition(global.d3);
  }
})(this);
