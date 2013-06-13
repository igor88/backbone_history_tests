var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define(['underscore', 'backbone', 'benchmark', 'cs!lib/settings', 'cs!lib/point'], function(_, Backbone, Benchmark, settings, point) {
  /*

    Base class to work with the data (without renderings)
  */

  var ImageProcessor;
  return ImageProcessor = (function(_super) {

    __extends(ImageProcessor, _super);

    ImageProcessor.prototype.initialize = function() {
      this.benchmarkOptions = {
        maxTime: 0.5
      };
      this.suite = new Benchmark.Suite;
      return this.benchmarkTestObj = {};
    };

    function ImageProcessor() {
      ImageProcessor.__super__.constructor.apply(this, arguments);
      this.on('change:data', this.loadImage, this);
      this.on('image:loaded', this.showBoundingBox, this);
      this.on('created:boundingBox', this.scaleBodyContour, this);
      this.on('done:bodyContour', this.drawInitialBodyContour, this);
    }

    ImageProcessor.prototype.benchmarkTest = function(name, fn, params) {
      var _this = this;
      if (!this.benchmarkTestObj[name]) {
        this.benchmarkTestObj[name] = true;
        return this.suite.add(name, function() {
          return fn;
        }, this.benchmarkOptions).on("cycle", function(event) {
          return console.log(String(event.target));
        }).run();
      }
    };

    ImageProcessor.prototype.parseData = function(data) {
      if (data != null) {
        return this.set('data', data);
      }
    };

    ImageProcessor.prototype.getR = function() {
      if (this.r != null) {
        return this.r;
      }
      return this.r = Raphael('holder', this.width, this.height);
    };

    ImageProcessor.prototype.getR2 = function() {
      if (this.r2 != null) {
        return this.r2;
      }
      return this.r2 = Raphael('holder2', settings.zoomed_paper_width, settings.zoomed_paper_height);
    };

    ImageProcessor.prototype.loadImage = function() {
      var data, originial_height, originial_width, parts, r;
      data = this.get('data');
      if (/error/.test(data)) {
        return this.trigger('error', 'Could not save the image, please try again');
      }
      parts = data.split(";");
      this.image_link = parts[0];
      this.image_name = parts[0].split("/")[1];
      originial_width = parts[1].split("-")[0];
      originial_height = parts[1].split("-")[1];
      this.height = settings.image_height;
      this.width = this.height * originial_width / originial_height;
      r = this.getR();
      r.setViewBox(0, 0, r.width, r.height);
      this.image = r.image(this.image_link, 0, 0, this.width, this.height);
      return this.trigger('image:loaded', {
        width: this.width,
        height: this.height
      });
    };

    ImageProcessor.prototype.showBoundingBox = function() {
      var height, width, x0, y0;
      x0 = this.width * settings.boundingBox_x;
      y0 = this.height * settings.boundingBox_y;
      width = this.width * settings.boundingBox_width;
      height = this.height * settings.boundingBox_height;
      this.boundingBox = this.getR().rect(x0, y0, width, height);
      this.boundingBox.attr({
        fill: settings.boundingBox_fill,
        stroke: settings.boundingBox_stroke,
        "fill-opacity": settings.boundingBox_fill_opacity,
        "stroke-width": settings.boundingBox_stroke_width,
        "stroke-opacity": settings.boundingBox_stroke_opacity,
        cursor: "move"
      });
      return this.trigger('created:boundingBox');
    };

    /*
        Function for scaling Body Contour
    */


    ImageProcessor.prototype.scaleBodyContour = function() {
      var getBbox, templateBodyContour,
        _this = this;
      getBbox = this.boundingBox.getBBox();
      templateBodyContour = point.getTemplateBodyContour();
      this.results = templateBodyContour.map(function(item) {
        return {
          x: Math.round(item.x * getBbox.width) + Math.round(getBbox.x),
          y: Math.round(item.y * getBbox.height) + Math.round(getBbox.y)
        };
      });
      return this.trigger('done:bodyContour');
    };

    ImageProcessor.prototype.pointsToPath = function() {
      var cSize, i, path, s, s_path, x0, y0, _ref;
      cSize = this.results.length;
      _ref = [this.results[0].x, this.results[0].y], x0 = _ref[0], y0 = _ref[1];
      s = ["M", x0, ",", y0, "R", this.results[1].x, ",", this.results[1].y].join('');
      s_path = [];
      i = 0;
      while (i < cSize - 1) {
        s_path.push(this.results[i].x, this.results[i].y);
        i = i + 16;
      }
      s_path = ["M", x0, y0, "R"].concat(s_path);
      s_path.push("Z");
      path = this.getR().path(s_path);
      path.attr({
        stroke: settings.bodyContour_stroke,
        "stroke-width": settings.bodyContour_stroke_width,
        "stroke-opacity": settings.bodyContour_stroke_opacity,
        "stroke-dasharray": settings.bodyContour_stroke_dasharray
      });
      return path;
    };

    ImageProcessor.prototype.drawInitialBodyContour = function() {
      var options, path;
      path = this.pointsToPath();
      this.bodyContour = this.getR().set(this.boundingBox, path);
      options = {
        distance: 1,
        rotate: [null, null, null],
        draw: "bbox"
      };
      this.ft = this.getR().freeTransform(this.bodyContour, options);
      return this.ft.hideCenterAndLines();
    };

    ImageProcessor.prototype.getLines = function(index) {
      var i, results;
      results = [];
      i = 0;
      while (i < this.lines.length) {
        if (this.lines[i].from === index || this.lines[i].to === index) {
          results.push(this.lines[i]);
          this.lines.splice(i, 1);
          i--;
        }
        i++;
      }
      return results;
    };

    ImageProcessor.prototype.scaleSkeleton = function() {
      var boundingBox, templateJoints,
        _this = this;
      boundingBox = this.bodyContour.items[0];
      templateJoints = point.getTemplateJoints();
      return templateJoints.map(function(item) {
        return {
          x: item.x * boundingBox.getBBox().width + boundingBox.getBBox().x,
          y: item.y * boundingBox.getBBox().height + boundingBox.getBBox().y
        };
      });
    };

    ImageProcessor.prototype.drawSkeleton = function(results) {
      var self,
        _this = this;
      this.lines = [];
      this.joints = [];
      self = this;
      this.drawLine(results, 0, 1);
      this.drawLine(results, 1, 2);
      this.drawLine(results, 2, 3);
      this.drawLine(results, 3, 4);
      this.drawLine(results, 1, 5);
      this.drawLine(results, 5, 6);
      this.drawLine(results, 6, 7);
      this.drawLine(results, 2, 11);
      this.drawLine(results, 5, 8);
      this.drawLine(results, 8, 11);
      this.drawLine(results, 8, 9);
      this.drawLine(results, 9, 10);
      this.drawLine(results, 11, 12);
      this.drawLine(results, 12, 13);
      results.forEach(function(result, i) {
        var dot;
        dot = self.getR().circle(result.x, result.y, 2);
        dot.attr({
          fill: settings.joints_fill,
          stroke: settings.joints_stroke,
          "fill-opacity": settings.joints_fill_opacity,
          "stroke-width": settings.joints_stroke_width
        });
        dot.joint_index = i;
        dot.original_location = {
          x: result.x,
          y: result.y
        };
        dot.mousedown(function() {
          this.original_location = {
            x: this.attr("cx"),
            y: this.attr("cy")
          };
          return self.tmpContour = self.clone(self.results);
        });
        dot.drag((function(dx, dy) {
          var att, lines, res,
            _this = this;
          att = {
            cx: this.ox + dx,
            cy: this.oy + dy
          };
          this.attr(att);
          lines = self.getLines(this.joint_index);
          lines.forEach(function(line) {
            return line.remove();
          });
          results[this.joint_index].x = this.ox + dx;
          results[this.joint_index].y = this.oy + dy;
          res = self.getRelatedJointsIndexes(this.joint_index);
          res.forEach(function(item) {
            return self.drawLine(results, _this.joint_index, item);
          });
          self.moveContours(this.joint_index, this.original_location, self.joints[this.joint_index]);
          return self.joints.forEach(function(joint) {
            return joint.toFront;
          });
        }), function() {
          this.ox = this.attr("cx");
          return this.oy = this.attr("cy");
        });
        return self.joints.push(dot);
      });
      return self.joints.forEach(function(joint) {
        return joint.toFront;
      });
    };

    ImageProcessor.prototype.clone = function(activeBodyContour) {
      var _this = this;
      return activeBodyContour.map(function(item) {
        return {
          x: _this.getX(item),
          y: _this.getY(item)
        };
      });
    };

    ImageProcessor.prototype.goDrawSkeleton = function() {
      var scaling_results;
      this.bodyContour.hide();
      scaling_results = this.scaleSkeleton();
      this.drawSkeleton(scaling_results);
      this.scale = 1;
      this.PathToPoints();
      this.cIndex = point.getTemplateBodyContourIndex();
      this.ft.hideHandles();
      return this.trigger('done:goDrawSkeleton');
    };

    ImageProcessor.prototype.PathToPoints = function() {
      var path, r, s,
        _this = this;
      r = this.getR();
      path = this.bodyContour.items[1];
      s = path.matrix.toTransformString();
      this.results = this.results.map(function(result, i) {
        var c, realX, realY, tmp, x, y, _ref;
        tmp = r.circle(result.x, result.y, 1);
        tmp.transform(s);
        tmp.hide();
        realX = tmp.matrix.x(tmp.attr("cx"), tmp.attr("cy"));
        realY = tmp.matrix.y(tmp.attr("cx"), tmp.attr("cy"));
        result.x = realX;
        result.y = realY;
        _this.dragged = false;
        _ref = [result.x, result.y], x = _ref[0], y = _ref[1];
        c = _this.getR().circle(x, y, settings.bodyContour_point_radius);
        c.x = x;
        c.y = y;
        c.index = i;
        c.attr({
          fill: settings.bodyContour_fill,
          stroke: settings.bodyContour_stroke,
          "fill-opacity": settings.bodyContour_fill_opacity,
          "stroke-width": settings.bodyContour_stroke_width
        });
        c.click(function(e) {
          if (!self.dragged) {
            this.animate({
              r: 5,
              fill: settings.bodyContour_fill_animated
            }, 10);
            if (self.selected_point1 == null) {
              self.selected_point1 = this;
              self.selected_point1.x = e.layerX;
              self.selected_point1.y = e.layerY;
            } else if (self.selected_point2 == null) {
              self.selected_point2 = this;
              self.selected_point2.x = e.layerX;
              self.selected_point2.y = e.layerY;
              if (self.selected_point1.index > self.selected_point2.index) {
                tmp = self.selected_point1;
                self.selected_point1 = self.selected_point2;
                self.selected_point2 = tmp;
              }
              highlightCriticalPoints(false);
            } else {
              unhighlightCriticalPoints(false);
              self.selected_point1.animate({
                r: 1
              }, 200);
              self.selected_point2.animate({
                r: 1
              }, 200);
              self.selected_point1.remove();
              self.selected_point2.remove();
              self.selected_point2 = null;
              self.selected_point1 = this;
              self.selected_point1.x = e.layerX;
              self.selected_point1.y = e.layerY;
            }
            return self.toFront();
          } else {
            return self.dragged = false;
          }
        });
        return c;
      });
      return this.toFront();
    };

    ImageProcessor.prototype.toFront = function() {
      return this.results.forEach(function(item) {
        return item.toFront();
      });
    };

    ImageProcessor.prototype.highlightCriticalPoints = function(zoomed) {
      var activeBodyContour, direction, i, index1, index2, len, radius, _results, _results1;
      activeBodyContour = (!zoomed ? this.results : this.zoomed_results);
      this.mouseovers = [];
      this.mouseouts = [];
      radius = (!zoomed ? settings.bodyContour_point_radius : settings.bodyContour_point_radius_zoomed);
      direction = this.getDirection(this.selected_point1, this.selected_point2);
      index1 = this.selected_point1.index;
      index2 = this.selected_point2.index;
      if (direction === "0") {
        i = index1 + 1;
        _results = [];
        while (i < index2) {
          handle(i, radius, activeBodyContour, direction);
          _results.push(i++);
        }
        return _results;
      } else {
        i = index2 + 11;
        len = this.results.length;
        while (i < len) {
          handle(i, radius, activeBodyContour, direction);
          i++;
        }
        i = 0;
        _results1 = [];
        while (i < index1) {
          handle(i, radius, activeBodyContour, direction);
          _results1.push(i++);
        }
        return _results1;
      }
    };

    ImageProcessor.prototype.getDirection = function(point1, point2) {
      var t1, t2, total_length;
      total_length = this.results.length;
      t1 = point2.index - point1.index;
      t2 = total_length - point2.index + point1.index;
      if (t1 > t2) {
        return "1";
      } else {
        return "0";
      }
    };

    ImageProcessor.prototype.handle = function(i, radius, activeBodyContour, direction) {
      var mouseout, mouseover;
      mouseover = function(event) {
        this.animate({
          r: radius * 5
        }, 10);
        return this.attr({
          fill: settings.bodyContour_critical_fill,
          stroke: settings.bodyContour_critical_stroke,
          "fill-opacity": settings.bodyContour_critical_fill_opacity,
          "stroke-width": settings.bodyContour_critical_stroke_width
        });
      };
      this.mouseovers.push(mouseover);
      mouseout = function(event) {
        this.animate({
          r: radius
        }, 10);
        return this.attr({
          fill: settings.bodyContour_fill,
          stroke: settings.bodyContour_stroke,
          "fill-opacity": settings.bodyContour_fill_opacity,
          "stroke-width": settings.bodyContour_stroke_width
        });
      };
      this.mouseouts.push(mouseout);
      activeBodyContour[i].hover(mouseover, mouseout);
      return activeBodyContour[i].drag((function(dx, dy) {
        var att, tmp, x, y;
        dx = dx * this.scale;
        dy = dy * this.scale;
        this.dragged = true;
        this.animate({
          r: radius * 5
        }, 10);
        this.attr({
          fill: settings.bodyContour_critical_fill,
          stroke: settings.bodyContour_critical_stroke,
          "fill-opacity": settings.bodyContour_critical_fill_opacity,
          "stroke-width": settings.bodyContour_critical_stroke_width
        });
        if (this.selected_point1.index > this.selected_point2.index) {
          tmp = this.selected_point1;
          this.selected_point1 = this.selected_point2;
          this.selected_point2 = tmp;
        }
        att = {
          cx: this.ox + dx,
          cy: this.oy + dy
        };
        x = this.ox + dx;
        y = this.oy + dy;
        if (direction === "0") {
          this.calculateNewCoordinates(activeBodyContour, this.selected_point1.index, this.index, this, activeBodyContour[this.selected_point1.index], {
            x: x,
            y: y
          });
          this.calculateNewCoordinates(activeBodyContour, this.index, this.selected_point2.index, this, activeBodyContour[this.selected_point2.index], {
            x: x,
            y: y
          });
        } else {
          this.calculateNewCoordinates(activeBodyContour, this.selected_point2.index, this.index, this, activeBodyContour[this.selected_point2.index], {
            x: x,
            y: y
          });
          this.calculateNewCoordinates(activeBodyContour, this.index, this.selected_point1.index, this, activeBodyContour[this.selected_point1.index], {
            x: x,
            y: y
          });
        }
        this.attr(att);
        return this.toFront();
      }), (function() {
        this.ox = this.attr("cx");
        return this.oy = this.attr("cy");
      }), function(event) {
        this.animate({
          r: radius
        }, 10);
        return this.moveContours(attr({
          fill: settings.bodyContour_fill,
          stroke: settings.bodyContour_stroke,
          "fill-opacity": settings.bodyContour_fill_opacity,
          "stroke-width": settings.bodyContour_stroke_width
        }));
      });
    };

    ImageProcessor.prototype.calculateNewCoordinates = function(idx, p1, p2) {
      var activeBodyContour, cIndex, diff, i, len, tmpContour, tmpx, tmpy, _results;
      activeBodyContour = this.results;
      tmpContour = this.tmpContour;
      cIndex = this.cIndex;
      diff = {};
      diff.x = this.getX(p1) - this.getX(p2);
      diff.y = this.getY(p1) - this.getY(p2);
      i = cIndex[idx];
      len = cIndex[idx + 1];
      _results = [];
      while (i < len) {
        tmpx = this.getX(tmpContour[i]);
        tmpx -= diff.x;
        tmpy = this.getY(tmpContour[i]);
        tmpy -= diff.y;
        activeBodyContour[i].attr({
          cx: tmpx,
          cy: tmpy
        });
        _results.push(i++);
      }
      return _results;
    };

    /*
        function for calculating coordinates type1
        @param {int} [idx]
        @param {element/object} [p1]
        @param {element/object} [p2]
    */


    ImageProcessor.prototype.calculateNewCoordinates1 = function(idx, p1, p2) {
      var activeBodyContour, cIndex, diff, i, len, tmpContour, tmpx, tmpy, _results;
      activeBodyContour = this.results;
      tmpContour = this.tmpContour;
      cIndex = this.cIndex;
      diff = {};
      diff.x = this.getX(p1) - this.getX(p2);
      diff.y = this.getY(p1) - this.getY(p2);
      i = cIndex[idx];
      len = cIndex[idx + 1];
      _results = [];
      while (i < len) {
        tmpx = this.getX(tmpContour[i]);
        tmpx -= diff.x;
        tmpy = this.getY(tmpContour[i]);
        tmpy -= diff.y;
        activeBodyContour[i].attr({
          cx: tmpx,
          cy: tmpy
        });
        _results.push(i++);
      }
      return _results;
    };

    /*
        function for calculating coordinates type2
        @param {int} [idx]
        @param {element/object} [p1]
        @param {element/object} [p2]
        @param {element/object} [p3]
    */


    ImageProcessor.prototype.calculateNewCoordinates2 = function(idx, p1, p2, p3) {
      var activeBodyContour, cIndex, denam, eIndex, i, idx_, lenght, p12, p32, sIndx, t, tSize, tmpContour, tmpx, tmpy, v, _results;
      activeBodyContour = this.results;
      tmpContour = this.tmpContour;
      cIndex = this.cIndex;
      t = {};
      v = {};
      p12 = {};
      p32 = {};
      sIndx = idx % cIndex.length;
      eIndex = (idx + 1) % cIndex.length;
      lenght = Math.abs(cIndex[eIndex] - cIndex[sIndx]);
      tSize = activeBodyContour.length;
      p12.x = this.getX(p1) - this.getX(p2);
      p12.y = this.getY(p1) - this.getY(p2);
      p32.x = this.getX(p3) - this.getX(p2);
      p32.y = this.getY(p3) - this.getY(p2);
      denam = p12.x * p12.x + p12.y * p12.y;
      if (lenght > tSize / 2) {
        lenght = tSize - lenght;
      }
      i = 0;
      _results = [];
      while (i < lenght) {
        idx_ = (i + cIndex[sIndx]) % tSize;
        t = tmpContour[idx_];
        v.x = (this.getX(t) - this.getX(p2)) * p12.x + (this.getY(t) - this.getY(p2)) * p12.y;
        v.y = (this.getY(t) - this.getY(p2)) * p12.x - (this.getX(t) - this.getX(p2)) * p12.y;
        v.x = v.x / denam;
        v.y = v.y / denam;
        tmpx = this.getX(p2) + v.x * p32.x - v.y * p32.y;
        tmpy = this.getY(p2) + v.x * p32.y + v.y * p32.x;
        activeBodyContour[idx_].attr({
          cx: tmpx,
          cy: tmpy
        });
        _results.push(i++);
      }
      return _results;
    };

    /*
        function for calculating coordinates type3
        @param {element/object} [p1]
        @param {element/object} [p2]
        @param {element/object} [p3]
        @param {element/object} [control_point]
    */


    ImageProcessor.prototype.calculateNewCoordinates3 = function(p1, p2, p3, control_point) {
      var denam, p12, p32, t, tmpContour, v;
      tmpContour = this.tmpContour;
      t = {};
      v = {};
      p12 = {};
      p32 = {};
      p12.x = this.getX(p1) - this.getX(p2);
      p12.y = this.getY(p1) - this.getY(p2);
      p32.x = this.getX(p3) - this.getX(p2);
      p32.y = this.getY(p3) - this.getY(p2);
      denam = p12.x * p12.x + p12.y * p12.y;
      t = tmpContour[control_point];
      v.x = (this.getX(t) - this.getX(p2)) * p12.x + (this.getY(t) - this.getY(p2)) * p12.y;
      v.y = (this.getY(t) - this.getY(p2)) * p12.x - (this.getX(t) - this.getX(p2)) * p12.y;
      v.x = v.x / denam;
      v.y = v.y / denam;
      return {
        x: this.getX(p2) + v.x * p32.x - v.y * p32.y,
        y: this.getY(p2) + v.x * p32.y + v.y * p32.x
      };
    };

    /*
        function for getting x coordinate from a Raphael element/object(x,y)
        @param {object/element} [element]
        @return {number}  x coordinate
    */


    ImageProcessor.prototype.getX = function(element) {
      if (_.isFunction(element.attr)) {
        return element.attr("cx");
      } else {
        return element.x;
      }
    };

    /*
        function for getting y coordinate from a Raphael element/object(x,y)
        @param {object/element} [element]
        @return {number}  y coordinate
    */


    ImageProcessor.prototype.getY = function(element) {
      if (_.isFunction(element.attr)) {
        return element.attr("cy");
      } else {
        return element.y;
      }
    };

    /*
        get related joints
        @param {int} [index] joint index
        @return {array} [results] related indexes
    */


    ImageProcessor.prototype.getRelatedJointsIndexes = function(index) {
      switch (index) {
        case 0:
          return [1];
        case 1:
          return [0, 2, 5];
        case 2:
          return [1, 3, 11];
        case 3:
          return [2, 4];
        case 4:
          return [3];
        case 5:
          return [1, 6, 8];
        case 6:
          return [5, 7];
        case 7:
          return [6];
        case 8:
          return [5, 11, 9];
        case 9:
          return [8, 10];
        case 10:
          return [9];
        case 11:
          return [2, 12, 8];
        case 12:
          return [11, 13];
        case 13:
          return [12];
      }
    };

    ImageProcessor.prototype.moveContours = function(index, dragged_joint, dragged_to) {
      var activeBodyContour, cIndex, control_point, tmpContour;
      activeBodyContour = this.results;
      tmpContour = this.tmpContour;
      cIndex = this.cIndex;
      if (index === 0) {
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[25]], dragged_to, cIndex[0]);
        this.calculateNewCoordinates2(25, tmpContour[cIndex[0]], activeBodyContour[cIndex[25]], control_point);
        this.calculateNewCoordinates2(0, tmpContour[cIndex[0]], activeBodyContour[cIndex[1]], control_point);
      }
      if (index === 2) {
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[1]], dragged_to, cIndex[2]);
        this.calculateNewCoordinates2(1, tmpContour[cIndex[2]], activeBodyContour[cIndex[1]], control_point);
        this.calculateNewCoordinates2(2, tmpContour[cIndex[2]], activeBodyContour[cIndex[3]], control_point);
      }
      if (index === 5) {
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[25]], dragged_to, cIndex[24]);
        this.calculateNewCoordinates2(23, tmpContour[cIndex[24]], activeBodyContour[cIndex[23]], control_point);
        this.calculateNewCoordinates2(24, tmpContour[cIndex[24]], activeBodyContour[cIndex[25]], control_point);
      }
      if (index === 10) {
        this.calculateNewCoordinates2(9, dragged_joint, activeBodyContour[cIndex[9]], dragged_to);
        this.calculateNewCoordinates1(10, dragged_joint, dragged_to);
        this.calculateNewCoordinates2(11, dragged_joint, activeBodyContour[cIndex[12]], dragged_to);
      }
      if (index === 13) {
        this.calculateNewCoordinates2(14, dragged_joint, activeBodyContour[cIndex[14]], dragged_to);
        this.calculateNewCoordinates1(15, dragged_joint, dragged_to);
        this.calculateNewCoordinates2(16, dragged_joint, activeBodyContour[cIndex[17]], dragged_to);
      }
      if (index === 3) {
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[2]], dragged_to, cIndex[3]);
        this.calculateNewCoordinates2(2, tmpContour[cIndex[3]], activeBodyContour[cIndex[2]], control_point);
        this.calculateNewCoordinates2(3, tmpContour[cIndex[3]], activeBodyContour[cIndex[4]], control_point);
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[7]], dragged_to, cIndex[6]);
        this.calculateNewCoordinates2(5, tmpContour[cIndex[6]], activeBodyContour[cIndex[5]], control_point);
        this.calculateNewCoordinates2(6, tmpContour[cIndex[6]], activeBodyContour[cIndex[7]], control_point);
      }
      if (index === 4) {
        this.calculateNewCoordinates1(4, dragged_joint, dragged_to);
        this.calculateNewCoordinates2(3, dragged_joint, activeBodyContour[cIndex[3]], dragged_to);
        this.calculateNewCoordinates2(5, dragged_joint, activeBodyContour[cIndex[6]], dragged_to);
      }
      if (index === 6) {
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[19]], dragged_to, cIndex[20]);
        this.calculateNewCoordinates2(19, tmpContour[cIndex[20]], activeBodyContour[cIndex[19]], control_point);
        this.calculateNewCoordinates2(20, tmpContour[cIndex[20]], activeBodyContour[cIndex[21]], control_point);
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[24]], dragged_to, cIndex[23]);
        this.calculateNewCoordinates2(22, tmpContour[cIndex[23]], activeBodyContour[cIndex[22]], control_point);
        this.calculateNewCoordinates2(23, tmpContour[cIndex[23]], activeBodyContour[cIndex[24]], control_point);
      }
      if (index === 7) {
        this.calculateNewCoordinates1(21, dragged_joint, dragged_to);
        this.calculateNewCoordinates2(20, dragged_joint, activeBodyContour[cIndex[20]], dragged_to);
        this.calculateNewCoordinates2(22, dragged_joint, activeBodyContour[cIndex[23]], dragged_to);
      }
      if (index === 8) {
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[7]], dragged_to, cIndex[8]);
        this.calculateNewCoordinates2(7, tmpContour[cIndex[8]], activeBodyContour[cIndex[7]], control_point);
        this.calculateNewCoordinates2(8, tmpContour[cIndex[8]], activeBodyContour[cIndex[9]], control_point);
      }
      if (index === 11) {
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[19]], dragged_to, cIndex[18]);
        this.calculateNewCoordinates2(17, tmpContour[cIndex[18]], activeBodyContour[cIndex[17]], control_point);
        this.calculateNewCoordinates2(18, tmpContour[cIndex[18]], activeBodyContour[cIndex[19]], control_point);
      }
      if (index === 9) {
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[8]], dragged_to, cIndex[9]);
        this.calculateNewCoordinates2(8, tmpContour[cIndex[9]], activeBodyContour[cIndex[8]], control_point);
        this.calculateNewCoordinates2(9, tmpContour[cIndex[9]], activeBodyContour[cIndex[10]], control_point);
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[13]], dragged_to, cIndex[12]);
        this.calculateNewCoordinates2(11, tmpContour[cIndex[12]], activeBodyContour[cIndex[11]], control_point);
        this.calculateNewCoordinates2(12, tmpContour[cIndex[12]], activeBodyContour[cIndex[13]], control_point);
      }
      if (index === 12) {
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[13]], dragged_to, cIndex[14]);
        this.calculateNewCoordinates2(13, tmpContour[cIndex[14]], activeBodyContour[cIndex[13]], control_point);
        this.calculateNewCoordinates2(14, tmpContour[cIndex[14]], activeBodyContour[cIndex[15]], control_point);
        control_point = this.calculateNewCoordinates3(dragged_joint, activeBodyContour[cIndex[16]], dragged_to, cIndex[17]);
        this.calculateNewCoordinates2(16, tmpContour[cIndex[17]], activeBodyContour[cIndex[16]], control_point);
        return this.calculateNewCoordinates2(17, tmpContour[cIndex[17]], activeBodyContour[cIndex[18]], control_point);
      }
    };

    ImageProcessor.prototype.drawLine = function(results, index1, index2) {
      var line, r1, r2, s, x1, x2, y1, y2, _ref, _ref1;
      _ref = [results[index1], results[index2]], r1 = _ref[0], r2 = _ref[1];
      _ref1 = [r1.x, r1.y, r2.x, r2.y], x1 = _ref1[0], y1 = _ref1[1], x2 = _ref1[2], y2 = _ref1[3];
      s = ['M', x1, ',', y1, 'L', x2, ',', y2].join('');
      line = this.getR().path(s);
      line.attr({
        stroke: settings.lines_stroke,
        "stroke-width": settings.lines_stroke_width,
        cursor: "move",
        "stroke-dasharray": settings.lines_stroke_dasharray
      });
      line.from = index1;
      line.to = index2;
      return this.lines.push(line);
    };

    ImageProcessor.prototype.goDrawPoints = function() {
      this.lock();
      this.zoomEditLoad();
      this.hideSkeleton();
      return this.trigger('done:goDrawPoints');
    };

    ImageProcessor.prototype.hideSkeleton = function() {
      this.lines.forEach(function(line) {
        return line.remove();
      });
      return this.joints.forEach(function(joint) {
        return joint.remove();
      });
    };

    ImageProcessor.prototype.zoomEditLoad = function() {
      var height, width;
      height = settings.zoomed_image_height;
      width = height * this.image.attr("width") / this.image.attr("height");
      this.image2 = this.getR2().image(this.image.attr("src"), 0, 0, width, height);
      this.bbox = this.calculateBodyBoundingBox();
      this.drawZoomedContour();
      return this.current_zoom = "head";
    };

    /*
        function for locking the main paper
    */


    ImageProcessor.prototype.lock = function() {
      this.lock = this.getR().rect(0, 0, this.getR().width, this.getR().height);
      return this.lock.attr({
        fill: "#FFF",
        "fill-opacity": 0
      });
    };

    ImageProcessor.prototype.calculateBodyBoundingBox = function() {
      var kx, ky, maxX, maxY, minX, minY;
      minX = maxX = this.results[0].attr("cx");
      minY = maxY = this.results[0].attr("cy");
      this.results.forEach(function(item) {
        if (item.attr("cx") < minX) {
          minX = item.attr("cx");
        } else {
          if (item.attr("cx") > maxX) {
            maxX = item.attr("cx");
          }
        }
        if (item.attr("cy") < minY) {
          return minY = item.attr("cy");
        } else {
          if (item.attr("cy") > maxY) {
            return maxY = item.attr("cy");
          }
        }
      });
      kx = this.image2.attr("width") / this.image.attr("width");
      ky = this.image2.attr("height") / this.image.attr("height");
      return {
        x: minX * kx,
        y: minY * ky,
        width: bbox.x * kx,
        height: bbox.y * ky
      };
    };

    ImageProcessor.prototype.drawZoomedContour = function() {
      var current_height, current_width, image_height, image_width, r2, self,
        _this = this;
      self = this;
      r2 = this.getR2();
      image_width = this.image.attr("width");
      image_height = this.image.attr("height");
      current_width = this.image2.attr("width");
      current_height = this.image2.attr("height");
      this.zoomed_results = this.results.map(function(result, i) {
        var c, newX, newY;
        newX = result.attr("cx") * current_width / image_width;
        newY = result.attr("cy") * current_height / image_height;
        c = r2.circle(newX, newY, settings.bodyContour_point_radius_zoomed);
        c.index = i;
        c.attr({
          fill: settings.bodyContour_fill,
          stroke: settings.bodyContour_stroke,
          "fill-opacity": settings.bodyContour_fill_opacity,
          "stroke-width": settings.bodyContour_stroke_width
        });
        _this.dragged = false;
        c.click(function(e) {
          var tmp;
          if (!self.dragged) {
            this.animate({
              r: settings.bodyContour_selected_point_zoomed_radius,
              fill: settings.bodyContour_fill_animated
            }, 10);
            if (self.selected_point1 == null) {
              self.selected_point1 = this;
              self.selected_point1.x = e.layerX;
              self.selected_point1.y = e.layerY;
            } else if (self.selected_point2 == null) {
              self.selected_point2 = this;
              self.selected_point2.x = e.layerX;
              self.selected_point2.y = e.layerY;
              if (self.selected_point1.index > self.selected_point2.index) {
                tmp = self.selected_point1;
                self.selected_point1 = self.selected_point2;
                self.selected_point2 = tmp;
              }
              self.highlightCriticalPoints(true);
            } else {
              unhighlightCriticalPoints(true);
              self.selected_point1.animate({
                r: settings.bodyContour_point_radius_zoomed
              }, 10);
              self.selected_point2.animate({
                r: settings.bodyContour_point_radius_zoomed
              }, 10);
              self.selected_point1.attr({
                fill: settings.bodyContour_fill,
                stroke: settings.bodyContour_stroke,
                "fill-opacity": settings.bodyContour_fill_opacity,
                "stroke-width": settings.bodyContour_stroke_width
              });
              self.selected_point2.attr({
                fill: settings.bodyContour_fill,
                stroke: settings.bodyContour_stroke,
                "fill-opacity": settings.bodyContour_fill_opacity,
                "stroke-width": settings.bodyContour_stroke_width
              });
              self.selected_point2 = null;
              self.selected_point1 = this;
              self.selected_point1.x = e.layerX;
              self.selected_point1.y = e.layerY;
            }
            return self.toFront();
          } else {
            return self.dragged = false;
          }
        });
        return c;
      });
      return self.toFront();
    };

    ImageProcessor.prototype.saveContour = function() {
      var contour, height, i, len, normalized_height, normalized_width, results_to_save, width;
      contour = this.results;
      results_to_save = [];
      height = this.image.attr("height");
      width = this.image.attr("width");
      normalized_height = 1000;
      normalized_width = normalized_height * width / height;
      i = 0;
      len = contour.length;
      while (i < len) {
        results_to_save[i] = {};
        results_to_save[i].x = contour[i].attr("cx") * normalized_width / width;
        results_to_save[i].y = contour[i].attr("cy") * normalized_height / height;
        i++;
      }
      return this.trigger('ajax:upload_contour', this.image_name, results_to_save);
    };

    ImageProcessor.prototype.zoomNext = function() {
      switch (this.current_zoom) {
        case "head":
          this.current_zoom = "shoulders";
          this.showShoulders();
          break;
        case "shoulders":
          this.current_zoom = "left_arm";
          this.showArm("left");
          break;
        case "left_arm":
          this.current_zoom = "right_arm";
          this.showArm("right");
          break;
        case "right_arm":
          this.current_zoom = "arm_tip_to_hip";
          this.showArmTipToHip();
          break;
        case "arm_tip_to_hip":
          this.current_zoom = "end";
          this.showLegs();
          break;
        case "end":
          this.fromZoom();
          alert("Zooming done");
          this.getR2().remove();
          break;
      }
    };

    ImageProcessor.prototype.showShoulders = function() {
      var bbox, bbox_center_x, ratio, vh, vw, vx, vy;
      bbox = this.bbox;
      ratio = 0.98;
      vw = bbox.width * ratio;
      vh = vw;
      bbox_center_x = bbox.x + bbox.width / 2;
      vx = bbox_center_x - vw / 2;
      vy = bbox.y + bbox.height * 0.10;
      this.scale = vw / settings.zoomed_paper_width;
      return this.getR2().setViewBox(vx, vy, vw, vh);
    };

    ImageProcessor.prototype.showHead = function() {
      var bbox, bbox_center_x, head_offset, ratio, vh, vw, vx, vy;
      bbox = this.bbox;
      ratio = 0.65;
      head_offset = 12;
      vw = bbox.width * ratio;
      vh = vw;
      bbox_center_x = bbox.x + bbox.width / 2;
      vx = bbox_center_x - vw / 2;
      vy = bbox.y - head_offset;
      this.scale = vw / settings.zoomed_paper_width;
      return this.getR2().setViewBox(vx, vy, vw, vh);
    };

    ImageProcessor.prototype.showArm = function(arm) {
      var bbox, ratio, vh, vw, vx, vy;
      bbox = this.bbox;
      ratio = 0.45;
      vh = bbox.height * ratio;
      vw = vh;
      if (arm === "left") {
        vx = bbox.x - vw / 2;
      } else {
        vx = bbox.x + bbox.width - vw / 2;
      }
      vy = bbox.y + bbox.height * 0.15;
      this.scale = vw / settings.zoomed_paper_width;
      return this.getR2().setViewBox(vx, vy, vw, vh);
    };

    ImageProcessor.prototype.showArmTipToHip = function() {
      var bbox, bbox_center_x, ratio, vh, vw, vx, vy;
      bbox = this.bbox;
      ratio = 0.30;
      vh = bbox.height * ratio;
      vw = vh;
      bbox_center_x = bbox.x + bbox.width / 2;
      vx = bbox_center_x - vw / 2;
      vy = bbox.y + bbox.height * 0.20;
      this.scale = vw / settings.zoomed_paper_width;
      return this.getR2().setViewBox(vx, vy, vw, vh);
    };

    ImageProcessor.prototype.showLegs = function() {
      var bbox, bbox_center_x, ratio, vh, vw, vx, vy;
      bbox = this.bbox;
      ratio = 0.65;
      vh = bbox.height * ratio;
      vw = vh;
      bbox_center_x = bbox.x + bbox.width / 2;
      vx = bbox_center_x - vw / 2;
      vy = bbox.y + bbox.height * 0.35;
      this.scale = vw / settings.zoomed_paper_width;
      return this.getR2().setViewBox(vx, vy, vw, vh);
    };

    ImageProcessor.prototype.fromZoom = function() {};

    ImageProcessor.prototype.goDrawPointsNoZoom = function() {
      this.hideSkeleton();
      return this.trigger('done:goDrawPointsNoZoom');
    };

    return ImageProcessor;

  })(Backbone.Model);
});

