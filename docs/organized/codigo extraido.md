
(function(global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(exports, require("leaflet"), require("@deck.gl/core"))
    : typeof define === "function" && define.amd
      ? define(["exports", "leaflet", "@deck.gl/core"], factory)
      : ((global =
          typeof globalThis !== "undefined" ? globalThis : global || self),
        factory((global.DeckGlLeaflet = {}), global.L, global.deck));
})(this, function(exports, L, core) {
  "use strict";

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function(k) {
        if (k !== "default") {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(
            n,
            k,
            d.get
              ? d
              : {
                  enumerable: true,
                  get: function() {
                    return e[k];
                  },
                }
          );
        }
      });
    }
    n["default"] = e;
    return Object.freeze(n);
  }

  var L__namespace = /*#__PURE__*/ _interopNamespace(L);

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

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError(
        "this hasn't been initialised - super() hasn't been called"
      );
    }

    return self;
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

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true,
      },
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
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

  function _possibleConstructorReturn(self, call) {
    if (call && (_typeof(call) === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf
      ? Object.getPrototypeOf
      : function _getPrototypeOf(o) {
          return o.__proto__ || Object.getPrototypeOf(o);
        };
    return _getPrototypeOf(o);
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) {
        symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
      }
      keys.push.apply(keys, symbols);
    }
    return keys;
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      if (i % 2) {
        ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(
          target,
          Object.getOwnPropertyDescriptors(source)
        );
      } else {
        ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(
            target,
            key,
            Object.getOwnPropertyDescriptor(source, key)
          );
        });
      }
    }
    return target;
  }
  /** @typedef {import('@deck.gl/core/lib/deck').DeckProps} DeckProps */

  /** @typedef {import('@deck.gl/core/lib/deck').ViewStateProps} ViewStateProps */

  /**
   * @param {L.Map} map
   * @returns {ViewStateProps}
   */

  function getViewState(map) {
    return {
      longitude: map.getCenter().lng,
      latitude: map.getCenter().lat,
      zoom: map.getZoom() - 1,
      pitch: 0,
      bearing: 0,
    };
  }
  /**
   * @param {L.Map} map
   * @param {HTMLElement} container
   * @param {Deck} deck
   * @param {DeckProps} props
   * @returns {Deck}
   */

  function createDeckInstance(map, container, deck, props) {
    if (!deck) {
      var viewState = getViewState(map);
      deck = new core.Deck(
        _objectSpread(
          _objectSpread({}, props),
          {},
          {
            parent: container,
            controller: false,
            style: {
              zIndex: "auto",
            },
            viewState: viewState,
          }
        )
      );
    }

    return deck;
  }
  /**
   * @param {Deck} deck
   * @param {L.Map} map
   */

  function updateDeckView(deck, map) {
    var viewState = getViewState(map); // console.log(viewState);

    deck.setProps({
      viewState: viewState,
    });
    deck.redraw(false);
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

  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;
    try {
      Boolean.prototype.valueOf.call(
        Reflect.construct(Boolean, [], function() {})
      );
      return true;
    } catch (e) {
      return false;
    }
  }
  /** @typedef {import('@deck.gl/core').Deck} Deck */

  /** @typedef {import('@deck.gl/core/lib/deck').DeckProps} DeckProps */

  var LeafletLayer = /*#__PURE__*/ (function(_L$Layer) {
    _inherits(LeafletLayer, _L$Layer);

    var _super = _createSuper(LeafletLayer);

    /** @type {HTMLElement | undefined} */

    /** @type {Deck | undefined} */

    /** @type {boolean | undefined} */

    /**
     * @param {DeckProps} props
     */
    function LeafletLayer(props) {
      var _this;

      _classCallCheck(this, LeafletLayer);

      _this = _super.call(this);

      _defineProperty(_assertThisInitialized(_this), "_container", undefined);

      _defineProperty(_assertThisInitialized(_this), "_deck", undefined);

      _defineProperty(_assertThisInitialized(_this), "_animate", undefined);

      _this.props = props;
      return _this;
    }
    /**
     * @returns {this}
     */

    _createClass(LeafletLayer, [
      {
        key: "onAdd",
        value: function onAdd() {
          this._container = L__namespace.DomUtil.create("div");
          this._container.className = "leaflet-layer";
          this._container.style.zIndex = this.props.zIndex;

          if (this._zoomAnimated) {
            L__namespace.DomUtil.addClass(
              this._container,
              "leaflet-zoom-animated"
            );
          }

          this.getPane("tilePane").appendChild(this._container);
          this._deck = createDeckInstance(
            this._map,
            this._container,
            this._deck,
            this.props
          );

          this._update();

          return this;
        },
        /**
         * @param {L.Map} _map
         * @returns {this}
         */
      },
      {
        key: "onRemove",
        value: function onRemove(_map) {
          L__namespace.DomUtil.remove(this._container);
          this._container = undefined;

          this._deck.finalize();

          this._deck = undefined;
          return this;
        },
        /**
         * @returns {Object}
         */
      },
      {
        key: "getEvents",
        value: function getEvents() {
          var events = {
            viewreset: this._reset,
            movestart: this._onMoveStart,
            moveend: this._onMoveEnd,
            zoomstart: this._onZoomStart,
            zoom: this._onZoom,
            zoomend: this._onZoomEnd,
          };

          if (this._zoomAnimated) {
            events.zoomanim = this._onAnimZoom;
          }

          return events;
        },
        /**
         * @param {DeckProps} props
         * @returns {void}
         */
      },
      {
        key: "setProps",
        value: function setProps(props) {
          Object.assign(this.props, props);

          if (this._deck) {
            this._deck.setProps(props);
          }
        },
        /**
         * @param {any} params
         * @returns {any}
         */
      },
      {
        key: "pickObject",
        value: function pickObject(params) {
          return this._deck && this._deck.pickObject(params);
        },
        /**
         * @param {any} params
         * @returns {any}
         */
      },
      {
        key: "pickMultipleObjects",
        value: function pickMultipleObjects(params) {
          return this._deck && this._deck.pickMultipleObjects(params);
        },
        /**
         * @param {any} params
         * @returns {any}
         */
      },
      {
        key: "pickObjects",
        value: function pickObjects(params) {
          return this._deck && this._deck.pickObjects(params);
        },
        /**
         * @returns {void}
         */
      },
      {
        key: "_update",
        value: function _update() {
          if (this._map._animatingZoom) {
            return;
          }

          var size = this._map.getSize();

          this._container.style.width = "".concat(size.x, "px");
          this._container.style.height = "".concat(size.y, "px"); // invert map position

          var offset = this._map._getMapPanePos().multiplyBy(-1);

          L__namespace.DomUtil.setPosition(this._container, offset);
          updateDeckView(this._deck, this._map);
        },
        /**
         * @returns {void}
         */
      },
      {
        key: "_pauseAnimation",
        value: function _pauseAnimation() {
          if (this._deck.props._animate) {
            this._animate = this._deck.props._animate;

            this._deck.setProps({
              _animate: false,
            });
          }
        },
        /**
         * @returns {void}
         */
      },
      {
        key: "_unpauseAnimation",
        value: function _unpauseAnimation() {
          if (this._animate) {
            this._deck.setProps({
              _animate: this._animate,
            });

            this._animate = undefined;
          }
        },
        /**
         * @returns {void}
         */
      },
      {
        key: "_reset",
        value: function _reset() {
          this._updateTransform(this._map.getCenter(), this._map.getZoom());

          this._update();
        },
        /**
         * @returns {void}
         */
      },
      {
        key: "_onMoveStart",
        value: function _onMoveStart() {
          this._pauseAnimation();
        },
        /**
         * @returns {void}
         */
      },
      {
        key: "_onMoveEnd",
        value: function _onMoveEnd() {
          this._update();

          this._unpauseAnimation();
        },
        /**
         * @returns {void}
         */
      },
      {
        key: "_onZoomStart",
        value: function _onZoomStart() {
          this._pauseAnimation();
        },
        /**
         * @param {L.ZoomAnimEvent} event
         * @returns {void}
         */
      },
      {
        key: "_onAnimZoom",
        value: function _onAnimZoom(event) {
          this._updateTransform(event.center, event.zoom);
        },
        /**
         * @returns {void}
         */
      },
      {
        key: "_onZoom",
        value: function _onZoom() {
          this._updateTransform(this._map.getCenter(), this._map.getZoom());
        },
        /**
         * @returns {void}
         */
      },
      {
        key: "_onZoomEnd",
        value: function _onZoomEnd() {
          this._unpauseAnimation();
        },
        /**
         * see https://stackoverflow.com/a/67107000/1823988
         * see L.Renderer._updateTransform https://github.com/Leaflet/Leaflet/blob/master/src/layer/vector/Renderer.js#L90-L105
         * @param {L.LatLng} center
         * @param {number} zoom
         */
      },
      {
        key: "_updateTransform",
        value: function _updateTransform(center, zoom) {
          var scale = this._map.getZoomScale(zoom, this._map.getZoom());

          var position = L__namespace.DomUtil.getPosition(this._container);

          var viewHalf = this._map.getSize().multiplyBy(0.5);

          var currentCenterPoint = this._map.project(
            this._map.getCenter(),
            zoom
          );

          var destCenterPoint = this._map.project(center, zoom);

          var centerOffset = destCenterPoint.subtract(currentCenterPoint);
          var topLeftOffset = viewHalf
            .multiplyBy(-scale)
            .add(position)
            .add(viewHalf)
            .subtract(centerOffset);

          if (L__namespace.Browser.any3d) {
            L__namespace.DomUtil.setTransform(
              this._container,
              topLeftOffset,
              scale
            );
          } else {
            L__namespace.DomUtil.setPosition(this._container, topLeftOffset);
          }
        },
      },
    ]);

    return LeafletLayer;
  })(L__namespace.Layer);

  exports.LeafletLayer = LeafletLayer;

  Object.defineProperty(exports, "__esModule", { value: true });
});
//# sourceMappingURL=deck.gl-leaflet.js.map



(function(factory, window) {
  // define an AMD module that relies on 'leaflet'
  if (typeof define === "function" && define.amd) {
    define(["leaflet"], factory);

    // define a Common JS module that relies on 'leaflet'
  } else if (typeof exports === "object") {
    module.exports = factory(require("leaflet"));
  }

  // attach your plugin to the global 'L' variable
  if (typeof window !== "undefined" && window.L) {
    factory(L);
  }
})(function(L) {
  L.Mask = L.LayerGroup.extend({
    options: {
      color: "#3388FF",
      weight: 2,
      fillColor: "#FFFFFF",
      fillOpacity: 1,

      interactive: false,

      fitBounds: true,
      restrictBounds: true,
    },

    initialize: function(geojson, options) {
      L.Util.setOptions(this, options);

      this._layers = {};
      this._bounds = new L.LatLngBounds();
      this._maskPolygonCoords = [
        [[-360, -90], [-360, 90], [360, 90], [360, -90]],
      ];

      if (geojson) {
        if (typeof geojson === "string") {
          var _that = this;
          this.request(geojson, function(json) {
            _that.addData(json);
          });
        } else {
          this.addData(geojson);
        }
      }
    },
    addData: function(geojson) {
      this.addObject(geojson);
      this.addMaskLayer();
    },
    addObject: function(json) {
      var i, len;
      if (L.Util.isArray(json)) {
        for (i = 0, len = json.length; i < len; i++) {
          this.addObject(json[i]);
        }
      } else {
        switch (json.type) {
          case "FeatureCollection":
            var features = json.features;
            for (i = 0, len = features.length; i < len; i++) {
              this.addObject(features[i]);
            }
            return;
          case "Feature":
            this.addObject(json.geometry);
            return;
          case "GeometryCollection":
            var geometries = json.geometries;
            for (i = 0, len = geometries.length; i < len; i++) {
              this.addObject(geometries[i]);
            }
            return;

          case "Polygon":
            this.addRemovalPolygonCoordinates(json.coordinates);
            return;
          case "MultiPolygon":
            this.addRemovalMultiPolygonCoordinates(json.coordinates);
            return;
          default:
            return;
        }
      }
    },
    addRemovalPolygonCoordinates: function(coords) {
      for (var i = 0, len = coords.length; i < len; i++) {
        this._maskPolygonCoords.push(coords[i]);
        this.updateBounds(coords[i]);
      }
    },
    addRemovalMultiPolygonCoordinates: function(coords) {
      for (var i = 0, len = coords.length; i < len; i++) {
        this.addRemovalPolygonCoordinates(coords[i]);
      }
    },
    updateBounds: function(coords) {
      for (var i = 0, len = coords.length; i < len; i++) {
        var coords2 = coords[i];
        for (var j = 0, lenJ = coords2.length; j < lenJ; j++) {
          this._bounds.extend(new L.latLng(coords2[1], coords2[0], coords2[2]));
        }
      }
    },
    addMaskLayer: function() {
      var latlngs = this.coordsToLatLngs(this._maskPolygonCoords);
      var layer = new L.Polygon(latlngs, this.options);
      this.addLayer(layer);
      // if (this.options.fitBounds) {
      //   this._map.fitBounds(this._bounds);
      // }
      // if (this.options.restrictBounds) {
      //   this._map.setMaxBounds(this._bounds);
      // }
    },
    dimension: function(arr) {
      var j = 1;
      for (var i in arr) {
        if (arr[i] instanceof Array) {
          if (1 + this.dimension(arr[i]) > j) {
            j = j + this.dimension(arr[i]);
          }
        }
      }
      return j;
    },
    coordsToLatLng: function(coords) {
      return new L.LatLng(coords[1], coords[0], coords[2]);
    },
    coordsToLatLngs: function(coords) {
      var latlngs = [];
      var dimensions = this.dimension(coords);
      for (var i = 0, len = coords.length, latlng; i < len; i++) {
        if (dimensions > 2) {
          latlng = this.coordsToLatLngs(coords[i]);
        } else {
          latlng = this.coordsToLatLng(coords[i]);
        }
        latlngs.push(latlng);
      }

      return latlngs;
    },
    request: function(url, success, error) {
      var xhr = new XMLHttpRequest();
      xhr.responseType = "json";
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            if (success && typeof success === "function") {
              success(xhr.response);
            }
          } else {
            if (error && typeof error === "function") {
              error();
            }
          }
        }
      };
      xhr.open("GET", url, true);
      xhr.send(null);
    },
  });

  L.mask = function(geojson, options) {
    return new L.Mask(geojson, options);
  };
}, window);

"use strict";

/*
 Generic  Canvas Layer for leaflet 0.7 and 1.0-rc,
 copyright Stanislav Sumbera,  2016 , sumbera.com , license MIT
 originally created and motivated by L.CanvasOverlay  available here: https://gist.github.com/Sumbera/11114288

 */
// -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
//------------------------------------------------------------------------------
if (!L.DomUtil.setTransform) {
  L.DomUtil.setTransform = function(el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] =
      (L.Browser.ie3d
        ? "translate(" + pos.x + "px," + pos.y + "px)"
        : "translate3d(" + pos.x + "px," + pos.y + "px,0)") +
      (scale ? " scale(" + scale + ")" : "");
  };
} // -- support for both  0.0.7 and 1.0.0 rc2 leaflet

L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({
  // -- initialized is called on prototype
  initialize: function initialize(options) {
    this._map = null;
    this._canvas = null;
    this._frame = null;
    this._delegate = null;
    L.setOptions(this, options);
  },
  delegate: function delegate(del) {
    this._delegate = del;
    return this;
  },
  needRedraw: function needRedraw() {
    if (!this._frame) {
      this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
    }

    return this;
  },
  //-------------------------------------------------------------
  _onLayerDidResize: function _onLayerDidResize(resizeEvent) {
    this._canvas.width = resizeEvent.newSize.x;
    this._canvas.height = resizeEvent.newSize.y;
  },
  //-------------------------------------------------------------
  _onLayerDidMove: function _onLayerDidMove() {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);

    L.DomUtil.setPosition(this._canvas, topLeft);
    this.drawLayer();
  },
  //-------------------------------------------------------------
  getEvents: function getEvents() {
    var events = {
      resize: this._onLayerDidResize,
      moveend: this._onLayerDidMove,
    };

    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      events.zoomanim = this._animateZoom;
    }

    return events;
  },
  //-------------------------------------------------------------
  onAdd: function onAdd(map) {
    console.log("canvas onAdd", this);
    this._map = map;
    this._canvas = L.DomUtil.create("canvas", "leaflet-layer");
    this.tiles = {};

    var size = this._map.getSize();

    this._canvas.width = size.x;
    this._canvas.height = size.y;
    this._canvas.style.zIndex = this.options.zIndex;
    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(
      this._canvas,
      "leaflet-zoom-" + (animated ? "animated" : "hide")
    );
    this.options.pane.appendChild(this._canvas);
    map.on(this.getEvents(), this);
    var del = this._delegate || this;
    del.onLayerDidMount && del.onLayerDidMount(); // -- callback

    this.needRedraw();
    var self = this;
    setTimeout(function() {
      self._onLayerDidMove();
    }, 0);
  },
  //-------------------------------------------------------------
  onRemove: function onRemove(map) {
    var del = this._delegate || this;
    del.onLayerWillUnmount && del.onLayerWillUnmount(); // -- callback

    this.options.pane.removeChild(this._canvas);
    map.off(this.getEvents(), this);
    this._canvas = null;
  },
  //------------------------------------------------------------
  addTo: function addTo(map) {
    map.addLayer(this, true);
    return this;
  },
  //------------------------------------------------------------------------------
  drawLayer: function drawLayer() {
    // -- todo make the viewInfo properties  flat objects.
    var size = this._map.getSize();

    var bounds = this._map.getBounds();

    var zoom = this._map.getZoom();

    var center = this._map.options.crs.project(this._map.getCenter());

    var corner = this._map.options.crs.project(
      this._map.containerPointToLatLng(this._map.getSize())
    );

    var del = this._delegate || this;
    del.onDrawLayer &&
      del.onDrawLayer({
        layer: this,
        canvas: this._canvas,
        bounds: bounds,
        size: size,
        zoom: zoom,
        center: center,
        corner: corner,
      });
    this._frame = null;
  },
  // -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
  //------------------------------------------------------------------------------
  _setTransform: function _setTransform(el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] =
      (L.Browser.ie3d
        ? "translate(" + pos.x + "px," + pos.y + "px)"
        : "translate3d(" + pos.x + "px," + pos.y + "px,0)") +
      (scale ? " scale(" + scale + ")" : "");
  },
  //------------------------------------------------------------------------------
  _animateZoom: function _animateZoom(e) {
    var scale = this._map.getZoomScale(e.zoom); // -- different calc of offset in leaflet 1.0.0 and 0.0.7 thanks for 1.0.0-rc2 calc @jduggan1

    var offset = L.Layer
      ? this._map._latLngToNewLayerPoint(
          this._map.getBounds().getNorthWest(),
          e.zoom,
          e.center
        )
      : this._map
          ._getCenterOffset(e.center)
          ._multiplyBy(-scale)
          .subtract(this._map._getMapPanePos());
    L.DomUtil.setTransform(this._canvas, offset, scale);
  },
});

L.canvasLayer = function(pane) {
  return new L.CanvasLayer(pane);
};

L.Control.Velocity = L.Control.extend({
  options: {
    position: "bottomleft",
    emptyString: "Unavailable",
    // Could be any combination of 'bearing' (angle toward which the flow goes) or 'meteo' (angle from which the flow comes)
    // and 'CW' (angle value increases clock-wise) or 'CCW' (angle value increases counter clock-wise)
    angleConvention: "bearingCW",
    // Could be 'm/s' for meter per second, 'k/h' for kilometer per hour or 'kt' for knots
    speedUnit: "m/s",
    onAdd: null,
    onRemove: null,
  },
  onAdd: function onAdd(map) {
    this._container = L.DomUtil.create("div", "leaflet-control-velocity");
    L.DomEvent.disableClickPropagation(this._container);
    map.on("mousemove", this._onMouseMove, this);
    map.on("click", this._onMouseClick, this);
    map.on("mouseout", this._onMouseOut, this);
    this._container.innerHTML = this.options.emptyString;
    if (this.options.leafletVelocity.options.onAdd)
      this.options.leafletVelocity.options.onAdd();
    return this._container;
  },
  onRemove: function onRemove(map) {
    map.off("mousemove", this._onMouseMove, this);
    map.off("click", this._onMouseClick, this);
    map.off("mouseout", this._onMouseOut, this);
    if (this.options.leafletVelocity.options.onRemove)
      this.options.leafletVelocity.options.onRemove();
  },
  vectorToSpeed: function vectorToSpeed(uMs, vMs, unit) {
    var velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2)); // Default is m/s

    if (unit === "k/h") {
      return this.meterSec2kilometerHour(velocityAbs);
    } else if (unit === "kt") {
      return this.meterSec2Knots(velocityAbs);
    } else {
      return velocityAbs;
    }
  },
  vectorToDegrees: function vectorToDegrees(uMs, vMs, angleConvention) {
    // Default angle convention is CW
    if (angleConvention.endsWith("CCW")) {
      // vMs comes out upside-down..
      vMs = vMs > 0 ? (vMs = -vMs) : Math.abs(vMs);
    }

    var velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));
    var velocityDir = Math.atan2(uMs / velocityAbs, vMs / velocityAbs);
    var velocityDirToDegrees = (velocityDir * 180) / Math.PI + 180;

    if (angleConvention === "bearingCW" || angleConvention === "meteoCCW") {
      velocityDirToDegrees += 180;
      if (velocityDirToDegrees >= 360) velocityDirToDegrees -= 360;
    }

    return velocityDirToDegrees;
  },
  meterSec2Knots: function meterSec2Knots(meters) {
    return meters / 0.514;
  },
  meterSec2kilometerHour: function meterSec2kilometerHour(meters) {
    return meters * 3.6;
  },
  _onMouseMove: function _onMouseMove(e) {
    this.options.leafletVelocity.options.onMouseMove();
  },
  _onMouseClick: function _onMouseClick(e) {
    var self = this;
    var pos = this.options.leafletVelocity._map.containerPointToLatLng(
      L.point(e.containerPoint.x, e.containerPoint.y)
    );

    var gridValue = this.options.leafletVelocity._windy.interpolatePoint(
      pos.lng,
      pos.lat
    );

    var direction, speed, unit;

    if (gridValue) {
      var direction = parseFloat(
        self
          .vectorToDegrees(
            gridValue[0],
            gridValue[1],
            this.options.angleConvention
          )
          .toFixed(2)
      );
      var speed = parseFloat(
        self
          .vectorToSpeed(gridValue[0], gridValue[1], this.options.speedUnit)
          .toFixed(2)
      );
      var unit = this.options.speedUnit;
    }

    this.options.leafletVelocity.options.onDrawTooltip(
      speed,
      direction,
      unit,
      pos.lng,
      pos.lat
    );
  },
  _onMouseOut: function(ev) {
    this.options.leafletVelocity.options.onLeavingMap();
  },
});
L.Map.mergeOptions({
  positionControl: false,
});
L.Map.addInitHook(function() {
  if (this.options.positionControl) {
    this.positionControl = new L.Control.MousePosition();
    this.addControl(this.positionControl);
  }
});

L.control.velocity = function(options) {
  return new L.Control.Velocity(options);
};

L.ParticlesLayer = (L.Layer ? L.Layer : L.Class).extend({
  options: {
    displayValues: true,
    displayOptions: {
      velocityType: "Velocity",
      position: "bottomleft",
      emptyString: "No velocity data",
    },
    maxVelocity: 10,
    // used to align color scale
    colorScale: null,
    data: null,
  },
  _map: null,
  _canvasLayer: null,
  _windy: null,
  _context: null,
  _timer: 0,
  _mouseControl: null,
  initialize: function initialize(options) {
    L.setOptions(this, options);
  },
  onAdd: function onAdd(map) {
    // determine where to add the layer
    this._paneName = this.options.paneName || "overlayPane"; // fall back to overlayPane for leaflet < 1

    var pane = map._panes.overlayPane;

    if (map.getPane) {
      // attempt to get pane first to preserve parent (createPane voids this)
      pane = map.getPane(this._paneName);

      if (!pane) {
        pane = map.createPane(this._paneName);
      }
    } // create canvas, add to map pane

    this._canvasLayer = L.canvasLayer({
      pane: pane,
      zIndex: this.options.zIndex,
    }).delegate(this);

    this._canvasLayer.addTo(map);

    this._map = map;
  },
  onRemove: function onRemove(map) {
    this._destroyWind();
  },
  setData: function setData(data) {
    this.options.data = data;

    if (this._windy) {
      this._windy.setData(data);

      this._clearAndRestart();
    }

    this.fire("load");
  },
  setOpacity: function setOpacity(opacity) {
    console.log("this._canvasLayer", this._canvasLayer);

    this._canvasLayer.setOpacity(opacity);
  },
  setOptions: function setOptions(options) {
    this.options = Object.assign(this.options, options);

    if (options.hasOwnProperty("displayOptions")) {
      this.options.displayOptions = Object.assign(
        this.options.displayOptions,
        options.displayOptions
      );

      this._initMouseHandler(true);
    }

    if (options.hasOwnProperty("data")) this.options.data = options.data;

    if (this._windy) {
      this._windy.setOptions(options);

      if (options.hasOwnProperty("data")) this._windy.setData(options.data);

      this._clearAndRestart();
    }

    this.fire("load");
  },

  /*------------------------------------ PRIVATE ------------------------------------------*/
  onDrawLayer: function onDrawLayer(overlay, params) {
    var self = this;

    if (!this._windy) {
      this._initWindy(this);

      return;
    }

    if (!this.options.data) {
      return;
    }

    if (this._timer) clearTimeout(self._timer);
    this._timer = setTimeout(function() {
      self._startWindy();
    }, 750); // showing velocity is delayed
  },
  // _startWindy: function() {
  //   var bounds = this._map.getBounds();
  //   var size = this._map.getSize();

  //   // bounds, width, height, extent
  //   this._windy.start(
  //     [
  //       [0, 0],
  //       [size.x, size.y]
  //     ],
  //     size.x,
  //     size.y,
  //     [
  //       [bounds._southWest.lng, bounds._southWest.lat],
  //       [bounds._northEast.lng, bounds._northEast.lat]
  //     ]
  //   );
  // },

  _startWindy: function _startWindy() {
    let size = this._map.getSize();

    let point1 = this._map.latLngToContainerPoint(
      L.latLng(this.options.limN, this.options.limW)
    );
    let point2 = this._map.latLngToContainerPoint(
      L.latLng(this.options.limS, this.options.limE)
    );
    point1.x = point1.x > 0 ? point1.x : 0;
    point1.y = point1.y > 0 ? point1.y : 0;
    point2.x = point2.x < size.x ? point2.x : size.x;
    point2.y = point2.y < size.y ? point2.y : size.y;

    let tileBounds = L.latLngBounds(
      L.latLng(this.options.limN, this.options.limW),
      L.latLng(this.options.limS, this.options.limE)
    );
    let mapBounds = this._map.getBounds();

    this._windy.start(
      [[point1.x, point1.y], [point2.x, point2.y]],
      size.x,
      size.y,
      [
        [mapBounds._southWest.lng, mapBounds._southWest.lat],
        [mapBounds._northEast.lng, mapBounds._northEast.lat],
      ]
    );
  },
  _initWindy: function _initWindy(self) {
    // windy object, copy options
    var options = Object.assign(
      {
        canvas: self._canvasLayer._canvas,
        map: this._map,
      },
      self.options
    );
    this._windy = new Windy(options); // prepare context global var, start drawing

    this._context = this._canvasLayer._canvas.getContext("2d");

    this._canvasLayer._canvas.classList.add("velocity-overlay");

    this.onDrawLayer();

    this._map.on("dragstart", self._windy.stop);

    // this._map.on("dragend", self._clearAndRestart);

    this._map.on("zoomstart", self._windy.stop);

    // this._map.on("zoomend", self._clearAndRestart);

    // this._map.on("resize", self._clearWind);

    this._initMouseHandler(false);
  },
  _initMouseHandler: function _initMouseHandler(voidPrevious) {
    if (voidPrevious) {
      this._map.removeControl(this._mouseControl);

      this._mouseControl = false;
    }

    if (!this._mouseControl && this.options.displayValues) {
      var options = this.options.displayOptions || {};
      options["leafletVelocity"] = this;
      this._mouseControl = L.control.velocity(options).addTo(this._map);
    }
  },
  _clearAndRestart: function _clearAndRestart() {
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    if (this._windy) this._startWindy();
  },
  _clearWind: function _clearWind() {
    if (this._windy) this._windy.stop();
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
  },
  _destroyWind: function _destroyWind() {
    if (this._timer) clearTimeout(this._timer);
    if (this._windy) this._windy.stop();
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    if (this._mouseControl) this._map.removeControl(this._mouseControl);
    this._mouseControl = null;
    this._windy = null;

    this._map.removeLayer(this._canvasLayer);
  },
});

L.particlesLayer = function(options) {
  return new L.ParticlesLayer(options);
};
/*  Global class for simulating the movement of particle through a 1km wind grid

 credit: All the credit for this work goes to: https://github.com/cambecc for creating the repo:
 https://github.com/cambecc/earth. The majority of this code is directly take nfrom there, since its awesome.

 This class takes a canvas element and an array of data (1km GFS from http://www.emc.ncep.noaa.gov/index.php?branch=GFS)
 and then uses a mercator (forward/reverse) projection to correctly map wind vectors in "map space".

 The "start" method takes the bounds of the map at its current extent and starts the whole gridding,
 interpolation and animation process.
 */

var Windy = function Windy(params) {
  var MIN_VELOCITY_INTENSITY = params.minVelocity || 0; // velocity at which particle intensity is minimum (m/s)

  var MAX_VELOCITY_INTENSITY = params.maxVelocity || 10; // velocity at which particle intensity is maximum (m/s)

  var VELOCITY_SCALE =
    (params.velocityScale || 0.005) *
    (Math.pow(window.devicePixelRatio, 1 / 3) || 1); // scale for wind velocity (completely arbitrary--this value looks nice)

  var MAX_PARTICLE_AGE = params.particleAge || 90; // max number of frames a particle is drawn before regeneration

  var PARTICLE_LINE_WIDTH = params.lineWidth || 1; // line width of a drawn particle

  var PARTICLE_MULTIPLIER = params.particleMultiplier || 1 / 300; // particle count scalar (completely arbitrary--this values looks nice)

  var PARTICLE_REDUCTION = Math.pow(window.devicePixelRatio, 1 / 3) || 1.6; // multiply particle count for mobiles by this amount

  var FRAME_RATE = params.frameRate || 15;
  var FRAME_TIME = 1000 / FRAME_RATE; // desired frames per second

  var OPACITY = 0.97;
  var defaulColorScale = [
    "rgb(36,104, 180)",
    "rgb(60,157, 194)",
    "rgb(128,205,193 )",
    "rgb(151,218,168 )",
    "rgb(198,231,181)",
    "rgb(238,247,217)",
    "rgb(255,238,159)",
    "rgb(252,217,125)",
    "rgb(255,182,100)",
    "rgb(252,150,75)",
    "rgb(250,112,52)",
    "rgb(245,64,32)",
    "rgb(237,45,28)",
    "rgb(220,24,32)",
    "rgb(180,0,35)",
  ];
  var colorScale = params.colorScale || defaulColorScale;
  var NULL_WIND_VECTOR = [NaN, NaN, null]; // singleton for no wind in the form: [u, v, magnitude]

  var builder;
  var grid;
  var gridData = params.data;
  var date;
  var λ0, φ0, Δλ, Δφ, ni, nj;

  var setData = function setData(data) {
    gridData = data;
  };

  var setOptions = function setOptions(options) {
    if (options.hasOwnProperty("minVelocity"))
      MIN_VELOCITY_INTENSITY = options.minVelocity;
    if (options.hasOwnProperty("maxVelocity"))
      MAX_VELOCITY_INTENSITY = options.maxVelocity;
    if (options.hasOwnProperty("velocityScale"))
      VELOCITY_SCALE =
        (options.velocityScale || 0.005) *
        (Math.pow(window.devicePixelRatio, 1 / 3) || 1);
    if (options.hasOwnProperty("particleAge"))
      MAX_PARTICLE_AGE = options.particleAge;
    if (options.hasOwnProperty("lineWidth"))
      PARTICLE_LINE_WIDTH = options.lineWidth;
    if (options.hasOwnProperty("particleMultiplier"))
      PARTICLE_MULTIPLIER = options.particleMultiplier;
    if (options.hasOwnProperty("opacity")) OPACITY = +options.opacity;
    if (options.hasOwnProperty("frameRate")) FRAME_RATE = options.frameRate;
    if (options.hasOwnProperty("colorScale")) colorScale = options.colorScale;
    FRAME_TIME = 1000 / FRAME_RATE;
  }; // interpolation for vectors like wind (u,v,m)

  var bilinearInterpolateVector = function bilinearInterpolateVector(
    x,
    y,
    g00,
    g10,
    g01,
    g11
  ) {
    var rx = 1 - x;
    var ry = 1 - y;
    var a = rx * ry,
      b = x * ry,
      c = rx * y,
      d = x * y;
    var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
    var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
    return [u, v, Math.sqrt(u * u + v * v)];
  };

  var createWindBuilder = function createWindBuilder(uComp, vComp) {
    var uData = uComp.data,
      vData = vComp.data;
    return {
      header: uComp.header,
      //recipe: recipeFor("wind-" + uComp.header.surface1Value),
      data: function data(i) {
        return [uData[i], vData[i]];
      },
      interpolate: bilinearInterpolateVector,
    };
  };

  var createBuilder = function createBuilder(data) {
    var uComp = null,
      vComp = null,
      scalar = null;
    data.forEach(function(record) {
      switch (
        record.header.parameterCategory + "," + record.header.parameterNumber
      ) {
        case "1,2":
        case "2,2":
          uComp = record;
          break;

        case "1,3":
        case "2,3":
          vComp = record;
          break;

        default:
          scalar = record;
      }
    });
    return createWindBuilder(uComp, vComp);
  };

  var buildGrid = function buildGrid(data, callback) {
    var supported = true;
    if (data.length < 2) supported = false;
    if (!supported)
      console.log("Windy Error: data must have at least two components (u,v)");
    builder = createBuilder(data);
    var header = builder.header;
    if (
      header.hasOwnProperty("gridDefinitionTemplate") &&
      header.gridDefinitionTemplate != 0
    )
      supported = false;

    if (!supported) {
      console.log(
        "Windy Error: Only data with Latitude_Longitude coordinates is supported"
      );
    }

    supported = true; // reset for futher checks

    λ0 = header.lo1;
    φ0 = header.la1; // the grid's origin (e.g., 0.0E, 90.0N)

    Δλ = header.dx;
    Δφ = header.dy; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)

    ni = header.nx;
    nj = header.ny; // number of grid points W-E and N-S (e.g., 144 x 73)

    if (header.hasOwnProperty("scanMode")) {
      var scanModeMask = header.scanMode.toString(2);
      scanModeMask = ("0" + scanModeMask).slice(-8);
      var scanModeMaskArray = scanModeMask
        .split("")
        .map(Number)
        .map(Boolean);
      if (scanModeMaskArray[0]) Δλ = -Δλ;
      if (scanModeMaskArray[1]) Δφ = -Δφ;
      if (scanModeMaskArray[2]) supported = false;
      if (scanModeMaskArray[3]) supported = false;
      if (scanModeMaskArray[4]) supported = false;
      if (scanModeMaskArray[5]) supported = false;
      if (scanModeMaskArray[6]) supported = false;
      if (scanModeMaskArray[7]) supported = false;
      if (!supported)
        console.log(
          "Windy Error: Data with scanMode: " +
            header.scanMode +
            " is not supported."
        );
    }

    date = new Date(header.refTime);
    date.setHours(date.getHours() + header.forecastTime); // Scan modes 0, 64 allowed.
    // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml

    grid = [];
    var p = 0;
    var isContinuous = Math.floor(ni * Δλ) >= 360;

    for (var j = 0; j < nj; j++) {
      var row = [];

      for (var i = 0; i < ni; i++, p++) {
        row[i] = builder.data(p);
      }

      if (isContinuous) {
        // For wrapped grids, duplicate first column as last column to simplify interpolation logic
        row.push(row[0]);
      }

      grid[j] = row;
    }

    callback({
      date: date,
      interpolate: interpolate,
    });
  };
  /**
   * Get interpolated grid value from Lon/Lat position
   * @param λ {Float} Longitude
   * @param φ {Float} Latitude
   * @returns {Object}
   */

  var interpolate = function interpolate(λ, φ) {
    if (!grid) return null;
    var i = floorMod(λ - λ0, 360) / Δλ; // calculate longitude index in wrapped range [0, 360)

    var j = (φ0 - φ) / Δφ; // calculate latitude index in direction +90 to -90

    var fi = Math.floor(i),
      ci = fi + 1;
    var fj = Math.floor(j),
      cj = fj + 1;
    var row;

    if ((row = grid[fj])) {
      var g00 = row[fi];
      var g10 = row[ci];

      if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
        var g01 = row[fi];
        var g11 = row[ci];

        if (isValue(g01) && isValue(g11)) {
          // All four points found, so interpolate the value.
          return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
        }
      }
    }

    return null;
  };
  /**
   * @returns {Boolean} true if the specified value is not null and not undefined.
   */

  var isValue = function isValue(x) {
    return x !== null && x !== undefined;
  };
  /**
   * @returns {Number} returns remainder of floored division, i.e., floor(a / n). Useful for consistent modulo
   *          of negative numbers. See http://en.wikipedia.org/wiki/Modulo_operation.
   */

  var floorMod = function floorMod(a, n) {
    return a - n * Math.floor(a / n);
  };
  /**
   * @returns {Number} the value x clamped to the range [low, high].
   */

  var clamp = function clamp(x, range) {
    return Math.max(range[0], Math.min(x, range[1]));
  };
  /**
   * @returns {Boolean} true if agent is probably a mobile device. Don't really care if this is accurate.
   */

  var isMobile = function isMobile() {
    return /android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i.test(
      navigator.userAgent
    );
  };
  /**
   * Calculate distortion of the wind vector caused by the shape of the projection at point (x, y). The wind
   * vector is modified in place and returned by this function.
   */

  var distort = function distort(projection, λ, φ, x, y, scale, wind) {
    var u = wind[0] * scale;
    var v = wind[1] * scale;
    var d = distortion(projection, λ, φ, x, y); // Scale distortion vectors by u and v, then add.

    wind[0] = d[0] * u + d[2] * v;
    wind[1] = d[1] * u + d[3] * v;
    return wind;
  };

  var distortion = function distortion(projection, λ, φ, x, y) {
    var τ = 2 * Math.PI; //    var H = Math.pow(10, -5.2); // 0.00000630957344480193
    //    var H = 0.0000360;          // 0.0000360°φ ~= 4m  (from https://github.com/cambecc/earth/blob/master/public/libs/earth/1.0.0/micro.js#L13)

    var H = 5; // ToDo:   Why does this work?

    var hλ = λ < 0 ? H : -H;
    var hφ = φ < 0 ? H : -H;
    var pλ = project(φ, λ + hλ);
    var pφ = project(φ + hφ, λ); // Meridian scale factor (see Snyder, equation 4-3), where R = 1. This handles issue where length of 1º λ
    // changes depending on φ. Without this, there is a pinching effect at the poles.

    var k = Math.cos((φ / 360) * τ);
    return [
      (pλ[0] - x) / hλ / k,
      (pλ[1] - y) / hλ / k,
      (pφ[0] - x) / hφ,
      (pφ[1] - y) / hφ,
    ];
  };

  var createField = function createField(columns, bounds, callback) {
    /**
     * @returns {Array} wind vector [u, v, magnitude] at the point (x, y), or [NaN, NaN, null] if wind
     *          is undefined at that point.
     */
    function field(x, y) {
      var column = columns[Math.round(x)];
      return (column && column[Math.round(y)]) || NULL_WIND_VECTOR;
    } // Frees the massive "columns" array for GC. Without this, the array is leaked (in Chrome) each time a new
    // field is interpolated because the field closure's context is leaked, for reasons that defy explanation.

    field.release = function() {
      columns = [];
    };

    field.randomize = function(o) {
      // UNDONE: this method is terrible
      var x, y;
      var safetyNet = 0;

      do {
        x = Math.round(Math.floor(Math.random() * bounds.width) + bounds.x);
        y = Math.round(Math.floor(Math.random() * bounds.height) + bounds.y);
      } while (field(x, y)[2] === null && safetyNet++ < 30);

      o.x = x;
      o.y = y;
      return o;
    };

    callback(bounds, field);
  };

  var buildBounds = function buildBounds(bounds, width, height) {
    var upperLeft = bounds[0];
    var lowerRight = bounds[1];
    var x = Math.max(Math.floor(upperLeft[0], 0), 0);

    var y = Math.max(Math.floor(upperLeft[1], 0), 0);
    var xMax = Math.min(Math.ceil(lowerRight[0], width), width - 1);
    var yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);
    return {
      x: x,
      y: y,
      xMax: xMax,
      yMax: yMax,
      width: width,
      height: height,
    };
  };

  var deg2rad = function deg2rad(deg) {
    return (deg / 180) * Math.PI;
  };

  var invert = function invert(x, y, windy) {
    var latlon = params.map.containerPointToLatLng(L.point(x, y));
    return [latlon.lng, latlon.lat];
  };

  var project = function project(lat, lon, windy) {
    var xy = params.map.latLngToContainerPoint(L.latLng(lat, lon));
    return [xy.x, xy.y];
  };

  var interpolateField = function interpolateField(
    grid,
    bounds,
    extent,
    callback
  ) {
    var projection = {}; // map.crs used instead

    var mapArea = (extent.south - extent.north) * (extent.west - extent.east);
    var velocityScale = VELOCITY_SCALE * Math.pow(mapArea, 0.4);
    var columns = [];
    var x = bounds.x;

    function interpolateColumn(x) {
      var column = [];

      for (var y = bounds.y; y <= bounds.yMax; y += 2) {
        var coord = invert(x, y);

        if (coord) {
          var λ = coord[0],
            φ = coord[1];

          if (isFinite(λ)) {
            var wind = grid.interpolate(λ, φ);

            if (wind) {
              wind = distort(projection, λ, φ, x, y, velocityScale, wind);
              column[y + 1] = column[y] = wind;
            }
          }
        }
      }

      columns[x + 1] = columns[x] = column;
    }

    (function batchInterpolate() {
      var start = Date.now();

      while (x < bounds.xMax) {
        interpolateColumn(x);
        x += 2;

        if (Date.now() - start > 1000) {
          //MAX_TASK_TIME) {
          setTimeout(batchInterpolate, 25);
          return;
        }
      }

      createField(columns, bounds, callback);
    })();
  };

  var animationLoop;

  var animate = function animate(bounds, field) {
    function windIntensityColorScale(min, max) {
      colorScale.indexFor = function(m) {
        // map velocity speed to a style
        return Math.max(
          0,
          Math.min(
            colorScale.length - 1,
            Math.round(((m - min) / (max - min)) * (colorScale.length - 1))
          )
        );
      };

      return colorScale;
    }

    var colorStyles = windIntensityColorScale(
      MIN_VELOCITY_INTENSITY,
      MAX_VELOCITY_INTENSITY
    );
    var buckets = colorStyles.map(function() {
      return [];
    });
    //var particleCount = Math.round(bounds.width * bounds.height * PARTICLE_MULTIPLIER);
    var particleCount = Math.round(
      (bounds.xMax - bounds.x) * (bounds.yMax - bounds.y) * PARTICLE_MULTIPLIER
    );

    if (isMobile()) {
      particleCount *= PARTICLE_REDUCTION;
    }

    var fadeFillStyle = "rgba(0, 0, 0, ".concat(OPACITY, ")");
    var particles = [];

    for (var i = 0; i < particleCount; i++) {
      particles.push(
        field.randomize({
          age: Math.floor(Math.random() * MAX_PARTICLE_AGE) + 0,
        })
      );
    }

    function evolve() {
      buckets.forEach(function(bucket) {
        bucket.length = 0;
      });
      particles.forEach(function(particle) {
        if (particle.age > MAX_PARTICLE_AGE) {
          field.randomize(particle).age = 0;
        }

        var x = particle.x;
        var y = particle.y;
        var v = field(x, y); // vector at current position

        var m = v[2];

        if (m === null) {
          particle.age = MAX_PARTICLE_AGE; // particle has escaped the grid, never to return...
        } else {
          var xt = x + v[0];
          var yt = y + v[1];

          if (field(xt, yt)[2] !== null) {
            // Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
            particle.xt = xt;
            particle.yt = yt;
            buckets[colorStyles.indexFor(m)].push(particle);
          } else {
            // Particle isn't visible, but it still moves through the field.
            particle.x = xt;
            particle.y = yt;
          }
        }

        particle.age += 1;
      });
    }

    var g = params.canvas.getContext("2d");
    g.lineWidth = PARTICLE_LINE_WIDTH;
    //console.log(Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2)));
    g.fillStyle = fadeFillStyle;
    g.globalAlpha = 0.6;

    function draw() {
      // Fade existing particle trails.
      var prev = "lighter";
      g.globalCompositeOperation = "destination-in";
      g.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      g.globalCompositeOperation = prev;
      g.globalAlpha = OPACITY === 0 ? 0 : OPACITY * 0.9; // Draw new particle trails.

      buckets.forEach(function(bucket, i) {
        if (bucket.length > 0) {
          g.beginPath();
          g.strokeStyle = colorStyles[i];
          bucket.forEach(function(particle) {
            if (false) {
              var v = field(particle.x, particle.y);
              g.lineWidth =
                PARTICLE_LINE_WIDTH * 1.5 +
                Math.sqrt(v[0] * v[0]) +
                v[1] * v[1];
              // var length = Math.sqrt((v[0] * v[0]) + (v[1] * v[1])); //calculating length
              // v[0] = v[0] / length; //assigning new value to x (dividing x by length of the vector)
              // v[1] = v[1] / length;; //assigning new value to y
              // v[2] = 1;
              // particle.xt = particle.x + v[0];
              // particle.yt = particle.y + v[1];
            } else {
            }
            g.moveTo(particle.x, particle.y);
            g.lineTo(particle.xt, particle.yt);
            particle.x = particle.xt;
            particle.y = particle.yt;
          });
          g.stroke();
        }
      });
    }

    var then = Date.now();

    (function frame() {
      animationLoop = requestAnimationFrame(frame);
      var now = Date.now();
      var delta = now - then;

      if (delta > FRAME_TIME) {
        then = now - (delta % FRAME_TIME);
        evolve();
        draw();
      }
    })();
  };

  var start = function start(bounds, width, height, extent) {
    var mapBounds = {
      south: deg2rad(extent[0][1]),
      north: deg2rad(extent[1][1]),
      east: deg2rad(extent[1][0]),
      west: deg2rad(extent[0][0]),
      width: width,
      height: height,
    };
    stop(); // build grid

    buildGrid(gridData, function(grid) {
      // interpolateField
      interpolateField(
        grid,
        buildBounds(bounds, width, height),
        mapBounds,
        function(bounds, field) {
          // animate the canvas with random points
          windy.field = field;
          animate(bounds, field);
        }
      );
    });
  };

  var stop = function stop() {
    if (windy.field) windy.field.release();
    if (animationLoop) cancelAnimationFrame(animationLoop);
  };

  var windy = {
    params: params,
    start: start,
    stop: stop,
    createField: createField,
    interpolatePoint: interpolate,
    setData: setData,
    setOptions: setOptions,
  };
  return windy;
};

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}


/* @preserve
 * Leaflet 1.3.1, a JS library for interactive maps. http://leafletjs.com
 * (c) 2010-2017 Vladimir Agafonkin, (c) 2010-2011 CloudMade
 */
 !function(t, i) {
  "object" == typeof exports && "undefined" != typeof module ? i(exports) : "function" == typeof define && define.amd ? define(["exports"], i) : i(t.L = {})
}(this, function(t) {
  "use strict";
  function i(t) {
      var i, e, n, o;
      for (e = 1,
      n = arguments.length; e < n; e++) {
          o = arguments[e];
          for (i in o)
              t[i] = o[i]
      }
      return t
  }
  function e(t, i) {
      var e = Array.prototype.slice;
      if (t.bind)
          return t.bind.apply(t, e.call(arguments, 1));
      var n = e.call(arguments, 2);
      return function() {
          return t.apply(i, n.length ? n.concat(e.call(arguments)) : arguments)
      }
  }
  function n(t) {
      return t._leaflet_id = t._leaflet_id || ++ti,
      t._leaflet_id
  }
  function o(t, i, e) {
      var n, o, s, r;
      return r = function() {
          n = !1,
          o && (s.apply(e, o),
          o = !1)
      }
      ,
      s = function() {
          n ? o = arguments : (t.apply(e, arguments),
          setTimeout(r, i),
          n = !0)
      }
  }
  function s(t, i, e) {
      var n = i[1]
        , o = i[0]
        , s = n - o;
      return t === n && e ? t : ((t - o) % s + s) % s + o
  }
  function r() {
      return !1
  }
  function a(t, i) {
      var e = Math.pow(10, void 0 === i ? 6 : i);
      return Math.round(t * e) / e
  }
  function h(t) {
      return t.trim ? t.trim() : t.replace(/^\s+|\s+$/g, "")
  }
  function u(t) {
      return h(t).split(/\s+/)
  }
  function l(t, i) {
      t.hasOwnProperty("options") || (t.options = t.options ? Qt(t.options) : {});
      for (var e in i)
          t.options[e] = i[e];
      return t.options
  }
  function c(t, i, e) {
      var n = [];
      for (var o in t)
          n.push(encodeURIComponent(e ? o.toUpperCase() : o) + "=" + encodeURIComponent(t[o]));
      return (i && -1 !== i.indexOf("?") ? "&" : "?") + n.join("&")
  }
  function _(t, i) {
      return t.replace(ii, function(t, e) {
          var n = i[e];
          if (void 0 === n)
              throw new Error("No value provided for variable " + t);
          return "function" == typeof n && (n = n(i)),
          n
      })
  }
  function d(t, i) {
      for (var e = 0; e < t.length; e++)
          if (t[e] === i)
              return e;
      return -1
  }
  function p(t) {
      return window["webkit" + t] || window["moz" + t] || window["ms" + t]
  }
  function m(t) {
      var i = +new Date
        , e = Math.max(0, 16 - (i - oi));
      return oi = i + e,
      window.setTimeout(t, e)
  }
  function f(t, i, n) {
      if (!n || si !== m)
          return si.call(window, e(t, i));
      t.call(i)
  }
  function g(t) {
      t && ri.call(window, t)
  }
  function v() {}
  function y(t) {
      if ("undefined" != typeof L && L && L.Mixin) {
          t = ei(t) ? t : [t];
          for (var i = 0; i < t.length; i++)
              t[i] === L.Mixin.Events && console.warn("Deprecated include of L.Mixin.Events: this property will be removed in future releases, please inherit from L.Evented instead.", (new Error).stack)
      }
  }
  function x(t, i, e) {
      this.x = e ? Math.round(t) : t,
      this.y = e ? Math.round(i) : i
  }
  function w(t, i, e) {
      return t instanceof x ? t : ei(t) ? new x(t[0],t[1]) : void 0 === t || null === t ? t : "object" == typeof t && "x"in t && "y"in t ? new x(t.x,t.y) : new x(t,i,e)
  }
  function P(t, i) {
      if (t)
          for (var e = i ? [t, i] : t, n = 0, o = e.length; n < o; n++)
              this.extend(e[n])
  }
  function b(t, i) {
      return !t || t instanceof P ? t : new P(t,i)
  }
  function T(t, i) {
      if (t)
          for (var e = i ? [t, i] : t, n = 0, o = e.length; n < o; n++)
              this.extend(e[n])
  }
  function z(t, i) {
      return t instanceof T ? t : new T(t,i)
  }
  function M(t, i, e) {
      if (isNaN(t) || isNaN(i))
          throw new Error("Invalid LatLng object: (" + t + ", " + i + ")");
      this.lat = +t,
      this.lng = +i,
      void 0 !== e && (this.alt = +e)
  }
  function C(t, i, e) {
      return t instanceof M ? t : ei(t) && "object" != typeof t[0] ? 3 === t.length ? new M(t[0],t[1],t[2]) : 2 === t.length ? new M(t[0],t[1]) : null : void 0 === t || null === t ? t : "object" == typeof t && "lat"in t ? new M(t.lat,"lng"in t ? t.lng : t.lon,t.alt) : void 0 === i ? null : new M(t,i,e)
  }
  function Z(t, i, e, n) {
      if (ei(t))
          return this._a = t[0],
          this._b = t[1],
          this._c = t[2],
          void (this._d = t[3]);
      this._a = t,
      this._b = i,
      this._c = e,
      this._d = n
  }
  function S(t, i, e, n) {
      return new Z(t,i,e,n)
  }
  function E(t) {
      return document.createElementNS("http://www.w3.org/2000/svg", t)
  }
  function k(t, i) {
      var e, n, o, s, r, a, h = "";
      for (e = 0,
      o = t.length; e < o; e++) {
          for (n = 0,
          s = (r = t[e]).length; n < s; n++)
              a = r[n],
              h += (n ? "L" : "M") + a.x + " " + a.y;
          h += i ? Xi ? "z" : "x" : ""
      }
      return h || "M0 0"
  }
  function I(t) {
      return navigator.userAgent.toLowerCase().indexOf(t) >= 0
  }
  function A(t, i, e, n) {
      return "touchstart" === i ? O(t, e, n) : "touchmove" === i ? W(t, e, n) : "touchend" === i && H(t, e, n),
      this
  }
  function B(t, i, e) {
      var n = t["_leaflet_" + i + e];
      return "touchstart" === i ? t.removeEventListener(Qi, n, !1) : "touchmove" === i ? t.removeEventListener(te, n, !1) : "touchend" === i && (t.removeEventListener(ie, n, !1),
      t.removeEventListener(ee, n, !1)),
      this
  }
  function O(t, i, n) {
      var o = e(function(t) {
          if ("mouse" !== t.pointerType && t.MSPOINTER_TYPE_MOUSE && t.pointerType !== t.MSPOINTER_TYPE_MOUSE) {
              if (!(ne.indexOf(t.target.tagName) < 0))
                  return;
              $(t)
          }
          j(t, i)
      });
      t["_leaflet_touchstart" + n] = o,
      t.addEventListener(Qi, o, !1),
      se || (document.documentElement.addEventListener(Qi, R, !0),
      document.documentElement.addEventListener(te, D, !0),
      document.documentElement.addEventListener(ie, N, !0),
      document.documentElement.addEventListener(ee, N, !0),
      se = !0)
  }
  function R(t) {
      oe[t.pointerId] = t,
      re++
  }
  function D(t) {
      oe[t.pointerId] && (oe[t.pointerId] = t)
  }
  function N(t) {
      delete oe[t.pointerId],
      re--
  }
  function j(t, i) {
      t.touches = [];
      for (var e in oe)
          t.touches.push(oe[e]);
      t.changedTouches = [t],
      i(t)
  }
  function W(t, i, e) {
      var n = function(t) {
          (t.pointerType !== t.MSPOINTER_TYPE_MOUSE && "mouse" !== t.pointerType || 0 !== t.buttons) && j(t, i)
      };
      t["_leaflet_touchmove" + e] = n,
      t.addEventListener(te, n, !1)
  }
  function H(t, i, e) {
      var n = function(t) {
          j(t, i)
      };
      t["_leaflet_touchend" + e] = n,
      t.addEventListener(ie, n, !1),
      t.addEventListener(ee, n, !1)
  }
  function F(t, i, e) {
      function n(t) {
          var i;
          if (Ui) {
              if (!Pi || "mouse" === t.pointerType)
                  return;
              i = re
          } else
              i = t.touches.length;
          if (!(i > 1)) {
              var e = Date.now()
                , n = e - (s || e);
              r = t.touches ? t.touches[0] : t,
              a = n > 0 && n <= h,
              s = e
          }
      }
      function o(t) {
          if (a && !r.cancelBubble) {
              if (Ui) {
                  if (!Pi || "mouse" === t.pointerType)
                      return;
                  var e, n, o = {};
                  for (n in r)
                      e = r[n],
                      o[n] = e && e.bind ? e.bind(r) : e;
                  r = o
              }
              r.type = "dblclick",
              i(r),
              s = null
          }
      }
      var s, r, a = !1, h = 250;
      return t[ue + ae + e] = n,
      t[ue + he + e] = o,
      t[ue + "dblclick" + e] = i,
      t.addEventListener(ae, n, !1),
      t.addEventListener(he, o, !1),
      t.addEventListener("dblclick", i, !1),
      this
  }
  function U(t, i) {
      var e = t[ue + ae + i]
        , n = t[ue + he + i]
        , o = t[ue + "dblclick" + i];
      return t.removeEventListener(ae, e, !1),
      t.removeEventListener(he, n, !1),
      Pi || t.removeEventListener("dblclick", o, !1),
      this
  }
  function V(t, i, e, n) {
      if ("object" == typeof i)
          for (var o in i)
              G(t, o, i[o], e);
      else
          for (var s = 0, r = (i = u(i)).length; s < r; s++)
              G(t, i[s], e, n);
      return this
  }
  function q(t, i, e, n) {
      if ("object" == typeof i)
          for (var o in i)
              K(t, o, i[o], e);
      else if (i)
          for (var s = 0, r = (i = u(i)).length; s < r; s++)
              K(t, i[s], e, n);
      else {
          for (var a in t[le])
              K(t, a, t[le][a]);
          delete t[le]
      }
      return this
  }
  function G(t, i, e, o) {
      var s = i + n(e) + (o ? "_" + n(o) : "");
      if (t[le] && t[le][s])
          return this;
      var r = function(i) {
          return e.call(o || t, i || window.event)
      }
        , a = r;
      Ui && 0 === i.indexOf("touch") ? A(t, i, r, s) : !Vi || "dblclick" !== i || !F || Ui && Si ? "addEventListener"in t ? "mousewheel" === i ? t.addEventListener("onwheel"in t ? "wheel" : "mousewheel", r, !1) : "mouseenter" === i || "mouseleave" === i ? (r = function(i) {
          i = i || window.event,
          ot(t, i) && a(i)
      }
      ,
      t.addEventListener("mouseenter" === i ? "mouseover" : "mouseout", r, !1)) : ("click" === i && Ti && (r = function(t) {
          st(t, a)
      }
      ),
      t.addEventListener(i, r, !1)) : "attachEvent"in t && t.attachEvent("on" + i, r) : F(t, r, s),
      t[le] = t[le] || {},
      t[le][s] = r
  }
  function K(t, i, e, o) {
      var s = i + n(e) + (o ? "_" + n(o) : "")
        , r = t[le] && t[le][s];
      if (!r)
          return this;
      Ui && 0 === i.indexOf("touch") ? B(t, i, s) : !Vi || "dblclick" !== i || !U || Ui && Si ? "removeEventListener"in t ? "mousewheel" === i ? t.removeEventListener("onwheel"in t ? "wheel" : "mousewheel", r, !1) : t.removeEventListener("mouseenter" === i ? "mouseover" : "mouseleave" === i ? "mouseout" : i, r, !1) : "detachEvent"in t && t.detachEvent("on" + i, r) : U(t, s),
      t[le][s] = null
  }
  function Y(t) {
      return t.stopPropagation ? t.stopPropagation() : t.originalEvent ? t.originalEvent._stopped = !0 : t.cancelBubble = !0,
      nt(t),
      this
  }
  function X(t) {
      return G(t, "mousewheel", Y),
      this
  }
  function J(t) {
      return V(t, "mousedown touchstart dblclick", Y),
      G(t, "click", et),
      this
  }
  function $(t) {
      return t.preventDefault ? t.preventDefault() : t.returnValue = !1,
      this
  }
  function Q(t) {
      return $(t),
      Y(t),
      this
  }
  function tt(t, i) {
      if (!i)
          return new x(t.clientX,t.clientY);
      var e = i.getBoundingClientRect()
        , n = e.width / i.offsetWidth || 1
        , o = e.height / i.offsetHeight || 1;
      return new x(t.clientX / n - e.left - i.clientLeft,t.clientY / o - e.top - i.clientTop)
  }
  function it(t) {
      return Pi ? t.wheelDeltaY / 2 : t.deltaY && 0 === t.deltaMode ? -t.deltaY / ce : t.deltaY && 1 === t.deltaMode ? 20 * -t.deltaY : t.deltaY && 2 === t.deltaMode ? 60 * -t.deltaY : t.deltaX || t.deltaZ ? 0 : t.wheelDelta ? (t.wheelDeltaY || t.wheelDelta) / 2 : t.detail && Math.abs(t.detail) < 32765 ? 20 * -t.detail : t.detail ? t.detail / -32765 * 60 : 0
  }
  function et(t) {
      _e[t.type] = !0
  }
  function nt(t) {
      var i = _e[t.type];
      return _e[t.type] = !1,
      i
  }
  function ot(t, i) {
      var e = i.relatedTarget;
      if (!e)
          return !0;
      try {
          for (; e && e !== t; )
              e = e.parentNode
      } catch (t) {
          return !1
      }
      return e !== t
  }
  function st(t, i) {
      var e = t.timeStamp || t.originalEvent && t.originalEvent.timeStamp
        , n = pi && e - pi;
      n && n > 100 && n < 500 || t.target._simulatedClick && !t._simulated ? Q(t) : (pi = e,
      i(t))
  }
  function rt(t) {
      return "string" == typeof t ? document.getElementById(t) : t
  }
  function at(t, i) {
      var e = t.style[i] || t.currentStyle && t.currentStyle[i];
      if ((!e || "auto" === e) && document.defaultView) {
          var n = document.defaultView.getComputedStyle(t, null);
          e = n ? n[i] : null
      }
      return "auto" === e ? null : e
  }
  function ht(t, i, e) {
      var n = document.createElement(t);
      return n.className = i || "",
      e && e.appendChild(n),
      n
  }
  function ut(t) {
      var i = t.parentNode;
      i && i.removeChild(t)
  }
  function lt(t) {
      for (; t.firstChild; )
          t.removeChild(t.firstChild)
  }
  function ct(t) {
      var i = t.parentNode;
      i.lastChild !== t && i.appendChild(t)
  }
  function _t(t) {
      var i = t.parentNode;
      i.firstChild !== t && i.insertBefore(t, i.firstChild)
  }
  function dt(t, i) {
      if (void 0 !== t.classList)
          return t.classList.contains(i);
      var e = gt(t);
      return e.length > 0 && new RegExp("(^|\\s)" + i + "(\\s|$)").test(e)
  }
  function pt(t, i) {
      if (void 0 !== t.classList)
          for (var e = u(i), n = 0, o = e.length; n < o; n++)
              t.classList.add(e[n]);
      else if (!dt(t, i)) {
          var s = gt(t);
          ft(t, (s ? s + " " : "") + i)
      }
  }
  function mt(t, i) {
      void 0 !== t.classList ? t.classList.remove(i) : ft(t, h((" " + gt(t) + " ").replace(" " + i + " ", " ")))
  }
  function ft(t, i) {
      void 0 === t.className.baseVal ? t.className = i : t.className.baseVal = i
  }
  function gt(t) {
      return void 0 === t.className.baseVal ? t.className : t.className.baseVal
  }
  function vt(t, i) {
      "opacity"in t.style ? t.style.opacity = i : "filter"in t.style && yt(t, i)
  }
  function yt(t, i) {
      var e = !1
        , n = "DXImageTransform.Microsoft.Alpha";
      try {
          e = t.filters.item(n)
      } catch (t) {
          if (1 === i)
              return
      }
      i = Math.round(100 * i),
      e ? (e.Enabled = 100 !== i,
      e.Opacity = i) : t.style.filter += " progid:" + n + "(opacity=" + i + ")"
  }
  function xt(t) {
      for (var i = document.documentElement.style, e = 0; e < t.length; e++)
          if (t[e]in i)
              return t[e];
      return !1
  }
  function wt(t, i, e) {
      var n = i || new x(0,0);
      t.style[pe] = (Oi ? "translate(" + n.x + "px," + n.y + "px)" : "translate3d(" + n.x + "px," + n.y + "px,0)") + (e ? " scale(" + e + ")" : "")
  }
  function Lt(t, i) {
      t._leaflet_pos = i,
      Ni ? wt(t, i) : (t.style.left = i.x + "px",
      t.style.top = i.y + "px")
  }
  function Pt(t) {
      return t._leaflet_pos || new x(0,0)
  }
  function bt() {
      V(window, "dragstart", $)
  }
  function Tt() {
      q(window, "dragstart", $)
  }
  function zt(t) {
      for (; -1 === t.tabIndex; )
          t = t.parentNode;
      t.style && (Mt(),
      ve = t,
      ye = t.style.outline,
      t.style.outline = "none",
      V(window, "keydown", Mt))
  }
  function Mt() {
      ve && (ve.style.outline = ye,
      ve = void 0,
      ye = void 0,
      q(window, "keydown", Mt))
  }
  function Ct(t, i) {
      if (!i || !t.length)
          return t.slice();
      var e = i * i;
      return t = kt(t, e),
      t = St(t, e)
  }
  function Zt(t, i, e) {
      return Math.sqrt(Rt(t, i, e, !0))
  }
  function St(t, i) {
      var e = t.length
        , n = new (typeof Uint8Array != void 0 + "" ? Uint8Array : Array)(e);
      n[0] = n[e - 1] = 1,
      Et(t, n, i, 0, e - 1);
      var o, s = [];
      for (o = 0; o < e; o++)
          n[o] && s.push(t[o]);
      return s
  }
  function Et(t, i, e, n, o) {
      var s, r, a, h = 0;
      for (r = n + 1; r <= o - 1; r++)
          (a = Rt(t[r], t[n], t[o], !0)) > h && (s = r,
          h = a);
      h > e && (i[s] = 1,
      Et(t, i, e, n, s),
      Et(t, i, e, s, o))
  }
  function kt(t, i) {
      for (var e = [t[0]], n = 1, o = 0, s = t.length; n < s; n++)
          Ot(t[n], t[o]) > i && (e.push(t[n]),
          o = n);
      return o < s - 1 && e.push(t[s - 1]),
      e
  }
  function It(t, i, e, n, o) {
      var s, r, a, h = n ? Se : Bt(t, e), u = Bt(i, e);
      for (Se = u; ; ) {
          if (!(h | u))
              return [t, i];
          if (h & u)
              return !1;
          a = Bt(r = At(t, i, s = h || u, e, o), e),
          s === h ? (t = r,
          h = a) : (i = r,
          u = a)
      }
  }
  function At(t, i, e, n, o) {
      var s, r, a = i.x - t.x, h = i.y - t.y, u = n.min, l = n.max;
      return 8 & e ? (s = t.x + a * (l.y - t.y) / h,
      r = l.y) : 4 & e ? (s = t.x + a * (u.y - t.y) / h,
      r = u.y) : 2 & e ? (s = l.x,
      r = t.y + h * (l.x - t.x) / a) : 1 & e && (s = u.x,
      r = t.y + h * (u.x - t.x) / a),
      new x(s,r,o)
  }
  function Bt(t, i) {
      var e = 0;
      return t.x < i.min.x ? e |= 1 : t.x > i.max.x && (e |= 2),
      t.y < i.min.y ? e |= 4 : t.y > i.max.y && (e |= 8),
      e
  }
  function Ot(t, i) {
      var e = i.x - t.x
        , n = i.y - t.y;
      return e * e + n * n
  }
  function Rt(t, i, e, n) {
      var o, s = i.x, r = i.y, a = e.x - s, h = e.y - r, u = a * a + h * h;
      return u > 0 && ((o = ((t.x - s) * a + (t.y - r) * h) / u) > 1 ? (s = e.x,
      r = e.y) : o > 0 && (s += a * o,
      r += h * o)),
      a = t.x - s,
      h = t.y - r,
      n ? a * a + h * h : new x(s,r)
  }
  function Dt(t) {
      return !ei(t[0]) || "object" != typeof t[0][0] && void 0 !== t[0][0]
  }
  function Nt(t) {
      return console.warn("Deprecated use of _flat, please use L.LineUtil.isFlat instead."),
      Dt(t)
  }
  function jt(t, i, e) {
      var n, o, s, r, a, h, u, l, c, _ = [1, 4, 2, 8];
      for (o = 0,
      u = t.length; o < u; o++)
          t[o]._code = Bt(t[o], i);
      for (r = 0; r < 4; r++) {
          for (l = _[r],
          n = [],
          o = 0,
          s = (u = t.length) - 1; o < u; s = o++)
              a = t[o],
              h = t[s],
              a._code & l ? h._code & l || ((c = At(h, a, l, i, e))._code = Bt(c, i),
              n.push(c)) : (h._code & l && ((c = At(h, a, l, i, e))._code = Bt(c, i),
              n.push(c)),
              n.push(a));
          t = n
      }
      return t
  }
  function Wt(t, i) {
      var e, n, o, s, r = "Feature" === t.type ? t.geometry : t, a = r ? r.coordinates : null, h = [], u = i && i.pointToLayer, l = i && i.coordsToLatLng || Ht;
      if (!a && !r)
          return null;
      switch (r.type) {
      case "Point":
          return e = l(a),
          u ? u(t, e) : new Xe(e);
      case "MultiPoint":
          for (o = 0,
          s = a.length; o < s; o++)
              e = l(a[o]),
              h.push(u ? u(t, e) : new Xe(e));
          return new qe(h);
      case "LineString":
      case "MultiLineString":
          return n = Ft(a, "LineString" === r.type ? 0 : 1, l),
          new tn(n,i);
      case "Polygon":
      case "MultiPolygon":
          return n = Ft(a, "Polygon" === r.type ? 1 : 2, l),
          new en(n,i);
      case "GeometryCollection":
          for (o = 0,
          s = r.geometries.length; o < s; o++) {
              var c = Wt({
                  geometry: r.geometries[o],
                  type: "Feature",
                  properties: t.properties
              }, i);
              c && h.push(c)
          }
          return new qe(h);
      default:
          throw new Error("Invalid GeoJSON object.")
      }
  }
  function Ht(t) {
      return new M(t[1],t[0],t[2])
  }
  function Ft(t, i, e) {
      for (var n, o = [], s = 0, r = t.length; s < r; s++)
          n = i ? Ft(t[s], i - 1, e) : (e || Ht)(t[s]),
          o.push(n);
      return o
  }
  function Ut(t, i) {
      return i = "number" == typeof i ? i : 6,
      void 0 !== t.alt ? [a(t.lng, i), a(t.lat, i), a(t.alt, i)] : [a(t.lng, i), a(t.lat, i)]
  }
  function Vt(t, i, e, n) {
      for (var o = [], s = 0, r = t.length; s < r; s++)
          o.push(i ? Vt(t[s], i - 1, e, n) : Ut(t[s], n));
      return !i && e && o.push(o[0]),
      o
  }
  function qt(t, e) {
      return t.feature ? i({}, t.feature, {
          geometry: e
      }) : Gt(e)
  }
  function Gt(t) {
      return "Feature" === t.type || "FeatureCollection" === t.type ? t : {
          type: "Feature",
          properties: {},
          geometry: t
      }
  }
  function Kt(t, i) {
      return new nn(t,i)
  }
  function Yt(t, i) {
      return new dn(t,i)
  }
  function Xt(t) {
      return Yi ? new fn(t) : null
  }
  function Jt(t) {
      return Xi || Ji ? new xn(t) : null
  }
  var $t = Object.freeze;
  Object.freeze = function(t) {
      return t
  }
  ;
  var Qt = Object.create || function() {
      function t() {}
      return function(i) {
          return t.prototype = i,
          new t
      }
  }()
    , ti = 0
    , ii = /\{ *([\w_-]+) *\}/g
    , ei = Array.isArray || function(t) {
      return "[object Array]" === Object.prototype.toString.call(t)
  }
    , ni = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
    , oi = 0
    , si = window.requestAnimationFrame || p("RequestAnimationFrame") || m
    , ri = window.cancelAnimationFrame || p("CancelAnimationFrame") || p("CancelRequestAnimationFrame") || function(t) {
      window.clearTimeout(t)
  }
    , ai = (Object.freeze || Object)({
      freeze: $t,
      extend: i,
      create: Qt,
      bind: e,
      lastId: ti,
      stamp: n,
      throttle: o,
      wrapNum: s,
      falseFn: r,
      formatNum: a,
      trim: h,
      splitWords: u,
      setOptions: l,
      getParamString: c,
      template: _,
      isArray: ei,
      indexOf: d,
      emptyImageUrl: ni,
      requestFn: si,
      cancelFn: ri,
      requestAnimFrame: f,
      cancelAnimFrame: g
  });
  v.extend = function(t) {
      var e = function() {
          this.initialize && this.initialize.apply(this, arguments),
          this.callInitHooks()
      }
        , n = e.__super__ = this.prototype
        , o = Qt(n);
      o.constructor = e,
      e.prototype = o;
      for (var s in this)
          this.hasOwnProperty(s) && "prototype" !== s && "__super__" !== s && (e[s] = this[s]);
      return t.statics && (i(e, t.statics),
      delete t.statics),
      t.includes && (y(t.includes),
      i.apply(null, [o].concat(t.includes)),
      delete t.includes),
      o.options && (t.options = i(Qt(o.options), t.options)),
      i(o, t),
      o._initHooks = [],
      o.callInitHooks = function() {
          if (!this._initHooksCalled) {
              n.callInitHooks && n.callInitHooks.call(this),
              this._initHooksCalled = !0;
              for (var t = 0, i = o._initHooks.length; t < i; t++)
                  o._initHooks[t].call(this)
          }
      }
      ,
      e
  }
  ,
  v.include = function(t) {
      return i(this.prototype, t),
      this
  }
  ,
  v.mergeOptions = function(t) {
      return i(this.prototype.options, t),
      this
  }
  ,
  v.addInitHook = function(t) {
      var i = Array.prototype.slice.call(arguments, 1)
        , e = "function" == typeof t ? t : function() {
          this[t].apply(this, i)
      }
      ;
      return this.prototype._initHooks = this.prototype._initHooks || [],
      this.prototype._initHooks.push(e),
      this
  }
  ;
  var hi = {
      on: function(t, i, e) {
          if ("object" == typeof t)
              for (var n in t)
                  this._on(n, t[n], i);
          else
              for (var o = 0, s = (t = u(t)).length; o < s; o++)
                  this._on(t[o], i, e);
          return this
      },
      off: function(t, i, e) {
          if (t)
              if ("object" == typeof t)
                  for (var n in t)
                      this._off(n, t[n], i);
              else
                  for (var o = 0, s = (t = u(t)).length; o < s; o++)
                      this._off(t[o], i, e);
          else
              delete this._events;
          return this
      },
      _on: function(t, i, e) {
          this._events = this._events || {};
          var n = this._events[t];
          n || (n = [],
          this._events[t] = n),
          e === this && (e = void 0);
          for (var o = {
              fn: i,
              ctx: e
          }, s = n, r = 0, a = s.length; r < a; r++)
              if (s[r].fn === i && s[r].ctx === e)
                  return;
          s.push(o)
      },
      _off: function(t, i, e) {
          var n, o, s;
          if (this._events && (n = this._events[t]))
              if (i) {
                  if (e === this && (e = void 0),
                  n)
                      for (o = 0,
                      s = n.length; o < s; o++) {
                          var a = n[o];
                          if (a.ctx === e && a.fn === i)
                              return a.fn = r,
                              this._firingCount && (this._events[t] = n = n.slice()),
                              void n.splice(o, 1)
                      }
              } else {
                  for (o = 0,
                  s = n.length; o < s; o++)
                      n[o].fn = r;
                  delete this._events[t]
              }
      },
      fire: function(t, e, n) {
          if (!this.listens(t, n))
              return this;
          var o = i({}, e, {
              type: t,
              target: this,
              sourceTarget: e && e.sourceTarget || this
          });
          if (this._events) {
              var s = this._events[t];
              if (s) {
                  this._firingCount = this._firingCount + 1 || 1;
                  for (var r = 0, a = s.length; r < a; r++) {
                      var h = s[r];
                      h.fn.call(h.ctx || this, o)
                  }
                  this._firingCount--
              }
          }
          return n && this._propagateEvent(o),
          this
      },
      listens: function(t, i) {
          var e = this._events && this._events[t];
          if (e && e.length)
              return !0;
          if (i)
              for (var n in this._eventParents)
                  if (this._eventParents[n].listens(t, i))
                      return !0;
          return !1
      },
      once: function(t, i, n) {
          if ("object" == typeof t) {
              for (var o in t)
                  this.once(o, t[o], i);
              return this
          }
          var s = e(function() {
              this.off(t, i, n).off(t, s, n)
          }, this);
          return this.on(t, i, n).on(t, s, n)
      },
      addEventParent: function(t) {
          return this._eventParents = this._eventParents || {},
          this._eventParents[n(t)] = t,
          this
      },
      removeEventParent: function(t) {
          return this._eventParents && delete this._eventParents[n(t)],
          this
      },
      _propagateEvent: function(t) {
          for (var e in this._eventParents)
              this._eventParents[e].fire(t.type, i({
                  layer: t.target,
                  propagatedFrom: t.target
              }, t), !0)
      }
  };
  hi.addEventListener = hi.on,
  hi.removeEventListener = hi.clearAllEventListeners = hi.off,
  hi.addOneTimeEventListener = hi.once,
  hi.fireEvent = hi.fire,
  hi.hasEventListeners = hi.listens;
  var ui = v.extend(hi)
    , li = Math.trunc || function(t) {
      return t > 0 ? Math.floor(t) : Math.ceil(t)
  }
  ;
  x.prototype = {
      clone: function() {
          return new x(this.x,this.y)
      },
      add: function(t) {
          return this.clone()._add(w(t))
      },
      _add: function(t) {
          return this.x += t.x,
          this.y += t.y,
          this
      },
      subtract: function(t) {
          return this.clone()._subtract(w(t))
      },
      _subtract: function(t) {
          return this.x -= t.x,
          this.y -= t.y,
          this
      },
      divideBy: function(t) {
          return this.clone()._divideBy(t)
      },
      _divideBy: function(t) {
          return this.x /= t,
          this.y /= t,
          this
      },
      multiplyBy: function(t) {
          return this.clone()._multiplyBy(t)
      },
      _multiplyBy: function(t) {
          return this.x *= t,
          this.y *= t,
          this
      },
      scaleBy: function(t) {
          return new x(this.x * t.x,this.y * t.y)
      },
      unscaleBy: function(t) {
          return new x(this.x / t.x,this.y / t.y)
      },
      round: function() {
          return this.clone()._round()
      },
      _round: function() {
          return this.x = Math.round(this.x),
          this.y = Math.round(this.y),
          this
      },
      floor: function() {
          return this.clone()._floor()
      },
      _floor: function() {
          return this.x = Math.floor(this.x),
          this.y = Math.floor(this.y),
          this
      },
      ceil: function() {
          return this.clone()._ceil()
      },
      _ceil: function() {
          return this.x = Math.ceil(this.x),
          this.y = Math.ceil(this.y),
          this
      },
      trunc: function() {
          return this.clone()._trunc()
      },
      _trunc: function() {
          return this.x = li(this.x),
          this.y = li(this.y),
          this
      },
      distanceTo: function(t) {
          var i = (t = w(t)).x - this.x
            , e = t.y - this.y;
          return Math.sqrt(i * i + e * e)
      },
      equals: function(t) {
          return (t = w(t)).x === this.x && t.y === this.y
      },
      contains: function(t) {
          return t = w(t),
          Math.abs(t.x) <= Math.abs(this.x) && Math.abs(t.y) <= Math.abs(this.y)
      },
      toString: function() {
          return "Point(" + a(this.x) + ", " + a(this.y) + ")"
      }
  },
  P.prototype = {
      extend: function(t) {
          return t = w(t),
          this.min || this.max ? (this.min.x = Math.min(t.x, this.min.x),
          this.max.x = Math.max(t.x, this.max.x),
          this.min.y = Math.min(t.y, this.min.y),
          this.max.y = Math.max(t.y, this.max.y)) : (this.min = t.clone(),
          this.max = t.clone()),
          this
      },
      getCenter: function(t) {
          return new x((this.min.x + this.max.x) / 2,(this.min.y + this.max.y) / 2,t)
      },
      getBottomLeft: function() {
          return new x(this.min.x,this.max.y)
      },
      getTopRight: function() {
          return new x(this.max.x,this.min.y)
      },
      getTopLeft: function() {
          return this.min
      },
      getBottomRight: function() {
          return this.max
      },
      getSize: function() {
          return this.max.subtract(this.min)
      },
      contains: function(t) {
          var i, e;
          return (t = "number" == typeof t[0] || t instanceof x ? w(t) : b(t))instanceof P ? (i = t.min,
          e = t.max) : i = e = t,
          i.x >= this.min.x && e.x <= this.max.x && i.y >= this.min.y && e.y <= this.max.y
      },
      intersects: function(t) {
          t = b(t);
          var i = this.min
            , e = this.max
            , n = t.min
            , o = t.max
            , s = o.x >= i.x && n.x <= e.x
            , r = o.y >= i.y && n.y <= e.y;
          return s && r
      },
      overlaps: function(t) {
          t = b(t);
          var i = this.min
            , e = this.max
            , n = t.min
            , o = t.max
            , s = o.x > i.x && n.x < e.x
            , r = o.y > i.y && n.y < e.y;
          return s && r
      },
      isValid: function() {
          return !(!this.min || !this.max)
      }
  },
  T.prototype = {
      extend: function(t) {
          var i, e, n = this._southWest, o = this._northEast;
          if (t instanceof M)
              i = t,
              e = t;
          else {
              if (!(t instanceof T))
                  return t ? this.extend(C(t) || z(t)) : this;
              if (i = t._southWest,
              e = t._northEast,
              !i || !e)
                  return this
          }
          return n || o ? (n.lat = Math.min(i.lat, n.lat),
          n.lng = Math.min(i.lng, n.lng),
          o.lat = Math.max(e.lat, o.lat),
          o.lng = Math.max(e.lng, o.lng)) : (this._southWest = new M(i.lat,i.lng),
          this._northEast = new M(e.lat,e.lng)),
          this
      },
      pad: function(t) {
          var i = this._southWest
            , e = this._northEast
            , n = Math.abs(i.lat - e.lat) * t
            , o = Math.abs(i.lng - e.lng) * t;
          return new T(new M(i.lat - n,i.lng - o),new M(e.lat + n,e.lng + o))
      },
      getCenter: function() {
          return new M((this._southWest.lat + this._northEast.lat) / 2,(this._southWest.lng + this._northEast.lng) / 2)
      },
      getSouthWest: function() {
          return this._southWest
      },
      getNorthEast: function() {
          return this._northEast
      },
      getNorthWest: function() {
          return new M(this.getNorth(),this.getWest())
      },
      getSouthEast: function() {
          return new M(this.getSouth(),this.getEast())
      },
      getWest: function() {
          return this._southWest.lng
      },
      getSouth: function() {
          return this._southWest.lat
      },
      getEast: function() {
          return this._northEast.lng
      },
      getNorth: function() {
          return this._northEast.lat
      },
      contains: function(t) {
          t = "number" == typeof t[0] || t instanceof M || "lat"in t ? C(t) : z(t);
          var i, e, n = this._southWest, o = this._northEast;
          return t instanceof T ? (i = t.getSouthWest(),
          e = t.getNorthEast()) : i = e = t,
          i.lat >= n.lat && e.lat <= o.lat && i.lng >= n.lng && e.lng <= o.lng
      },
      intersects: function(t) {
          t = z(t);
          var i = this._southWest
            , e = this._northEast
            , n = t.getSouthWest()
            , o = t.getNorthEast()
            , s = o.lat >= i.lat && n.lat <= e.lat
            , r = o.lng >= i.lng && n.lng <= e.lng;
          return s && r
      },
      overlaps: function(t) {
          t = z(t);
          var i = this._southWest
            , e = this._northEast
            , n = t.getSouthWest()
            , o = t.getNorthEast()
            , s = o.lat > i.lat && n.lat < e.lat
            , r = o.lng > i.lng && n.lng < e.lng;
          return s && r
      },
      toBBoxString: function() {
          return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(",")
      },
      equals: function(t, i) {
          return !!t && (t = z(t),
          this._southWest.equals(t.getSouthWest(), i) && this._northEast.equals(t.getNorthEast(), i))
      },
      isValid: function() {
          return !(!this._southWest || !this._northEast)
      }
  },
  M.prototype = {
      equals: function(t, i) {
          return !!t && (t = C(t),
          Math.max(Math.abs(this.lat - t.lat), Math.abs(this.lng - t.lng)) <= (void 0 === i ? 1e-9 : i))
      },
      toString: function(t) {
          return "LatLng(" + a(this.lat, t) + ", " + a(this.lng, t) + ")"
      },
      distanceTo: function(t) {
          return _i.distance(this, C(t))
      },
      wrap: function() {
          return _i.wrapLatLng(this)
      },
      toBounds: function(t) {
          var i = 180 * t / 40075017
            , e = i / Math.cos(Math.PI / 180 * this.lat);
          return z([this.lat - i, this.lng - e], [this.lat + i, this.lng + e])
      },
      clone: function() {
          return new M(this.lat,this.lng,this.alt)
      }
  };
  var ci = {
      latLngToPoint: function(t, i) {
          var e = this.projection.project(t)
            , n = this.scale(i);
          return this.transformation._transform(e, n)
      },
      pointToLatLng: function(t, i) {
          var e = this.scale(i)
            , n = this.transformation.untransform(t, e);
          return this.projection.unproject(n)
      },
      project: function(t) {
          return this.projection.project(t)
      },
      unproject: function(t) {
          return this.projection.unproject(t)
      },
      scale: function(t) {
          return 256 * Math.pow(2, t)
      },
      zoom: function(t) {
          return Math.log(t / 256) / Math.LN2
      },
      getProjectedBounds: function(t) {
          if (this.infinite)
              return null;
          var i = this.projection.bounds
            , e = this.scale(t);
          return new P(this.transformation.transform(i.min, e),this.transformation.transform(i.max, e))
      },
      infinite: !1,
      wrapLatLng: function(t) {
          var i = this.wrapLng ? s(t.lng, this.wrapLng, !0) : t.lng;
          return new M(this.wrapLat ? s(t.lat, this.wrapLat, !0) : t.lat,i,t.alt)
      },
      wrapLatLngBounds: function(t) {
          var i = t.getCenter()
            , e = this.wrapLatLng(i)
            , n = i.lat - e.lat
            , o = i.lng - e.lng;
          if (0 === n && 0 === o)
              return t;
          var s = t.getSouthWest()
            , r = t.getNorthEast();
          return new T(new M(s.lat - n,s.lng - o),new M(r.lat - n,r.lng - o))
      }
  }
    , _i = i({}, ci, {
      wrapLng: [-180, 180],
      R: 6371e3,
      distance: function(t, i) {
          var e = Math.PI / 180
            , n = t.lat * e
            , o = i.lat * e
            , s = Math.sin((i.lat - t.lat) * e / 2)
            , r = Math.sin((i.lng - t.lng) * e / 2)
            , a = s * s + Math.cos(n) * Math.cos(o) * r * r
            , h = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return this.R * h
      }
  })
    , di = {
      R: 6378137,
      MAX_LATITUDE: 85.0511287798,
      project: function(t) {
          var i = Math.PI / 180
            , e = this.MAX_LATITUDE
            , n = Math.max(Math.min(e, t.lat), -e)
            , o = Math.sin(n * i);
          return new x(this.R * t.lng * i,this.R * Math.log((1 + o) / (1 - o)) / 2)
      },
      unproject: function(t) {
          var i = 180 / Math.PI;
          return new M((2 * Math.atan(Math.exp(t.y / this.R)) - Math.PI / 2) * i,t.x * i / this.R)
      },
      bounds: function() {
          var t = 6378137 * Math.PI;
          return new P([-t, -t],[t, t])
      }()
  };
  Z.prototype = {
      transform: function(t, i) {
          return this._transform(t.clone(), i)
      },
      _transform: function(t, i) {
          return i = i || 1,
          t.x = i * (this._a * t.x + this._b),
          t.y = i * (this._c * t.y + this._d),
          t
      },
      untransform: function(t, i) {
          return i = i || 1,
          new x((t.x / i - this._b) / this._a,(t.y / i - this._d) / this._c)
      }
  };
  var pi, mi, fi, gi, vi = i({}, _i, {
      code: "EPSG:3857",
      projection: di,
      transformation: function() {
          var t = .5 / (Math.PI * di.R);
          return S(t, .5, -t, .5)
      }()
  }), yi = i({}, vi, {
      code: "EPSG:900913"
  }), xi = document.documentElement.style, wi = "ActiveXObject"in window, Li = wi && !document.addEventListener, Pi = "msLaunchUri"in navigator && !("documentMode"in document), bi = I("webkit"), Ti = I("android"), zi = I("android 2") || I("android 3"), Mi = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10), Ci = Ti && I("Google") && Mi < 537 && !("AudioNode"in window), Zi = !!window.opera, Si = I("chrome"), Ei = I("gecko") && !bi && !Zi && !wi, ki = !Si && I("safari"), Ii = I("phantom"), Ai = "OTransition"in xi, Bi = 0 === navigator.platform.indexOf("Win"), Oi = wi && "transition"in xi, Ri = "WebKitCSSMatrix"in window && "m11"in new window.WebKitCSSMatrix && !zi, Di = "MozPerspective"in xi, Ni = !window.L_DISABLE_3D && (Oi || Ri || Di) && !Ai && !Ii, ji = "undefined" != typeof orientation || I("mobile"), Wi = ji && bi, Hi = ji && Ri, Fi = !window.PointerEvent && window.MSPointerEvent, Ui = !(!window.PointerEvent && !Fi), Vi = !window.L_NO_TOUCH && (Ui || "ontouchstart"in window || window.DocumentTouch && document instanceof window.DocumentTouch), qi = ji && Zi, Gi = ji && Ei, Ki = (window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI) > 1, Yi = !!document.createElement("canvas").getContext, Xi = !(!document.createElementNS || !E("svg").createSVGRect), Ji = !Xi && function() {
      try {
          var t = document.createElement("div");
          t.innerHTML = '<v:shape adj="1"/>';
          var i = t.firstChild;
          return i.style.behavior = "url(#default#VML)",
          i && "object" == typeof i.adj
      } catch (t) {
          return !1
      }
  }(), $i = (Object.freeze || Object)({
      ie: wi,
      ielt9: Li,
      edge: Pi,
      webkit: bi,
      android: Ti,
      android23: zi,
      androidStock: Ci,
      opera: Zi,
      chrome: Si,
      gecko: Ei,
      safari: ki,
      phantom: Ii,
      opera12: Ai,
      win: Bi,
      ie3d: Oi,
      webkit3d: Ri,
      gecko3d: Di,
      any3d: Ni,
      mobile: ji,
      mobileWebkit: Wi,
      mobileWebkit3d: Hi,
      msPointer: Fi,
      pointer: Ui,
      touch: Vi,
      mobileOpera: qi,
      mobileGecko: Gi,
      retina: Ki,
      canvas: Yi,
      svg: Xi,
      vml: Ji
  }), Qi = Fi ? "MSPointerDown" : "pointerdown", te = Fi ? "MSPointerMove" : "pointermove", ie = Fi ? "MSPointerUp" : "pointerup", ee = Fi ? "MSPointerCancel" : "pointercancel", ne = ["INPUT", "SELECT", "OPTION"], oe = {}, se = !1, re = 0, ae = Fi ? "MSPointerDown" : Ui ? "pointerdown" : "touchstart", he = Fi ? "MSPointerUp" : Ui ? "pointerup" : "touchend", ue = "_leaflet_", le = "_leaflet_events", ce = Bi && Si ? 2 * window.devicePixelRatio : Ei ? window.devicePixelRatio : 1, _e = {}, de = (Object.freeze || Object)({
      on: V,
      off: q,
      stopPropagation: Y,
      disableScrollPropagation: X,
      disableClickPropagation: J,
      preventDefault: $,
      stop: Q,
      getMousePosition: tt,
      getWheelDelta: it,
      fakeStop: et,
      skipped: nt,
      isExternalTarget: ot,
      addListener: V,
      removeListener: q
  }), pe = xt(["transform", "WebkitTransform", "OTransform", "MozTransform", "msTransform"]), me = xt(["webkitTransition", "transition", "OTransition", "MozTransition", "msTransition"]), fe = "webkitTransition" === me || "OTransition" === me ? me + "End" : "transitionend";
  if ("onselectstart"in document)
      mi = function() {
          V(window, "selectstart", $)
      }
      ,
      fi = function() {
          q(window, "selectstart", $)
      }
      ;
  else {
      var ge = xt(["userSelect", "WebkitUserSelect", "OUserSelect", "MozUserSelect", "msUserSelect"]);
      mi = function() {
          if (ge) {
              var t = document.documentElement.style;
              gi = t[ge],
              t[ge] = "none"
          }
      }
      ,
      fi = function() {
          ge && (document.documentElement.style[ge] = gi,
          gi = void 0)
      }
  }
  var ve, ye, xe = (Object.freeze || Object)({
      TRANSFORM: pe,
      TRANSITION: me,
      TRANSITION_END: fe,
      get: rt,
      getStyle: at,
      create: ht,
      remove: ut,
      empty: lt,
      toFront: ct,
      toBack: _t,
      hasClass: dt,
      addClass: pt,
      removeClass: mt,
      setClass: ft,
      getClass: gt,
      setOpacity: vt,
      testProp: xt,
      setTransform: wt,
      setPosition: Lt,
      getPosition: Pt,
      disableTextSelection: mi,
      enableTextSelection: fi,
      disableImageDrag: bt,
      enableImageDrag: Tt,
      preventOutline: zt,
      restoreOutline: Mt
  }), we = ui.extend({
      run: function(t, i, e, n) {
          this.stop(),
          this._el = t,
          this._inProgress = !0,
          this._duration = e || .25,
          this._easeOutPower = 1 / Math.max(n || .5, .2),
          this._startPos = Pt(t),
          this._offset = i.subtract(this._startPos),
          this._startTime = +new Date,
          this.fire("start"),
          this._animate()
      },
      stop: function() {
          this._inProgress && (this._step(!0),
          this._complete())
      },
      _animate: function() {
          this._animId = f(this._animate, this),
          this._step()
      },
      _step: function(t) {
          var i = +new Date - this._startTime
            , e = 1e3 * this._duration;
          i < e ? this._runFrame(this._easeOut(i / e), t) : (this._runFrame(1),
          this._complete())
      },
      _runFrame: function(t, i) {
          var e = this._startPos.add(this._offset.multiplyBy(t));
          i && e._round(),
          Lt(this._el, e),
          this.fire("step")
      },
      _complete: function() {
          g(this._animId),
          this._inProgress = !1,
          this.fire("end")
      },
      _easeOut: function(t) {
          return 1 - Math.pow(1 - t, this._easeOutPower)
      }
  }), Le = ui.extend({
      options: {
          crs: vi,
          center: void 0,
          zoom: void 0,
          minZoom: void 0,
          maxZoom: void 0,
          layers: [],
          maxBounds: void 0,
          renderer: void 0,
          zoomAnimation: !0,
          zoomAnimationThreshold: 4,
          fadeAnimation: !0,
          markerZoomAnimation: !0,
          transform3DLimit: 8388608,
          zoomSnap: 1,
          zoomDelta: 1,
          trackResize: !0
      },
      initialize: function(t, i) {
          i = l(this, i),
          this._initContainer(t),
          this._initLayout(),
          this._onResize = e(this._onResize, this),
          this._initEvents(),
          i.maxBounds && this.setMaxBounds(i.maxBounds),
          void 0 !== i.zoom && (this._zoom = this._limitZoom(i.zoom)),
          i.center && void 0 !== i.zoom && this.setView(C(i.center), i.zoom, {
              reset: !0
          }),
          this._handlers = [],
          this._layers = {},
          this._zoomBoundLayers = {},
          this._sizeChanged = !0,
          this.callInitHooks(),
          this._zoomAnimated = me && Ni && !qi && this.options.zoomAnimation,
          this._zoomAnimated && (this._createAnimProxy(),
          V(this._proxy, fe, this._catchTransitionEnd, this)),
          this._addLayers(this.options.layers)
      },
      setView: function(t, e, n) {
          return e = void 0 === e ? this._zoom : this._limitZoom(e),
          t = this._limitCenter(C(t), e, this.options.maxBounds),
          n = n || {},
          this._stop(),
          this._loaded && !n.reset && !0 !== n && (void 0 !== n.animate && (n.zoom = i({
              animate: n.animate
          }, n.zoom),
          n.pan = i({
              animate: n.animate,
              duration: n.duration
          }, n.pan)),
          this._zoom !== e ? this._tryAnimatedZoom && this._tryAnimatedZoom(t, e, n.zoom) : this._tryAnimatedPan(t, n.pan)) ? (clearTimeout(this._sizeTimer),
          this) : (this._resetView(t, e),
          this)
      },
      setZoom: function(t, i) {
          return this._loaded ? this.setView(this.getCenter(), t, {
              zoom: i
          }) : (this._zoom = t,
          this)
      },
      zoomIn: function(t, i) {
          return t = t || (Ni ? this.options.zoomDelta : 1),
          this.setZoom(this._zoom + t, i)
      },
      zoomOut: function(t, i) {
          return t = t || (Ni ? this.options.zoomDelta : 1),
          this.setZoom(this._zoom - t, i)
      },
      setZoomAround: function(t, i, e) {
          var n = this.getZoomScale(i)
            , o = this.getSize().divideBy(2)
            , s = (t instanceof x ? t : this.latLngToContainerPoint(t)).subtract(o).multiplyBy(1 - 1 / n)
            , r = this.containerPointToLatLng(o.add(s));
          return this.setView(r, i, {
              zoom: e
          })
      },
      _getBoundsCenterZoom: function(t, i) {
          i = i || {},
          t = t.getBounds ? t.getBounds() : z(t);
          var e = w(i.paddingTopLeft || i.padding || [0, 0])
            , n = w(i.paddingBottomRight || i.padding || [0, 0])
            , o = this.getBoundsZoom(t, !1, e.add(n));
          if ((o = "number" == typeof i.maxZoom ? Math.min(i.maxZoom, o) : o) === 1 / 0)
              return {
                  center: t.getCenter(),
                  zoom: o
              };
          var s = n.subtract(e).divideBy(2)
            , r = this.project(t.getSouthWest(), o)
            , a = this.project(t.getNorthEast(), o);
          return {
              center: this.unproject(r.add(a).divideBy(2).add(s), o),
              zoom: o
          }
      },
      fitBounds: function(t, i) {
          if (!(t = z(t)).isValid())
              throw new Error("Bounds are not valid.");
          var e = this._getBoundsCenterZoom(t, i);
          return this.setView(e.center, e.zoom, i)
      },
      fitWorld: function(t) {
          return this.fitBounds([[-90, -180], [90, 180]], t)
      },
      panTo: function(t, i) {
          return this.setView(t, this._zoom, {
              pan: i
          })
      },
      panBy: function(t, i) {
          if (t = w(t).round(),
          i = i || {},
          !t.x && !t.y)
              return this.fire("moveend");
          if (!0 !== i.animate && !this.getSize().contains(t))
              return this._resetView(this.unproject(this.project(this.getCenter()).add(t)), this.getZoom()),
              this;
          if (this._panAnim || (this._panAnim = new we,
          this._panAnim.on({
              step: this._onPanTransitionStep,
              end: this._onPanTransitionEnd
          }, this)),
          i.noMoveStart || this.fire("movestart"),
          !1 !== i.animate) {
              pt(this._mapPane, "leaflet-pan-anim");
              var e = this._getMapPanePos().subtract(t).round();
              this._panAnim.run(this._mapPane, e, i.duration || .25, i.easeLinearity)
          } else
              this._rawPanBy(t),
              this.fire("move").fire("moveend");
          return this
      },
      flyTo: function(t, i, e) {
          function n(t) {
              var i = (g * g - m * m + (t ? -1 : 1) * x * x * v * v) / (2 * (t ? g : m) * x * v)
                , e = Math.sqrt(i * i + 1) - i;
              return e < 1e-9 ? -18 : Math.log(e)
          }
          function o(t) {
              return (Math.exp(t) - Math.exp(-t)) / 2
          }
          function s(t) {
              return (Math.exp(t) + Math.exp(-t)) / 2
          }
          function r(t) {
              return o(t) / s(t)
          }
          function a(t) {
              return m * (s(w) / s(w + y * t))
          }
          function h(t) {
              return m * (s(w) * r(w + y * t) - o(w)) / x
          }
          function u(t) {
              return 1 - Math.pow(1 - t, 1.5)
          }
          function l() {
              var e = (Date.now() - L) / b
                , n = u(e) * P;
              e <= 1 ? (this._flyToFrame = f(l, this),
              this._move(this.unproject(c.add(_.subtract(c).multiplyBy(h(n) / v)), p), this.getScaleZoom(m / a(n), p), {
                  flyTo: !0
              })) : this._move(t, i)._moveEnd(!0)
          }
          if (!1 === (e = e || {}).animate || !Ni)
              return this.setView(t, i, e);
          this._stop();
          var c = this.project(this.getCenter())
            , _ = this.project(t)
            , d = this.getSize()
            , p = this._zoom;
          t = C(t),
          i = void 0 === i ? p : i;
          var m = Math.max(d.x, d.y)
            , g = m * this.getZoomScale(p, i)
            , v = _.distanceTo(c) || 1
            , y = 1.42
            , x = y * y
            , w = n(0)
            , L = Date.now()
            , P = (n(1) - w) / y
            , b = e.duration ? 1e3 * e.duration : 1e3 * P * .8;
          return this._moveStart(!0, e.noMoveStart),
          l.call(this),
          this
      },
      flyToBounds: function(t, i) {
          var e = this._getBoundsCenterZoom(t, i);
          return this.flyTo(e.center, e.zoom, i)
      },
      setMaxBounds: function(t) {
          return (t = z(t)).isValid() ? (this.options.maxBounds && this.off("moveend", this._panInsideMaxBounds),
          this.options.maxBounds = t,
          this._loaded && this._panInsideMaxBounds(),
          this.on("moveend", this._panInsideMaxBounds)) : (this.options.maxBounds = null,
          this.off("moveend", this._panInsideMaxBounds))
      },
      setMinZoom: function(t) {
          var i = this.options.minZoom;
          return this.options.minZoom = t,
          this._loaded && i !== t && (this.fire("zoomlevelschange"),
          this.getZoom() < this.options.minZoom) ? this.setZoom(t) : this
      },
      setMaxZoom: function(t) {
          var i = this.options.maxZoom;
          return this.options.maxZoom = t,
          this._loaded && i !== t && (this.fire("zoomlevelschange"),
          this.getZoom() > this.options.maxZoom) ? this.setZoom(t) : this
      },
      panInsideBounds: function(t, i) {
          this._enforcingBounds = !0;
          var e = this.getCenter()
            , n = this._limitCenter(e, this._zoom, z(t));
          return e.equals(n) || this.panTo(n, i),
          this._enforcingBounds = !1,
          this
      },
      invalidateSize: function(t) {
          if (!this._loaded)
              return this;
          t = i({
              animate: !1,
              pan: !0
          }, !0 === t ? {
              animate: !0
          } : t);
          var n = this.getSize();
          this._sizeChanged = !0,
          this._lastCenter = null;
          var o = this.getSize()
            , s = n.divideBy(2).round()
            , r = o.divideBy(2).round()
            , a = s.subtract(r);
          return a.x || a.y ? (t.animate && t.pan ? this.panBy(a) : (t.pan && this._rawPanBy(a),
          this.fire("move"),
          t.debounceMoveend ? (clearTimeout(this._sizeTimer),
          this._sizeTimer = setTimeout(e(this.fire, this, "moveend"), 200)) : this.fire("moveend")),
          this.fire("resize", {
              oldSize: n,
              newSize: o
          })) : this
      },
      stop: function() {
          return this.setZoom(this._limitZoom(this._zoom)),
          this.options.zoomSnap || this.fire("viewreset"),
          this._stop()
      },
      locate: function(t) {
          if (t = this._locateOptions = i({
              timeout: 1e4,
              watch: !1
          }, t),
          !("geolocation"in navigator))
              return this._handleGeolocationError({
                  code: 0,
                  message: "Geolocation not supported."
              }),
              this;
          var n = e(this._handleGeolocationResponse, this)
            , o = e(this._handleGeolocationError, this);
          return t.watch ? this._locationWatchId = navigator.geolocation.watchPosition(n, o, t) : navigator.geolocation.getCurrentPosition(n, o, t),
          this
      },
      stopLocate: function() {
          return navigator.geolocation && navigator.geolocation.clearWatch && navigator.geolocation.clearWatch(this._locationWatchId),
          this._locateOptions && (this._locateOptions.setView = !1),
          this
      },
      _handleGeolocationError: function(t) {
          var i = t.code
            , e = t.message || (1 === i ? "permission denied" : 2 === i ? "position unavailable" : "timeout");
          this._locateOptions.setView && !this._loaded && this.fitWorld(),
          this.fire("locationerror", {
              code: i,
              message: "Geolocation error: " + e + "."
          })
      },
      _handleGeolocationResponse: function(t) {
          var i = new M(t.coords.latitude,t.coords.longitude)
            , e = i.toBounds(t.coords.accuracy)
            , n = this._locateOptions;
          if (n.setView) {
              var o = this.getBoundsZoom(e);
              this.setView(i, n.maxZoom ? Math.min(o, n.maxZoom) : o)
          }
          var s = {
              latlng: i,
              bounds: e,
              timestamp: t.timestamp
          };
          for (var r in t.coords)
              "number" == typeof t.coords[r] && (s[r] = t.coords[r]);
          this.fire("locationfound", s)
      },
      addHandler: function(t, i) {
          if (!i)
              return this;
          var e = this[t] = new i(this);
          return this._handlers.push(e),
          this.options[t] && e.enable(),
          this
      },
      remove: function() {
          if (this._initEvents(!0),
          this._containerId !== this._container._leaflet_id)
              throw new Error("Map container is being reused by another instance");
          try {
              delete this._container._leaflet_id,
              delete this._containerId
          } catch (t) {
              this._container._leaflet_id = void 0,
              this._containerId = void 0
          }
          void 0 !== this._locationWatchId && this.stopLocate(),
          this._stop(),
          ut(this._mapPane),
          this._clearControlPos && this._clearControlPos(),
          this._clearHandlers(),
          this._loaded && this.fire("unload");
          var t;
          for (t in this._layers)
              this._layers[t].remove();
          for (t in this._panes)
              ut(this._panes[t]);
          return this._layers = [],
          this._panes = [],
          delete this._mapPane,
          delete this._renderer,
          this
      },
      createPane: function(t, i) {
          var e = ht("div", "leaflet-pane" + (t ? " leaflet-" + t.replace("Pane", "") + "-pane" : ""), i || this._mapPane);
          return t && (this._panes[t] = e),
          e
      },
      getCenter: function() {
          return this._checkIfLoaded(),
          this._lastCenter && !this._moved() ? this._lastCenter : this.layerPointToLatLng(this._getCenterLayerPoint())
      },
      getZoom: function() {
          return this._zoom
      },
      getBounds: function() {
          var t = this.getPixelBounds();
          return new T(this.unproject(t.getBottomLeft()),this.unproject(t.getTopRight()))
      },
      getMinZoom: function() {
          return void 0 === this.options.minZoom ? this._layersMinZoom || 0 : this.options.minZoom
      },
      getMaxZoom: function() {
          return void 0 === this.options.maxZoom ? void 0 === this._layersMaxZoom ? 1 / 0 : this._layersMaxZoom : this.options.maxZoom
      },
      getBoundsZoom: function(t, i, e) {
          t = z(t),
          e = w(e || [0, 0]);
          var n = this.getZoom() || 0
            , o = this.getMinZoom()
            , s = this.getMaxZoom()
            , r = t.getNorthWest()
            , a = t.getSouthEast()
            , h = this.getSize().subtract(e)
            , u = b(this.project(a, n), this.project(r, n)).getSize()
            , l = Ni ? this.options.zoomSnap : 1
            , c = h.x / u.x
            , _ = h.y / u.y
            , d = i ? Math.max(c, _) : Math.min(c, _);
          return n = this.getScaleZoom(d, n),
          l && (n = Math.round(n / (l / 100)) * (l / 100),
          n = i ? Math.ceil(n / l) * l : Math.floor(n / l) * l),
          Math.max(o, Math.min(s, n))
      },
      getSize: function() {
          return this._size && !this._sizeChanged || (this._size = new x(this._container.clientWidth || 0,this._container.clientHeight || 0),
          this._sizeChanged = !1),
          this._size.clone()
      },
      getPixelBounds: function(t, i) {
          var e = this._getTopLeftPoint(t, i);
          return new P(e,e.add(this.getSize()))
      },
      getPixelOrigin: function() {
          return this._checkIfLoaded(),
          this._pixelOrigin
      },
      getPixelWorldBounds: function(t) {
          return this.options.crs.getProjectedBounds(void 0 === t ? this.getZoom() : t)
      },
      getPane: function(t) {
          return "string" == typeof t ? this._panes[t] : t
      },
      getPanes: function() {
          return this._panes
      },
      getContainer: function() {
          return this._container
      },
      getZoomScale: function(t, i) {
          var e = this.options.crs;
          return i = void 0 === i ? this._zoom : i,
          e.scale(t) / e.scale(i)
      },
      getScaleZoom: function(t, i) {
          var e = this.options.crs;
          i = void 0 === i ? this._zoom : i;
          var n = e.zoom(t * e.scale(i));
          return isNaN(n) ? 1 / 0 : n
      },
      project: function(t, i) {
          return i = void 0 === i ? this._zoom : i,
          this.options.crs.latLngToPoint(C(t), i)
      },
      unproject: function(t, i) {
          return i = void 0 === i ? this._zoom : i,
          this.options.crs.pointToLatLng(w(t), i)
      },
      layerPointToLatLng: function(t) {
          var i = w(t).add(this.getPixelOrigin());
          return this.unproject(i)
      },
      latLngToLayerPoint: function(t) {
          return this.project(C(t))._round()._subtract(this.getPixelOrigin())
      },
      wrapLatLng: function(t) {
          return this.options.crs.wrapLatLng(C(t))
      },
      wrapLatLngBounds: function(t) {
          return this.options.crs.wrapLatLngBounds(z(t))
      },
      distance: function(t, i) {
          return this.options.crs.distance(C(t), C(i))
      },
      containerPointToLayerPoint: function(t) {
          return w(t).subtract(this._getMapPanePos())
      },
      layerPointToContainerPoint: function(t) {
          return w(t).add(this._getMapPanePos())
      },
      containerPointToLatLng: function(t) {
          var i = this.containerPointToLayerPoint(w(t));
          return this.layerPointToLatLng(i)
      },
      latLngToContainerPoint: function(t) {
          return this.layerPointToContainerPoint(this.latLngToLayerPoint(C(t)))
      },
      mouseEventToContainerPoint: function(t) {
          return tt(t, this._container)
      },
      mouseEventToLayerPoint: function(t) {
          return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(t))
      },
      mouseEventToLatLng: function(t) {
          return this.layerPointToLatLng(this.mouseEventToLayerPoint(t))
      },
      _initContainer: function(t) {
          var i = this._container = rt(t);
          if (!i)
              throw new Error("Map container not found.");
          if (i._leaflet_id)
              throw new Error("Map container is already initialized.");
          V(i, "scroll", this._onScroll, this),
          this._containerId = n(i)
      },
      _initLayout: function() {
          var t = this._container;
          this._fadeAnimated = this.options.fadeAnimation && Ni,
          pt(t, "leaflet-container" + (Vi ? " leaflet-touch" : "") + (Ki ? " leaflet-retina" : "") + (Li ? " leaflet-oldie" : "") + (ki ? " leaflet-safari" : "") + (this._fadeAnimated ? " leaflet-fade-anim" : ""));
          var i = at(t, "position");
          "absolute" !== i && "relative" !== i && "fixed" !== i && (t.style.position = "relative"),
          this._initPanes(),
          this._initControlPos && this._initControlPos()
      },
      _initPanes: function() {
          var t = this._panes = {};
          this._paneRenderers = {},
          this._mapPane = this.createPane("mapPane", this._container),
          Lt(this._mapPane, new x(0,0)),
          this.createPane("tilePane"),
          this.createPane("shadowPane"),
          this.createPane("overlayPane"),
          this.createPane("markerPane"),
          this.createPane("tooltipPane"),
          this.createPane("popupPane"),
          this.options.markerZoomAnimation || (pt(t.markerPane, "leaflet-zoom-hide"),
          pt(t.shadowPane, "leaflet-zoom-hide"))
      },
      _resetView: function(t, i) {
          Lt(this._mapPane, new x(0,0));
          var e = !this._loaded;
          this._loaded = !0,
          i = this._limitZoom(i),
          this.fire("viewprereset");
          var n = this._zoom !== i;
          this._moveStart(n, !1)._move(t, i)._moveEnd(n),
          this.fire("viewreset"),
          e && this.fire("load")
      },
      _moveStart: function(t, i) {
          return t && this.fire("zoomstart"),
          i || this.fire("movestart"),
          this
      },
      _move: function(t, i, e) {
          void 0 === i && (i = this._zoom);
          var n = this._zoom !== i;
          return this._zoom = i,
          this._lastCenter = t,
          this._pixelOrigin = this._getNewPixelOrigin(t),
          (n || e && e.pinch) && this.fire("zoom", e),
          this.fire("move", e)
      },
      _moveEnd: function(t) {
          return t && this.fire("zoomend"),
          this.fire("moveend")
      },
      _stop: function() {
          return g(this._flyToFrame),
          this._panAnim && this._panAnim.stop(),
          this
      },
      _rawPanBy: function(t) {
          Lt(this._mapPane, this._getMapPanePos().subtract(t))
      },
      _getZoomSpan: function() {
          return this.getMaxZoom() - this.getMinZoom()
      },
      _panInsideMaxBounds: function() {
          this._enforcingBounds || this.panInsideBounds(this.options.maxBounds)
      },
      _checkIfLoaded: function() {
          if (!this._loaded)
              throw new Error("Set map center and zoom first.")
      },
      _initEvents: function(t) {
          this._targets = {},
          this._targets[n(this._container)] = this;
          var i = t ? q : V;
          i(this._container, "click dblclick mousedown mouseup mouseover mouseout mousemove contextmenu keypress", this._handleDOMEvent, this),
          this.options.trackResize && i(window, "resize", this._onResize, this),
          Ni && this.options.transform3DLimit && (t ? this.off : this.on).call(this, "moveend", this._onMoveEnd)
      },
      _onResize: function() {
          g(this._resizeRequest),
          this._resizeRequest = f(function() {
              this.invalidateSize({
                  debounceMoveend: !0
              })
          }, this)
      },
      _onScroll: function() {
          this._container.scrollTop = 0,
          this._container.scrollLeft = 0
      },
      _onMoveEnd: function() {
          var t = this._getMapPanePos();
          Math.max(Math.abs(t.x), Math.abs(t.y)) >= this.options.transform3DLimit && this._resetView(this.getCenter(), this.getZoom())
      },
      _findEventTargets: function(t, i) {
          for (var e, o = [], s = "mouseout" === i || "mouseover" === i, r = t.target || t.srcElement, a = !1; r; ) {
              if ((e = this._targets[n(r)]) && ("click" === i || "preclick" === i) && !t._simulated && this._draggableMoved(e)) {
                  a = !0;
                  break
              }
              if (e && e.listens(i, !0)) {
                  if (s && !ot(r, t))
                      break;
                  if (o.push(e),
                  s)
                      break
              }
              if (r === this._container)
                  break;
              r = r.parentNode
          }
          return o.length || a || s || !ot(r, t) || (o = [this]),
          o
      },
      _handleDOMEvent: function(t) {
          if (this._loaded && !nt(t)) {
              var i = t.type;
              "mousedown" !== i && "keypress" !== i || zt(t.target || t.srcElement),
              this._fireDOMEvent(t, i)
          }
      },
      _mouseEvents: ["click", "dblclick", "mouseover", "mouseout", "contextmenu"],
      _fireDOMEvent: function(t, e, n) {
          if ("click" === t.type) {
              var o = i({}, t);
              o.type = "preclick",
              this._fireDOMEvent(o, o.type, n)
          }
          if (!t._stopped && (n = (n || []).concat(this._findEventTargets(t, e))).length) {
              var s = n[0];
              "contextmenu" === e && s.listens(e, !0) && $(t);
              var r = {
                  originalEvent: t
              };
              if ("keypress" !== t.type) {
                  var a = s.getLatLng && (!s._radius || s._radius <= 10);
                  r.containerPoint = a ? this.latLngToContainerPoint(s.getLatLng()) : this.mouseEventToContainerPoint(t),
                  r.layerPoint = this.containerPointToLayerPoint(r.containerPoint),
                  r.latlng = a ? s.getLatLng() : this.layerPointToLatLng(r.layerPoint)
              }
              for (var h = 0; h < n.length; h++)
                  if (n[h].fire(e, r, !0),
                  r.originalEvent._stopped || !1 === n[h].options.bubblingMouseEvents && -1 !== d(this._mouseEvents, e))
                      return
          }
      },
      _draggableMoved: function(t) {
          return (t = t.dragging && t.dragging.enabled() ? t : this).dragging && t.dragging.moved() || this.boxZoom && this.boxZoom.moved()
      },
      _clearHandlers: function() {
          for (var t = 0, i = this._handlers.length; t < i; t++)
              this._handlers[t].disable()
      },
      whenReady: function(t, i) {
          return this._loaded ? t.call(i || this, {
              target: this
          }) : this.on("load", t, i),
          this
      },
      _getMapPanePos: function() {
          return Pt(this._mapPane) || new x(0,0)
      },
      _moved: function() {
          var t = this._getMapPanePos();
          return t && !t.equals([0, 0])
      },
      _getTopLeftPoint: function(t, i) {
          return (t && void 0 !== i ? this._getNewPixelOrigin(t, i) : this.getPixelOrigin()).subtract(this._getMapPanePos())
      },
      _getNewPixelOrigin: function(t, i) {
          var e = this.getSize()._divideBy(2);
          return this.project(t, i)._subtract(e)._add(this._getMapPanePos())._round()
      },
      _latLngToNewLayerPoint: function(t, i, e) {
          var n = this._getNewPixelOrigin(e, i);
          return this.project(t, i)._subtract(n)
      },
      _latLngBoundsToNewLayerBounds: function(t, i, e) {
          var n = this._getNewPixelOrigin(e, i);
          return b([this.project(t.getSouthWest(), i)._subtract(n), this.project(t.getNorthWest(), i)._subtract(n), this.project(t.getSouthEast(), i)._subtract(n), this.project(t.getNorthEast(), i)._subtract(n)])
      },
      _getCenterLayerPoint: function() {
          return this.containerPointToLayerPoint(this.getSize()._divideBy(2))
      },
      _getCenterOffset: function(t) {
          return this.latLngToLayerPoint(t).subtract(this._getCenterLayerPoint())
      },
      _limitCenter: function(t, i, e) {
          if (!e)
              return t;
          var n = this.project(t, i)
            , o = this.getSize().divideBy(2)
            , s = new P(n.subtract(o),n.add(o))
            , r = this._getBoundsOffset(s, e, i);
          return r.round().equals([0, 0]) ? t : this.unproject(n.add(r), i)
      },
      _limitOffset: function(t, i) {
          if (!i)
              return t;
          var e = this.getPixelBounds()
            , n = new P(e.min.add(t),e.max.add(t));
          return t.add(this._getBoundsOffset(n, i))
      },
      _getBoundsOffset: function(t, i, e) {
          var n = b(this.project(i.getNorthEast(), e), this.project(i.getSouthWest(), e))
            , o = n.min.subtract(t.min)
            , s = n.max.subtract(t.max);
          return new x(this._rebound(o.x, -s.x),this._rebound(o.y, -s.y))
      },
      _rebound: function(t, i) {
          return t + i > 0 ? Math.round(t - i) / 2 : Math.max(0, Math.ceil(t)) - Math.max(0, Math.floor(i))
      },
      _limitZoom: function(t) {
          var i = this.getMinZoom()
            , e = this.getMaxZoom()
            , n = Ni ? this.options.zoomSnap : 1;
          return n && (t = Math.round(t / n) * n),
          Math.max(i, Math.min(e, t))
      },
      _onPanTransitionStep: function() {
          this.fire("move")
      },
      _onPanTransitionEnd: function() {
          mt(this._mapPane, "leaflet-pan-anim"),
          this.fire("moveend")
      },
      _tryAnimatedPan: function(t, i) {
          var e = this._getCenterOffset(t)._trunc();
          return !(!0 !== (i && i.animate) && !this.getSize().contains(e)) && (this.panBy(e, i),
          !0)
      },
      _createAnimProxy: function() {
          var t = this._proxy = ht("div", "leaflet-proxy leaflet-zoom-animated");
          this._panes.mapPane.appendChild(t),
          this.on("zoomanim", function(t) {
              var i = pe
                , e = this._proxy.style[i];
              wt(this._proxy, this.project(t.center, t.zoom), this.getZoomScale(t.zoom, 1)),
              e === this._proxy.style[i] && this._animatingZoom && this._onZoomTransitionEnd()
          }, this),
          this.on("load moveend", function() {
              var t = this.getCenter()
                , i = this.getZoom();
              wt(this._proxy, this.project(t, i), this.getZoomScale(i, 1))
          }, this),
          this._on("unload", this._destroyAnimProxy, this)
      },
      _destroyAnimProxy: function() {
          ut(this._proxy),
          delete this._proxy
      },
      _catchTransitionEnd: function(t) {
          this._animatingZoom && t.propertyName.indexOf("transform") >= 0 && this._onZoomTransitionEnd()
      },
      _nothingToAnimate: function() {
          return !this._container.getElementsByClassName("leaflet-zoom-animated").length
      },
      _tryAnimatedZoom: function(t, i, e) {
          if (this._animatingZoom)
              return !0;
          if (e = e || {},
          !this._zoomAnimated || !1 === e.animate || this._nothingToAnimate() || Math.abs(i - this._zoom) > this.options.zoomAnimationThreshold)
              return !1;
          var n = this.getZoomScale(i)
            , o = this._getCenterOffset(t)._divideBy(1 - 1 / n);
          return !(!0 !== e.animate && !this.getSize().contains(o)) && (f(function() {
              this._moveStart(!0, !1)._animateZoom(t, i, !0)
          }, this),
          !0)
      },
      _animateZoom: function(t, i, n, o) {
          this._mapPane && (n && (this._animatingZoom = !0,
          this._animateToCenter = t,
          this._animateToZoom = i,
          pt(this._mapPane, "leaflet-zoom-anim")),
          this.fire("zoomanim", {
              center: t,
              zoom: i,
              noUpdate: o
          }),
          setTimeout(e(this._onZoomTransitionEnd, this), 250))
      },
      _onZoomTransitionEnd: function() {
          this._animatingZoom && (this._mapPane && mt(this._mapPane, "leaflet-zoom-anim"),
          this._animatingZoom = !1,
          this._move(this._animateToCenter, this._animateToZoom),
          f(function() {
              this._moveEnd(!0)
          }, this))
      }
  }), Pe = v.extend({
      options: {
          position: "topright"
      },
      initialize: function(t) {
          l(this, t)
      },
      getPosition: function() {
          return this.options.position
      },
      setPosition: function(t) {
          var i = this._map;
          return i && i.removeControl(this),
          this.options.position = t,
          i && i.addControl(this),
          this
      },
      getContainer: function() {
          return this._container
      },
      addTo: function(t) {
          this.remove(),
          this._map = t;
          var i = this._container = this.onAdd(t)
            , e = this.getPosition()
            , n = t._controlCorners[e];
          return pt(i, "leaflet-control"),
          -1 !== e.indexOf("bottom") ? n.insertBefore(i, n.firstChild) : n.appendChild(i),
          this
      },
      remove: function() {
          return this._map ? (ut(this._container),
          this.onRemove && this.onRemove(this._map),
          this._map = null,
          this) : this
      },
      _refocusOnMap: function(t) {
          this._map && t && t.screenX > 0 && t.screenY > 0 && this._map.getContainer().focus()
      }
  }), be = function(t) {
      return new Pe(t)
  };
  Le.include({
      addControl: function(t) {
          return t.addTo(this),
          this
      },
      removeControl: function(t) {
          return t.remove(),
          this
      },
      _initControlPos: function() {
          function t(t, o) {
              var s = e + t + " " + e + o;
              i[t + o] = ht("div", s, n)
          }
          var i = this._controlCorners = {}
            , e = "leaflet-"
            , n = this._controlContainer = ht("div", e + "control-container", this._container);
          t("top", "left"),
          t("top", "right"),
          t("bottom", "left"),
          t("bottom", "right")
      },
      _clearControlPos: function() {
          for (var t in this._controlCorners)
              ut(this._controlCorners[t]);
          ut(this._controlContainer),
          delete this._controlCorners,
          delete this._controlContainer
      }
  });
  var Te = Pe.extend({
      options: {
          collapsed: !0,
          position: "topright",
          autoZIndex: !0,
          hideSingleBase: !1,
          sortLayers: !1,
          sortFunction: function(t, i, e, n) {
              return e < n ? -1 : n < e ? 1 : 0
          }
      },
      initialize: function(t, i, e) {
          l(this, e),
          this._layerControlInputs = [],
          this._layers = [],
          this._lastZIndex = 0,
          this._handlingClick = !1;
          for (var n in t)
              this._addLayer(t[n], n);
          for (n in i)
              this._addLayer(i[n], n, !0)
      },
      onAdd: function(t) {
          this._initLayout(),
          this._update(),
          this._map = t,
          t.on("zoomend", this._checkDisabledLayers, this);
          for (var i = 0; i < this._layers.length; i++)
              this._layers[i].layer.on("add remove", this._onLayerChange, this);
          return this._container
      },
      addTo: function(t) {
          return Pe.prototype.addTo.call(this, t),
          this._expandIfNotCollapsed()
      },
      onRemove: function() {
          this._map.off("zoomend", this._checkDisabledLayers, this);
          for (var t = 0; t < this._layers.length; t++)
              this._layers[t].layer.off("add remove", this._onLayerChange, this)
      },
      addBaseLayer: function(t, i) {
          return this._addLayer(t, i),
          this._map ? this._update() : this
      },
      addOverlay: function(t, i) {
          return this._addLayer(t, i, !0),
          this._map ? this._update() : this
      },
      removeLayer: function(t) {
          t.off("add remove", this._onLayerChange, this);
          var i = this._getLayer(n(t));
          return i && this._layers.splice(this._layers.indexOf(i), 1),
          this._map ? this._update() : this
      },
      expand: function() {
          pt(this._container, "leaflet-control-layers-expanded"),
          this._form.style.height = null;
          var t = this._map.getSize().y - (this._container.offsetTop + 50);
          return t < this._form.clientHeight ? (pt(this._form, "leaflet-control-layers-scrollbar"),
          this._form.style.height = t + "px") : mt(this._form, "leaflet-control-layers-scrollbar"),
          this._checkDisabledLayers(),
          this
      },
      collapse: function() {
          return mt(this._container, "leaflet-control-layers-expanded"),
          this
      },
      _initLayout: function() {
          var t = "leaflet-control-layers"
            , i = this._container = ht("div", t)
            , e = this.options.collapsed;
          i.setAttribute("aria-haspopup", !0),
          J(i),
          X(i);
          var n = this._form = ht("form", t + "-list");
          e && (this._map.on("click", this.collapse, this),
          Ti || V(i, {
              mouseenter: this.expand,
              mouseleave: this.collapse
          }, this));
          var o = this._layersLink = ht("a", t + "-toggle", i);
          o.href = "#",
          o.title = "Layers",
          Vi ? (V(o, "click", Q),
          V(o, "click", this.expand, this)) : V(o, "focus", this.expand, this),
          e || this.expand(),
          this._baseLayersList = ht("div", t + "-base", n),
          this._separator = ht("div", t + "-separator", n),
          this._overlaysList = ht("div", t + "-overlays", n),
          i.appendChild(n)
      },
      _getLayer: function(t) {
          for (var i = 0; i < this._layers.length; i++)
              if (this._layers[i] && n(this._layers[i].layer) === t)
                  return this._layers[i]
      },
      _addLayer: function(t, i, n) {
          this._map && t.on("add remove", this._onLayerChange, this),
          this._layers.push({
              layer: t,
              name: i,
              overlay: n
          }),
          this.options.sortLayers && this._layers.sort(e(function(t, i) {
              return this.options.sortFunction(t.layer, i.layer, t.name, i.name)
          }, this)),
          this.options.autoZIndex && t.setZIndex && (this._lastZIndex++,
          t.setZIndex(this._lastZIndex)),
          this._expandIfNotCollapsed()
      },
      _update: function() {
          if (!this._container)
              return this;
          lt(this._baseLayersList),
          lt(this._overlaysList),
          this._layerControlInputs = [];
          var t, i, e, n, o = 0;
          for (e = 0; e < this._layers.length; e++)
              n = this._layers[e],
              this._addItem(n),
              i = i || n.overlay,
              t = t || !n.overlay,
              o += n.overlay ? 0 : 1;
          return this.options.hideSingleBase && (t = t && o > 1,
          this._baseLayersList.style.display = t ? "" : "none"),
          this._separator.style.display = i && t ? "" : "none",
          this
      },
      _onLayerChange: function(t) {
          this._handlingClick || this._update();
          var i = this._getLayer(n(t.target))
            , e = i.overlay ? "add" === t.type ? "overlayadd" : "overlayremove" : "add" === t.type ? "baselayerchange" : null;
          e && this._map.fire(e, i)
      },
      _createRadioElement: function(t, i) {
          var e = '<input type="radio" class="leaflet-control-layers-selector" name="' + t + '"' + (i ? ' checked="checked"' : "") + "/>"
            , n = document.createElement("div");
          return n.innerHTML = e,
          n.firstChild
      },
      _addItem: function(t) {
          var i, e = document.createElement("label"), o = this._map.hasLayer(t.layer);
          t.overlay ? ((i = document.createElement("input")).type = "checkbox",
          i.className = "leaflet-control-layers-selector",
          i.defaultChecked = o) : i = this._createRadioElement("leaflet-base-layers", o),
          this._layerControlInputs.push(i),
          i.layerId = n(t.layer),
          V(i, "click", this._onInputClick, this);
          var s = document.createElement("span");
          s.innerHTML = " " + t.name;
          var r = document.createElement("div");
          return e.appendChild(r),
          r.appendChild(i),
          r.appendChild(s),
          (t.overlay ? this._overlaysList : this._baseLayersList).appendChild(e),
          this._checkDisabledLayers(),
          e
      },
      _onInputClick: function() {
          var t, i, e = this._layerControlInputs, n = [], o = [];
          this._handlingClick = !0;
          for (var s = e.length - 1; s >= 0; s--)
              t = e[s],
              i = this._getLayer(t.layerId).layer,
              t.checked ? n.push(i) : t.checked || o.push(i);
          for (s = 0; s < o.length; s++)
              this._map.hasLayer(o[s]) && this._map.removeLayer(o[s]);
          for (s = 0; s < n.length; s++)
              this._map.hasLayer(n[s]) || this._map.addLayer(n[s]);
          this._handlingClick = !1,
          this._refocusOnMap()
      },
      _checkDisabledLayers: function() {
          for (var t, i, e = this._layerControlInputs, n = this._map.getZoom(), o = e.length - 1; o >= 0; o--)
              t = e[o],
              i = this._getLayer(t.layerId).layer,
              t.disabled = void 0 !== i.options.minZoom && n < i.options.minZoom || void 0 !== i.options.maxZoom && n > i.options.maxZoom
      },
      _expandIfNotCollapsed: function() {
          return this._map && !this.options.collapsed && this.expand(),
          this
      },
      _expand: function() {
          return this.expand()
      },
      _collapse: function() {
          return this.collapse()
      }
  })
    , ze = Pe.extend({
      options: {
          position: "topleft",
          zoomInText: "+",
          zoomInTitle: "Zoom in",
          zoomOutText: "&#x2212;",
          zoomOutTitle: "Zoom out"
      },
      onAdd: function(t) {
          var i = "leaflet-control-zoom"
            , e = ht("div", i + " leaflet-bar")
            , n = this.options;
          return this._zoomInButton = this._createButton(n.zoomInText, n.zoomInTitle, i + "-in", e, this._zoomIn),
          this._zoomOutButton = this._createButton(n.zoomOutText, n.zoomOutTitle, i + "-out", e, this._zoomOut),
          this._updateDisabled(),
          t.on("zoomend zoomlevelschange", this._updateDisabled, this),
          e
      },
      onRemove: function(t) {
          t.off("zoomend zoomlevelschange", this._updateDisabled, this)
      },
      disable: function() {
          return this._disabled = !0,
          this._updateDisabled(),
          this
      },
      enable: function() {
          return this._disabled = !1,
          this._updateDisabled(),
          this
      },
      _zoomIn: function(t) {
          !this._disabled && this._map._zoom < this._map.getMaxZoom() && this._map.zoomIn(this._map.options.zoomDelta * (t.shiftKey ? 3 : 1))
      },
      _zoomOut: function(t) {
          !this._disabled && this._map._zoom > this._map.getMinZoom() && this._map.zoomOut(this._map.options.zoomDelta * (t.shiftKey ? 3 : 1))
      },
      _createButton: function(t, i, e, n, o) {
          var s = ht("a", e, n);
          return s.innerHTML = t,
          s.href = "#",
          s.title = i,
          s.setAttribute("role", "button"),
          s.setAttribute("aria-label", i),
          J(s),
          V(s, "click", Q),
          V(s, "click", o, this),
          V(s, "click", this._refocusOnMap, this),
          s
      },
      _updateDisabled: function() {
          var t = this._map
            , i = "leaflet-disabled";
          mt(this._zoomInButton, i),
          mt(this._zoomOutButton, i),
          (this._disabled || t._zoom === t.getMinZoom()) && pt(this._zoomOutButton, i),
          (this._disabled || t._zoom === t.getMaxZoom()) && pt(this._zoomInButton, i)
      }
  });
  Le.mergeOptions({
      zoomControl: !0
  }),
  Le.addInitHook(function() {
      this.options.zoomControl && (this.zoomControl = new ze,
      this.addControl(this.zoomControl))
  });
  var Me = Pe.extend({
      options: {
          position: "bottomleft",
          maxWidth: 100,
          metric: !0,
          imperial: !0
      },
      onAdd: function(t) {
          var i = ht("div", "leaflet-control-scale")
            , e = this.options;
          return this._addScales(e, "leaflet-control-scale-line", i),
          t.on(e.updateWhenIdle ? "moveend" : "move", this._update, this),
          t.whenReady(this._update, this),
          i
      },
      onRemove: function(t) {
          t.off(this.options.updateWhenIdle ? "moveend" : "move", this._update, this)
      },
      _addScales: function(t, i, e) {
          t.metric && (this._mScale = ht("div", i, e)),
          t.imperial && (this._iScale = ht("div", i, e))
      },
      _update: function() {
          var t = this._map
            , i = t.getSize().y / 2
            , e = t.distance(t.containerPointToLatLng([0, i]), t.containerPointToLatLng([this.options.maxWidth, i]));
          this._updateScales(e)
      },
      _updateScales: function(t) {
          this.options.metric && t && this._updateMetric(t),
          this.options.imperial && t && this._updateImperial(t)
      },
      _updateMetric: function(t) {
          var i = this._getRoundNum(t)
            , e = i < 1e3 ? i + " m" : i / 1e3 + " km";
          this._updateScale(this._mScale, e, i / t)
      },
      _updateImperial: function(t) {
          var i, e, n, o = 3.2808399 * t;
          o > 5280 ? (i = o / 5280,
          e = this._getRoundNum(i),
          this._updateScale(this._iScale, e + " mi", e / i)) : (n = this._getRoundNum(o),
          this._updateScale(this._iScale, n + " ft", n / o))
      },
      _updateScale: function(t, i, e) {
          t.style.width = Math.round(this.options.maxWidth * e) + "px",
          t.innerHTML = i
      },
      _getRoundNum: function(t) {
          var i = Math.pow(10, (Math.floor(t) + "").length - 1)
            , e = t / i;
          return e = e >= 10 ? 10 : e >= 5 ? 5 : e >= 3 ? 3 : e >= 2 ? 2 : 1,
          i * e
      }
  })
    , Ce = Pe.extend({
      options: {
          position: "bottomright",
          prefix: '<a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
      },
      initialize: function(t) {
          l(this, t),
          this._attributions = {}
      },
      onAdd: function(t) {
          t.attributionControl = this,
          this._container = ht("div", "leaflet-control-attribution"),
          J(this._container);
          for (var i in t._layers)
              t._layers[i].getAttribution && this.addAttribution(t._layers[i].getAttribution());
          return this._update(),
          this._container
      },
      setPrefix: function(t) {
          return this.options.prefix = t,
          this._update(),
          this
      },
      addAttribution: function(t) {
          return t ? (this._attributions[t] || (this._attributions[t] = 0),
          this._attributions[t]++,
          this._update(),
          this) : this
      },
      removeAttribution: function(t) {
          return t ? (this._attributions[t] && (this._attributions[t]--,
          this._update()),
          this) : this
      },
      _update: function() {
          if (this._map) {
              var t = [];
              for (var i in this._attributions)
                  this._attributions[i] && t.push(i);
              var e = [];
              this.options.prefix && e.push(this.options.prefix),
              t.length && e.push(t.join(", ")),
              this._container.innerHTML = e.join(" | ")
          }
      }
  });
  Le.mergeOptions({
      attributionControl: !0
  }),
  Le.addInitHook(function() {
      this.options.attributionControl && (new Ce).addTo(this)
  });
  Pe.Layers = Te,
  Pe.Zoom = ze,
  Pe.Scale = Me,
  Pe.Attribution = Ce,
  be.layers = function(t, i, e) {
      return new Te(t,i,e)
  }
  ,
  be.zoom = function(t) {
      return new ze(t)
  }
  ,
  be.scale = function(t) {
      return new Me(t)
  }
  ,
  be.attribution = function(t) {
      return new Ce(t)
  }
  ;
  var Ze = v.extend({
      initialize: function(t) {
          this._map = t
      },
      enable: function() {
          return this._enabled ? this : (this._enabled = !0,
          this.addHooks(),
          this)
      },
      disable: function() {
          return this._enabled ? (this._enabled = !1,
          this.removeHooks(),
          this) : this
      },
      enabled: function() {
          return !!this._enabled
      }
  });
  Ze.addTo = function(t, i) {
      return t.addHandler(i, this),
      this
  }
  ;
  var Se, Ee = {
      Events: hi
  }, ke = Vi ? "touchstart mousedown" : "mousedown", Ie = {
      mousedown: "mouseup",
      touchstart: "touchend",
      pointerdown: "touchend",
      MSPointerDown: "touchend"
  }, Ae = {
      mousedown: "mousemove",
      touchstart: "touchmove",
      pointerdown: "touchmove",
      MSPointerDown: "touchmove"
  }, Be = ui.extend({
      options: {
          clickTolerance: 3
      },
      initialize: function(t, i, e, n) {
          l(this, n),
          this._element = t,
          this._dragStartTarget = i || t,
          this._preventOutline = e
      },
      enable: function() {
          this._enabled || (V(this._dragStartTarget, ke, this._onDown, this),
          this._enabled = !0)
      },
      disable: function() {
          this._enabled && (Be._dragging === this && this.finishDrag(),
          q(this._dragStartTarget, ke, this._onDown, this),
          this._enabled = !1,
          this._moved = !1)
      },
      _onDown: function(t) {
          if (!t._simulated && this._enabled && (this._moved = !1,
          !dt(this._element, "leaflet-zoom-anim") && !(Be._dragging || t.shiftKey || 1 !== t.which && 1 !== t.button && !t.touches || (Be._dragging = this,
          this._preventOutline && zt(this._element),
          bt(),
          mi(),
          this._moving)))) {
              this.fire("down");
              var i = t.touches ? t.touches[0] : t;
              this._startPoint = new x(i.clientX,i.clientY),
              V(document, Ae[t.type], this._onMove, this),
              V(document, Ie[t.type], this._onUp, this)
          }
      },
      _onMove: function(t) {
          if (!t._simulated && this._enabled)
              if (t.touches && t.touches.length > 1)
                  this._moved = !0;
              else {
                  var i = t.touches && 1 === t.touches.length ? t.touches[0] : t
                    , e = new x(i.clientX,i.clientY).subtract(this._startPoint);
                  (e.x || e.y) && (Math.abs(e.x) + Math.abs(e.y) < this.options.clickTolerance || ($(t),
                  this._moved || (this.fire("dragstart"),
                  this._moved = !0,
                  this._startPos = Pt(this._element).subtract(e),
                  pt(document.body, "leaflet-dragging"),
                  this._lastTarget = t.target || t.srcElement,
                  window.SVGElementInstance && this._lastTarget instanceof SVGElementInstance && (this._lastTarget = this._lastTarget.correspondingUseElement),
                  pt(this._lastTarget, "leaflet-drag-target")),
                  this._newPos = this._startPos.add(e),
                  this._moving = !0,
                  g(this._animRequest),
                  this._lastEvent = t,
                  this._animRequest = f(this._updatePosition, this, !0)))
              }
      },
      _updatePosition: function() {
          var t = {
              originalEvent: this._lastEvent
          };
          this.fire("predrag", t),
          Lt(this._element, this._newPos),
          this.fire("drag", t)
      },
      _onUp: function(t) {
          !t._simulated && this._enabled && this.finishDrag()
      },
      finishDrag: function() {
          mt(document.body, "leaflet-dragging"),
          this._lastTarget && (mt(this._lastTarget, "leaflet-drag-target"),
          this._lastTarget = null);
          for (var t in Ae)
              q(document, Ae[t], this._onMove, this),
              q(document, Ie[t], this._onUp, this);
          Tt(),
          fi(),
          this._moved && this._moving && (g(this._animRequest),
          this.fire("dragend", {
              distance: this._newPos.distanceTo(this._startPos)
          })),
          this._moving = !1,
          Be._dragging = !1
      }
  }), Oe = (Object.freeze || Object)({
      simplify: Ct,
      pointToSegmentDistance: Zt,
      closestPointOnSegment: function(t, i, e) {
          return Rt(t, i, e)
      },
      clipSegment: It,
      _getEdgeIntersection: At,
      _getBitCode: Bt,
      _sqClosestPointOnSegment: Rt,
      isFlat: Dt,
      _flat: Nt
  }), Re = (Object.freeze || Object)({
      clipPolygon: jt
  }), De = {
      project: function(t) {
          return new x(t.lng,t.lat)
      },
      unproject: function(t) {
          return new M(t.y,t.x)
      },
      bounds: new P([-180, -90],[180, 90])
  }, Ne = {
      R: 6378137,
      R_MINOR: 6356752.314245179,
      bounds: new P([-20037508.34279, -15496570.73972],[20037508.34279, 18764656.23138]),
      project: function(t) {
          var i = Math.PI / 180
            , e = this.R
            , n = t.lat * i
            , o = this.R_MINOR / e
            , s = Math.sqrt(1 - o * o)
            , r = s * Math.sin(n)
            , a = Math.tan(Math.PI / 4 - n / 2) / Math.pow((1 - r) / (1 + r), s / 2);
          return n = -e * Math.log(Math.max(a, 1e-10)),
          new x(t.lng * i * e,n)
      },
      unproject: function(t) {
          for (var i, e = 180 / Math.PI, n = this.R, o = this.R_MINOR / n, s = Math.sqrt(1 - o * o), r = Math.exp(-t.y / n), a = Math.PI / 2 - 2 * Math.atan(r), h = 0, u = .1; h < 15 && Math.abs(u) > 1e-7; h++)
              i = s * Math.sin(a),
              i = Math.pow((1 - i) / (1 + i), s / 2),
              a += u = Math.PI / 2 - 2 * Math.atan(r * i) - a;
          return new M(a * e,t.x * e / n)
      }
  }, je = (Object.freeze || Object)({
      LonLat: De,
      Mercator: Ne,
      SphericalMercator: di
  }), We = i({}, _i, {
      code: "EPSG:3395",
      projection: Ne,
      transformation: function() {
          var t = .5 / (Math.PI * Ne.R);
          return S(t, .5, -t, .5)
      }()
  }), He = i({}, _i, {
      code: "EPSG:4326",
      projection: De,
      transformation: S(1 / 180, 1, -1 / 180, .5)
  }), Fe = i({}, ci, {
      projection: De,
      transformation: S(1, 0, -1, 0),
      scale: function(t) {
          return Math.pow(2, t)
      },
      zoom: function(t) {
          return Math.log(t) / Math.LN2
      },
      distance: function(t, i) {
          var e = i.lng - t.lng
            , n = i.lat - t.lat;
          return Math.sqrt(e * e + n * n)
      },
      infinite: !0
  });
  ci.Earth = _i,
  ci.EPSG3395 = We,
  ci.EPSG3857 = vi,
  ci.EPSG900913 = yi,
  ci.EPSG4326 = He,
  ci.Simple = Fe;
  var Ue = ui.extend({
      options: {
          pane: "overlayPane",
          attribution: null,
          bubblingMouseEvents: !0
      },
      addTo: function(t) {
          return t.addLayer(this),
          this
      },
      remove: function() {
          return this.removeFrom(this._map || this._mapToAdd)
      },
      removeFrom: function(t) {
          return t && t.removeLayer(this),
          this
      },
      getPane: function(t) {
          return this._map.getPane(t ? this.options[t] || t : this.options.pane)
      },
      addInteractiveTarget: function(t) {
          return this._map._targets[n(t)] = this,
          this
      },
      removeInteractiveTarget: function(t) {
          return delete this._map._targets[n(t)],
          this
      },
      getAttribution: function() {
          return this.options.attribution
      },
      _layerAdd: function(t) {
          var i = t.target;
          if (i.hasLayer(this)) {
              if (this._map = i,
              this._zoomAnimated = i._zoomAnimated,
              this.getEvents) {
                  var e = this.getEvents();
                  i.on(e, this),
                  this.once("remove", function() {
                      i.off(e, this)
                  }, this)
              }
              this.onAdd(i),
              this.getAttribution && i.attributionControl && i.attributionControl.addAttribution(this.getAttribution()),
              this.fire("add"),
              i.fire("layeradd", {
                  layer: this
              })
          }
      }
  });
  Le.include({
      addLayer: function(t) {
          if (!t._layerAdd)
              throw new Error("The provided object is not a Layer.");
          var i = n(t);
          return this._layers[i] ? this : (this._layers[i] = t,
          t._mapToAdd = this,
          t.beforeAdd && t.beforeAdd(this),
          this.whenReady(t._layerAdd, t),
          this)
      },
      removeLayer: function(t) {
          var i = n(t);
          return this._layers[i] ? (this._loaded && t.onRemove(this),
          t.getAttribution && this.attributionControl && this.attributionControl.removeAttribution(t.getAttribution()),
          delete this._layers[i],
          this._loaded && (this.fire("layerremove", {
              layer: t
          }),
          t.fire("remove")),
          t._map = t._mapToAdd = null,
          this) : this
      },
      hasLayer: function(t) {
          return !!t && n(t)in this._layers
      },
      eachLayer: function(t, i) {
          for (var e in this._layers)
              t.call(i, this._layers[e]);
          return this
      },
      _addLayers: function(t) {
          for (var i = 0, e = (t = t ? ei(t) ? t : [t] : []).length; i < e; i++)
              this.addLayer(t[i])
      },
      _addZoomLimit: function(t) {
          !isNaN(t.options.maxZoom) && isNaN(t.options.minZoom) || (this._zoomBoundLayers[n(t)] = t,
          this._updateZoomLevels())
      },
      _removeZoomLimit: function(t) {
          var i = n(t);
          this._zoomBoundLayers[i] && (delete this._zoomBoundLayers[i],
          this._updateZoomLevels())
      },
      _updateZoomLevels: function() {
          var t = 1 / 0
            , i = -1 / 0
            , e = this._getZoomSpan();
          for (var n in this._zoomBoundLayers) {
              var o = this._zoomBoundLayers[n].options;
              t = void 0 === o.minZoom ? t : Math.min(t, o.minZoom),
              i = void 0 === o.maxZoom ? i : Math.max(i, o.maxZoom)
          }
          this._layersMaxZoom = i === -1 / 0 ? void 0 : i,
          this._layersMinZoom = t === 1 / 0 ? void 0 : t,
          e !== this._getZoomSpan() && this.fire("zoomlevelschange"),
          void 0 === this.options.maxZoom && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom && this.setZoom(this._layersMaxZoom),
          void 0 === this.options.minZoom && this._layersMinZoom && this.getZoom() < this._layersMinZoom && this.setZoom(this._layersMinZoom)
      }
  });
  var Ve = Ue.extend({
      initialize: function(t, i) {
          l(this, i),
          this._layers = {};
          var e, n;
          if (t)
              for (e = 0,
              n = t.length; e < n; e++)
                  this.addLayer(t[e])
      },
      addLayer: function(t) {
          var i = this.getLayerId(t);
          return this._layers[i] = t,
          this._map && this._map.addLayer(t),
          this
      },
      removeLayer: function(t) {
          var i = t in this._layers ? t : this.getLayerId(t);
          return this._map && this._layers[i] && this._map.removeLayer(this._layers[i]),
          delete this._layers[i],
          this
      },
      hasLayer: function(t) {
          return !!t && (t in this._layers || this.getLayerId(t)in this._layers)
      },
      clearLayers: function() {
          return this.eachLayer(this.removeLayer, this)
      },
      invoke: function(t) {
          var i, e, n = Array.prototype.slice.call(arguments, 1);
          for (i in this._layers)
              (e = this._layers[i])[t] && e[t].apply(e, n);
          return this
      },
      onAdd: function(t) {
          this.eachLayer(t.addLayer, t)
      },
      onRemove: function(t) {
          this.eachLayer(t.removeLayer, t)
      },
      eachLayer: function(t, i) {
          for (var e in this._layers)
              t.call(i, this._layers[e]);
          return this
      },
      getLayer: function(t) {
          return this._layers[t]
      },
      getLayers: function() {
          var t = [];
          return this.eachLayer(t.push, t),
          t
      },
      setZIndex: function(t) {
          return this.invoke("setZIndex", t)
      },
      getLayerId: function(t) {
          return n(t)
      }
  })
    , qe = Ve.extend({
      addLayer: function(t) {
          return this.hasLayer(t) ? this : (t.addEventParent(this),
          Ve.prototype.addLayer.call(this, t),
          this.fire("layeradd", {
              layer: t
          }))
      },
      removeLayer: function(t) {
          return this.hasLayer(t) ? (t in this._layers && (t = this._layers[t]),
          t.removeEventParent(this),
          Ve.prototype.removeLayer.call(this, t),
          this.fire("layerremove", {
              layer: t
          })) : this
      },
      setStyle: function(t) {
          return this.invoke("setStyle", t)
      },
      bringToFront: function() {
          return this.invoke("bringToFront")
      },
      bringToBack: function() {
          return this.invoke("bringToBack")
      },
      getBounds: function() {
          var t = new T;
          for (var i in this._layers) {
              var e = this._layers[i];
              t.extend(e.getBounds ? e.getBounds() : e.getLatLng())
          }
          return t
      }
  })
    , Ge = v.extend({
      options: {
          popupAnchor: [0, 0],
          tooltipAnchor: [0, 0]
      },
      initialize: function(t) {
          l(this, t)
      },
      createIcon: function(t) {
          return this._createIcon("icon", t)
      },
      createShadow: function(t) {
          return this._createIcon("shadow", t)
      },
      _createIcon: function(t, i) {
          var e = this._getIconUrl(t);
          if (!e) {
              if ("icon" === t)
                  throw new Error("iconUrl not set in Icon options (see the docs).");
              return null
          }
          var n = this._createImg(e, i && "IMG" === i.tagName ? i : null);
          return this._setIconStyles(n, t),
          n
      },
      _setIconStyles: function(t, i) {
          var e = this.options
            , n = e[i + "Size"];
          "number" == typeof n && (n = [n, n]);
          var o = w(n)
            , s = w("shadow" === i && e.shadowAnchor || e.iconAnchor || o && o.divideBy(2, !0));
          t.className = "leaflet-marker-" + i + " " + (e.className || ""),
          s && (t.style.marginLeft = -s.x + "px",
          t.style.marginTop = -s.y + "px"),
          o && (t.style.width = o.x + "px",
          t.style.height = o.y + "px")
      },
      _createImg: function(t, i) {
          return i = i || document.createElement("img"),
          i.src = t,
          i
      },
      _getIconUrl: function(t) {
          return Ki && this.options[t + "RetinaUrl"] || this.options[t + "Url"]
      }
  })
    , Ke = Ge.extend({
      options: {
          iconUrl: "marker-icon.png",
          iconRetinaUrl: "marker-icon-2x.png",
          shadowUrl: "marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowSize: [41, 41]
      },
      _getIconUrl: function(t) {
          return Ke.imagePath || (Ke.imagePath = this._detectIconPath()),
          (this.options.imagePath || Ke.imagePath) + Ge.prototype._getIconUrl.call(this, t)
      },
      _detectIconPath: function() {
          var t = ht("div", "leaflet-default-icon-path", document.body)
            , i = at(t, "background-image") || at(t, "backgroundImage");
          return document.body.removeChild(t),
          i = null === i || 0 !== i.indexOf("url") ? "" : i.replace(/^url\(["']?/, "").replace(/marker-icon\.png["']?\)$/, "")
      }
  })
    , Ye = Ze.extend({
      initialize: function(t) {
          this._marker = t
      },
      addHooks: function() {
          var t = this._marker._icon;
          this._draggable || (this._draggable = new Be(t,t,!0)),
          this._draggable.on({
              dragstart: this._onDragStart,
              predrag: this._onPreDrag,
              drag: this._onDrag,
              dragend: this._onDragEnd
          }, this).enable(),
          pt(t, "leaflet-marker-draggable")
      },
      removeHooks: function() {
          this._draggable.off({
              dragstart: this._onDragStart,
              predrag: this._onPreDrag,
              drag: this._onDrag,
              dragend: this._onDragEnd
          }, this).disable(),
          this._marker._icon && mt(this._marker._icon, "leaflet-marker-draggable")
      },
      moved: function() {
          return this._draggable && this._draggable._moved
      },
      _adjustPan: function(t) {
          var i = this._marker
            , e = i._map
            , n = this._marker.options.autoPanSpeed
            , o = this._marker.options.autoPanPadding
            , s = L.DomUtil.getPosition(i._icon)
            , r = e.getPixelBounds()
            , a = e.getPixelOrigin()
            , h = b(r.min._subtract(a).add(o), r.max._subtract(a).subtract(o));
          if (!h.contains(s)) {
              var u = w((Math.max(h.max.x, s.x) - h.max.x) / (r.max.x - h.max.x) - (Math.min(h.min.x, s.x) - h.min.x) / (r.min.x - h.min.x), (Math.max(h.max.y, s.y) - h.max.y) / (r.max.y - h.max.y) - (Math.min(h.min.y, s.y) - h.min.y) / (r.min.y - h.min.y)).multiplyBy(n);
              e.panBy(u, {
                  animate: !1
              }),
              this._draggable._newPos._add(u),
              this._draggable._startPos._add(u),
              L.DomUtil.setPosition(i._icon, this._draggable._newPos),
              this._onDrag(t),
              this._panRequest = f(this._adjustPan.bind(this, t))
          }
      },
      _onDragStart: function() {
          this._oldLatLng = this._marker.getLatLng(),
          this._marker.closePopup().fire("movestart").fire("dragstart")
      },
      _onPreDrag: function(t) {
          this._marker.options.autoPan && (g(this._panRequest),
          this._panRequest = f(this._adjustPan.bind(this, t)))
      },
      _onDrag: function(t) {
          var i = this._marker
            , e = i._shadow
            , n = Pt(i._icon)
            , o = i._map.layerPointToLatLng(n);
          e && Lt(e, n),
          i._latlng = o,
          t.latlng = o,
          t.oldLatLng = this._oldLatLng,
          i.fire("move", t).fire("drag", t)
      },
      _onDragEnd: function(t) {
          g(this._panRequest),
          delete this._oldLatLng,
          this._marker.fire("moveend").fire("dragend", t)
      }
  })
    , Xe = Ue.extend({
      options: {
          icon: new Ke,
          interactive: !0,
          draggable: !1,
          autoPan: !1,
          autoPanPadding: [50, 50],
          autoPanSpeed: 10,
          keyboard: !0,
          title: "",
          alt: "",
          zIndexOffset: 0,
          opacity: 1,
          riseOnHover: !1,
          riseOffset: 250,
          pane: "markerPane",
          bubblingMouseEvents: !1
      },
      initialize: function(t, i) {
          l(this, i),
          this._latlng = C(t)
      },
      onAdd: function(t) {
          this._zoomAnimated = this._zoomAnimated && t.options.markerZoomAnimation,
          this._zoomAnimated && t.on("zoomanim", this._animateZoom, this),
          this._initIcon(),
          this.update()
      },
      onRemove: function(t) {
          this.dragging && this.dragging.enabled() && (this.options.draggable = !0,
          this.dragging.removeHooks()),
          delete this.dragging,
          this._zoomAnimated && t.off("zoomanim", this._animateZoom, this),
          this._removeIcon(),
          this._removeShadow()
      },
      getEvents: function() {
          return {
              zoom: this.update,
              viewreset: this.update
          }
      },
      getLatLng: function() {
          return this._latlng
      },
      setLatLng: function(t) {
          var i = this._latlng;
          return this._latlng = C(t),
          this.update(),
          this.fire("move", {
              oldLatLng: i,
              latlng: this._latlng
          })
      },
      setZIndexOffset: function(t) {
          return this.options.zIndexOffset = t,
          this.update()
      },
      setIcon: function(t) {
          return this.options.icon = t,
          this._map && (this._initIcon(),
          this.update()),
          this._popup && this.bindPopup(this._popup, this._popup.options),
          this
      },
      getElement: function() {
          return this._icon
      },
      update: function() {
          if (this._icon && this._map) {
              var t = this._map.latLngToLayerPoint(this._latlng).round();
              this._setPos(t)
          }
          return this
      },
      _initIcon: function() {
          var t = this.options
            , i = "leaflet-zoom-" + (this._zoomAnimated ? "animated" : "hide")
            , e = t.icon.createIcon(this._icon)
            , n = !1;
          e !== this._icon && (this._icon && this._removeIcon(),
          n = !0,
          t.title && (e.title = t.title),
          "IMG" === e.tagName && (e.alt = t.alt || "")),
          pt(e, i),
          t.keyboard && (e.tabIndex = "0"),
          this._icon = e,
          t.riseOnHover && this.on({
              mouseover: this._bringToFront,
              mouseout: this._resetZIndex
          });
          var o = t.icon.createShadow(this._shadow)
            , s = !1;
          o !== this._shadow && (this._removeShadow(),
          s = !0),
          o && (pt(o, i),
          o.alt = ""),
          this._shadow = o,
          t.opacity < 1 && this._updateOpacity(),
          n && this.getPane().appendChild(this._icon),
          this._initInteraction(),
          o && s && this.getPane("shadowPane").appendChild(this._shadow)
      },
      _removeIcon: function() {
          this.options.riseOnHover && this.off({
              mouseover: this._bringToFront,
              mouseout: this._resetZIndex
          }),
          ut(this._icon),
          this.removeInteractiveTarget(this._icon),
          this._icon = null
      },
      _removeShadow: function() {
          this._shadow && ut(this._shadow),
          this._shadow = null
      },
      _setPos: function(t) {
          Lt(this._icon, t),
          this._shadow && Lt(this._shadow, t),
          this._zIndex = t.y + this.options.zIndexOffset,
          this._resetZIndex()
      },
      _updateZIndex: function(t) {
          this._icon.style.zIndex = this._zIndex + t
      },
      _animateZoom: function(t) {
          var i = this._map._latLngToNewLayerPoint(this._latlng, t.zoom, t.center).round();
          this._setPos(i)
      },
      _initInteraction: function() {
          if (this.options.interactive && (pt(this._icon, "leaflet-interactive"),
          this.addInteractiveTarget(this._icon),
          Ye)) {
              var t = this.options.draggable;
              this.dragging && (t = this.dragging.enabled(),
              this.dragging.disable()),
              this.dragging = new Ye(this),
              t && this.dragging.enable()
          }
      },
      setOpacity: function(t) {
          return this.options.opacity = t,
          this._map && this._updateOpacity(),
          this
      },
      _updateOpacity: function() {
          var t = this.options.opacity;
          vt(this._icon, t),
          this._shadow && vt(this._shadow, t)
      },
      _bringToFront: function() {
          this._updateZIndex(this.options.riseOffset)
      },
      _resetZIndex: function() {
          this._updateZIndex(0)
      },
      _getPopupAnchor: function() {
          return this.options.icon.options.popupAnchor
      },
      _getTooltipAnchor: function() {
          return this.options.icon.options.tooltipAnchor
      }
  })
    , Je = Ue.extend({
      options: {
          stroke: !0,
          color: "#3388ff",
          weight: 3,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
          dashArray: null,
          dashOffset: null,
          fill: !1,
          fillColor: null,
          fillOpacity: .2,
          fillRule: "evenodd",
          interactive: !0,
          bubblingMouseEvents: !0
      },
      beforeAdd: function(t) {
          this._renderer = t.getRenderer(this)
      },
      onAdd: function() {
          this._renderer._initPath(this),
          this._reset(),
          this._renderer._addPath(this)
      },
      onRemove: function() {
          this._renderer._removePath(this)
      },
      redraw: function() {
          return this._map && this._renderer._updatePath(this),
          this
      },
      setStyle: function(t) {
          return l(this, t),
          this._renderer && this._renderer._updateStyle(this),
          this
      },
      bringToFront: function() {
          return this._renderer && this._renderer._bringToFront(this),
          this
      },
      bringToBack: function() {
          return this._renderer && this._renderer._bringToBack(this),
          this
      },
      getElement: function() {
          return this._path
      },
      _reset: function() {
          this._project(),
          this._update()
      },
      _clickTolerance: function() {
          return (this.options.stroke ? this.options.weight / 2 : 0) + this._renderer.options.tolerance
      }
  })
    , $e = Je.extend({
      options: {
          fill: !0,
          radius: 10
      },
      initialize: function(t, i) {
          l(this, i),
          this._latlng = C(t),
          this._radius = this.options.radius
      },
      setLatLng: function(t) {
          return this._latlng = C(t),
          this.redraw(),
          this.fire("move", {
              latlng: this._latlng
          })
      },
      getLatLng: function() {
          return this._latlng
      },
      setRadius: function(t) {
          return this.options.radius = this._radius = t,
          this.redraw()
      },
      getRadius: function() {
          return this._radius
      },
      setStyle: function(t) {
          var i = t && t.radius || this._radius;
          return Je.prototype.setStyle.call(this, t),
          this.setRadius(i),
          this
      },
      _project: function() {
          this._point = this._map.latLngToLayerPoint(this._latlng),
          this._updateBounds()
      },
      _updateBounds: function() {
          var t = this._radius
            , i = this._radiusY || t
            , e = this._clickTolerance()
            , n = [t + e, i + e];
          this._pxBounds = new P(this._point.subtract(n),this._point.add(n))
      },
      _update: function() {
          this._map && this._updatePath()
      },
      _updatePath: function() {
          this._renderer._updateCircle(this)
      },
      _empty: function() {
          return this._radius && !this._renderer._bounds.intersects(this._pxBounds)
      },
      _containsPoint: function(t) {
          return t.distanceTo(this._point) <= this._radius + this._clickTolerance()
      }
  })
    , Qe = $e.extend({
      initialize: function(t, e, n) {
          if ("number" == typeof e && (e = i({}, n, {
              radius: e
          })),
          l(this, e),
          this._latlng = C(t),
          isNaN(this.options.radius))
              throw new Error("Circle radius cannot be NaN");
          this._mRadius = this.options.radius
      },
      setRadius: function(t) {
          return this._mRadius = t,
          this.redraw()
      },
      getRadius: function() {
          return this._mRadius
      },
      getBounds: function() {
          var t = [this._radius, this._radiusY || this._radius];
          return new T(this._map.layerPointToLatLng(this._point.subtract(t)),this._map.layerPointToLatLng(this._point.add(t)))
      },
      setStyle: Je.prototype.setStyle,
      _project: function() {
          var t = this._latlng.lng
            , i = this._latlng.lat
            , e = this._map
            , n = e.options.crs;
          if (n.distance === _i.distance) {
              var o = Math.PI / 180
                , s = this._mRadius / _i.R / o
                , r = e.project([i + s, t])
                , a = e.project([i - s, t])
                , h = r.add(a).divideBy(2)
                , u = e.unproject(h).lat
                , l = Math.acos((Math.cos(s * o) - Math.sin(i * o) * Math.sin(u * o)) / (Math.cos(i * o) * Math.cos(u * o))) / o;
              (isNaN(l) || 0 === l) && (l = s / Math.cos(Math.PI / 180 * i)),
              this._point = h.subtract(e.getPixelOrigin()),
              this._radius = isNaN(l) ? 0 : h.x - e.project([u, t - l]).x,
              this._radiusY = h.y - r.y
          } else {
              var c = n.unproject(n.project(this._latlng).subtract([this._mRadius, 0]));
              this._point = e.latLngToLayerPoint(this._latlng),
              this._radius = this._point.x - e.latLngToLayerPoint(c).x
          }
          this._updateBounds()
      }
  })
    , tn = Je.extend({
      options: {
          smoothFactor: 1,
          noClip: !1
      },
      initialize: function(t, i) {
          l(this, i),
          this._setLatLngs(t)
      },
      getLatLngs: function() {
          return this._latlngs
      },
      setLatLngs: function(t) {
          return this._setLatLngs(t),
          this.redraw()
      },
      isEmpty: function() {
          return !this._latlngs.length
      },
      closestLayerPoint: function(t) {
          for (var i, e, n = 1 / 0, o = null, s = Rt, r = 0, a = this._parts.length; r < a; r++)
              for (var h = this._parts[r], u = 1, l = h.length; u < l; u++) {
                  var c = s(t, i = h[u - 1], e = h[u], !0);
                  c < n && (n = c,
                  o = s(t, i, e))
              }
          return o && (o.distance = Math.sqrt(n)),
          o
      },
      getCenter: function() {
          if (!this._map)
              throw new Error("Must add layer to map before using getCenter()");
          var t, i, e, n, o, s, r, a = this._rings[0], h = a.length;
          if (!h)
              return null;
          for (t = 0,
          i = 0; t < h - 1; t++)
              i += a[t].distanceTo(a[t + 1]) / 2;
          if (0 === i)
              return this._map.layerPointToLatLng(a[0]);
          for (t = 0,
          n = 0; t < h - 1; t++)
              if (o = a[t],
              s = a[t + 1],
              e = o.distanceTo(s),
              (n += e) > i)
                  return r = (n - i) / e,
                  this._map.layerPointToLatLng([s.x - r * (s.x - o.x), s.y - r * (s.y - o.y)])
      },
      getBounds: function() {
          return this._bounds
      },
      addLatLng: function(t, i) {
          return i = i || this._defaultShape(),
          t = C(t),
          i.push(t),
          this._bounds.extend(t),
          this.redraw()
      },
      _setLatLngs: function(t) {
          this._bounds = new T,
          this._latlngs = this._convertLatLngs(t)
      },
      _defaultShape: function() {
          return Dt(this._latlngs) ? this._latlngs : this._latlngs[0]
      },
      _convertLatLngs: function(t) {
          for (var i = [], e = Dt(t), n = 0, o = t.length; n < o; n++)
              e ? (i[n] = C(t[n]),
              this._bounds.extend(i[n])) : i[n] = this._convertLatLngs(t[n]);
          return i
      },
      _project: function() {
          var t = new P;
          this._rings = [],
          this._projectLatlngs(this._latlngs, this._rings, t);
          var i = this._clickTolerance()
            , e = new x(i,i);
          this._bounds.isValid() && t.isValid() && (t.min._subtract(e),
          t.max._add(e),
          this._pxBounds = t)
      },
      _projectLatlngs: function(t, i, e) {
          var n, o, s = t[0]instanceof M, r = t.length;
          if (s) {
              for (o = [],
              n = 0; n < r; n++)
                  o[n] = this._map.latLngToLayerPoint(t[n]),
                  e.extend(o[n]);
              i.push(o)
          } else
              for (n = 0; n < r; n++)
                  this._projectLatlngs(t[n], i, e)
      },
      _clipPoints: function() {
          var t = this._renderer._bounds;
          if (this._parts = [],
          this._pxBounds && this._pxBounds.intersects(t))
              if (this.options.noClip)
                  this._parts = this._rings;
              else {
                  var i, e, n, o, s, r, a, h = this._parts;
                  for (i = 0,
                  n = 0,
                  o = this._rings.length; i < o; i++)
                      for (e = 0,
                      s = (a = this._rings[i]).length; e < s - 1; e++)
                          (r = It(a[e], a[e + 1], t, e, !0)) && (h[n] = h[n] || [],
                          h[n].push(r[0]),
                          r[1] === a[e + 1] && e !== s - 2 || (h[n].push(r[1]),
                          n++))
              }
      },
      _simplifyPoints: function() {
          for (var t = this._parts, i = this.options.smoothFactor, e = 0, n = t.length; e < n; e++)
              t[e] = Ct(t[e], i)
      },
      _update: function() {
          this._map && (this._clipPoints(),
          this._simplifyPoints(),
          this._updatePath())
      },
      _updatePath: function() {
          this._renderer._updatePoly(this)
      },
      _containsPoint: function(t, i) {
          var e, n, o, s, r, a, h = this._clickTolerance();
          if (!this._pxBounds || !this._pxBounds.contains(t))
              return !1;
          for (e = 0,
          s = this._parts.length; e < s; e++)
              for (n = 0,
              o = (r = (a = this._parts[e]).length) - 1; n < r; o = n++)
                  if ((i || 0 !== n) && Zt(t, a[o], a[n]) <= h)
                      return !0;
          return !1
      }
  });
  tn._flat = Nt;
  var en = tn.extend({
      options: {
          fill: !0
      },
      isEmpty: function() {
          return !this._latlngs.length || !this._latlngs[0].length
      },
      getCenter: function() {
          if (!this._map)
              throw new Error("Must add layer to map before using getCenter()");
          var t, i, e, n, o, s, r, a, h, u = this._rings[0], l = u.length;
          if (!l)
              return null;
          for (s = r = a = 0,
          t = 0,
          i = l - 1; t < l; i = t++)
              e = u[t],
              n = u[i],
              o = e.y * n.x - n.y * e.x,
              r += (e.x + n.x) * o,
              a += (e.y + n.y) * o,
              s += 3 * o;
          return h = 0 === s ? u[0] : [r / s, a / s],
          this._map.layerPointToLatLng(h)
      },
      _convertLatLngs: function(t) {
          var i = tn.prototype._convertLatLngs.call(this, t)
            , e = i.length;
          return e >= 2 && i[0]instanceof M && i[0].equals(i[e - 1]) && i.pop(),
          i
      },
      _setLatLngs: function(t) {
          tn.prototype._setLatLngs.call(this, t),
          Dt(this._latlngs) && (this._latlngs = [this._latlngs])
      },
      _defaultShape: function() {
          return Dt(this._latlngs[0]) ? this._latlngs[0] : this._latlngs[0][0]
      },
      _clipPoints: function() {
          var t = this._renderer._bounds
            , i = this.options.weight
            , e = new x(i,i);
          if (t = new P(t.min.subtract(e),t.max.add(e)),
          this._parts = [],
          this._pxBounds && this._pxBounds.intersects(t))
              if (this.options.noClip)
                  this._parts = this._rings;
              else
                  for (var n, o = 0, s = this._rings.length; o < s; o++)
                      (n = jt(this._rings[o], t, !0)).length && this._parts.push(n)
      },
      _updatePath: function() {
          this._renderer._updatePoly(this, !0)
      },
      _containsPoint: function(t) {
          var i, e, n, o, s, r, a, h, u = !1;
          if (!this._pxBounds.contains(t))
              return !1;
          for (o = 0,
          a = this._parts.length; o < a; o++)
              for (s = 0,
              r = (h = (i = this._parts[o]).length) - 1; s < h; r = s++)
                  e = i[s],
                  n = i[r],
                  e.y > t.y != n.y > t.y && t.x < (n.x - e.x) * (t.y - e.y) / (n.y - e.y) + e.x && (u = !u);
          return u || tn.prototype._containsPoint.call(this, t, !0)
      }
  })
    , nn = qe.extend({
      initialize: function(t, i) {
          l(this, i),
          this._layers = {},
          t && this.addData(t)
      },
      addData: function(t) {
          var i, e, n, o = ei(t) ? t : t.features;
          if (o) {
              for (i = 0,
              e = o.length; i < e; i++)
                  ((n = o[i]).geometries || n.geometry || n.features || n.coordinates) && this.addData(n);
              return this
          }
          var s = this.options;
          if (s.filter && !s.filter(t))
              return this;
          var r = Wt(t, s);
          return r ? (r.feature = Gt(t),
          r.defaultOptions = r.options,
          this.resetStyle(r),
          s.onEachFeature && s.onEachFeature(t, r),
          this.addLayer(r)) : this
      },
      resetStyle: function(t) {
          return t.options = i({}, t.defaultOptions),
          this._setLayerStyle(t, this.options.style),
          this
      },
      setStyle: function(t) {
          return this.eachLayer(function(i) {
              this._setLayerStyle(i, t)
          }, this)
      },
      _setLayerStyle: function(t, i) {
          "function" == typeof i && (i = i(t.feature)),
          t.setStyle && t.setStyle(i)
      }
  })
    , on = {
      toGeoJSON: function(t) {
          return qt(this, {
              type: "Point",
              coordinates: Ut(this.getLatLng(), t)
          })
      }
  };
  Xe.include(on),
  Qe.include(on),
  $e.include(on),
  tn.include({
      toGeoJSON: function(t) {
          var i = !Dt(this._latlngs)
            , e = Vt(this._latlngs, i ? 1 : 0, !1, t);
          return qt(this, {
              type: (i ? "Multi" : "") + "LineString",
              coordinates: e
          })
      }
  }),
  en.include({
      toGeoJSON: function(t) {
          var i = !Dt(this._latlngs)
            , e = i && !Dt(this._latlngs[0])
            , n = Vt(this._latlngs, e ? 2 : i ? 1 : 0, !0, t);
          return i || (n = [n]),
          qt(this, {
              type: (e ? "Multi" : "") + "Polygon",
              coordinates: n
          })
      }
  }),
  Ve.include({
      toMultiPoint: function(t) {
          var i = [];
          return this.eachLayer(function(e) {
              i.push(e.toGeoJSON(t).geometry.coordinates)
          }),
          qt(this, {
              type: "MultiPoint",
              coordinates: i
          })
      },
      toGeoJSON: function(t) {
          var i = this.feature && this.feature.geometry && this.feature.geometry.type;
          if ("MultiPoint" === i)
              return this.toMultiPoint(t);
          var e = "GeometryCollection" === i
            , n = [];
          return this.eachLayer(function(i) {
              if (i.toGeoJSON) {
                  var o = i.toGeoJSON(t);
                  if (e)
                      n.push(o.geometry);
                  else {
                      var s = Gt(o);
                      "FeatureCollection" === s.type ? n.push.apply(n, s.features) : n.push(s)
                  }
              }
          }),
          e ? qt(this, {
              geometries: n,
              type: "GeometryCollection"
          }) : {
              type: "FeatureCollection",
              features: n
          }
      }
  });
  var sn = Kt
    , rn = Ue.extend({
      options: {
          opacity: 1,
          alt: "",
          interactive: !1,
          crossOrigin: !1,
          errorOverlayUrl: "",
          zIndex: 1,
          className: ""
      },
      initialize: function(t, i, e) {
          this._url = t,
          this._bounds = z(i),
          l(this, e)
      },
      onAdd: function() {
          this._image || (this._initImage(),
          this.options.opacity < 1 && this._updateOpacity()),
          this.options.interactive && (pt(this._image, "leaflet-interactive"),
          this.addInteractiveTarget(this._image)),
          this.getPane().appendChild(this._image),
          this._reset()
      },
      onRemove: function() {
          ut(this._image),
          this.options.interactive && this.removeInteractiveTarget(this._image)
      },
      setOpacity: function(t) {
          return this.options.opacity = t,
          this._image && this._updateOpacity(),
          this
      },
      setStyle: function(t) {
          return t.opacity && this.setOpacity(t.opacity),
          this
      },
      bringToFront: function() {
          return this._map && ct(this._image),
          this
      },
      bringToBack: function() {
          return this._map && _t(this._image),
          this
      },
      setUrl: function(t) {
          return this._url = t,
          this._image && (this._image.src = t),
          this
      },
      setBounds: function(t) {
          return this._bounds = z(t),
          this._map && this._reset(),
          this
      },
      getEvents: function() {
          var t = {
              zoom: this._reset,
              viewreset: this._reset
          };
          return this._zoomAnimated && (t.zoomanim = this._animateZoom),
          t
      },
      setZIndex: function(t) {
          return this.options.zIndex = t,
          this._updateZIndex(),
          this
      },
      getBounds: function() {
          return this._bounds
      },
      getElement: function() {
          return this._image
      },
      _initImage: function() {
          var t = "IMG" === this._url.tagName
            , i = this._image = t ? this._url : ht("img");
          pt(i, "leaflet-image-layer"),
          this._zoomAnimated && pt(i, "leaflet-zoom-animated"),
          this.options.className && pt(i, this.options.className),
          i.onselectstart = r,
          i.onmousemove = r,
          i.onload = e(this.fire, this, "load"),
          i.onerror = e(this._overlayOnError, this, "error"),
          this.options.crossOrigin && (i.crossOrigin = ""),
          this.options.zIndex && this._updateZIndex(),
          t ? this._url = i.src : (i.src = this._url,
          i.alt = this.options.alt)
      },
      _animateZoom: function(t) {
          var i = this._map.getZoomScale(t.zoom)
            , e = this._map._latLngBoundsToNewLayerBounds(this._bounds, t.zoom, t.center).min;
          wt(this._image, e, i)
      },
      _reset: function() {
          var t = this._image
            , i = new P(this._map.latLngToLayerPoint(this._bounds.getNorthWest()),this._map.latLngToLayerPoint(this._bounds.getSouthEast()))
            , e = i.getSize();
          Lt(t, i.min),
          t.style.width = e.x + "px",
          t.style.height = e.y + "px"
      },
      _updateOpacity: function() {
          vt(this._image, this.options.opacity)
      },
      _updateZIndex: function() {
          this._image && void 0 !== this.options.zIndex && null !== this.options.zIndex && (this._image.style.zIndex = this.options.zIndex)
      },
      _overlayOnError: function() {
          this.fire("error");
          var t = this.options.errorOverlayUrl;
          t && this._url !== t && (this._url = t,
          this._image.src = t)
      }
  })
    , an = rn.extend({
      options: {
          autoplay: !0,
          loop: !0
      },
      _initImage: function() {
          var t = "VIDEO" === this._url.tagName
            , i = this._image = t ? this._url : ht("video");
          if (pt(i, "leaflet-image-layer"),
          this._zoomAnimated && pt(i, "leaflet-zoom-animated"),
          i.onselectstart = r,
          i.onmousemove = r,
          i.onloadeddata = e(this.fire, this, "load"),
          t) {
              for (var n = i.getElementsByTagName("source"), o = [], s = 0; s < n.length; s++)
                  o.push(n[s].src);
              this._url = n.length > 0 ? o : [i.src]
          } else {
              ei(this._url) || (this._url = [this._url]),
              i.autoplay = !!this.options.autoplay,
              i.loop = !!this.options.loop;
              for (var a = 0; a < this._url.length; a++) {
                  var h = ht("source");
                  h.src = this._url[a],
                  i.appendChild(h)
              }
          }
      }
  })
    , hn = Ue.extend({
      options: {
          offset: [0, 7],
          className: "",
          pane: "popupPane"
      },
      initialize: function(t, i) {
          l(this, t),
          this._source = i
      },
      onAdd: function(t) {
          this._zoomAnimated = t._zoomAnimated,
          this._container || this._initLayout(),
          t._fadeAnimated && vt(this._container, 0),
          clearTimeout(this._removeTimeout),
          this.getPane().appendChild(this._container),
          this.update(),
          t._fadeAnimated && vt(this._container, 1),
          this.bringToFront()
      },
      onRemove: function(t) {
          t._fadeAnimated ? (vt(this._container, 0),
          this._removeTimeout = setTimeout(e(ut, void 0, this._container), 200)) : ut(this._container)
      },
      getLatLng: function() {
          return this._latlng
      },
      setLatLng: function(t) {
          return this._latlng = C(t),
          this._map && (this._updatePosition(),
          this._adjustPan()),
          this
      },
      getContent: function() {
          return this._content
      },
      setContent: function(t) {
          return this._content = t,
          this.update(),
          this
      },
      getElement: function() {
          return this._container
      },
      update: function() {
          this._map && (this._container.style.visibility = "hidden",
          this._updateContent(),
          this._updateLayout(),
          this._updatePosition(),
          this._container.style.visibility = "",
          this._adjustPan())
      },
      getEvents: function() {
          var t = {
              zoom: this._updatePosition,
              viewreset: this._updatePosition
          };
          return this._zoomAnimated && (t.zoomanim = this._animateZoom),
          t
      },
      isOpen: function() {
          return !!this._map && this._map.hasLayer(this)
      },
      bringToFront: function() {
          return this._map && ct(this._container),
          this
      },
      bringToBack: function() {
          return this._map && _t(this._container),
          this
      },
      _updateContent: function() {
          if (this._content) {
              var t = this._contentNode
                , i = "function" == typeof this._content ? this._content(this._source || this) : this._content;
              if ("string" == typeof i)
                  t.innerHTML = i;
              else {
                  for (; t.hasChildNodes(); )
                      t.removeChild(t.firstChild);
                  t.appendChild(i)
              }
              this.fire("contentupdate")
          }
      },
      _updatePosition: function() {
          if (this._map) {
              var t = this._map.latLngToLayerPoint(this._latlng)
                , i = w(this.options.offset)
                , e = this._getAnchor();
              this._zoomAnimated ? Lt(this._container, t.add(e)) : i = i.add(t).add(e);
              var n = this._containerBottom = -i.y
                , o = this._containerLeft = -Math.round(this._containerWidth / 2) + i.x;
              this._container.style.bottom = n + "px",
              this._container.style.left = o + "px"
          }
      },
      _getAnchor: function() {
          return [0, 0]
      }
  })
    , un = hn.extend({
      options: {
          maxWidth: 300,
          minWidth: 50,
          maxHeight: null,
          autoPan: !0,
          autoPanPaddingTopLeft: null,
          autoPanPaddingBottomRight: null,
          autoPanPadding: [5, 5],
          keepInView: !1,
          closeButton: !0,
          autoClose: !0,
          closeOnEscapeKey: !0,
          className: ""
      },
      openOn: function(t) {
          return t.openPopup(this),
          this
      },
      onAdd: function(t) {
          hn.prototype.onAdd.call(this, t),
          t.fire("popupopen", {
              popup: this
          }),
          this._source && (this._source.fire("popupopen", {
              popup: this
          }, !0),
          this._source instanceof Je || this._source.on("preclick", Y))
      },
      onRemove: function(t) {
          hn.prototype.onRemove.call(this, t),
          t.fire("popupclose", {
              popup: this
          }),
          this._source && (this._source.fire("popupclose", {
              popup: this
          }, !0),
          this._source instanceof Je || this._source.off("preclick", Y))
      },
      getEvents: function() {
          var t = hn.prototype.getEvents.call(this);
          return (void 0 !== this.options.closeOnClick ? this.options.closeOnClick : this._map.options.closePopupOnClick) && (t.preclick = this._close),
          this.options.keepInView && (t.moveend = this._adjustPan),
          t
      },
      _close: function() {
          this._map && this._map.closePopup(this)
      },
      _initLayout: function() {
          var t = "leaflet-popup"
            , i = this._container = ht("div", t + " " + (this.options.className || "") + " leaflet-zoom-animated")
            , e = this._wrapper = ht("div", t + "-content-wrapper", i);
          if (this._contentNode = ht("div", t + "-content", e),
          J(e),
          X(this._contentNode),
          V(e, "contextmenu", Y),
          this._tipContainer = ht("div", t + "-tip-container", i),
          this._tip = ht("div", t + "-tip", this._tipContainer),
          this.options.closeButton) {
              var n = this._closeButton = ht("a", t + "-close-button", i);
              n.href = "#close",
              n.innerHTML = "&#215;",
              V(n, "click", this._onCloseButtonClick, this)
          }
      },
      _updateLayout: function() {
          var t = this._contentNode
            , i = t.style;
          i.width = "",
          i.whiteSpace = "nowrap";
          var e = t.offsetWidth;
          e = Math.min(e, this.options.maxWidth),
          e = Math.max(e, this.options.minWidth),
          i.width = e + 1 + "px",
          i.whiteSpace = "",
          i.height = "";
          var n = t.offsetHeight
            , o = this.options.maxHeight;
          o && n > o ? (i.height = o + "px",
          pt(t, "leaflet-popup-scrolled")) : mt(t, "leaflet-popup-scrolled"),
          this._containerWidth = this._container.offsetWidth
      },
      _animateZoom: function(t) {
          var i = this._map._latLngToNewLayerPoint(this._latlng, t.zoom, t.center)
            , e = this._getAnchor();
          Lt(this._container, i.add(e))
      },
      _adjustPan: function() {
          if (!(!this.options.autoPan || this._map._panAnim && this._map._panAnim._inProgress)) {
              var t = this._map
                , i = parseInt(at(this._container, "marginBottom"), 10) || 0
                , e = this._container.offsetHeight + i
                , n = this._containerWidth
                , o = new x(this._containerLeft,-e - this._containerBottom);
              o._add(Pt(this._container));
              var s = t.layerPointToContainerPoint(o)
                , r = w(this.options.autoPanPadding)
                , a = w(this.options.autoPanPaddingTopLeft || r)
                , h = w(this.options.autoPanPaddingBottomRight || r)
                , u = t.getSize()
                , l = 0
                , c = 0;
              s.x + n + h.x > u.x && (l = s.x + n - u.x + h.x),
              s.x - l - a.x < 0 && (l = s.x - a.x),
              s.y + e + h.y > u.y && (c = s.y + e - u.y + h.y),
              s.y - c - a.y < 0 && (c = s.y - a.y),
              (l || c) && t.fire("autopanstart").panBy([l, c])
          }
      },
      _onCloseButtonClick: function(t) {
          this._close(),
          Q(t)
      },
      _getAnchor: function() {
          return w(this._source && this._source._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0])
      }
  });
  Le.mergeOptions({
      closePopupOnClick: !0
  }),
  Le.include({
      openPopup: function(t, i, e) {
          return t instanceof un || (t = new un(e).setContent(t)),
          i && t.setLatLng(i),
          this.hasLayer(t) ? this : (this._popup && this._popup.options.autoClose && this.closePopup(),
          this._popup = t,
          this.addLayer(t))
      },
      closePopup: function(t) {
          return t && t !== this._popup || (t = this._popup,
          this._popup = null),
          t && this.removeLayer(t),
          this
      }
  }),
  Ue.include({
      bindPopup: function(t, i) {
          return t instanceof un ? (l(t, i),
          this._popup = t,
          t._source = this) : (this._popup && !i || (this._popup = new un(i,this)),
          this._popup.setContent(t)),
          this._popupHandlersAdded || (this.on({
              click: this._openPopup,
              keypress: this._onKeyPress,
              remove: this.closePopup,
              move: this._movePopup
          }),
          this._popupHandlersAdded = !0),
          this
      },
      unbindPopup: function() {
          return this._popup && (this.off({
              click: this._openPopup,
              keypress: this._onKeyPress,
              remove: this.closePopup,
              move: this._movePopup
          }),
          this._popupHandlersAdded = !1,
          this._popup = null),
          this
      },
      openPopup: function(t, i) {
          if (t instanceof Ue || (i = t,
          t = this),
          t instanceof qe)
              for (var e in this._layers) {
                  t = this._layers[e];
                  break
              }
          return i || (i = t.getCenter ? t.getCenter() : t.getLatLng()),
          this._popup && this._map && (this._popup._source = t,
          this._popup.update(),
          this._map.openPopup(this._popup, i)),
          this
      },
      closePopup: function() {
          return this._popup && this._popup._close(),
          this
      },
      togglePopup: function(t) {
          return this._popup && (this._popup._map ? this.closePopup() : this.openPopup(t)),
          this
      },
      isPopupOpen: function() {
          return !!this._popup && this._popup.isOpen()
      },
      setPopupContent: function(t) {
          return this._popup && this._popup.setContent(t),
          this
      },
      getPopup: function() {
          return this._popup
      },
      _openPopup: function(t) {
          var i = t.layer || t.target;
          this._popup && this._map && (Q(t),
          i instanceof Je ? this.openPopup(t.layer || t.target, t.latlng) : this._map.hasLayer(this._popup) && this._popup._source === i ? this.closePopup() : this.openPopup(i, t.latlng))
      },
      _movePopup: function(t) {
          this._popup.setLatLng(t.latlng)
      },
      _onKeyPress: function(t) {
          13 === t.originalEvent.keyCode && this._openPopup(t)
      }
  });
  var ln = hn.extend({
      options: {
          pane: "tooltipPane",
          offset: [0, 0],
          direction: "auto",
          permanent: !1,
          sticky: !1,
          interactive: !1,
          opacity: .9
      },
      onAdd: function(t) {
          hn.prototype.onAdd.call(this, t),
          this.setOpacity(this.options.opacity),
          t.fire("tooltipopen", {
              tooltip: this
          }),
          this._source && this._source.fire("tooltipopen", {
              tooltip: this
          }, !0)
      },
      onRemove: function(t) {
          hn.prototype.onRemove.call(this, t),
          t.fire("tooltipclose", {
              tooltip: this
          }),
          this._source && this._source.fire("tooltipclose", {
              tooltip: this
          }, !0)
      },
      getEvents: function() {
          var t = hn.prototype.getEvents.call(this);
          return Vi && !this.options.permanent && (t.preclick = this._close),
          t
      },
      _close: function() {
          this._map && this._map.closeTooltip(this)
      },
      _initLayout: function() {
          var t = "leaflet-tooltip " + (this.options.className || "") + " leaflet-zoom-" + (this._zoomAnimated ? "animated" : "hide");
          this._contentNode = this._container = ht("div", t)
      },
      _updateLayout: function() {},
      _adjustPan: function() {},
      _setPosition: function(t) {
          var i = this._map
            , e = this._container
            , n = i.latLngToContainerPoint(i.getCenter())
            , o = i.layerPointToContainerPoint(t)
            , s = this.options.direction
            , r = e.offsetWidth
            , a = e.offsetHeight
            , h = w(this.options.offset)
            , u = this._getAnchor();
          "top" === s ? t = t.add(w(-r / 2 + h.x, -a + h.y + u.y, !0)) : "bottom" === s ? t = t.subtract(w(r / 2 - h.x, -h.y, !0)) : "center" === s ? t = t.subtract(w(r / 2 + h.x, a / 2 - u.y + h.y, !0)) : "right" === s || "auto" === s && o.x < n.x ? (s = "right",
          t = t.add(w(h.x + u.x, u.y - a / 2 + h.y, !0))) : (s = "left",
          t = t.subtract(w(r + u.x - h.x, a / 2 - u.y - h.y, !0))),
          mt(e, "leaflet-tooltip-right"),
          mt(e, "leaflet-tooltip-left"),
          mt(e, "leaflet-tooltip-top"),
          mt(e, "leaflet-tooltip-bottom"),
          pt(e, "leaflet-tooltip-" + s),
          Lt(e, t)
      },
      _updatePosition: function() {
          var t = this._map.latLngToLayerPoint(this._latlng);
          this._setPosition(t)
      },
      setOpacity: function(t) {
          this.options.opacity = t,
          this._container && vt(this._container, t)
      },
      _animateZoom: function(t) {
          var i = this._map._latLngToNewLayerPoint(this._latlng, t.zoom, t.center);
          this._setPosition(i)
      },
      _getAnchor: function() {
          return w(this._source && this._source._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0])
      }
  });
  Le.include({
      openTooltip: function(t, i, e) {
          return t instanceof ln || (t = new ln(e).setContent(t)),
          i && t.setLatLng(i),
          this.hasLayer(t) ? this : this.addLayer(t)
      },
      closeTooltip: function(t) {
          return t && this.removeLayer(t),
          this
      }
  }),
  Ue.include({
      bindTooltip: function(t, i) {
          return t instanceof ln ? (l(t, i),
          this._tooltip = t,
          t._source = this) : (this._tooltip && !i || (this._tooltip = new ln(i,this)),
          this._tooltip.setContent(t)),
          this._initTooltipInteractions(),
          this._tooltip.options.permanent && this._map && this._map.hasLayer(this) && this.openTooltip(),
          this
      },
      unbindTooltip: function() {
          return this._tooltip && (this._initTooltipInteractions(!0),
          this.closeTooltip(),
          this._tooltip = null),
          this
      },
      _initTooltipInteractions: function(t) {
          if (t || !this._tooltipHandlersAdded) {
              var i = t ? "off" : "on"
                , e = {
                  remove: this.closeTooltip,
                  move: this._moveTooltip
              };
              this._tooltip.options.permanent ? e.add = this._openTooltip : (e.mouseover = this._openTooltip,
              e.mouseout = this.closeTooltip,
              this._tooltip.options.sticky && (e.mousemove = this._moveTooltip),
              Vi && (e.click = this._openTooltip)),
              this[i](e),
              this._tooltipHandlersAdded = !t
          }
      },
      openTooltip: function(t, i) {
          if (t instanceof Ue || (i = t,
          t = this),
          t instanceof qe)
              for (var e in this._layers) {
                  t = this._layers[e];
                  break
              }
          return i || (i = t.getCenter ? t.getCenter() : t.getLatLng()),
          this._tooltip && this._map && (this._tooltip._source = t,
          this._tooltip.update(),
          this._map.openTooltip(this._tooltip, i),
          this._tooltip.options.interactive && this._tooltip._container && (pt(this._tooltip._container, "leaflet-clickable"),
          this.addInteractiveTarget(this._tooltip._container))),
          this
      },
      closeTooltip: function() {
          return this._tooltip && (this._tooltip._close(),
          this._tooltip.options.interactive && this._tooltip._container && (mt(this._tooltip._container, "leaflet-clickable"),
          this.removeInteractiveTarget(this._tooltip._container))),
          this
      },
      toggleTooltip: function(t) {
          return this._tooltip && (this._tooltip._map ? this.closeTooltip() : this.openTooltip(t)),
          this
      },
      isTooltipOpen: function() {
          return this._tooltip.isOpen()
      },
      setTooltipContent: function(t) {
          return this._tooltip && this._tooltip.setContent(t),
          this
      },
      getTooltip: function() {
          return this._tooltip
      },
      _openTooltip: function(t) {
          var i = t.layer || t.target;
          this._tooltip && this._map && this.openTooltip(i, this._tooltip.options.sticky ? t.latlng : void 0)
      },
      _moveTooltip: function(t) {
          var i, e, n = t.latlng;
          this._tooltip.options.sticky && t.originalEvent && (i = this._map.mouseEventToContainerPoint(t.originalEvent),
          e = this._map.containerPointToLayerPoint(i),
          n = this._map.layerPointToLatLng(e)),
          this._tooltip.setLatLng(n)
      }
  });
  var cn = Ge.extend({
      options: {
          iconSize: [12, 12],
          html: !1,
          bgPos: null,
          className: "leaflet-div-icon"
      },
      createIcon: function(t) {
          var i = t && "DIV" === t.tagName ? t : document.createElement("div")
            , e = this.options;
          if (i.innerHTML = !1 !== e.html ? e.html : "",
          e.bgPos) {
              var n = w(e.bgPos);
              i.style.backgroundPosition = -n.x + "px " + -n.y + "px"
          }
          return this._setIconStyles(i, "icon"),
          i
      },
      createShadow: function() {
          return null
      }
  });
  Ge.Default = Ke;
  var _n = Ue.extend({
      options: {
          tileSize: 256,
          opacity: 1,
          updateWhenIdle: ji,
          updateWhenZooming: !0,
          updateInterval: 200,
          zIndex: 1,
          bounds: null,
          minZoom: 0,
          maxZoom: void 0,
          maxNativeZoom: void 0,
          minNativeZoom: void 0,
          noWrap: !1,
          pane: "tilePane",
          className: "",
          keepBuffer: 2
      },
      initialize: function(t) {
          l(this, t)
      },
      onAdd: function() {
          this._initContainer(),
          this._levels = {},
          this._tiles = {},
          this._resetView(),
          this._update()
      },
      beforeAdd: function(t) {
          t._addZoomLimit(this)
      },
      onRemove: function(t) {
          this._removeAllTiles(),
          ut(this._container),
          t._removeZoomLimit(this),
          this._container = null,
          this._tileZoom = void 0
      },
      bringToFront: function() {
          return this._map && (ct(this._container),
          this._setAutoZIndex(Math.max)),
          this
      },
      bringToBack: function() {
          return this._map && (_t(this._container),
          this._setAutoZIndex(Math.min)),
          this
      },
      getContainer: function() {
          return this._container
      },
      setOpacity: function(t) {
          return this.options.opacity = t,
          this._updateOpacity(),
          this
      },
      setZIndex: function(t) {
          return this.options.zIndex = t,
          this._updateZIndex(),
          this
      },
      isLoading: function() {
          return this._loading
      },
      redraw: function() {
          return this._map && (this._removeAllTiles(),
          this._update()),
          this
      },
      getEvents: function() {
          var t = {
              viewprereset: this._invalidateAll,
              viewreset: this._resetView,
              zoom: this._resetView,
              moveend: this._onMoveEnd
          };
          return this.options.updateWhenIdle || (this._onMove || (this._onMove = o(this._onMoveEnd, this.options.updateInterval, this)),
          t.move = this._onMove),
          this._zoomAnimated && (t.zoomanim = this._animateZoom),
          t
      },
      createTile: function() {
          return document.createElement("div")
      },
      getTileSize: function() {
          var t = this.options.tileSize;
          return t instanceof x ? t : new x(t,t)
      },
      _updateZIndex: function() {
          this._container && void 0 !== this.options.zIndex && null !== this.options.zIndex && (this._container.style.zIndex = this.options.zIndex)
      },
      _setAutoZIndex: function(t) {
          for (var i, e = this.getPane().children, n = -t(-1 / 0, 1 / 0), o = 0, s = e.length; o < s; o++)
              i = e[o].style.zIndex,
              e[o] !== this._container && i && (n = t(n, +i));
          isFinite(n) && (this.options.zIndex = n + t(-1, 1),
          this._updateZIndex())
      },
      _updateOpacity: function() {
          if (this._map && !Li) {
              vt(this._container, this.options.opacity);
              var t = +new Date
                , i = !1
                , e = !1;
              for (var n in this._tiles) {
                  var o = this._tiles[n];
                  if (o.current && o.loaded) {
                      var s = Math.min(1, (t - o.loaded) / 200);
                      vt(o.el, s),
                      s < 1 ? i = !0 : (o.active ? e = !0 : this._onOpaqueTile(o),
                      o.active = !0)
                  }
              }
              e && !this._noPrune && this._pruneTiles(),
              i && (g(this._fadeFrame),
              this._fadeFrame = f(this._updateOpacity, this))
          }
      },
      _onOpaqueTile: r,
      _initContainer: function() {
          this._container || (this._container = ht("div", "leaflet-layer " + (this.options.className || "")),
          this._updateZIndex(),
          this.options.opacity < 1 && this._updateOpacity(),
          this.getPane().appendChild(this._container))
      },
      _updateLevels: function() {
          var t = this._tileZoom
            , i = this.options.maxZoom;
          if (void 0 !== t) {
              for (var e in this._levels)
                  this._levels[e].el.children.length || e === t ? (this._levels[e].el.style.zIndex = i - Math.abs(t - e),
                  this._onUpdateLevel(e)) : (ut(this._levels[e].el),
                  this._removeTilesAtZoom(e),
                  this._onRemoveLevel(e),
                  delete this._levels[e]);
              var n = this._levels[t]
                , o = this._map;
              return n || ((n = this._levels[t] = {}).el = ht("div", "leaflet-tile-container leaflet-zoom-animated", this._container),
              n.el.style.zIndex = i,
              n.origin = o.project(o.unproject(o.getPixelOrigin()), t).round(),
              n.zoom = t,
              this._setZoomTransform(n, o.getCenter(), o.getZoom()),
              n.el.offsetWidth,
              this._onCreateLevel(n)),
              this._level = n,
              n
          }
      },
      _onUpdateLevel: r,
      _onRemoveLevel: r,
      _onCreateLevel: r,
      _pruneTiles: function() {
          if (this._map) {
              var t, i, e = this._map.getZoom();
              if (e > this.options.maxZoom || e < this.options.minZoom)
                  this._removeAllTiles();
              else {
                  for (t in this._tiles)
                      (i = this._tiles[t]).retain = i.current;
                  for (t in this._tiles)
                      if ((i = this._tiles[t]).current && !i.active) {
                          var n = i.coords;
                          this._retainParent(n.x, n.y, n.z, n.z - 5) || this._retainChildren(n.x, n.y, n.z, n.z + 2)
                      }
                  for (t in this._tiles)
                      this._tiles[t].retain || this._removeTile(t)
              }
          }
      },
      _removeTilesAtZoom: function(t) {
          for (var i in this._tiles)
              this._tiles[i].coords.z === t && this._removeTile(i)
      },
      _removeAllTiles: function() {
          for (var t in this._tiles)
              this._removeTile(t)
      },
      _invalidateAll: function() {
          for (var t in this._levels)
              ut(this._levels[t].el),
              this._onRemoveLevel(t),
              delete this._levels[t];
          this._removeAllTiles(),
          this._tileZoom = void 0
      },
      _retainParent: function(t, i, e, n) {
          var o = Math.floor(t / 2)
            , s = Math.floor(i / 2)
            , r = e - 1
            , a = new x(+o,+s);
          a.z = +r;
          var h = this._tileCoordsToKey(a)
            , u = this._tiles[h];
          return u && u.active ? (u.retain = !0,
          !0) : (u && u.loaded && (u.retain = !0),
          r > n && this._retainParent(o, s, r, n))
      },
      _retainChildren: function(t, i, e, n) {
          for (var o = 2 * t; o < 2 * t + 2; o++)
              for (var s = 2 * i; s < 2 * i + 2; s++) {
                  var r = new x(o,s);
                  r.z = e + 1;
                  var a = this._tileCoordsToKey(r)
                    , h = this._tiles[a];
                  h && h.active ? h.retain = !0 : (h && h.loaded && (h.retain = !0),
                  e + 1 < n && this._retainChildren(o, s, e + 1, n))
              }
      },
      _resetView: function(t) {
          var i = t && (t.pinch || t.flyTo);
          this._setView(this._map.getCenter(), this._map.getZoom(), i, i)
      },
      _animateZoom: function(t) {
          this._setView(t.center, t.zoom, !0, t.noUpdate)
      },
      _clampZoom: function(t) {
          var i = this.options;
          return void 0 !== i.minNativeZoom && t < i.minNativeZoom ? i.minNativeZoom : void 0 !== i.maxNativeZoom && i.maxNativeZoom < t ? i.maxNativeZoom : t
      },
      _setView: function(t, i, e, n) {
          var o = this._clampZoom(Math.round(i));
          (void 0 !== this.options.maxZoom && o > this.options.maxZoom || void 0 !== this.options.minZoom && o < this.options.minZoom) && (o = void 0);
          var s = this.options.updateWhenZooming && o !== this._tileZoom;
          n && !s || (this._tileZoom = o,
          this._abortLoading && this._abortLoading(),
          this._updateLevels(),
          this._resetGrid(),
          void 0 !== o && this._update(t),
          e || this._pruneTiles(),
          this._noPrune = !!e),
          this._setZoomTransforms(t, i)
      },
      _setZoomTransforms: function(t, i) {
          for (var e in this._levels)
              this._setZoomTransform(this._levels[e], t, i)
      },
      _setZoomTransform: function(t, i, e) {
          var n = this._map.getZoomScale(e, t.zoom)
            , o = t.origin.multiplyBy(n).subtract(this._map._getNewPixelOrigin(i, e)).round();
          Ni ? wt(t.el, o, n) : Lt(t.el, o)
      },
      _resetGrid: function() {
          var t = this._map
            , i = t.options.crs
            , e = this._tileSize = this.getTileSize()
            , n = this._tileZoom
            , o = this._map.getPixelWorldBounds(this._tileZoom);
          o && (this._globalTileRange = this._pxBoundsToTileRange(o)),
          this._wrapX = i.wrapLng && !this.options.noWrap && [Math.floor(t.project([0, i.wrapLng[0]], n).x / e.x), Math.ceil(t.project([0, i.wrapLng[1]], n).x / e.y)],
          this._wrapY = i.wrapLat && !this.options.noWrap && [Math.floor(t.project([i.wrapLat[0], 0], n).y / e.x), Math.ceil(t.project([i.wrapLat[1], 0], n).y / e.y)]
      },
      _onMoveEnd: function() {
          this._map && !this._map._animatingZoom && this._update()
      },
      _getTiledPixelBounds: function(t) {
          var i = this._map
            , e = i._animatingZoom ? Math.max(i._animateToZoom, i.getZoom()) : i.getZoom()
            , n = i.getZoomScale(e, this._tileZoom)
            , o = i.project(t, this._tileZoom).floor()
            , s = i.getSize().divideBy(2 * n);
          return new P(o.subtract(s),o.add(s))
      },
      _update: function(t) {
          var i = this._map;
          if (i) {
              var e = this._clampZoom(i.getZoom());
              if (void 0 === t && (t = i.getCenter()),
              void 0 !== this._tileZoom) {
                  var n = this._getTiledPixelBounds(t)
                    , o = this._pxBoundsToTileRange(n)
                    , s = o.getCenter()
                    , r = []
                    , a = this.options.keepBuffer
                    , h = new P(o.getBottomLeft().subtract([a, -a]),o.getTopRight().add([a, -a]));
                  if (!(isFinite(o.min.x) && isFinite(o.min.y) && isFinite(o.max.x) && isFinite(o.max.y)))
                      throw new Error("Attempted to load an infinite number of tiles");
                  for (var u in this._tiles) {
                      var l = this._tiles[u].coords;
                      l.z === this._tileZoom && h.contains(new x(l.x,l.y)) || (this._tiles[u].current = !1)
                  }
                  if (Math.abs(e - this._tileZoom) > 1)
                      this._setView(t, e);
                  else {
                      for (var c = o.min.y; c <= o.max.y; c++)
                          for (var _ = o.min.x; _ <= o.max.x; _++) {
                              var d = new x(_,c);
                              if (d.z = this._tileZoom,
                              this._isValidTile(d)) {
                                  var p = this._tiles[this._tileCoordsToKey(d)];
                                  p ? p.current = !0 : r.push(d)
                              }
                          }
                      if (r.sort(function(t, i) {
                          return t.distanceTo(s) - i.distanceTo(s)
                      }),
                      0 !== r.length) {
                          this._loading || (this._loading = !0,
                          this.fire("loading"));
                          var m = document.createDocumentFragment();
                          for (_ = 0; _ < r.length; _++)
                              this._addTile(r[_], m);
                          this._level.el.appendChild(m)
                      }
                  }
              }
          }
      },
      _isValidTile: function(t) {
          var i = this._map.options.crs;
          if (!i.infinite) {
              var e = this._globalTileRange;
              if (!i.wrapLng && (t.x < e.min.x || t.x > e.max.x) || !i.wrapLat && (t.y < e.min.y || t.y > e.max.y))
                  return !1
          }
          if (!this.options.bounds)
              return !0;
          var n = this._tileCoordsToBounds(t);
          return z(this.options.bounds).overlaps(n)
      },
      _keyToBounds: function(t) {
          return this._tileCoordsToBounds(this._keyToTileCoords(t))
      },
      _tileCoordsToNwSe: function(t) {
          var i = this._map
            , e = this.getTileSize()
            , n = t.scaleBy(e)
            , o = n.add(e);
          return [i.unproject(n, t.z), i.unproject(o, t.z)]
      },
      _tileCoordsToBounds: function(t) {
          var i = this._tileCoordsToNwSe(t)
            , e = new T(i[0],i[1]);
          return this.options.noWrap || (e = this._map.wrapLatLngBounds(e)),
          e
      },
      _tileCoordsToKey: function(t) {
          return t.x + ":" + t.y + ":" + t.z
      },
      _keyToTileCoords: function(t) {
          var i = t.split(":")
            , e = new x(+i[0],+i[1]);
          return e.z = +i[2],
          e
      },
      _removeTile: function(t) {
          var i = this._tiles[t];
          i && (Ci || i.el.setAttribute("src", ni),
          ut(i.el),
          delete this._tiles[t],
          this.fire("tileunload", {
              tile: i.el,
              coords: this._keyToTileCoords(t)
          }))
      },
      _initTile: function(t) {
          pt(t, "leaflet-tile");
          var i = this.getTileSize();
          t.style.width = i.x + "px",
          t.style.height = i.y + "px",
          t.onselectstart = r,
          t.onmousemove = r,
          Li && this.options.opacity < 1 && vt(t, this.options.opacity),
          Ti && !zi && (t.style.WebkitBackfaceVisibility = "hidden")
      },
      _addTile: function(t, i) {
          var n = this._getTilePos(t)
            , o = this._tileCoordsToKey(t)
            , s = this.createTile(this._wrapCoords(t), e(this._tileReady, this, t));
          this._initTile(s),
          this.createTile.length < 2 && f(e(this._tileReady, this, t, null, s)),
          Lt(s, n),
          this._tiles[o] = {
              el: s,
              coords: t,
              current: !0
          },
          i.appendChild(s),
          this.fire("tileloadstart", {
              tile: s,
              coords: t
          })
      },
      _tileReady: function(t, i, n) {
          if (this._map) {
              i && this.fire("tileerror", {
                  error: i,
                  tile: n,
                  coords: t
              });
              var o = this._tileCoordsToKey(t);
              (n = this._tiles[o]) && (n.loaded = +new Date,
              this._map._fadeAnimated ? (vt(n.el, 0),
              g(this._fadeFrame),
              this._fadeFrame = f(this._updateOpacity, this)) : (n.active = !0,
              this._pruneTiles()),
              i || (pt(n.el, "leaflet-tile-loaded"),
              this.fire("tileload", {
                  tile: n.el,
                  coords: t
              })),
              this._noTilesToLoad() && (this._loading = !1,
              this.fire("load"),
              Li || !this._map._fadeAnimated ? f(this._pruneTiles, this) : setTimeout(e(this._pruneTiles, this), 250)))
          }
      },
      _getTilePos: function(t) {
          return t.scaleBy(this.getTileSize()).subtract(this._level.origin)
      },
      _wrapCoords: function(t) {
          var i = new x(this._wrapX ? s(t.x, this._wrapX) : t.x,this._wrapY ? s(t.y, this._wrapY) : t.y);
          return i.z = t.z,
          i
      },
      _pxBoundsToTileRange: function(t) {
          var i = this.getTileSize();
          return new P(t.min.unscaleBy(i).floor(),t.max.unscaleBy(i).ceil().subtract([1, 1]))
      },
      _noTilesToLoad: function() {
          for (var t in this._tiles)
              if (!this._tiles[t].loaded)
                  return !1;
          return !0
      }
  })
    , dn = _n.extend({
      options: {
          minZoom: 0,
          maxZoom: 18,
          subdomains: "abc",
          errorTileUrl: "",
          zoomOffset: 0,
          tms: !1,
          zoomReverse: !1,
          detectRetina: !1,
          crossOrigin: !1
      },
      initialize: function(t, i) {
          this._url = t,
          (i = l(this, i)).detectRetina && Ki && i.maxZoom > 0 && (i.tileSize = Math.floor(i.tileSize / 2),
          i.zoomReverse ? (i.zoomOffset--,
          i.minZoom++) : (i.zoomOffset++,
          i.maxZoom--),
          i.minZoom = Math.max(0, i.minZoom)),
          "string" == typeof i.subdomains && (i.subdomains = i.subdomains.split("")),
          Ti || this.on("tileunload", this._onTileRemove)
      },
      setUrl: function(t, i) {
          return this._url = t,
          i || this.redraw(),
          this
      },
      createTile: function(t, i) {
          var n = document.createElement("img");
          return V(n, "load", e(this._tileOnLoad, this, i, n)),
          V(n, "error", e(this._tileOnError, this, i, n)),
          this.options.crossOrigin && (n.crossOrigin = ""),
          n.alt = "",
          n.setAttribute("role", "presentation"),
          n.src = this.getTileUrl(t),
          n
      },
      getTileUrl: function(t) {
          var e = {
              r: Ki ? "@2x" : "",
              s: this._getSubdomain(t),
              x: t.x,
              y: t.y,
              z: this._getZoomForUrl()
          };
          if (this._map && !this._map.options.crs.infinite) {
              var n = this._globalTileRange.max.y - t.y;
              this.options.tms && (e.y = n),
              e["-y"] = n
          }
          return _(this._url, i(e, this.options))
      },
      _tileOnLoad: function(t, i) {
          Li ? setTimeout(e(t, this, null, i), 0) : t(null, i)
      },
      _tileOnError: function(t, i, e) {
          var n = this.options.errorTileUrl;
          n && i.getAttribute("src") !== n && (i.src = n),
          t(e, i)
      },
      _onTileRemove: function(t) {
          t.tile.onload = null
      },
      _getZoomForUrl: function() {
          var t = this._tileZoom
            , i = this.options.maxZoom
            , e = this.options.zoomReverse
            , n = this.options.zoomOffset;
          return e && (t = i - t),
          t + n
      },
      _getSubdomain: function(t) {
          var i = Math.abs(t.x + t.y) % this.options.subdomains.length;
          return this.options.subdomains[i]
      },
      _abortLoading: function() {
          var t, i;
          for (t in this._tiles)
              this._tiles[t].coords.z !== this._tileZoom && ((i = this._tiles[t].el).onload = r,
              i.onerror = r,
              i.complete || (i.src = ni,
              ut(i),
              delete this._tiles[t]))
      }
  })
    , pn = dn.extend({
      defaultWmsParams: {
          service: "WMS",
          request: "GetMap",
          layers: "",
          styles: "",
          format: "image/jpeg",
          transparent: !1,
          version: "1.1.1"
      },
      options: {
          crs: null,
          uppercase: !1
      },
      initialize: function(t, e) {
          this._url = t;
          var n = i({}, this.defaultWmsParams);
          for (var o in e)
              o in this.options || (n[o] = e[o]);
          var s = (e = l(this, e)).detectRetina && Ki ? 2 : 1
            , r = this.getTileSize();
          n.width = r.x * s,
          n.height = r.y * s,
          this.wmsParams = n
      },
      onAdd: function(t) {
          this._crs = this.options.crs || t.options.crs,
          this._wmsVersion = parseFloat(this.wmsParams.version);
          var i = this._wmsVersion >= 1.3 ? "crs" : "srs";
          this.wmsParams[i] = this._crs.code,
          dn.prototype.onAdd.call(this, t)
      },
      getTileUrl: function(t) {
          var i = this._tileCoordsToNwSe(t)
            , e = this._crs
            , n = b(e.project(i[0]), e.project(i[1]))
            , o = n.min
            , s = n.max
            , r = (this._wmsVersion >= 1.3 && this._crs === He ? [o.y, o.x, s.y, s.x] : [o.x, o.y, s.x, s.y]).join(",")
            , a = L.TileLayer.prototype.getTileUrl.call(this, t);
          return a + c(this.wmsParams, a, this.options.uppercase) + (this.options.uppercase ? "&BBOX=" : "&bbox=") + r
      },
      setParams: function(t, e) {
          return i(this.wmsParams, t),
          e || this.redraw(),
          this
      }
  });
  dn.WMS = pn,
  Yt.wms = function(t, i) {
      return new pn(t,i)
  }
  ;
  var mn = Ue.extend({
      options: {
          padding: .1,
          tolerance: 0
      },
      initialize: function(t) {
          l(this, t),
          n(this),
          this._layers = this._layers || {}
      },
      onAdd: function() {
          this._container || (this._initContainer(),
          this._zoomAnimated && pt(this._container, "leaflet-zoom-animated")),
          this.getPane().appendChild(this._container),
          this._update(),
          this.on("update", this._updatePaths, this)
      },
      onRemove: function() {
          this.off("update", this._updatePaths, this),
          this._destroyContainer()
      },
      getEvents: function() {
          var t = {
              viewreset: this._reset,
              zoom: this._onZoom,
              moveend: this._update,
              zoomend: this._onZoomEnd
          };
          return this._zoomAnimated && (t.zoomanim = this._onAnimZoom),
          t
      },
      _onAnimZoom: function(t) {
          this._updateTransform(t.center, t.zoom)
      },
      _onZoom: function() {
          this._updateTransform(this._map.getCenter(), this._map.getZoom())
      },
      _updateTransform: function(t, i) {
          var e = this._map.getZoomScale(i, this._zoom)
            , n = Pt(this._container)
            , o = this._map.getSize().multiplyBy(.5 + this.options.padding)
            , s = this._map.project(this._center, i)
            , r = this._map.project(t, i).subtract(s)
            , a = o.multiplyBy(-e).add(n).add(o).subtract(r);
          Ni ? wt(this._container, a, e) : Lt(this._container, a)
      },
      _reset: function() {
          this._update(),
          this._updateTransform(this._center, this._zoom);
          for (var t in this._layers)
              this._layers[t]._reset()
      },
      _onZoomEnd: function() {
          for (var t in this._layers)
              this._layers[t]._project()
      },
      _updatePaths: function() {
          for (var t in this._layers)
              this._layers[t]._update()
      },
      _update: function() {
          var t = this.options.padding
            , i = this._map.getSize()
            , e = this._map.containerPointToLayerPoint(i.multiplyBy(-t)).round();
          this._bounds = new P(e,e.add(i.multiplyBy(1 + 2 * t)).round()),
          this._center = this._map.getCenter(),
          this._zoom = this._map.getZoom()
      }
  })
    , fn = mn.extend({
      getEvents: function() {
          var t = mn.prototype.getEvents.call(this);
          return t.viewprereset = this._onViewPreReset,
          t
      },
      _onViewPreReset: function() {
          this._postponeUpdatePaths = !0
      },
      onAdd: function() {
          mn.prototype.onAdd.call(this),
          this._draw()
      },
      _initContainer: function() {
          var t = this._container = document.createElement("canvas");
          V(t, "mousemove", o(this._onMouseMove, 32, this), this),
          V(t, "click dblclick mousedown mouseup contextmenu", this._onClick, this),
          V(t, "mouseout", this._handleMouseOut, this),
          this._ctx = t.getContext("2d")
      },
      _destroyContainer: function() {
          delete this._ctx,
          ut(this._container),
          q(this._container),
          delete this._container
      },
      _updatePaths: function() {
          if (!this._postponeUpdatePaths) {
              this._redrawBounds = null;
              for (var t in this._layers)
                  this._layers[t]._update();
              this._redraw()
          }
      },
      _update: function() {
          if (!this._map._animatingZoom || !this._bounds) {
              this._drawnLayers = {},
              mn.prototype._update.call(this);
              var t = this._bounds
                , i = this._container
                , e = t.getSize()
                , n = Ki ? 2 : 1;
              Lt(i, t.min),
              i.width = n * e.x,
              i.height = n * e.y,
              i.style.width = e.x + "px",
              i.style.height = e.y + "px",
              Ki && this._ctx.scale(2, 2),
              this._ctx.translate(-t.min.x, -t.min.y),
              this.fire("update")
          }
      },
      _reset: function() {
          mn.prototype._reset.call(this),
          this._postponeUpdatePaths && (this._postponeUpdatePaths = !1,
          this._updatePaths())
      },
      _initPath: function(t) {
          this._updateDashArray(t),
          this._layers[n(t)] = t;
          var i = t._order = {
              layer: t,
              prev: this._drawLast,
              next: null
          };
          this._drawLast && (this._drawLast.next = i),
          this._drawLast = i,
          this._drawFirst = this._drawFirst || this._drawLast
      },
      _addPath: function(t) {
          this._requestRedraw(t)
      },
      _removePath: function(t) {
          var i = t._order
            , e = i.next
            , n = i.prev;
          e ? e.prev = n : this._drawLast = n,
          n ? n.next = e : this._drawFirst = e,
          delete t._order,
          delete this._layers[L.stamp(t)],
          this._requestRedraw(t)
      },
      _updatePath: function(t) {
          this._extendRedrawBounds(t),
          t._project(),
          t._update(),
          this._requestRedraw(t)
      },
      _updateStyle: function(t) {
          this._updateDashArray(t),
          this._requestRedraw(t)
      },
      _updateDashArray: function(t) {
          if (t.options.dashArray) {
              var i, e = t.options.dashArray.split(","), n = [];
              for (i = 0; i < e.length; i++)
                  n.push(Number(e[i]));
              t.options._dashArray = n
          }
      },
      _requestRedraw: function(t) {
          this._map && (this._extendRedrawBounds(t),
          this._redrawRequest = this._redrawRequest || f(this._redraw, this))
      },
      _extendRedrawBounds: function(t) {
          if (t._pxBounds) {
              var i = (t.options.weight || 0) + 1;
              this._redrawBounds = this._redrawBounds || new P,
              this._redrawBounds.extend(t._pxBounds.min.subtract([i, i])),
              this._redrawBounds.extend(t._pxBounds.max.add([i, i]))
          }
      },
      _redraw: function() {
          this._redrawRequest = null,
          this._redrawBounds && (this._redrawBounds.min._floor(),
          this._redrawBounds.max._ceil()),
          this._clear(),
          this._draw(),
          this._redrawBounds = null
      },
      _clear: function() {
          var t = this._redrawBounds;
          if (t) {
              var i = t.getSize();
              this._ctx.clearRect(t.min.x, t.min.y, i.x, i.y)
          } else
              this._ctx.clearRect(0, 0, this._container.width, this._container.height)
      },
      _draw: function() {
          var t, i = this._redrawBounds;
          if (this._ctx.save(),
          i) {
              var e = i.getSize();
              this._ctx.beginPath(),
              this._ctx.rect(i.min.x, i.min.y, e.x, e.y),
              this._ctx.clip()
          }
          this._drawing = !0;
          for (var n = this._drawFirst; n; n = n.next)
              t = n.layer,
              (!i || t._pxBounds && t._pxBounds.intersects(i)) && t._updatePath();
          this._drawing = !1,
          this._ctx.restore()
      },
      _updatePoly: function(t, i) {
          if (this._drawing) {
              var e, n, o, s, r = t._parts, a = r.length, h = this._ctx;
              if (a) {
                  for (this._drawnLayers[t._leaflet_id] = t,
                  h.beginPath(),
                  e = 0; e < a; e++) {
                      for (n = 0,
                      o = r[e].length; n < o; n++)
                          s = r[e][n],
                          h[n ? "lineTo" : "moveTo"](s.x, s.y);
                      i && h.closePath()
                  }
                  this._fillStroke(h, t)
              }
          }
      },
      _updateCircle: function(t) {
          if (this._drawing && !t._empty()) {
              var i = t._point
                , e = this._ctx
                , n = Math.max(Math.round(t._radius), 1)
                , o = (Math.max(Math.round(t._radiusY), 1) || n) / n;
              this._drawnLayers[t._leaflet_id] = t,
              1 !== o && (e.save(),
              e.scale(1, o)),
              e.beginPath(),
              e.arc(i.x, i.y / o, n, 0, 2 * Math.PI, !1),
              1 !== o && e.restore(),
              this._fillStroke(e, t)
          }
      },
      _fillStroke: function(t, i) {
          var e = i.options;
          e.fill && (t.globalAlpha = e.fillOpacity,
          t.fillStyle = e.fillColor || e.color,
          t.fill(e.fillRule || "evenodd")),
          e.stroke && 0 !== e.weight && (t.setLineDash && t.setLineDash(i.options && i.options._dashArray || []),
          t.globalAlpha = e.opacity,
          t.lineWidth = e.weight,
          t.strokeStyle = e.color,
          t.lineCap = e.lineCap,
          t.lineJoin = e.lineJoin,
          t.stroke())
      },
      _onClick: function(t) {
          for (var i, e, n = this._map.mouseEventToLayerPoint(t), o = this._drawFirst; o; o = o.next)
              (i = o.layer).options.interactive && i._containsPoint(n) && !this._map._draggableMoved(i) && (e = i);
          e && (et(t),
          this._fireEvent([e], t))
      },
      _onMouseMove: function(t) {
          if (this._map && !this._map.dragging.moving() && !this._map._animatingZoom) {
              var i = this._map.mouseEventToLayerPoint(t);
              this._handleMouseHover(t, i)
          }
      },
      _handleMouseOut: function(t) {
          var i = this._hoveredLayer;
          i && (mt(this._container, "leaflet-interactive"),
          this._fireEvent([i], t, "mouseout"),
          this._hoveredLayer = null)
      },
      _handleMouseHover: function(t, i) {
          for (var e, n, o = this._drawFirst; o; o = o.next)
              (e = o.layer).options.interactive && e._containsPoint(i) && (n = e);
          n !== this._hoveredLayer && (this._handleMouseOut(t),
          n && (pt(this._container, "leaflet-interactive"),
          this._fireEvent([n], t, "mouseover"),
          this._hoveredLayer = n)),
          this._hoveredLayer && this._fireEvent([this._hoveredLayer], t)
      },
      _fireEvent: function(t, i, e) {
          this._map._fireDOMEvent(i, e || i.type, t)
      },
      _bringToFront: function(t) {
          var i = t._order
            , e = i.next
            , n = i.prev;
          e && (e.prev = n,
          n ? n.next = e : e && (this._drawFirst = e),
          i.prev = this._drawLast,
          this._drawLast.next = i,
          i.next = null,
          this._drawLast = i,
          this._requestRedraw(t))
      },
      _bringToBack: function(t) {
          var i = t._order
            , e = i.next
            , n = i.prev;
          n && (n.next = e,
          e ? e.prev = n : n && (this._drawLast = n),
          i.prev = null,
          i.next = this._drawFirst,
          this._drawFirst.prev = i,
          this._drawFirst = i,
          this._requestRedraw(t))
      }
  })
    , gn = function() {
      try {
          return document.namespaces.add("lvml", "urn:schemas-microsoft-com:vml"),
          function(t) {
              return document.createElement("<lvml:" + t + ' class="lvml">')
          }
      } catch (t) {
          return function(t) {
              return document.createElement("<" + t + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">')
          }
      }
  }()
    , vn = {
      _initContainer: function() {
          this._container = ht("div", "leaflet-vml-container")
      },
      _update: function() {
          this._map._animatingZoom || (mn.prototype._update.call(this),
          this.fire("update"))
      },
      _initPath: function(t) {
          var i = t._container = gn("shape");
          pt(i, "leaflet-vml-shape " + (this.options.className || "")),
          i.coordsize = "1 1",
          t._path = gn("path"),
          i.appendChild(t._path),
          this._updateStyle(t),
          this._layers[n(t)] = t
      },
      _addPath: function(t) {
          var i = t._container;
          this._container.appendChild(i),
          t.options.interactive && t.addInteractiveTarget(i)
      },
      _removePath: function(t) {
          var i = t._container;
          ut(i),
          t.removeInteractiveTarget(i),
          delete this._layers[n(t)]
      },
      _updateStyle: function(t) {
          var i = t._stroke
            , e = t._fill
            , n = t.options
            , o = t._container;
          o.stroked = !!n.stroke,
          o.filled = !!n.fill,
          n.stroke ? (i || (i = t._stroke = gn("stroke")),
          o.appendChild(i),
          i.weight = n.weight + "px",
          i.color = n.color,
          i.opacity = n.opacity,
          n.dashArray ? i.dashStyle = ei(n.dashArray) ? n.dashArray.join(" ") : n.dashArray.replace(/( *, *)/g, " ") : i.dashStyle = "",
          i.endcap = n.lineCap.replace("butt", "flat"),
          i.joinstyle = n.lineJoin) : i && (o.removeChild(i),
          t._stroke = null),
          n.fill ? (e || (e = t._fill = gn("fill")),
          o.appendChild(e),
          e.color = n.fillColor || n.color,
          e.opacity = n.fillOpacity) : e && (o.removeChild(e),
          t._fill = null)
      },
      _updateCircle: function(t) {
          var i = t._point.round()
            , e = Math.round(t._radius)
            , n = Math.round(t._radiusY || e);
          this._setPath(t, t._empty() ? "M0 0" : "AL " + i.x + "," + i.y + " " + e + "," + n + " 0,23592600")
      },
      _setPath: function(t, i) {
          t._path.v = i
      },
      _bringToFront: function(t) {
          ct(t._container)
      },
      _bringToBack: function(t) {
          _t(t._container)
      }
  }
    , yn = Ji ? gn : E
    , xn = mn.extend({
      getEvents: function() {
          var t = mn.prototype.getEvents.call(this);
          return t.zoomstart = this._onZoomStart,
          t
      },
      _initContainer: function() {
          this._container = yn("svg"),
          this._container.setAttribute("pointer-events", "none"),
          this._rootGroup = yn("g"),
          this._container.appendChild(this._rootGroup)
      },
      _destroyContainer: function() {
          ut(this._container),
          q(this._container),
          delete this._container,
          delete this._rootGroup,
          delete this._svgSize
      },
      _onZoomStart: function() {
          this._update()
      },
      _update: function() {
          if (!this._map._animatingZoom || !this._bounds) {
              mn.prototype._update.call(this);
              var t = this._bounds
                , i = t.getSize()
                , e = this._container;
              this._svgSize && this._svgSize.equals(i) || (this._svgSize = i,
              e.setAttribute("width", i.x),
              e.setAttribute("height", i.y)),
              Lt(e, t.min),
              e.setAttribute("viewBox", [t.min.x, t.min.y, i.x, i.y].join(" ")),
              this.fire("update")
          }
      },
      _initPath: function(t) {
          var i = t._path = yn("path");
          t.options.className && pt(i, t.options.className),
          t.options.interactive && pt(i, "leaflet-interactive"),
          this._updateStyle(t),
          this._layers[n(t)] = t
      },
      _addPath: function(t) {
          this._rootGroup || this._initContainer(),
          this._rootGroup.appendChild(t._path),
          t.addInteractiveTarget(t._path)
      },
      _removePath: function(t) {
          ut(t._path),
          t.removeInteractiveTarget(t._path),
          delete this._layers[n(t)]
      },
      _updatePath: function(t) {
          t._project(),
          t._update()
      },
      _updateStyle: function(t) {
          var i = t._path
            , e = t.options;
          i && (e.stroke ? (i.setAttribute("stroke", e.color),
          i.setAttribute("stroke-opacity", e.opacity),
          i.setAttribute("stroke-width", e.weight),
          i.setAttribute("stroke-linecap", e.lineCap),
          i.setAttribute("stroke-linejoin", e.lineJoin),
          e.dashArray ? i.setAttribute("stroke-dasharray", e.dashArray) : i.removeAttribute("stroke-dasharray"),
          e.dashOffset ? i.setAttribute("stroke-dashoffset", e.dashOffset) : i.removeAttribute("stroke-dashoffset")) : i.setAttribute("stroke", "none"),
          e.fill ? (i.setAttribute("fill", e.fillColor || e.color),
          i.setAttribute("fill-opacity", e.fillOpacity),
          i.setAttribute("fill-rule", e.fillRule || "evenodd")) : i.setAttribute("fill", "none"))
      },
      _updatePoly: function(t, i) {
          this._setPath(t, k(t._parts, i))
      },
      _updateCircle: function(t) {
          var i = t._point
            , e = Math.max(Math.round(t._radius), 1)
            , n = "a" + e + "," + (Math.max(Math.round(t._radiusY), 1) || e) + " 0 1,0 "
            , o = t._empty() ? "M0 0" : "M" + (i.x - e) + "," + i.y + n + 2 * e + ",0 " + n + 2 * -e + ",0 ";
          this._setPath(t, o)
      },
      _setPath: function(t, i) {
          t._path.setAttribute("d", i)
      },
      _bringToFront: function(t) {
          ct(t._path)
      },
      _bringToBack: function(t) {
          _t(t._path)
      }
  });
  Ji && xn.include(vn),
  Le.include({
      getRenderer: function(t) {
          var i = t.options.renderer || this._getPaneRenderer(t.options.pane) || this.options.renderer || this._renderer;
          return i || (i = this._renderer = this.options.preferCanvas && Xt() || Jt()),
          this.hasLayer(i) || this.addLayer(i),
          i
      },
      _getPaneRenderer: function(t) {
          if ("overlayPane" === t || void 0 === t)
              return !1;
          var i = this._paneRenderers[t];
          return void 0 === i && (i = xn && Jt({
              pane: t
          }) || fn && Xt({
              pane: t
          }),
          this._paneRenderers[t] = i),
          i
      }
  });
  var wn = en.extend({
      initialize: function(t, i) {
          en.prototype.initialize.call(this, this._boundsToLatLngs(t), i)
      },
      setBounds: function(t) {
          return this.setLatLngs(this._boundsToLatLngs(t))
      },
      _boundsToLatLngs: function(t) {
          return t = z(t),
          [t.getSouthWest(), t.getNorthWest(), t.getNorthEast(), t.getSouthEast()]
      }
  });
  xn.create = yn,
  xn.pointsToPath = k,
  nn.geometryToLayer = Wt,
  nn.coordsToLatLng = Ht,
  nn.coordsToLatLngs = Ft,
  nn.latLngToCoords = Ut,
  nn.latLngsToCoords = Vt,
  nn.getFeature = qt,
  nn.asFeature = Gt,
  Le.mergeOptions({
      boxZoom: !0
  });
  var Ln = Ze.extend({
      initialize: function(t) {
          this._map = t,
          this._container = t._container,
          this._pane = t._panes.overlayPane,
          this._resetStateTimeout = 0,
          t.on("unload", this._destroy, this)
      },
      addHooks: function() {
          V(this._container, "mousedown", this._onMouseDown, this)
      },
      removeHooks: function() {
          q(this._container, "mousedown", this._onMouseDown, this)
      },
      moved: function() {
          return this._moved
      },
      _destroy: function() {
          ut(this._pane),
          delete this._pane
      },
      _resetState: function() {
          this._resetStateTimeout = 0,
          this._moved = !1
      },
      _clearDeferredResetState: function() {
          0 !== this._resetStateTimeout && (clearTimeout(this._resetStateTimeout),
          this._resetStateTimeout = 0)
      },
      _onMouseDown: function(t) {
          if (!t.shiftKey || 1 !== t.which && 1 !== t.button)
              return !1;
          this._clearDeferredResetState(),
          this._resetState(),
          mi(),
          bt(),
          this._startPoint = this._map.mouseEventToContainerPoint(t),
          V(document, {
              contextmenu: Q,
              mousemove: this._onMouseMove,
              mouseup: this._onMouseUp,
              keydown: this._onKeyDown
          }, this)
      },
      _onMouseMove: function(t) {
          this._moved || (this._moved = !0,
          this._box = ht("div", "leaflet-zoom-box", this._container),
          pt(this._container, "leaflet-crosshair"),
          this._map.fire("boxzoomstart")),
          this._point = this._map.mouseEventToContainerPoint(t);
          var i = new P(this._point,this._startPoint)
            , e = i.getSize();
          Lt(this._box, i.min),
          this._box.style.width = e.x + "px",
          this._box.style.height = e.y + "px"
      },
      _finish: function() {
          this._moved && (ut(this._box),
          mt(this._container, "leaflet-crosshair")),
          fi(),
          Tt(),
          q(document, {
              contextmenu: Q,
              mousemove: this._onMouseMove,
              mouseup: this._onMouseUp,
              keydown: this._onKeyDown
          }, this)
      },
      _onMouseUp: function(t) {
          if ((1 === t.which || 1 === t.button) && (this._finish(),
          this._moved)) {
              this._clearDeferredResetState(),
              this._resetStateTimeout = setTimeout(e(this._resetState, this), 0);
              var i = new T(this._map.containerPointToLatLng(this._startPoint),this._map.containerPointToLatLng(this._point));
              this._map.fitBounds(i).fire("boxzoomend", {
                  boxZoomBounds: i
              })
          }
      },
      _onKeyDown: function(t) {
          27 === t.keyCode && this._finish()
      }
  });
  Le.addInitHook("addHandler", "boxZoom", Ln),
  Le.mergeOptions({
      doubleClickZoom: !0
  });
  var Pn = Ze.extend({
      addHooks: function() {
          this._map.on("dblclick", this._onDoubleClick, this)
      },
      removeHooks: function() {
          this._map.off("dblclick", this._onDoubleClick, this)
      },
      _onDoubleClick: function(t) {
          var i = this._map
            , e = i.getZoom()
            , n = i.options.zoomDelta
            , o = t.originalEvent.shiftKey ? e - n : e + n;
          "center" === i.options.doubleClickZoom ? i.setZoom(o) : i.setZoomAround(t.containerPoint, o)
      }
  });
  Le.addInitHook("addHandler", "doubleClickZoom", Pn),
  Le.mergeOptions({
      dragging: !0,
      inertia: !zi,
      inertiaDeceleration: 3400,
      inertiaMaxSpeed: 1 / 0,
      easeLinearity: .2,
      worldCopyJump: !1,
      maxBoundsViscosity: 0
  });
  var bn = Ze.extend({
      addHooks: function() {
          if (!this._draggable) {
              var t = this._map;
              this._draggable = new Be(t._mapPane,t._container),
              this._draggable.on({
                  dragstart: this._onDragStart,
                  drag: this._onDrag,
                  dragend: this._onDragEnd
              }, this),
              this._draggable.on("predrag", this._onPreDragLimit, this),
              t.options.worldCopyJump && (this._draggable.on("predrag", this._onPreDragWrap, this),
              t.on("zoomend", this._onZoomEnd, this),
              t.whenReady(this._onZoomEnd, this))
          }
          pt(this._map._container, "leaflet-grab leaflet-touch-drag"),
          this._draggable.enable(),
          this._positions = [],
          this._times = []
      },
      removeHooks: function() {
          mt(this._map._container, "leaflet-grab"),
          mt(this._map._container, "leaflet-touch-drag"),
          this._draggable.disable()
      },
      moved: function() {
          return this._draggable && this._draggable._moved
      },
      moving: function() {
          return this._draggable && this._draggable._moving
      },
      _onDragStart: function() {
          var t = this._map;
          if (t._stop(),
          this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
              var i = z(this._map.options.maxBounds);
              this._offsetLimit = b(this._map.latLngToContainerPoint(i.getNorthWest()).multiplyBy(-1), this._map.latLngToContainerPoint(i.getSouthEast()).multiplyBy(-1).add(this._map.getSize())),
              this._viscosity = Math.min(1, Math.max(0, this._map.options.maxBoundsViscosity))
          } else
              this._offsetLimit = null;
          t.fire("movestart").fire("dragstart"),
          t.options.inertia && (this._positions = [],
          this._times = [])
      },
      _onDrag: function(t) {
          if (this._map.options.inertia) {
              var i = this._lastTime = +new Date
                , e = this._lastPos = this._draggable._absPos || this._draggable._newPos;
              this._positions.push(e),
              this._times.push(i),
              this._prunePositions(i)
          }
          this._map.fire("move", t).fire("drag", t)
      },
      _prunePositions: function(t) {
          for (; this._positions.length > 1 && t - this._times[0] > 50; )
              this._positions.shift(),
              this._times.shift()
      },
      _onZoomEnd: function() {
          var t = this._map.getSize().divideBy(2)
            , i = this._map.latLngToLayerPoint([0, 0]);
          this._initialWorldOffset = i.subtract(t).x,
          this._worldWidth = this._map.getPixelWorldBounds().getSize().x
      },
      _viscousLimit: function(t, i) {
          return t - (t - i) * this._viscosity
      },
      _onPreDragLimit: function() {
          if (this._viscosity && this._offsetLimit) {
              var t = this._draggable._newPos.subtract(this._draggable._startPos)
                , i = this._offsetLimit;
              t.x < i.min.x && (t.x = this._viscousLimit(t.x, i.min.x)),
              t.y < i.min.y && (t.y = this._viscousLimit(t.y, i.min.y)),
              t.x > i.max.x && (t.x = this._viscousLimit(t.x, i.max.x)),
              t.y > i.max.y && (t.y = this._viscousLimit(t.y, i.max.y)),
              this._draggable._newPos = this._draggable._startPos.add(t)
          }
      },
      _onPreDragWrap: function() {
          var t = this._worldWidth
            , i = Math.round(t / 2)
            , e = this._initialWorldOffset
            , n = this._draggable._newPos.x
            , o = (n - i + e) % t + i - e
            , s = (n + i + e) % t - i - e
            , r = Math.abs(o + e) < Math.abs(s + e) ? o : s;
          this._draggable._absPos = this._draggable._newPos.clone(),
          this._draggable._newPos.x = r
      },
      _onDragEnd: function(t) {
          var i = this._map
            , e = i.options
            , n = !e.inertia || this._times.length < 2;
          if (i.fire("dragend", t),
          n)
              i.fire("moveend");
          else {
              this._prunePositions(+new Date);
              var o = this._lastPos.subtract(this._positions[0])
                , s = (this._lastTime - this._times[0]) / 1e3
                , r = e.easeLinearity
                , a = o.multiplyBy(r / s)
                , h = a.distanceTo([0, 0])
                , u = Math.min(e.inertiaMaxSpeed, h)
                , l = a.multiplyBy(u / h)
                , c = u / (e.inertiaDeceleration * r)
                , _ = l.multiplyBy(-c / 2).round();
              _.x || _.y ? (_ = i._limitOffset(_, i.options.maxBounds),
              f(function() {
                  i.panBy(_, {
                      duration: c,
                      easeLinearity: r,
                      noMoveStart: !0,
                      animate: !0
                  })
              })) : i.fire("moveend")
          }
      }
  });
  Le.addInitHook("addHandler", "dragging", bn),
  Le.mergeOptions({
      keyboard: !0,
      keyboardPanDelta: 80
  });
  var Tn = Ze.extend({
      keyCodes: {
          left: [37],
          right: [39],
          down: [40],
          up: [38],
          zoomIn: [187, 107, 61, 171],
          zoomOut: [189, 109, 54, 173]
      },
      initialize: function(t) {
          this._map = t,
          this._setPanDelta(t.options.keyboardPanDelta),
          this._setZoomDelta(t.options.zoomDelta)
      },
      addHooks: function() {
          var t = this._map._container;
          t.tabIndex <= 0 && (t.tabIndex = "0"),
          V(t, {
              focus: this._onFocus,
              blur: this._onBlur,
              mousedown: this._onMouseDown
          }, this),
          this._map.on({
              focus: this._addHooks,
              blur: this._removeHooks
          }, this)
      },
      removeHooks: function() {
          this._removeHooks(),
          q(this._map._container, {
              focus: this._onFocus,
              blur: this._onBlur,
              mousedown: this._onMouseDown
          }, this),
          this._map.off({
              focus: this._addHooks,
              blur: this._removeHooks
          }, this)
      },
      _onMouseDown: function() {
          if (!this._focused) {
              var t = document.body
                , i = document.documentElement
                , e = t.scrollTop || i.scrollTop
                , n = t.scrollLeft || i.scrollLeft;
              this._map._container.focus(),
              window.scrollTo(n, e)
          }
      },
      _onFocus: function() {
          this._focused = !0,
          this._map.fire("focus")
      },
      _onBlur: function() {
          this._focused = !1,
          this._map.fire("blur")
      },
      _setPanDelta: function(t) {
          var i, e, n = this._panKeys = {}, o = this.keyCodes;
          for (i = 0,
          e = o.left.length; i < e; i++)
              n[o.left[i]] = [-1 * t, 0];
          for (i = 0,
          e = o.right.length; i < e; i++)
              n[o.right[i]] = [t, 0];
          for (i = 0,
          e = o.down.length; i < e; i++)
              n[o.down[i]] = [0, t];
          for (i = 0,
          e = o.up.length; i < e; i++)
              n[o.up[i]] = [0, -1 * t]
      },
      _setZoomDelta: function(t) {
          var i, e, n = this._zoomKeys = {}, o = this.keyCodes;
          for (i = 0,
          e = o.zoomIn.length; i < e; i++)
              n[o.zoomIn[i]] = t;
          for (i = 0,
          e = o.zoomOut.length; i < e; i++)
              n[o.zoomOut[i]] = -t
      },
      _addHooks: function() {
          V(document, "keydown", this._onKeyDown, this)
      },
      _removeHooks: function() {
          q(document, "keydown", this._onKeyDown, this)
      },
      _onKeyDown: function(t) {
          if (!(t.altKey || t.ctrlKey || t.metaKey)) {
              var i, e = t.keyCode, n = this._map;
              if (e in this._panKeys) {
                  if (n._panAnim && n._panAnim._inProgress)
                      return;
                  i = this._panKeys[e],
                  t.shiftKey && (i = w(i).multiplyBy(3)),
                  n.panBy(i),
                  n.options.maxBounds && n.panInsideBounds(n.options.maxBounds)
              } else if (e in this._zoomKeys)
                  n.setZoom(n.getZoom() + (t.shiftKey ? 3 : 1) * this._zoomKeys[e]);
              else {
                  if (27 !== e || !n._popup || !n._popup.options.closeOnEscapeKey)
                      return;
                  n.closePopup()
              }
              Q(t)
          }
      }
  });
  Le.addInitHook("addHandler", "keyboard", Tn),
  Le.mergeOptions({
      scrollWheelZoom: !0,
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 60
  });
  var zn = Ze.extend({
      addHooks: function() {
          V(this._map._container, "mousewheel", this._onWheelScroll, this),
          this._delta = 0
      },
      removeHooks: function() {
          q(this._map._container, "mousewheel", this._onWheelScroll, this)
      },
      _onWheelScroll: function(t) {
          var i = it(t)
            , n = this._map.options.wheelDebounceTime;
          this._delta += i,
          this._lastMousePos = this._map.mouseEventToContainerPoint(t),
          this._startTime || (this._startTime = +new Date);
          var o = Math.max(n - (+new Date - this._startTime), 0);
          clearTimeout(this._timer),
          this._timer = setTimeout(e(this._performZoom, this), o),
          Q(t)
      },
      _performZoom: function() {
          var t = this._map
            , i = t.getZoom()
            , e = this._map.options.zoomSnap || 0;
          t._stop();
          var n = this._delta / (4 * this._map.options.wheelPxPerZoomLevel)
            , o = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(n)))) / Math.LN2
            , s = e ? Math.ceil(o / e) * e : o
            , r = t._limitZoom(i + (this._delta > 0 ? s : -s)) - i;
          this._delta = 0,
          this._startTime = null,
          r && ("center" === t.options.scrollWheelZoom ? t.setZoom(i + r) : t.setZoomAround(this._lastMousePos, i + r))
      }
  });
  Le.addInitHook("addHandler", "scrollWheelZoom", zn),
  Le.mergeOptions({
      tap: !0,
      tapTolerance: 15
  });
  var Mn = Ze.extend({
      addHooks: function() {
          V(this._map._container, "touchstart", this._onDown, this)
      },
      removeHooks: function() {
          q(this._map._container, "touchstart", this._onDown, this)
      },
      _onDown: function(t) {
          if (t.touches) {
              if ($(t),
              this._fireClick = !0,
              t.touches.length > 1)
                  return this._fireClick = !1,
                  void clearTimeout(this._holdTimeout);
              var i = t.touches[0]
                , n = i.target;
              this._startPos = this._newPos = new x(i.clientX,i.clientY),
              n.tagName && "a" === n.tagName.toLowerCase() && pt(n, "leaflet-active"),
              this._holdTimeout = setTimeout(e(function() {
                  this._isTapValid() && (this._fireClick = !1,
                  this._onUp(),
                  this._simulateEvent("contextmenu", i))
              }, this), 1e3),
              this._simulateEvent("mousedown", i),
              V(document, {
                  touchmove: this._onMove,
                  touchend: this._onUp
              }, this)
          }
      },
      _onUp: function(t) {
          if (clearTimeout(this._holdTimeout),
          q(document, {
              touchmove: this._onMove,
              touchend: this._onUp
          }, this),
          this._fireClick && t && t.changedTouches) {
              var i = t.changedTouches[0]
                , e = i.target;
              e && e.tagName && "a" === e.tagName.toLowerCase() && mt(e, "leaflet-active"),
              this._simulateEvent("mouseup", i),
              this._isTapValid() && this._simulateEvent("click", i)
          }
      },
      _isTapValid: function() {
          return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance
      },
      _onMove: function(t) {
          var i = t.touches[0];
          this._newPos = new x(i.clientX,i.clientY),
          this._simulateEvent("mousemove", i)
      },
      _simulateEvent: function(t, i) {
          var e = document.createEvent("MouseEvents");
          e._simulated = !0,
          i.target._simulatedClick = !0,
          e.initMouseEvent(t, !0, !0, window, 1, i.screenX, i.screenY, i.clientX, i.clientY, !1, !1, !1, !1, 0, null),
          i.target.dispatchEvent(e)
      }
  });
  Vi && !Ui && Le.addInitHook("addHandler", "tap", Mn),
  Le.mergeOptions({
      touchZoom: Vi && !zi,
      bounceAtZoomLimits: !0
  });
  var Cn = Ze.extend({
      addHooks: function() {
          pt(this._map._container, "leaflet-touch-zoom"),
          V(this._map._container, "touchstart", this._onTouchStart, this)
      },
      removeHooks: function() {
          mt(this._map._container, "leaflet-touch-zoom"),
          q(this._map._container, "touchstart", this._onTouchStart, this)
      },
      _onTouchStart: function(t) {
          var i = this._map;
          if (t.touches && 2 === t.touches.length && !i._animatingZoom && !this._zooming) {
              var e = i.mouseEventToContainerPoint(t.touches[0])
                , n = i.mouseEventToContainerPoint(t.touches[1]);
              this._centerPoint = i.getSize()._divideBy(2),
              this._startLatLng = i.containerPointToLatLng(this._centerPoint),
              "center" !== i.options.touchZoom && (this._pinchStartLatLng = i.containerPointToLatLng(e.add(n)._divideBy(2))),
              this._startDist = e.distanceTo(n),
              this._startZoom = i.getZoom(),
              this._moved = !1,
              this._zooming = !0,
              i._stop(),
              V(document, "touchmove", this._onTouchMove, this),
              V(document, "touchend", this._onTouchEnd, this),
              $(t)
          }
      },
      _onTouchMove: function(t) {
          if (t.touches && 2 === t.touches.length && this._zooming) {
              var i = this._map
                , n = i.mouseEventToContainerPoint(t.touches[0])
                , o = i.mouseEventToContainerPoint(t.touches[1])
                , s = n.distanceTo(o) / this._startDist;
              if (this._zoom = i.getScaleZoom(s, this._startZoom),
              !i.options.bounceAtZoomLimits && (this._zoom < i.getMinZoom() && s < 1 || this._zoom > i.getMaxZoom() && s > 1) && (this._zoom = i._limitZoom(this._zoom)),
              "center" === i.options.touchZoom) {
                  if (this._center = this._startLatLng,
                  1 === s)
                      return
              } else {
                  var r = n._add(o)._divideBy(2)._subtract(this._centerPoint);
                  if (1 === s && 0 === r.x && 0 === r.y)
                      return;
                  this._center = i.unproject(i.project(this._pinchStartLatLng, this._zoom).subtract(r), this._zoom)
              }
              this._moved || (i._moveStart(!0, !1),
              this._moved = !0),
              g(this._animRequest);
              var a = e(i._move, i, this._center, this._zoom, {
                  pinch: !0,
                  round: !1
              });
              this._animRequest = f(a, this, !0),
              $(t)
          }
      },
      _onTouchEnd: function() {
          this._moved && this._zooming ? (this._zooming = !1,
          g(this._animRequest),
          q(document, "touchmove", this._onTouchMove),
          q(document, "touchend", this._onTouchEnd),
          this._map.options.zoomAnimation ? this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), !0, this._map.options.zoomSnap) : this._map._resetView(this._center, this._map._limitZoom(this._zoom))) : this._zooming = !1
      }
  });
  Le.addInitHook("addHandler", "touchZoom", Cn),
  Le.BoxZoom = Ln,
  Le.DoubleClickZoom = Pn,
  Le.Drag = bn,
  Le.Keyboard = Tn,
  Le.ScrollWheelZoom = zn,
  Le.Tap = Mn,
  Le.TouchZoom = Cn;
  var Zn = window.L;
  window.L = t,
  Object.freeze = $t,
  t.version = "1.3.1",
  t.noConflict = function() {
      return window.L = Zn,
      this
  }
  ,
  t.Control = Pe,
  t.control = be,
  t.Browser = $i,
  t.Evented = ui,
  t.Mixin = Ee,
  t.Util = ai,
  t.Class = v,
  t.Handler = Ze,
  t.extend = i,
  t.bind = e,
  t.stamp = n,
  t.setOptions = l,
  t.DomEvent = de,
  t.DomUtil = xe,
  t.PosAnimation = we,
  t.Draggable = Be,
  t.LineUtil = Oe,
  t.PolyUtil = Re,
  t.Point = x,
  t.point = w,
  t.Bounds = P,
  t.bounds = b,
  t.Transformation = Z,
  t.transformation = S,
  t.Projection = je,
  t.LatLng = M,
  t.latLng = C,
  t.LatLngBounds = T,
  t.latLngBounds = z,
  t.CRS = ci,
  t.GeoJSON = nn,
  t.geoJSON = Kt,
  t.geoJson = sn,
  t.Layer = Ue,
  t.LayerGroup = Ve,
  t.layerGroup = function(t, i) {
      return new Ve(t,i)
  }
  ,
  t.FeatureGroup = qe,
  t.featureGroup = function(t) {
      return new qe(t)
  }
  ,
  t.ImageOverlay = rn,
  t.imageOverlay = function(t, i, e) {
      return new rn(t,i,e)
  }
  ,
  t.VideoOverlay = an,
  t.videoOverlay = function(t, i, e) {
      return new an(t,i,e)
  }
  ,
  t.DivOverlay = hn,
  t.Popup = un,
  t.popup = function(t, i) {
      return new un(t,i)
  }
  ,
  t.Tooltip = ln,
  t.tooltip = function(t, i) {
      return new ln(t,i)
  }
  ,
  t.Icon = Ge,
  t.icon = function(t) {
      return new Ge(t)
  }
  ,
  t.DivIcon = cn,
  t.divIcon = function(t) {
      return new cn(t)
  }
  ,
  t.Marker = Xe,
  t.marker = function(t, i) {
      return new Xe(t,i)
  }
  ,
  t.TileLayer = dn,
  t.tileLayer = Yt,
  t.GridLayer = _n,
  t.gridLayer = function(t) {
      return new _n(t)
  }
  ,
  t.SVG = xn,
  t.svg = Jt,
  t.Renderer = mn,
  t.Canvas = fn,
  t.canvas = Xt,
  t.Path = Je,
  t.CircleMarker = $e,
  t.circleMarker = function(t, i) {
      return new $e(t,i)
  }
  ,
  t.Circle = Qe,
  t.circle = function(t, i, e) {
      return new Qe(t,i,e)
  }
  ,
  t.Polyline = tn,
  t.polyline = function(t, i) {
      return new tn(t,i)
  }
  ,
  t.Polygon = en,
  t.polygon = function(t, i) {
      return new en(t,i)
  }
  ,
  t.Rectangle = wn,
  t.rectangle = function(t, i) {
      return new wn(t,i)
  }
  ,
  t.Map = Le,
  t.map = function(t, i) {
      return new Le(t,i)
  }
});

(function (factory, window) {
  // define an AMD module that relies on 'leaflet'
  if (typeof define === 'function' && define.amd) {
    define(['leaflet'], function (L) {
      factory(L, window.toGeoJSON);
    });

    // define a Common JS module that relies on 'leaflet'
  } else if (typeof exports === 'object') {
    module.exports = function (L) {
      if (L === undefined) {
        if (typeof window !== 'undefined') {
          L = require('leaflet'); // eslint-disable-line import/no-unresolved
        }
      }
      factory(L);
      return L;
    };
  } else if (typeof window !== 'undefined' && window.L) {
    factory(window.L);
  }
}(function (L) {
  L.Polyline.Measure = L.Draw.Polyline.extend({
    addHooks: function () {
      L.Draw.Polyline.prototype.addHooks.call(this);
      if (this._map) {
        this._markerGroup = new L.LayerGroup();
        this._map.addLayer(this._markerGroup);

        this._markers = [];
        this._map.on('click', this._onClick, this);
        this._startShape();
      }
    },

    removeHooks: function () {
      L.Draw.Polyline.prototype.removeHooks.call(this);

      this._clearHideErrorTimeout();

      // !\ Still useful when control is disabled before any drawing (refactor needed?)
      this._map
        .off('pointermove', this._onMouseMove, this)
        .off('mousemove', this._onMouseMove, this)
        .off('click', this._onClick, this);

      this._clearGuides();
      this._container.style.cursor = '';

      this._removeShape();
    },

    _startShape: function () {
      this._drawing = true;
      this._poly = new L.Polyline([], this.options.shapeOptions);
      // this is added as a placeholder, if leaflet doesn't recieve
      // this when the tool is turned off all onclick events are removed
      this._poly._onClick = function () {};

      this._container.style.cursor = 'crosshair';

      this._updateTooltip();
      this._map
        .on('pointermove', this._onMouseMove, this)
        .on('mousemove', this._onMouseMove, this);
    },

    _finishShape: function () {
      this._drawing = false;

      this._cleanUpShape();
      this._clearGuides();

      this._updateTooltip();

      this._map
        .off('pointermove', this._onMouseMove, this)
        .off('mousemove', this._onMouseMove, this);

      this._container.style.cursor = '';
    },

    _removeShape: function () {
      if (!this._poly) return;
      this._map.removeLayer(this._poly);
      delete this._poly;
      this._markers.splice(0);
      this._markerGroup.clearLayers();
    },

    _onClick: function () {
      if (!this._drawing) {
        this._removeShape();
        this._startShape();
      }
    },

    _getTooltipText: function () {
      var labelText = L.Draw.Polyline.prototype._getTooltipText.call(this);
      if (!this._drawing) {
        labelText.text = '';
      }
      return labelText;
    }
  });

  L.Control.MeasureControl = L.Control.extend({

    statics: {
      TITLE: 'Measure distances'
    },
    options: {
      position: 'topleft',
      handler: {}
    },

    toggle: function () {
      if (this.handler.enabled()) {
        this.handler.disable.call(this.handler);
      } else {
        this.handler.enable.call(this.handler);
      }
    },

    onAdd: function (map) {
      var link = null;
      var className = 'leaflet-control-draw';

      this._container = L.DomUtil.create('div', 'leaflet-bar');

      this.handler = new L.Polyline.Measure(map, this.options.handler);

      this.handler.on('enabled', function () {
        this.enabled = true;
        L.DomUtil.addClass(this._container, 'enabled');
      }, this);

      this.handler.on('disabled', function () {
        delete this.enabled;
        L.DomUtil.removeClass(this._container, 'enabled');
      }, this);

      link = L.DomUtil.create('a', className + '-measure', this._container);
      link.href = '#';
      link.title = L.Control.MeasureControl.TITLE;

      L.DomEvent
        .addListener(link, 'click', L.DomEvent.stopPropagation)
        .addListener(link, 'click', L.DomEvent.preventDefault)
        .addListener(link, 'click', this.toggle, this);

      return this._container;
    }
  });


  L.Map.mergeOptions({
    measureControl: false
  });


  L.Map.addInitHook(function () {
    if (this.options.measureControl) {
      this.measureControl = L.Control.measureControl().addTo(this);
    }
  });


  L.Control.measureControl = function (options) {
    return new L.Control.MeasureControl(options);
  };
}, window));


/*
  Copyright (c) 2012 Eric S. Theise
  
  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation the 
  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit 
  persons to whom the Software is furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the 
  Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
  WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
  OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
    
L.Rrose = L.Popup.extend({

  _initLayout:function () {
    var prefix = 'leaflet-rrose',
      container = this._container = L.DomUtil.create('div', prefix + ' ' + this.options.className + ' leaflet-zoom-animated fadeInPopup'),
      closeButton, wrapper;

    if (this.options.closeButton) {
      closeButton = this._closeButton = L.DomUtil.create('a', prefix + '-close-button', container);
      closeButton.href = '#close';
      closeButton.innerHTML = '&#215;';

      L.DomEvent.on(closeButton, 'click', this._onCloseButtonClick, this);
    }

    // Set the pixel distances from the map edges at which popups are too close and need to be re-oriented.
    var x_bound = (typeof this.options.x_bound === 'undefined') ? 80 : this.options.x_bound,
      y_bound = (typeof this.options.y_bound === 'undefined') ? 80 : this.options.y_bound;
    // Determine the alternate direction to pop up; north mimics Leaflet's default behavior, so we initialize to that.
    this.options.position = 'n';
    // Then see if the point is too far north...
    var panelsHeight = this.options.top_offset ? this.options.top_offset : 0;
    var markerPanelHeight = this.options.bottom_offset ? this.options.bottom_offset : 0;
    var y_diff = y_bound - (this._map.latLngToContainerPoint(this._latlng).y - panelsHeight + markerPanelHeight);
    if (y_diff > 0) {
      this.options.position = 's'
    }
    // or too far east...
    var menuWidth = this.options.right_offset ? this.options.right_offset : 0;
    var x_diff = this._map.latLngToContainerPoint(this._latlng).x - ((this._map.getSize().x - menuWidth) - x_bound);
    if (x_diff > 0) {
      this.options.position += 'w'
    } else {
    // or too far west.
      x_diff = x_bound - this._map.latLngToContainerPoint(this._latlng).x;
      if (x_diff > 0) {
        this.options.position += 'e'
      }
    }

    // Create the necessary DOM elements in the correct order. Pure 'n' and 's' conditions need only one class for styling, others need two.
    if (/s/.test(this.options.position)) {
      if (this.options.position === 's') {
        this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
        wrapper = this._wrapper = L.DomUtil.create('div', prefix + '-content-wrapper', container);
      } 
      else {
        this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container' + ' ' + prefix + '-tip-container-' + this.options.position, container);
        wrapper = this._wrapper = L.DomUtil.create('div', prefix + '-content-wrapper' + ' ' + prefix + '-content-wrapper-' + this.options.position, container);
      }
      this._tip = L.DomUtil.create('div', prefix + '-tip' + ' ' + prefix + '-tip-' + this.options.position, this._tipContainer);
      L.DomEvent.disableClickPropagation(wrapper);
      this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);
      L.DomEvent.on(this._contentNode, 'mousewheel', L.DomEvent.stopPropagation);
    } 
    else {
      if (this.options.position === 'n') {
        wrapper = this._wrapper = L.DomUtil.create('div', prefix + '-content-wrapper', container);
        this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container', container);
      } 
      else {
        wrapper = this._wrapper = L.DomUtil.create('div', prefix + '-content-wrapper' + ' ' + prefix + '-content-wrapper-' + this.options.position, container);
        this._tipContainer = L.DomUtil.create('div', prefix + '-tip-container' + ' ' + prefix + '-tip-container-' + this.options.position, container);
      }
      L.DomEvent.disableClickPropagation(wrapper);
      this._contentNode = L.DomUtil.create('div', prefix + '-content', wrapper);
      L.DomEvent.on(this._contentNode, 'mousewheel', L.DomEvent.stopPropagation);
      this._tip = L.DomUtil.create('div', prefix + '-tip' + ' ' + prefix + '-tip-' + this.options.position, this._tipContainer);
    }

  },

  _updatePosition:function () {
    var pos = this._map.latLngToLayerPoint(this._latlng),
      is3d = L.Browser.any3d,
      offset = this.options.offset;

    if (is3d) {
      L.DomUtil.setPosition(this._container, pos);
    }

    if (/s/.test(this.options.position)) {
      this._containerBottom = -this._container.offsetHeight + offset.y - (is3d ? 0 : pos.y);
    } else {
      this._containerBottom = -offset.y - (is3d ? 0 : pos.y);
    }

    if (/e/.test(this.options.position)) {
      this._containerLeft = offset.x + (is3d ? 0 : pos.x);
    } 
    else if (/w/.test(this.options.position)) {
      this._containerLeft = -Math.round(this._containerWidth) + offset.x + (is3d ? 0 : pos.x);
    } 
    else {
      this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x + (is3d ? 0 : pos.x);
    }

    this._container.style.bottom = this._containerBottom + 'px';
    this._container.style.left = this._containerLeft + 'px';
  }

});


/*
 * L.TimeDimension.Layer.TileLayer.TimeLine: TimeDimension TileLayer for Portus.
 */




 L.TimeDimension.Layer.TileLayer = L.TimeDimension.Layer.extend({});

 L.timeDimension.layer.tileLayer = function(layer, options) {
     return new L.TimeDimension.Layer.TileLayer(layer, options);
 };
 
 L.TimeDimension.Layer.TileLayer.TimeLine = L.TimeDimension.Layer.TileLayer.extend({
 
     initialize: function(layer, options) {
         L.TimeDimension.Layer.TileLayer.prototype.initialize.call(this, layer, options);
         this._layers = {};
         this._defaultTime = 0;
         this._availableTimes = [];
         this._timeCacheBackward = this.options.cacheBackward || this.options.cache || 400;
         this._timeCacheForward = this.options.cacheForward || this.options.cache || 400;
 
         this._baseLayer.on('load', (function() {
             this._baseLayer.setLoaded(true);
             this.fire('timeload', {
                 time: this._defaultTime
             });
         }).bind(this));
     },
 
     eachLayer: function(method, context) {
         for (var prop in this._layers) {
             if (this._layers.hasOwnProperty(prop)) {
                 method.call(context, this._layers[prop]);
             }
         }
         return L.TimeDimension.Layer.TileLayer.prototype.eachLayer.call(this, method, context);
     },
 
     _onNewTimeLoading: function(ev) {
         var layer = this._getLayerForTime(ev.time);
         if (!this._map.hasLayer(layer)) {
             this._map.addLayer(layer);
         }
     },
 
     isReady: function(time) {
         var layer = this._getLayerForTime(time);
         var currentZoom = this._map.getZoom();
         if (layer.options.minZoom && currentZoom < layer.options.minZoom){
             return true;
         }
         if (layer.options.maxZoom && currentZoom > layer.options.maxZoom){
             return true;
         }
 
         return layer.isLoaded();
     },
 
     _update: function() {
         if (!this._map)
             return;
         var time = this._timeDimension.getCurrentTime();
         // It will get the layer for this time (create or get)
         // Then, the layer will be loaded if necessary, adding it to the map (and show it after loading).
         // If it already on the map (but probably hidden), it will be shown
         var layer = this._getLayerForTime(time);
         if (this._currentLayer == null) {
             this._currentLayer = layer;
         }
         if (!this._map.hasLayer(layer)) {
             this._map.addLayer(layer);
         } else {
             this._showLayer(layer, time);
         }
     },
 
     setOpacity: function(opacity) {
         L.TimeDimension.Layer.TileLayer.prototype.setOpacity.apply(this, arguments);
         // apply to all preloaded caches
         for (var prop in this._layers) {
             if (this._layers.hasOwnProperty(prop) && this._layers[prop].setOpacity) {
                 this._layers[prop].setOpacity(opacity);
             }
         }
     },
     
     setZIndex: function(zIndex){
         L.TimeDimension.Layer.TileLayer.prototype.setZIndex.apply(this, arguments);
         // apply to all preloaded caches
         for (var prop in this._layers) {
             if (this._layers.hasOwnProperty(prop) && this._layers[prop].setZIndex) {
                 this._layers[prop].setZIndex(zIndex);
             }
         }
     },
 
     _unvalidateCache: function() {
         var time = this._timeDimension.getCurrentTime();
         for (var prop in this._layers) {
             if (time != prop && this._layers.hasOwnProperty(prop)) {
                 this._layers[prop].setLoaded(false); // mark it as unloaded
                 this._layers[prop].redraw();
             }
         }
       
     },
 
     _evictCachedTimes: function(keepforward, keepbackward) {
         // Cache management
         var times = this._getLoadedTimes();
         var strTime = String(this._currentTime);
         var index = times.indexOf(strTime);
         var remove = [];
         // remove times before current time
         if (keepbackward > -1) {
             var objectsToRemove = index - keepbackward;
             if (objectsToRemove > 0) {
                 remove = times.splice(0, objectsToRemove);
                 this._removeLayers(remove);
             }
         }
         if (keepforward > -1) {
             index = times.indexOf(strTime);
             var objectsToRemove = times.length - index - keepforward - 1;
             if (objectsToRemove > 0) {
                 remove = times.splice(index + keepforward + 1, objectsToRemove);
                 this._removeLayers(remove);
             }
         }
     },
 
     _showLayer: function(layer, time) {
 
         if (this._currentLayer && this._currentLayer !== layer) {
             this._currentLayer.hide();
         }
         layer.show();
         if (this._currentLayer && this._currentLayer === layer) {
             return;
         }
         this._currentLayer = layer;
         this._currentTime = time;
         //console.log('Show layer with time: ' + new Date(time).toISOString());
 
         this._evictCachedTimes(this._timeCacheForward, this._timeCacheBackward);
 
         
     },
 
     _getLayerForTime: function(time) {
         if (time == 0 || time == this._defaultTime || time == null) {
             return this._baseLayer;
         }
         if (this._layers.hasOwnProperty(time)) {
             return this._layers[time];
         }
         var nearestTime = this._getNearestTime(time);
         if (this._layers.hasOwnProperty(nearestTime)) {
             return this._layers[nearestTime];
         }
 
         var newLayer = this._createLayerForTime(nearestTime);
        
         this._layers[time] = newLayer;
 
         newLayer.on('load', (function(layer, time) {
             layer.setLoaded(true);
             // this time entry should exists inside _layers
             // but it might be deleted by cache management
             if (!this._layers[time]) {
                 this._layers[time] = layer;
             }
             if (this._timeDimension && time == this._timeDimension.getCurrentTime() && !this._timeDimension.isLoading()) {
                 this._showLayer(layer, time);
             }
             // console.log('Loaded layer ' + layer.wmsParams.layers + ' with time: ' + new Date(time).toISOString());
             this.fire('timeload', {
                 time: time
             });
         }).bind(this, newLayer, time));
 
         // Hack to hide the layer when added to the map.
         // It will be shown when timeload event is fired from the map (after all layers are loaded)
         newLayer.onAdd = (function(map) {
             Object.getPrototypeOf(this).onAdd.call(this, map);
             this.hide();
         }).bind(newLayer);
         return newLayer;
     },
     
     _createLayerForTime:function(time){
         var options = this._baseLayer.options;
         var url = this._baseLayer.getURL();
 
         var startDate = new Date(time);
         startDate.setUTCHours(0, 0, 0, 0);
         var startDateFormatted = startDate.toISOString().substring(0,10).replace(/-/g, '');
         url = url.replace('{d}', startDateFormatted);
 
         var hours = new Date(time).getUTCHours();
         hours = "00" + hours;
         hours = hours.substring(hours.length - 2, hours.length);
         url = url.replace('{h}', hours);
         return new this._baseLayer.constructor(url, this._baseLayer.options);
     },
 
     _getLoadedTimes: function() {
         var result = [];
         for (var prop in this._layers) {
             if (this._layers.hasOwnProperty(prop)) {
                 result.push(prop);
             }
         }
         return result.sort(function(a, b) {
             return a - b;
         });
     },
 
     _removeLayers: function(times) {
         for (var i = 0, l = times.length; i < l; i++) {
             if (this._map)
                 this._map.removeLayer(this._layers[times[i]]);
             delete this._layers[times[i]];
         }
     },
 
     setMinimumForwardCache: function(value) {
         if (value > this._timeCacheForward) {
             this._timeCacheForward = value;
         }
     },
 
     _getNearestTime: function(time) {
         if (this._layers.hasOwnProperty(time)) {
             return time;
         }
         if (this._availableTimes.length == 0) {
             return time;
         }
         var index = 0;
         var len = this._availableTimes.length;
         for (; index < len; index++) {
             if (time < this._availableTimes[index]) {
                 break;
             }
         }
         // We've found the first index greater than the time. Get the previous
         if (index > 0) {
             index--;
         }
         if (time != this._availableTimes[index]) {
             console.log('Search layer time: ' + new Date(time).toISOString());
             console.log('Return layer time: ' + new Date(this._availableTimes[index]).toISOString());
         }
         return this._availableTimes[index];
     },
 
     // getEvents: function() {
     //     var clearCache = L.bind(this._unvalidateCache, this);
     //     return {
     //         moveend: clearCache,
     //         zoomend: clearCache
     //     }
     // },
 
 });
 
 L.timeDimension.layer.tileLayer.timeLine = function(layer, options) {
     return new L.TimeDimension.Layer.TileLayer.TimeLine(layer, options);
 };
 
 // (function(){
 
 // 	var gridProto = L.TimeDimension.Layer.TileLayer.TimeLine.prototype;
 // 	var onRemoveProto = gridProto.onRemove;
 // 	var onAddProto = gridProto.onAdd;
 // 	var fadeDuration = 200;
 
 // 	L.TimeDimension.Layer.TileLayer.TimeLine.include({
 
 // 		onAdd: function(map) {
 // 			if (this._fadeOutTime) {
 // 				var now = performance.now() || (+new Date());
 // 				L.Util.cancelAnimFrame(this._fadeOutFrame);
 // 				this._fadeOutTime = now + fadeDuration - this._fadeOutTime + now;
 // 				L.Util.requestAnimFrame(this._fadeIn, this)
 // 			} else {
 // 				onAddProto.call(this, map);
 // 			}
 // 		},
 
 // 		onRemove: function(map) {
 
 // 			if (this._fadeOutTime) {
 // 				// We're removing this *again* quickly after removing and re-adding
 // 				var now = performance.now() || (+new Date());
 
 // 				this._fadeOutTime = now + fadeDuration - this._fadeOutTime + now;
 // 			}
 // 			this._fadeOutTime = (performance.now() || (+new Date())) + fadeDuration * 2;
 // 			this._fadeOutMap = this._map;
 
 // 			L.Util.requestAnimFrame(this._fadeOut, this)
 // 		},
 
 // 		_fadeOut: function(){
 // 			if (!this._fadeOutTime || !this._container) { return; }
 
 // 			var now = performance.now() || (+new Date());
 
 // 			var opacity = Math.min((this._fadeOutTime - now) / fadeDuration, 1);
 // // console.log('fadeout:', opacity);
 // 			if (opacity < 0) {
 // 				this._fadeOutTime = false;
 
 // 				onRemoveProto.call(this, this._fadeOutMap);
 
 // 				return;
 // 			}
 
 // 			L.DomUtil.setOpacity(this._container, opacity * this.options.opacity);
 
 // 			this._fadeOutFrame = L.Util.requestAnimFrame(this._fadeOut, this);
 // 		},
 
 // 		// Only runs when the gridlayer is quickly re-added while it's being faded out
 // 		_fadeIn: function _fadeIn(){
 // 			if (!this._fadeOutTime || !this._container) { return; }
 
 // 			var now = performance.now() || (+new Date());
 
 // 			var opacity = (now - this._fadeOutTime) / fadeDuration;
 // // console.log('fadein:', opacity);
 
 // 			if (opacity > 1) {
 // 				this._fadeOutTime = false;
 // 				return;
 // 			}
 
 // 			L.DomUtil.setOpacity(this._container, opacity * this.options.opacity);
 
 // 			L.Util.requestAnimFrame(this._fadeIn, this);
 // 		}
 
 // 	});
 
 // })();

 /* 
 * Leaflet TimeDimension v1.1.0 - 2017-10-13 
 * 
 * Copyright 2017 Biel Frontera (ICTS SOCIB) 
 * datacenter@socib.es 
 * http://www.socib.es/ 
 * 
 * Licensed under the MIT license. 
 * 
 * Demos: 
 * http://apps.socib.es/Leaflet.TimeDimension/ 
 * 
 * Source: 
 * git://github.com/socib/Leaflet.TimeDimension.git 
 * 
 */
/*jshint indent: 4, browser:true*/
/*global L*/
/*
 * L.TimeDimension: TimeDimension object manages the time component of a layer.
 * It can be shared among different layers and it can be added to a map, and become
 * the default timedimension component for any layer added to the map.
 */

L.TimeDimension = (L.Layer || L.Class).extend({

  includes: (L.Evented || L.Mixin.Events),

  initialize: function (options) {
      L.setOptions(this, options);
      // añadido para controlar el loader del mapa
      this.mapState = options.mapState;
      // _availableTimes is an array with all the available times in ms.
      this._availableTimes = this._generateAvailableTimes();
      this._currentTimeIndex = -1;
      this._loadingTimeIndex = -1;
      this._loadingTimeout = this.options.loadingTimeout || 3000;
      this._syncedLayers = [];
      if (this._availableTimes.length > 0) {
          this.setCurrentTime(this.options.currentTime || this._getDefaultCurrentTime());
      }
      if (this.options.lowerLimitTime) {
          this.setLowerLimit(this.options.lowerLimitTime);
      }
      if (this.options.upperLimitTime) {
          this.setUpperLimit(this.options.upperLimitTime);
      }
  },

  getSyncedLayers: function () {
      return this._syncedLayers;
  },

  getAvailableTimes: function () {
      return this._availableTimes;
  },

  getCurrentTimeIndex: function () {
      if (this._currentTimeIndex === -1) {
          return this._availableTimes.length - 1;
      }
      return this._currentTimeIndex;
  },

  getCurrentTime: function () {
      var index = -1;
      if (this._loadingTimeIndex !== -1) {
          index = this._loadingTimeIndex;
      } else {
          index = this.getCurrentTimeIndex();
      }
      if (index >= 0) {
          return this._availableTimes[index];
      } else {
          return null;
      }
  },

  isLoading: function () {
      return (this._loadingTimeIndex !== -1);
  },

  setCurrentTimeIndex: function (newIndex) {
      var upperLimit = this._upperLimit || this._availableTimes.length - 1;
      var lowerLimit = this._lowerLimit || 0;
      //clamp the value
      newIndex = Math.min(Math.max(lowerLimit, newIndex), upperLimit);
      if (newIndex < 0) {
          return;
      }
      this._loadingTimeIndex = newIndex;
      var newTime = this._availableTimes[newIndex];
      
      if (this._checkSyncedLayersReady(this._availableTimes[this._loadingTimeIndex])) {
          this._newTimeIndexLoaded();
      } else {
          this.fire('timeloading', {
              time: newTime
          });
          // add timeout of 3 seconds if layers doesn't response
          setTimeout((function (index) {
              if (index == this._loadingTimeIndex) {
                  this._newTimeIndexLoaded();
              }
          }).bind(this, newIndex), this._loadingTimeout);
      }

  },

  _newTimeIndexLoaded: function () {
      if (this._loadingTimeIndex === -1) {
          return;
      }
      var time = this._availableTimes[this._loadingTimeIndex];
      //this.mapState.setCurrentPlayerTime(time);
      this.mapState.setCurrentTimeIndex(this._loadingTimeIndex);

      this._currentTimeIndex = this._loadingTimeIndex;
      this.fire('timeload', {
          time: time
      });
      this._loadingTimeIndex = -1;
  },
  
  _checkSyncedLayersReady: function (time) {
      for (var i = 0, len = this.getSyncedLayers().length; i < len; i++) {
          if (this.getSyncedLayers()[i].isReady) {
              if (!this.getSyncedLayers()[i].isReady(time)) {
        return false;                    
              }
          }
      }
      return true;
  },
  
  setCurrentTime: function (time) {
      var newIndex = this._seekNearestTimeIndex(time);
      this.setCurrentTimeIndex(newIndex);
  },

  seekNearestTime: function (time) {
      var index = this._seekNearestTimeIndex(time);
      return this._availableTimes[index];
  },

  nextTime: function (numSteps, loop) {
      if (!numSteps) {
          numSteps = 1;
      }
      var newIndex = this._currentTimeIndex;
      var upperLimit = this._upperLimit || this._availableTimes.length - 1;
      var lowerLimit = this._lowerLimit || 0;
      if (this._loadingTimeIndex > -1) {
          newIndex = this._loadingTimeIndex;
      }
      newIndex = newIndex + numSteps;
      if (newIndex > upperLimit) {
          if (!!loop) {
              newIndex = lowerLimit;
          } else {
              newIndex = upperLimit;
          }
      }
      // loop backwards
      if (newIndex < lowerLimit) {
          if (!!loop) {
              newIndex = upperLimit;
          } else {
              newIndex = lowerLimit;
          }
      }
      this.setCurrentTimeIndex(newIndex);

      this.mapState.setCurrentTimeIndex(newIndex);
      var time = this._availableTimes[newIndex];
      //this.mapState.setCurrentPlayerTime(time);
      this.mapState.setVisibleParticleLayers(true);
  },

  prepareNextTimes: function (numSteps, howmany, loop) {
      if (!numSteps) {
          numSteps = 1;
      }

      var newIndex = this._currentTimeIndex;
      var currentIndex = newIndex;
      if (this._loadingTimeIndex > -1) {
          newIndex = this._loadingTimeIndex;
      }
      // assure synced layers have a buffer/cache of at least howmany elements
      for (var i = 0, len = this.getSyncedLayers().length; i < len; i++) {
          if (this.getSyncedLayers()[i].setMinimumForwardCache) {
              this.getSyncedLayers()[i].setMinimumForwardCache(howmany);
          }
      }
      var count = howmany;
      var upperLimit = this._upperLimit || this._availableTimes.length - 1;
      var lowerLimit = this._lowerLimit || 0;
      while (count > 0) {
          newIndex = newIndex + numSteps;
          if (newIndex > upperLimit) {
              if (!!loop) {
                  newIndex = lowerLimit;
              } else {
                  break;
              }
          }
          if (newIndex < lowerLimit) {
              if (!!loop) {
                  newIndex = upperLimit;
              } else {
                  break;
              }
          }
          if (currentIndex === newIndex) {
              //we looped around the timeline
              //no need to load further, the next times are already loading
              break;
          }
          this.fire('timeloading', {
              time: this._availableTimes[newIndex]
          });
          count--;
      }
  },

  getNumberNextTimesReady: function (numSteps, howmany, loop) {
      if (!numSteps) {
          numSteps = 1;
      }

      var newIndex = this._currentTimeIndex;
      if (this._loadingTimeIndex > -1) {
          newIndex = this._loadingTimeIndex;
      }
      var count = howmany;
      var ready = 0;
      var upperLimit = this._upperLimit || this._availableTimes.length - 1;
      var lowerLimit = this._lowerLimit || 0;
      while (count > 0) {
          newIndex = newIndex + numSteps;
          if (newIndex > upperLimit) {
              if (!!loop) {
                  newIndex = lowerLimit;
              } else {
                  count = 0;
                  ready = howmany;
                  break;
              }
          }
          if (newIndex < lowerLimit) {
              if (!!loop) {
                  newIndex = upperLimit;
              } else {
                  count = 0;
                  ready = howmany;
                  break;
              }
          }
          var time = this._availableTimes[newIndex];
          if (this._checkSyncedLayersReady(time)) {
              ready++;
          }
          count--;
      }
      return ready;
  },

  previousTime: function (numSteps, loop) {
      this.nextTime(numSteps*(-1), loop);
  },

  registerSyncedLayer: function (layer) {
      this._syncedLayers.push(layer);
      layer.on('timeload', this._onSyncedLayerLoaded, this);
  },

  unregisterSyncedLayer: function (layer) {
      var index = this._syncedLayers.indexOf(layer);
      if (index != -1) {
          this._syncedLayers.splice(index, 1);
      }
      layer.off('timeload', this._onSyncedLayerLoaded, this);
  },

  _onSyncedLayerLoaded: function (e) {
      if (e.time == this._availableTimes[this._loadingTimeIndex] && this._checkSyncedLayersReady(e.time)) {
          this._newTimeIndexLoaded();
      }
  },

  _generateAvailableTimes: function () {
      if (this.options.times) {
          return L.TimeDimension.Util.parseTimesExpression(this.options.times);
      } else if (this.options.timeInterval) {
          var tiArray = L.TimeDimension.Util.parseTimeInterval(this.options.timeInterval);
          this.mapState.setPlayerDateRangeValue(tiArray[0], tiArray[1]);
          var period = this.options.period || 'P1D';
          var validTimeRange = this.options.validTimeRange || undefined;
          return L.TimeDimension.Util.explodeTimeRange(tiArray[0], tiArray[1], period, validTimeRange);
      } else {
          return [];
      }
  },

  _getDefaultCurrentTime: function () {
      var index = this._seekNearestTimeIndex(new Date().getTime());
      return this._availableTimes[index];
  },

  _seekNearestTimeIndex: function (time) {
      var newIndex = 0;
      var len = this._availableTimes.length;
      for (; newIndex < len; newIndex++) {
          if (time < this._availableTimes[newIndex]) {
              break;
          }
      }
      // We've found the first index greater than the time. Return the previous
      if (newIndex > 0) {
          newIndex--;
      }
      return newIndex;
  },

  setAvailableTimes: function (times, mode) {
      var currentTime = this.getCurrentTime(),
          lowerLimitTime = this.getLowerLimit(),
          upperLimitTime = this.getUpperLimit();

      if (mode == 'extremes') {
          var period = this.options.period || 'P1D';
          this._availableTimes = L.TimeDimension.Util.explodeTimeRange(new Date(times[0]), new Date(times[times.length - 1]), period);
      } else {
          var parsedTimes = L.TimeDimension.Util.parseTimesExpression(times);
          if (this._availableTimes.length === 0) {
              this._availableTimes = parsedTimes;
          } else if (mode == 'intersect') {
              this._availableTimes = L.TimeDimension.Util.intersect_arrays(parsedTimes, this._availableTimes);
          } else if (mode == 'union') {
              this._availableTimes = L.TimeDimension.Util.union_arrays(parsedTimes, this._availableTimes);
          } else if (mode == 'replace') {
              this._availableTimes = parsedTimes;
          } else {
              throw 'Merge available times mode not implemented: ' + mode;
          }
      }

      if (lowerLimitTime) {
          this.setLowerLimit(lowerLimitTime); //restore lower limit
      }
      if (upperLimitTime) {
          this.setUpperLimit(upperLimitTime); //restore upper limit
      }
      this.setCurrentTime(currentTime);
      this.fire('availabletimeschanged', {
          availableTimes: this._availableTimes,
          currentTime: currentTime
      });
      
  },
  getLowerLimit: function () {
      return this._availableTimes[this.getLowerLimitIndex()];
  },
  getUpperLimit: function () {
      return this._availableTimes[this.getUpperLimitIndex()];
  },
  setLowerLimit: function (time) {
      var index = this._seekNearestTimeIndex(time);
      this.setLowerLimitIndex(index);
  },
  setUpperLimit: function (time) {
      var index = this._seekNearestTimeIndex(time);
      this.setUpperLimitIndex(index);
  },
  setLowerLimitIndex: function (index) {
      this._lowerLimit = Math.min(Math.max(index || 0, 0), this._upperLimit || this._availableTimes.length - 1);
      this.fire('limitschanged', {
          lowerLimit: this._lowerLimit,
          upperLimit: this._upperLimit
      });
  },
  setUpperLimitIndex: function (index) {
      this._upperLimit = Math.max(Math.min(index, this._availableTimes.length - 1), this._lowerLimit || 0);
      this.fire('limitschanged', {
          lowerLimit: this._lowerLimit,
          upperLimit: this._upperLimit
      });
  },
  getLowerLimitIndex: function () {
      return this._lowerLimit;
  },
  getUpperLimitIndex: function () {
      return this._upperLimit;
  }
});

L.Map.addInitHook(function () {
  if (this.options.timeDimension) {
      this.timeDimension = L.timeDimension(this.options.timeDimensionOptions || {});
  }
});

L.timeDimension = function (options) {
  return new L.TimeDimension(options);
};

/*
* L.TimeDimension.Util
*/

L.TimeDimension.Util = {
  getTimeDuration: function(ISODuration) {
      if (typeof nezasa === 'undefined') {
          throw "iso8601-js-period library is required for Leatlet.TimeDimension: https://github.com/nezasa/iso8601-js-period";
      }
      return nezasa.iso8601.Period.parse(ISODuration, true);
  },

  addTimeDuration: function(date, duration, utc) {
      if (typeof utc === 'undefined') {
          utc = true;
      }
      if (typeof duration == 'string' || duration instanceof String) {
          duration = this.getTimeDuration(duration);
      }
      var l = duration.length;
      var get = utc ? "getUTC" : "get";
      var set = utc ? "setUTC" : "set";

      if (l > 0 && duration[0] != 0) {
          date[set + "FullYear"](date[get + "FullYear"]() + duration[0]);
      }
      if (l > 1 && duration[1] != 0) {
          date[set + "Month"](date[get + "Month"]() + duration[1]);
      }
      if (l > 2 && duration[2] != 0) {
          // weeks
          date[set + "Date"](date[get + "Date"]() + (duration[2] * 7));
      }
      if (l > 3 && duration[3] != 0) {
          date[set + "Date"](date[get + "Date"]() + duration[3]);
      }
      if (l > 4 && duration[4] != 0) {
          date[set + "Hours"](date[get + "Hours"]() + duration[4]);
      }
      if (l > 5 && duration[5] != 0) {
          date[set + "Minutes"](date[get + "Minutes"]() + duration[5]);
      }
      if (l > 6 && duration[6] != 0) {
          date[set + "Seconds"](date[get + "Seconds"]() + duration[6]);
      }
  },

  subtractTimeDuration: function(date, duration, utc) {
      if (typeof duration == 'string' || duration instanceof String) {
          duration = this.getTimeDuration(duration);
      }
      var subDuration = [];
      for (var i = 0, l = duration.length; i < l; i++) {
          subDuration.push(-duration[i]);
      }
      this.addTimeDuration(date, subDuration, utc);
  },

  parseAndExplodeTimeRange: function(timeRange) {
      var tr = timeRange.split('/');
      var startTime = new Date(Date.parse(tr[0]));
      var endTime = new Date(Date.parse(tr[1]));
      var duration = tr.length > 2 ? tr[2] : "P1D";

      return this.explodeTimeRange(startTime, endTime, duration);
  },

  explodeTimeRange: function(startTime, endTime, ISODuration, validTimeRange) {
      var duration = this.getTimeDuration(ISODuration);
      var result = [];
      var currentTime = new Date(startTime.getTime());
      var minHour = null,
          minMinutes = null,
          maxHour = null,
          maxMinutes = null;
      if (validTimeRange !== undefined) {
          var validTimeRangeArray = validTimeRange.split('/');
          minHour = validTimeRangeArray[0].split(':')[0];
          minMinutes = validTimeRangeArray[0].split(':')[1];
          maxHour = validTimeRangeArray[1].split(':')[0];
          maxMinutes = validTimeRangeArray[1].split(':')[1];
      }
      while (currentTime < endTime) {
          if (validTimeRange === undefined ||
              (currentTime.getUTCHours() >= minHour && currentTime.getUTCHours() <= maxHour)
          ) {
              if ((currentTime.getUTCHours() != minHour || currentTime.getUTCMinutes() >= minMinutes) &&
                  (currentTime.getUTCHours() != maxHour || currentTime.getUTCMinutes() <= maxMinutes)) {
                  result.push(currentTime.getTime());
              }
          }
          this.addTimeDuration(currentTime, duration);
      }
      if (currentTime >= endTime){
          result.push(endTime.getTime());
      }
      return result;
  },

  parseTimeInterval: function(timeInterval) {
      var parts = timeInterval.split("/");
      if (parts.length != 2) {
          throw "Incorrect ISO9601 TimeInterval: " + timeInterval;
      }
      var startTime = Date.parse(parts[0]);
      var endTime = null;
      var duration = null;
      if (isNaN(startTime)) {
          // -> format duration/endTime
          duration = this.getTimeDuration(parts[0]);
          endTime = Date.parse(parts[1]);
          startTime = new Date(endTime);
          this.subtractTimeDuration(startTime, duration, true);
          endTime = new Date(endTime);
      } else {
          endTime = Date.parse(parts[1]);
          if (isNaN(endTime)) {
              // -> format startTime/duration
              duration = this.getTimeDuration(parts[1]);
              endTime = new Date(startTime);
              this.addTimeDuration(endTime, duration, true);
          } else {
              // -> format startTime/endTime
              endTime = new Date(endTime);
          }
          startTime = new Date(startTime);
      }
      return [startTime, endTime];
  },

  parseTimesExpression: function(times) {
      var result = [];
      if (!times) {
          return result;
      }
      if (typeof times == 'string' || times instanceof String) {
          var timeRanges = times.split(",");
          var timeRange;
          var timeValue;
          for (var i=0, l=timeRanges.length; i<l; i++){
              timeRange = timeRanges[i];
              if (timeRange.split("/").length == 3) {
                  result = result.concat(this.parseAndExplodeTimeRange(timeRange));
              } else {
                  timeValue = Date.parse(timeRange);
                  if (!isNaN(timeValue)) {
                      result.push(timeValue);
                  }
              }
          }
      } else {
          result = times;
      }
      return result.sort(function(a, b) {
          return a - b;
      });
  },

  intersect_arrays: function(arrayA, arrayB) {
      var a = arrayA.slice(0);
      var b = arrayB.slice(0);
      var result = [];
      while (a.length > 0 && b.length > 0) {
          if (a[0] < b[0]) {
              a.shift();
          } else if (a[0] > b[0]) {
              b.shift();
          } else /* they're equal */ {
              result.push(a.shift());
              b.shift();
          }
      }
      return result;
  },

  union_arrays: function(arrayA, arrayB) {
      var a = arrayA.slice(0);
      var b = arrayB.slice(0);
      var result = [];
      while (a.length > 0 && b.length > 0) {
          if (a[0] < b[0]) {
              result.push(a.shift());
          } else if (a[0] > b[0]) {
              result.push(b.shift());
          } else /* they're equal */ {
              result.push(a.shift());
              b.shift();
          }
      }
      if (a.length > 0) {
          result = result.concat(a);
      } else if (b.length > 0) {
          result = result.concat(b);
      }
      return result;
  }

};

/*
* L.TimeDimension.Layer:  an abstract Layer that can be managed/synchronized with a TimeDimension.
* The constructor recieves a layer (of any kind) and options.
* Any children class should implement `_onNewTimeLoading`, `isReady` and `_update` functions
* to react to time changes.
*/

L.TimeDimension.Layer = (L.Layer || L.Class).extend({

  includes: (L.Evented || L.Mixin.Events),
  options: {
      opacity: 1,
      zIndex: 1
  },

  initialize: function(layer, options) {
      L.setOptions(this, options || {});
      this._map = null;
      this._baseLayer = layer;
      this._currentLayer = null;
      this._timeDimension = this.options.timeDimension || null;
  },

  addTo: function(map) {
      map.addLayer(this);
      return this;
  },

  onAdd: function(map) {
      this._map = map;
      if (!this._timeDimension && map.timeDimension) {
          this._timeDimension = map.timeDimension;
      }
      this._timeDimension.on("timeloading", this._onNewTimeLoading, this);
      this._timeDimension.on("timeload", this._update, this);
      this._timeDimension.registerSyncedLayer(this);
      this._update();
  },

  onRemove: function(map) {
      this._timeDimension.unregisterSyncedLayer(this);
      this._timeDimension.off("timeloading", this._onNewTimeLoading, this);
      this._timeDimension.off("timeload", this._update, this);
      this.eachLayer(map.removeLayer, map);
      this._map = null;
  },

  eachLayer: function(method, context) {
      method.call(context, this._baseLayer);
      return this;
  },

  setZIndex: function(zIndex) {
      this.options.zIndex = zIndex;
      if (this._baseLayer.setZIndex) {
          this._baseLayer.setZIndex(zIndex);
      }
      if (this._currentLayer && this._currentLayer.setZIndex) {
          this._currentLayer.setZIndex(zIndex);
      }
      return this;
  },

  setOpacity: function(opacity) {
      this.options.opacity = opacity;
      if (this._baseLayer.setOpacity) {
          this._baseLayer.setOpacity(opacity);
      }
      if (this._currentLayer && this._currentLayer.setOpacity) {
          this._currentLayer.setOpacity(opacity);
      }
      return this;
  },

  bringToBack: function() {
      if (!this._currentLayer) {
          return;
      }
      this._currentLayer.bringToBack();
      return this;
  },

  bringToFront: function() {
      if (!this._currentLayer) {
          return;
      }
      this._currentLayer.bringToFront();
      return this;
  },

  _onNewTimeLoading: function(ev) {
      // to be implemented for each type of layer
      this.fire('timeload', {
          time: ev.time
      });
      return;
  },

  isReady: function(time) {
      // to be implemented for each type of layer
      return true;
  },

  _update: function() {
      // to be implemented for each type of layer
      return true;
  },

  getBaseLayer: function() {
      return this._baseLayer;
  },

  getBounds: function() {
      var bounds = new L.LatLngBounds();
      if (this._currentLayer) {
          bounds.extend(this._currentLayer.getBounds ? this._currentLayer.getBounds() : this._currentLayer.getLatLng());
      }
      return bounds;
  }

});

L.timeDimension.layer = function(layer, options) {
  return new L.TimeDimension.Layer(layer, options);
};
/*
* L.TimeDimension.Layer.WMS: wms Layer associated to a TimeDimension
*/

L.TimeDimension.Layer.WMS = L.TimeDimension.Layer.extend({

  initialize: function(layer, options) {
      L.TimeDimension.Layer.prototype.initialize.call(this, layer, options);
      this._timeCacheBackward = this.options.cacheBackward || this.options.cache || 0;
      this._timeCacheForward = this.options.cacheForward || this.options.cache || 0;
      this._wmsVersion = this.options.wmsVersion || this.options.version || layer.options.version || "1.1.1";
      this._getCapabilitiesParams = this.options.getCapabilitiesParams || {};
      this._getCapabilitiesAlternateUrl = this.options.getCapabilitiesUrl || null;
      this._getCapabilitiesAlternateLayerName = this.options.getCapabilitiesLayerName || null;
      this._proxy = this.options.proxy || null;
      this._updateTimeDimension = this.options.updateTimeDimension || false;
      this._setDefaultTime = this.options.setDefaultTime || false;
      this._updateTimeDimensionMode = this.options.updateTimeDimensionMode || 'intersect'; // 'union' or 'replace'
      this._layers = {};
      this._defaultTime = 0;
      this._availableTimes = [];
      this._capabilitiesRequested = false;
      if (this._updateTimeDimension || this.options.requestTimeFromCapabilities) {
          this._requestTimeDimensionFromCapabilities();
      }

      this._baseLayer.on('load', (function() {
          this._baseLayer.setLoaded(true);
          this.fire('timeload', {
              time: this._defaultTime
          });
      }).bind(this));
  },

  getEvents: function() {
      var clearCache = L.bind(this._unvalidateCache, this);
      return {
          moveend: clearCache,
          zoomend: clearCache
      }
  },

  eachLayer: function(method, context) {
      for (var prop in this._layers) {
          if (this._layers.hasOwnProperty(prop)) {
              method.call(context, this._layers[prop]);
          }
      }
      return L.TimeDimension.Layer.prototype.eachLayer.call(this, method, context);
  },

  _onNewTimeLoading: function(ev) {
      // 
      var layer = this._getLayerForTime(ev.time);
      if (!this._map.hasLayer(layer)) {
          this._map.addLayer(layer);
          // 
      }
  },

  isReady: function(time) {
      var layer = this._getLayerForTime(time);
      if (this.options.bounds && this._map)
          if (!this._map.getBounds().contains(this.options.bounds))
              return true;
      return layer.isLoaded();
  },

  onAdd: function(map) {
      L.TimeDimension.Layer.prototype.onAdd.call(this, map);
      if (this._availableTimes.length == 0) {
          this._requestTimeDimensionFromCapabilities();
      } else {
          this._updateTimeDimensionAvailableTimes();
      }
  },

  _update: function() {
      if (!this._map)
          return;
      var time = this._timeDimension.getCurrentTime();
      // It will get the layer for this time (create or get)
      // Then, the layer will be loaded if necessary, adding it to the map (and show it after loading).
      // If it already on the map (but probably hidden), it will be shown
      var layer = this._getLayerForTime(time);
      if (this._currentLayer == null) {
          this._currentLayer = layer;
      }
      if (!this._map.hasLayer(layer)) {
          this._map.addLayer(layer);
      } else {
          this._showLayer(layer, time);
      }
  },

  setOpacity: function(opacity) {
      L.TimeDimension.Layer.prototype.setOpacity.apply(this, arguments);
      // apply to all preloaded caches
      for (var prop in this._layers) {
          if (this._layers.hasOwnProperty(prop) && this._layers[prop].setOpacity) {
              this._layers[prop].setOpacity(opacity);
          }
      }
  },

  setZIndex: function(zIndex){
      L.TimeDimension.Layer.prototype.setZIndex.apply(this, arguments);
      // apply to all preloaded caches
      for (var prop in this._layers) {
          if (this._layers.hasOwnProperty(prop) && this._layers[prop].setZIndex) {
              this._layers[prop].setZIndex(zIndex);
          }
      }
  },

  setParams: function(params, noRedraw) {
      L.extend(this._baseLayer.options, params);
      if (this._baseLayer.setParams) {
          this._baseLayer.setParams(params, noRedraw);
      }
      for (var prop in this._layers) {
          if (this._layers.hasOwnProperty(prop) && this._layers[prop].setParams) {
              this._layers[prop].setLoaded(false); // mark it as unloaded
              this._layers[prop].setParams(params, noRedraw);
          }
      }
      return this;
  },

  _unvalidateCache: function() {
      var time = this._timeDimension.getCurrentTime();
      for (var prop in this._layers) {
          if (time != prop && this._layers.hasOwnProperty(prop)) {
              this._layers[prop].setLoaded(false); // mark it as unloaded
              this._layers[prop].redraw();
          }
      }
  },

  _evictCachedTimes: function(keepforward, keepbackward) {
      // Cache management
      var times = this._getLoadedTimes();
      var strTime = String(this._currentTime);
      var index = times.indexOf(strTime);
      var remove = [];
      // remove times before current time
      if (keepbackward > -1) {
          var objectsToRemove = index - keepbackward;
          if (objectsToRemove > 0) {
              remove = times.splice(0, objectsToRemove);
              this._removeLayers(remove);
          }
      }
      if (keepforward > -1) {
          index = times.indexOf(strTime);
          var objectsToRemove = times.length - index - keepforward - 1;
          if (objectsToRemove > 0) {
              remove = times.splice(index + keepforward + 1, objectsToRemove);
              this._removeLayers(remove);
          }
      }
  },
  _showLayer: function(layer, time) {
      if (this._currentLayer && this._currentLayer !== layer) {
          this._currentLayer.hide();
      }
      layer.show();
      if (this._currentLayer && this._currentLayer === layer) {
          return;
      }
      this._currentLayer = layer;
      this._currentTime = time;
      

      this._evictCachedTimes(this._timeCacheForward, this._timeCacheBackward);
  },

  _getLayerForTime: function(time) {
      if (time == 0 || time == this._defaultTime || time == null) {
          return this._baseLayer;
      }
      if (this._layers.hasOwnProperty(time)) {
          return this._layers[time];
      }
      var nearestTime = this._getNearestTime(time);
      if (this._layers.hasOwnProperty(nearestTime)) {
          return this._layers[nearestTime];
      }

      var newLayer = this._createLayerForTime(nearestTime);

      this._layers[time] = newLayer;

      newLayer.on('load', (function(layer, time) {
          layer.setLoaded(true);
          // this time entry should exists inside _layers
          // but it might be deleted by cache management
          if (!this._layers[time]) {
              this._layers[time] = layer;
          }
          if (this._timeDimension && time == this._timeDimension.getCurrentTime() && !this._timeDimension.isLoading()) {
              this._showLayer(layer, time);
          }
          // 
          this.fire('timeload', {
              time: time
          });
      }).bind(this, newLayer, time));

      // Hack to hide the layer when added to the map.
      // It will be shown when timeload event is fired from the map (after all layers are loaded)
      newLayer.onAdd = (function(map) {
          Object.getPrototypeOf(this).onAdd.call(this, map);
          this.hide();
      }).bind(newLayer);
      return newLayer;
  },

  _createLayerForTime:function(time){
      var wmsParams = this._baseLayer.options;
      wmsParams.time = new Date(time).toISOString();
      return new this._baseLayer.constructor(this._baseLayer.getURL(), wmsParams);
  },

  _getLoadedTimes: function() {
      var result = [];
      for (var prop in this._layers) {
          if (this._layers.hasOwnProperty(prop)) {
              result.push(prop);
          }
      }
      return result.sort(function(a, b) {
          return a - b;
      });
  },

  _removeLayers: function(times) {
      for (var i = 0, l = times.length; i < l; i++) {
          if (this._map)
              this._map.removeLayer(this._layers[times[i]]);
          delete this._layers[times[i]];
      }
  },

  setMinimumForwardCache: function(value) {
      if (value > this._timeCacheForward) {
          this._timeCacheForward = value;
      }
  },

  _requestTimeDimensionFromCapabilities: function() {
      if (this._capabilitiesRequested) {
          return;
      }
      this._capabilitiesRequested = true;
      var url = this._getCapabilitiesUrl();
      if (this._proxy) {
          url = this._proxy + '?url=' + encodeURIComponent(url);
      }
      var oReq = new XMLHttpRequest();
      oReq.addEventListener("load", (function(xhr) {
          var data = xhr.currentTarget.responseXML;
          this._defaultTime = Date.parse(this._getDefaultTimeFromCapabilities(data));
          this._setDefaultTime = this._setDefaultTime || (this._timeDimension && this._timeDimension.getAvailableTimes().length == 0);
          this.setAvailableTimes(this._parseTimeDimensionFromCapabilities(data));
          if (this._setDefaultTime && this._timeDimension) {
              this._timeDimension.setCurrentTime(this._defaultTime);
          }
      }).bind(this));
      oReq.overrideMimeType('application/xml');
      oReq.open("GET", url);
      oReq.send();
  },

  _getCapabilitiesUrl: function() {
      var url = this._baseLayer.getURL();
      if (this._getCapabilitiesAlternateUrl)
          url = this._getCapabilitiesAlternateUrl;
      var params = L.extend({}, this._getCapabilitiesParams, {
        'request': 'GetCapabilities',
        'service': 'WMS',
        'version': this._wmsVersion
      });
      url = url + L.Util.getParamString(params, url, params.uppercase);
      return url;
  },

  _parseTimeDimensionFromCapabilities: function(xml) {
      var layers = xml.querySelectorAll('Layer[queryable="1"]');
      var layerName = this._baseLayer.wmsParams.layers;
      var layer = null;
      var times = null;

      layers.forEach(function(current) {
          if (current.querySelector("Name").innerHTML === layerName) {
              layer = current;
          }
      })
      if (layer) {
          times = this._getTimesFromLayerCapabilities(layer);
          if (!times) {
              times = this._getTimesFromLayerCapabilities(layer.parentNode);
          }
      }

      return times;
  },

  _getTimesFromLayerCapabilities: function(layer) {
      var times = null;
      var dimensions = layer.querySelectorAll("Dimension[name='time']");
      if (dimensions && dimensions.length && dimensions[0].textContent.length) {
          times = dimensions[0].textContent.trim();
      } else {
          var extents = layer.querySelectorAll("Extent[name='time']");
          if (extents && extents.length && extents[0].textContent.length) {
              times = extents[0].textContent.trim();
          }
      }
      return times;
  },

  _getDefaultTimeFromCapabilities: function(xml) {
      var layers = xml.querySelectorAll('Layer[queryable="1"]');
      var layerName = this._baseLayer.wmsParams.layers;
      var layer = null;
      var times = null;

      layers.forEach(function(current) {
          if (current.querySelector("Name").innerHTML === layerName) {
              layer = current;
          }
      })

      var defaultTime = 0;
      if (layer) {
          defaultTime = this._getDefaultTimeFromLayerCapabilities(layer);
          if (defaultTime == 0) {
              defaultTime = this._getDefaultTimeFromLayerCapabilities(layer.parentNode);
          }
      }
      return defaultTime;
  },

  _getDefaultTimeFromLayerCapabilities: function(layer) {
      var defaultTime = 0;
      var dimensions = layer.querySelectorAll("Dimension[name='time']");
      if (dimensions && dimensions.length && dimensions[0].attributes.default) {
          defaultTime = dimensions[0].attributes.default;
      } else {
          var extents = layer.querySelectorAll("Extent[name='time']");
          if (extents && extents.length && extents[0].attributes.default) {
              defaultTime = extents[0].attributes.default;
          }
      }
      return defaultTime;
  },

  setAvailableTimes: function(times) {
      this._availableTimes = L.TimeDimension.Util.parseTimesExpression(times);
      this._updateTimeDimensionAvailableTimes();
  },

  _updateTimeDimensionAvailableTimes: function() {
      if ((this._timeDimension && this._updateTimeDimension) ||
          (this._timeDimension && this._timeDimension.getAvailableTimes().length == 0)) {
          this._timeDimension.setAvailableTimes(this._availableTimes, this._updateTimeDimensionMode);
          if (this._setDefaultTime && this._defaultTime > 0) {
              this._timeDimension.setCurrentTime(this._defaultTime);
          }
      }
  },

  _getNearestTime: function(time) {
      if (this._layers.hasOwnProperty(time)) {
          return time;
      }
      if (this._availableTimes.length == 0) {
          return time;
      }
      var index = 0;
      var len = this._availableTimes.length;
      for (; index < len; index++) {
          if (time < this._availableTimes[index]) {
              break;
          }
      }
      // We've found the first index greater than the time. Get the previous
      if (index > 0) {
          index--;
      }
      if (time != this._availableTimes[index]) {
          
          
      }
      return this._availableTimes[index];
  },

});

if (!L.NonTiledLayer) {
  L.NonTiledLayer = (L.Layer || L.Class).extend({});
}

L.NonTiledLayer.include({
  _visible: true,
  _loaded: false,

  _originalUpdate: L.NonTiledLayer.prototype._update,
  _originalOnRemove: L.NonTiledLayer.prototype.onRemove,

  _update: function() {
      if (!this._visible && this._loaded) {
          return;
      }
      this._originalUpdate();
  },

  onRemove: function(map) {
      this._loaded = false;
      this._originalOnRemove(map);
  },

  setLoaded: function(loaded) {
      this._loaded = loaded;
  },

  isLoaded: function() {
      return this._loaded;
  },

  hide: function() {
      this._visible = false;
      this._div.style.display = 'none';

  },

  show: function() {
      this._visible = true;
      this._div.style.display = 'block';

  },

  getURL: function() {
      return this._wmsUrl;
  }

});

L.TileLayer.include({
  _visible: true,
  _loaded: false,

  _originalUpdate: L.TileLayer.prototype._update,

  _update: function() {
      if (!this._visible && this._loaded) {
          return;
      }
      this._originalUpdate();
  },

  setLoaded: function(loaded) {
      this._loaded = loaded;
  },

  isLoaded: function() {
      return this._loaded;
  },

  hide: function() {
  
     if (this._map && (this._map.timeDimensionControl._player._preloadBuffer && PC.smooth_preloading && this._map.timeDimensionControl._player.isPlaying())) {
          var _delayedLayer = this;
          setTimeout(function() {
              _delayedLayer._visible = false;
              if (_delayedLayer._container) {
                  _delayedLayer._container.style.display = 'none';
              }
          }, 100);
         
      }
      else {
          this._visible = false;
          if (this._container) {
              this._container.style.display = 'none';
          }
      }
      
  },

  show: function() {

      // if (this._map.timeDimensionControl 
      //     && this._map.timeDimensionControl._player._preloadBuffer 
      //     && this._map.timeDimensionControl._player.isPlaying()) 
      //     this.setOpacity(PC.smooth_preloading ? 1 : PC.hidden_preloading ? 0.01 : 0.1);
      // else
      //     this.setOpacity(this._map.timeDimensionControl.mapState.getTileLayersOpacity());

      this._visible = true;
      if (this._container) {
          this._container.style.display = 'block';
      }
    
  },

  getURL: function() {
      return this._url;
  }

});

L.timeDimension.layer.wms = function(layer, options) {
  return new L.TimeDimension.Layer.WMS(layer, options);
};

/*
* L.TimeDimension.Layer.GeoJson:
*/

L.TimeDimension.Layer.GeoJson = L.TimeDimension.Layer.extend({

  initialize: function(layer, options) {
      L.TimeDimension.Layer.prototype.initialize.call(this, layer, options);
      this._updateTimeDimension = this.options.updateTimeDimension || false;
      this._updateTimeDimensionMode = this.options.updateTimeDimensionMode || 'extremes'; // 'union', 'replace' or extremes
      this._duration = this.options.duration || null;
      this._addlastPoint = this.options.addlastPoint || false;
      this._waitForReady = this.options.waitForReady || false;
      this._defaultTime = 0;
      this._availableTimes = [];
      this._loaded = false;
      if (this._baseLayer.getLayers().length == 0) {
          if (this._waitForReady){
              this._baseLayer.on("ready", this._onReadyBaseLayer, this);
          }else{
              this._loaded = true;
          }
      } else {
          this._loaded = true;
          this._setAvailableTimes();
      }
      // reload available times if data is added to the base layer
      this._baseLayer.on('layeradd', (function () {
          if (this._loaded) {
              this._setAvailableTimes();
          }
      }).bind(this));
  },

  onAdd: function(map) {
      L.TimeDimension.Layer.prototype.onAdd.call(this, map);
      if (this._loaded) {
          this._setAvailableTimes();
      }
  },

  eachLayer: function(method, context) {
      if (this._currentLayer) {
          method.call(context, this._currentLayer);
      }
      return L.TimeDimension.Layer.prototype.eachLayer.call(this, method, context);
  },

  isReady: function(time) {
      return this._loaded;
  },

  _update: function() {
      if (!this._map)
          return;
      if (!this._loaded) {
          return;
      }

      var time = this._timeDimension.getCurrentTime();

      var maxTime = this._timeDimension.getCurrentTime(),
          minTime = 0;
      if (this._duration) {
          var date = new Date(maxTime);
          L.TimeDimension.Util.subtractTimeDuration(date, this._duration, true);
          minTime = date.getTime();
      }

      // new coordinates:
      var layer = L.geoJson(null, this._baseLayer.options);
      var layers = this._baseLayer.getLayers();
      for (var i = 0, l = layers.length; i < l; i++) {
          var feature = this._getFeatureBetweenDates(layers[i].feature, minTime, maxTime);
          if (feature) {
              layer.addData(feature);
              if (this._addlastPoint && feature.geometry.type == "LineString") {
                  if (feature.geometry.coordinates.length > 0) {
                      var properties = feature.properties;
                      properties.last = true;
                      layer.addData({
                          type: 'Feature',
                          properties: properties,
                          geometry: {
                              type: 'Point',
                              coordinates: feature.geometry.coordinates[feature.geometry.coordinates.length - 1]
                          }
                      });
                  }
              }
          }
      }

      if (this._currentLayer) {
          this._map.removeLayer(this._currentLayer);
      }
      if (layer.getLayers().length) {
          layer.addTo(this._map);
          this._currentLayer = layer;
      }
  },

  _setAvailableTimes: function() {
      var times = [];
      this._availableTimes = [];
      var layers = this._baseLayer.getLayers();
      for (var i = 0, l = layers.length; i < l; i++) {
          if (layers[i].feature) {
              times = L.TimeDimension.Util.union_arrays(
                  times,
                  this._getFeatureTimes(layers[i].feature)
              );
          }
      }
      // String dates to ms
      for (var i = 0, l = times.length; i < l; i++) {
          var time = times[i]
          if (typeof time == 'string' || time instanceof String) {
              time = Date.parse(time.trim());
          }
          this._availableTimes.push(time);
      }
      if (this._timeDimension && (this._updateTimeDimension || this._timeDimension.getAvailableTimes().length == 0)) {
          this._timeDimension.setAvailableTimes(this._availableTimes, this._updateTimeDimensionMode);
      }
  },

  _getFeatureTimes: function(feature) {
      if (!feature.properties) {
          return [];
      }
      if (feature.properties.hasOwnProperty('coordTimes')) {
          return feature.properties.coordTimes;
      }
      if (feature.properties.hasOwnProperty('times')) {
          return feature.properties.times;
      }
      if (feature.properties.hasOwnProperty('linestringTimestamps')) {
          return feature.properties.linestringTimestamps;
      }
      if (feature.properties.hasOwnProperty('time')) {
          return [feature.properties.time];
      }
      return [];
  },

  _getFeatureBetweenDates: function(feature, minTime, maxTime) {
      var featureStringTimes = this._getFeatureTimes(feature);
      if (featureStringTimes.length == 0) {
          return feature;
      }
      var featureTimes = [];
      for (var i = 0, l = featureStringTimes.length; i < l; i++) {
          var time = featureStringTimes[i]
          if (typeof time == 'string' || time instanceof String) {
              time = Date.parse(time.trim());
          }
          featureTimes.push(time);
      }

      if (featureTimes[0] > maxTime || featureTimes[l - 1] < minTime) {
          return null;
      }
      var index_min = null,
          index_max = null,
          l = featureTimes.length;
      if (featureTimes[l - 1] > minTime) {
          for (var i = 0; i < l; i++) {
              if (index_min === null && featureTimes[i] > minTime) {
                  // set index_min the first time that current time is greater the minTime
                  index_min = i;
              }
              if (featureTimes[i] > maxTime) {
                  index_max = i;
                  break;
              }
          }
      }
      if (index_min === null) {
          index_min = 0;
      }
      if (index_max === null) {
          index_max = l;
      }
      var new_coordinates = [];
      if (feature.geometry.coordinates[0].length) {
          new_coordinates = feature.geometry.coordinates.slice(index_min, index_max);
      } else {
          new_coordinates = feature.geometry.coordinates;
      }
      return {
          type: 'Feature',
          properties: feature.properties,
          geometry: {
              type: feature.geometry.type,
              coordinates: new_coordinates
          }
      };
  },

  _onReadyBaseLayer: function() {
      this._loaded = true;
      this._setAvailableTimes();
      this._update();
  },

});

L.timeDimension.layer.geoJson = function(layer, options) {
  return new L.TimeDimension.Layer.GeoJson(layer, options);
};

/*jshint indent: 4, browser:true*/
/*global L*/


/*
* L.TimeDimension.Player
*/
//'use strict';
L.TimeDimension.Player = (L.Layer || L.Class).extend({

  includes: (L.Evented || L.Mixin.Events),
  initialize: function(options, timeDimension) {
      L.setOptions(this, options);
      this.checkBufferPreloadNeeded();
      this.mapState = timeDimension.options.mapState;
      this._timeDimension = timeDimension;
      this._paused = false;
      var frames = timeDimension._availableTimes.length;
      this.setTransitionTime(this.options.transitionTime || 1000);
      this._waitingForBuffer = false;
      this._loop = this.options.loop || false;
      this._steps = 1;
      this._timeDimension.on('timeload', (function(data) {
          this.release(); // free clock
          this._waitingForBuffer = false; // reset buffer
      }).bind(this));
      
      this._timeDimension.on('limitschanged availabletimeschanged timeload', (function(data) {
          this._timeDimension.prepareNextTimes(this._steps, this._minBufferReady, this._loop);
      }).bind(this));
  },

  // Determina si la animación deberá o no pre-cargar cuando empiece, basándose en el navegador,
  // y establece según el caso los parámetros de buffer y minBufferReady
  // checkBufferPreloadNeeded: function() {
  //     var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  //     this._preloadBuffer = !isChrome;
  //     this._preloadBufferCompleted = false;
  //     var shortAnimation = false; // frames <= 25;
  //     this._buffer = this.options.buffer || (isChrome ? 5 : shortAnimation ? frames : frames / 4);
  //     this._minBufferReady =  this.options.minBufferReady || (isChrome ? 1 : shortAnimation ? 1 : 0); 
  // },

  checkBufferPreloadNeeded: function() {
      var isValid = /webkit/.test(navigator.userAgent.toLowerCase()) || /firefox/.test(navigator.userAgent.toLowerCase());
      this._preloadBuffer = !isValid;
      this._preloadBufferCompleted = false;
      var shortAnimation = false; // frames <= 25;
      this._buffer = this.options.buffer || (isValid ? 5 : shortAnimation ? frames : frames / 4);
      this._minBufferReady =  this.options.minBufferReady || (isValid ? 1 : shortAnimation ? 1 : 0); 
  },


  // Determina si empezamos la pre-carga (estamos en la posición 0 y _preloadBuffer es true)
  checkStartBufferPreloading: function() {
      var minPosition = this._timeDimension.getCurrentTime() == this._timeDimension._availableTimes[0] 
      if (this._preloadBuffer && minPosition) {
          this.mapState.addLoading('playerPreload');
          jQuery('#sliderTimeElement').removeClass('knob');
          if (this._transitionTime != 100)
              this.setTransitionTime(100);
      }
  },

  // Determina si finalizamos la pre-carga (estamos en la última posición y _preloadBuffer es true)
  checkFinishBufferPreloading: function () {
      var maxForward = this._timeDimension.getCurrentTime() == this._timeDimension._availableTimes[this._timeDimension._availableTimes.length - 1] 
       if (maxForward && this._preloadBuffer) {
          this._preloadBuffer = false;
          this.mapState.removeLoading('playerPreload');
          jQuery('#sliderTimeElement').addClass('knob');
          this.setTransitionTime(this.options.transitionTime || 1000);
          this._timeDimension.setCurrentTime(this._timeDimension.getLowerLimit());
              
      }
  },

  _tick: function() {
      if (this._preloadBuffer) {
          this.checkStartBufferPreloading();
          this.checkFinishBufferPreloading();
      }
      var maxIndex = this._getMaxIndex();
      var maxForward = (this._timeDimension.getCurrentTimeIndex() >= maxIndex) && (this._steps > 0);
      var maxBackward = (this._timeDimension.getCurrentTimeIndex() == 0) && (this._steps < 0);
      if (maxForward || maxBackward) {
          if (!this._loop) {
              this.pause();
              this.stop();
              this.fire('animationfinished');
              return;
          }
      }

      if (this._paused) {
          return;
      }
      var numberNextTimesReady = 0,
          buffer = this._bufferSize;

      if (this._minBufferReady > 0) {
          numberNextTimesReady = this._timeDimension.getNumberNextTimesReady(this._steps, buffer, this._loop);
          // If the player was waiting, check if all times are loaded
          if (this._waitingForBuffer) {
              if (numberNextTimesReady < buffer) {
                  
                  this.fire('waiting', {
                      buffer: buffer,
                      available: numberNextTimesReady
                  });
                  return;
              } else {
                  // all times loaded
                  
                  this.fire('running');
                  this._waitingForBuffer = false;
              }
          } else {
              // aqui
              // check if player has to stop to wait and force to full all the buffer
              if (numberNextTimesReady < this._minBufferReady) {
                  
                  this._waitingForBuffer = true;
                  this._timeDimension.prepareNextTimes(this._steps, buffer, this._loop);
                  this.fire('waiting', {
                      buffer: buffer,
                      available: numberNextTimesReady
                  });
                  return;
              }
          }
      }
      this.pause();
      this._timeDimension.nextTime(this._steps, this._loop);
      if (buffer > 0) {
          this._timeDimension.prepareNextTimes(this._steps, buffer, this._loop);
      }
  },
  
  _getMaxIndex: function(){
     return Math.min(this._timeDimension.getAvailableTimes().length - 1, 
                     this._timeDimension.getUpperLimitIndex() || Infinity);
  },

  start: function(numSteps) {
      if (this._preloadBuffer) {
          this._timeDimension.setCurrentTime(this._timeDimension._availableTimes[0]);
      }
      if (this._intervalID) return;
      this._steps = numSteps || 1;
      this._waitingForBuffer = false;
      if (this.options.startOver){
          if (this._timeDimension.getCurrentTimeIndex() === this._getMaxIndex()){
               this._timeDimension.setCurrentTimeIndex(this._timeDimension.getLowerLimitIndex() || 0);
          }
      }
      this.release();
      this._intervalID = window.setInterval(
          L.bind(this._tick, this),
          this._transitionTime);
      this._tick();
      this.fire('play');
      this.fire('running');
      this.mapState.firstPlaying = false;
  },

  stop: function() {
      if (!this._intervalID) return;
      clearInterval(this._intervalID);
      this._intervalID = null;
      this._waitingForBuffer = false;
      this.fire('stop');
  },

  pause: function() {
      this._paused = true;
      
  },

  release: function () {
      this._paused = false;
  },

  getTransitionTime: function() {
      return this._transitionTime;
  },

  isPlaying: function() {
      return this._intervalID ? true : false;
  },

  isWaiting: function() {
      return this._waitingForBuffer;
  },
  isLooped: function() {
      return this._loop;
  },

  setLooped: function(looped) {
      this._loop = looped;
      this.fire('loopchange', {
          loop: looped
      });
  },

  setTransitionTime: function(transitionTime) {
      this._transitionTime = transitionTime;
      if (typeof this._buffer === 'function') {
          this._bufferSize = this._buffer.call(this, this._transitionTime, this._minBufferReady, this._loop);
          
      } else {
          this._bufferSize = this._buffer;
      }
      if (this._intervalID) {
          this.stop();
          this.start(this._steps);
      }
      this.fire('speedchange', {
          transitionTime: transitionTime,
          buffer: this._bufferSize
      });
  },

  getSteps: function() {
      return this._steps;
  }
});

/*jshint indent: 4, browser:true*/
/*global L*/

/*
* L.Control.TimeDimension: Leaflet control to manage a timeDimension
*/

L.UI = L.ui = L.UI || {};
L.UI.Knob = L.Draggable.extend({
  options: {
      className: 'knob',
      step: 1,
      rangeMin: 0,
      rangeMax: 10
          //minValue : null,
          //maxValue : null
  },
  initialize: function(slider, options) {
      L.setOptions(this, options);
      this._element = L.DomUtil.create('div', this.options.className || 'knob', slider);
      L.Draggable.prototype.initialize.call(this, this._element, this._element);
      this._container = slider;
      this.on('predrag', function() {
          this._newPos.y = 0;
          this._newPos.x = this._adjustX(this._newPos.x);
      }, this);
      this.on('dragstart', function() {
          L.DomUtil.addClass(slider, 'dragging');
      });
      this.on('dragend', function() {
          L.DomUtil.removeClass(slider, 'dragging');
      });
      L.DomEvent.on(this._element, 'dblclick', function(e) {
          this.fire('dblclick', e);
      }, this);
      L.DomEvent.disableClickPropagation(this._element);
      this.enable();
  },

  _getProjectionCoef: function() {
      return (this.options.rangeMax - this.options.rangeMin) / (this._container.offsetWidth || this._container.style.width);
  },
  _update: function() {
      this.setPosition(L.DomUtil.getPosition(this._element).x);
  },
  _adjustX: function(x) {
      var value = this._toValue(x) || this.getMinValue();
      return this._toX(this._adjustValue(value));
  },

  _adjustValue: function(value) {
      value = Math.max(this.getMinValue(), Math.min(this.getMaxValue(), value)); //clamp value
      value = value - this.options.rangeMin; //offsets to zero

      //snap the value to the closet step
      value = Math.round(value / this.options.step) * this.options.step;
      value = value + this.options.rangeMin; //restore offset
      value = Math.round(value * 100) / 100; // *100/100 to avoid floating point precision problems

      return value;
  },

  _toX: function(value) {
      var x = (value - this.options.rangeMin) / this._getProjectionCoef();
      //
      return x;
  },

  _toValue: function(x) {
      var v = x * this._getProjectionCoef() + this.options.rangeMin;
      if (this.tale)
          jQuery(this.tale).css('width', Math.round(x).toString() + "px");
      return v;
  },

  getMinValue: function() {
      return this.options.minValue || this.options.rangeMin;
  },
  getMaxValue: function() {
      return this.options.maxValue || this.options.rangeMax;
  },

  setStep: function(step) {
      this.options.step = step;
      this._update();
  },

  setPosition: function(x) {
      L.DomUtil.setPosition(this._element,
          L.point(this._adjustX(x), 0));
      this.fire('positionchanged');
  },
  getPosition: function() {
      return L.DomUtil.getPosition(this._element).x;
  },

  setValue: function(v) {
      //
      this.setPosition(this._toX(v));
  },

  getValue: function() {
      return this._adjustValue(this._toValue(this.getPosition()));
  }
});


/*
* L.Control.TimeDimension: Leaflet control to manage a timeDimension
*/

L.Control.TimeDimension = L.Control.extend({
  options: {
      styleNS: 'leaflet-control-timecontrol',
      position: 'bottomleft',
      title: 'Time Control',
      backwardButton: true,
      forwardButton: true,
      playButton: true,
      playReverseButton: false,
      loopButton: false,
      displayDate: true,
      timeSlider: true,
      timeSliderDragUpdate: false,
      limitSliders: false,
      limitMinimumRange: 5,
      speedSlider: true,
      minSpeed: 0.1, // 0.35,
      maxSpeed: 10,
      speedStep: 0.05,
      timeSteps: 1,
      autoPlay: false,
      playerOptions: {
          transitionTime: 1000
      }
  },

  initialize: function(options) {
      L.Control.prototype.initialize.call(this, options);
      this._dateUTC = true;
      this._timeDimension = this.options.timeDimension || null;
  },

  onAdd: function(map) {
      var container;
      this._map = map;
      if (!this._timeDimension && map.timeDimension) {
          this._timeDimension = map.timeDimension;
          this.mapState = map.timeDimension.options.mapState;
      }
      this._initPlayer();
     
      var classesStr = !this.mapState.isWidget 
      ? 'leaflet-bar leaflet-bar-horizontal leaflet-bar-timecontrol left-for-google-logo' 
      : 'leaflet-bar leaflet-bar-horizontal leaflet-bar-timecontrol';
      container = L.DomUtil.create('div', classesStr);
      if (this.options.timeSlider) {
          var timeSliderClass = this.options.minimized ? 'timecontrol-datesliderMin' : 'timecontrol-dateslider';
          this._sliderTime = this._createSliderTime(this.options.styleNS + ' timecontrol-slider ' + timeSliderClass, container);
          this._sliderTime._element.id = "sliderTimeElement";
          this._sliderTime.tale = L.DomUtil.create('div', this.options.styleNS + ' slider slider-tale', container);
      }
      if (this.options.backwardButton) {
          this._buttonBackward = this._createButton('Backward', container);
      }
      if (this.options.playReverseButton) {
          this._buttonPlayReversePause = this._createButton('Play Reverse', container);
      }
      if (this.options.playButton) {
          this._buttonPlayPause = this._createButton('Play', container);
      }
      if (this.options.forwardButton) {
          this._buttonForward = this._createButton('Forward', container);
      }
      if (this.options.speedSlider && !this.options.minimized  && !PC.mobile_device) {
          this._sliderSpeed = this._createSliderSpeed(this.options.styleNS + ' timecontrol-slider timecontrol-speed', container);
          this._sliderSpeed.tale = L.DomUtil.create('div', this.options.styleNS + ' slider slider-speed-tale', container);
      }
      if (this.options.loopButton) {
          this._buttonLoop = this._createButton('Loop', container);
      }
      if (!PC.mobile_device && this.options.displayDate) {
          var title = !this.options.minimized ? 'Date' : 'DateMin';
          this._displayDate = this._createButton(title, container);
      }
     
      this._steps = this.options.timeSteps || 1;

      this._timeDimension.on('timeload',  this._update, this);
      this._timeDimension.on('timeload',  this._onPlayerStateChange, this);
      this._timeDimension.on('timeloading', this._onTimeLoading, this);

      this._timeDimension.on('limitschanged availabletimeschanged', this._onTimeLimitsChanged, this);

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.on(container, 'mousemove', (ev) => {
          L.DomEvent.stopPropagation(ev);
          this.mapState.outOfMap = true;
      });

      return container;
  },
  addTo: function() {
      //To be notified AFTER the component was added to the DOM
      L.Control.prototype.addTo.apply(this, arguments);
      this._onPlayerStateChange();
      this._onTimeLimitsChanged();
      this._update();
      return this;
  },
  onRemove: function() {
      this.mapState.removeLoading('player')
      this._player.off('play stop running loopchange speedchange', this._onPlayerStateChange, this);
      this._player.off('waiting', this._onPlayerWaiting, this);
      //this._player = null;  keep it for later re-add

      this._timeDimension.off('timeload',  this._update, this);
      this._timeDimension.off('timeload',  this._onPlayerStateChange, this);
      this._timeDimension.off('timeloading', this._onTimeLoading, this);
      this._timeDimension.off('limitschanged availabletimeschanged', this._onTimeLimitsChanged, this);
  },

  _initPlayer: function() {
      if (!this._player){ // in case of remove/add
          if (this.options.player) {
              this._player = this.options.player;
          } else {
              this._player = new L.TimeDimension.Player(this.options.playerOptions, this._timeDimension);
          }
      }
      if (this.options.autoPlay) {
          this._player.start(this._steps);
      }
      // else  {
      //     this.mapState.setVisibleParticleLayers(false);
      // }
      this._player.on('play stop running loopchange speedchange', this._onPlayerStateChange, this);
      this._player.on('waiting', this._onPlayerWaiting, this);
      this._onPlayerStateChange();
  },

  _onTimeLoading : function(data) {
      if (data.time == this._timeDimension.getCurrentTime()) {
          if (this._displayDate) {
              //L.DomUtil.addClass(this._displayDate, 'loading');
              this.mapState.addLoading('player');
          }
      }
  },

  _onTimeLimitsChanged: function() {
      var lowerIndex = this._timeDimension.getLowerLimitIndex(),
          upperIndex = this._timeDimension.getUpperLimitIndex(),
          max = this._timeDimension.getAvailableTimes().length - 1;

      if (this._limitKnobs) {
          this._limitKnobs[0].options.rangeMax = max;
          this._limitKnobs[1].options.rangeMax = max;
          this._limitKnobs[0].setValue(lowerIndex || 0);
          this._limitKnobs[1].setValue(upperIndex || max);
      }
      if (this._sliderTime) {
          this._sliderTime.options.rangeMax = max;
          this._sliderTime._update();
      }
  },

  _onPlayerWaiting: function(evt) {
      if (this._buttonPlayPause && this._player.getSteps() > 0) {
          //L.DomUtil.addClass(this._buttonPlayPause, 'loading');
          this.mapState.addLoading('player');
          //this._buttonPlayPause.innerHTML = this._getDisplayLoadingText(evt.available, evt.buffer);
      }
      if (this._buttonPlayReversePause && this._player.getSteps() < 0) {
          //L.DomUtil.addClass(this._buttonPlayReversePause, 'loading');
          this.mapState.addLoading('player');
          //this._buttonPlayReversePause.innerHTML = this._getDisplayLoadingText(evt.available, evt.buffer);
      }
  },
  _onPlayerStateChange: function() {
      if (this._buttonPlayPause) {
          if (this._player.isPlaying() && this._player.getSteps() > 0) {
              L.DomUtil.addClass(this._buttonPlayPause, 'pause');
              L.DomUtil.removeClass(this._buttonPlayPause, 'play');
          } else {
              L.DomUtil.removeClass(this._buttonPlayPause, 'pause');
              L.DomUtil.addClass(this._buttonPlayPause, 'play');
          }
          if (this._player.isWaiting() && this._player.getSteps() > 0) {
              //L.DomUtil.addClass(this._buttonPlayPause, 'loading');
              this.mapState.addLoading('player');
          } else {
              this._buttonPlayPause.innerHTML = '';
              //L.DomUtil.removeClass(this._buttonPlayPause, 'loading');
              this.mapState.removeLoading('player');
          }
      }
      if (this._buttonPlayReversePause) {
          if (this._player.isPlaying() && this._player.getSteps() < 0) {
              L.DomUtil.addClass(this._buttonPlayReversePause, 'pause');
          } else {
              L.DomUtil.removeClass(this._buttonPlayReversePause, 'pause');
          }
          if (this._player.isWaiting() && this._player.getSteps() < 0) {
              //L.DomUtil.addClass(this._buttonPlayReversePause, 'loading');
              this.mapState.addLoading('player');
          } else {
              this._buttonPlayReversePause.innerHTML = '';
              //L.DomUtil.removeClass(this._buttonPlayReversePause, 'loading');
              this.mapState.removeLoading('player');
          }
      }
      if (this._buttonLoop) {
          if (this._player.isLooped()) {
              L.DomUtil.addClass(this._buttonLoop, 'looped');
          } else {
              L.DomUtil.removeClass(this._buttonLoop, 'looped');
          }
      }
      if (this._sliderSpeed && !this._draggingSpeed) {
          var speed =  this._player.getTransitionTime() || 1000;//transitionTime
          speed = Math.round(10000 / speed) /10; // 1s / transition
          this._sliderSpeed.setValue(speed);
      }
  },

  _update: function() {
      if (!this._timeDimension) {
          return;
      }
      if (this._timeDimension.getCurrentTimeIndex() >= 0) {
          var date = new Date(this._timeDimension.getCurrentTime());
          if (this._displayDate) {
              if (this._map.timeDimensionControl._player._preloadBuffer && this._map.timeDimensionControl._player.isPlaying()) {
                  L.DomUtil.addClass(this._displayDate, 'blink_me');
                  this._displayDate.innerHTML = this._map.timeDimensionControl.mapState.getVueInstance().$t('{playerLoading}') + " " + Math.round(this._sliderTime.getValue() * 100 / this._sliderTime.getMaxValue()) + "%";
                  
              }
              else {
                  L.DomUtil.removeClass(this._displayDate, 'blink_me');
                  this._displayDate.innerHTML = this._getDisplayDateFormat(date);
              }
          }
          if (this._sliderTime && !this._slidingTimeSlider) {
              this._sliderTime.setValue(this._timeDimension.getCurrentTimeIndex());
          }
      } else {
          if (this._displayDate) {
              this._displayDate.innerHTML = this._getDisplayNoTimeError();
          }
      }
  },

  _createButton: function(title, container) {
      var link = L.DomUtil.create('a', this.options.styleNS + ' timecontrol-' + title.toLowerCase(), container);
      link.href = '#';
      link.title = this._map.timeDimensionControl.mapState.getVueInstance().$t('{buttonPlayer' + title + '}');

      L.DomEvent
          .addListener(link, 'click', L.DomEvent.stopPropagation)
          .addListener(link, 'click', L.DomEvent.preventDefault)
          .addListener(link, 'click', this['_button' + title.replace(/ /i, '') + 'Clicked'], this)
          .addListener(link, 'mouseover', this['_buttonHover'], this)
          .addListener(link, 'mouseout', this['_buttonOut'], this);

         
      //link.addListener('dblclick', this['_button' + title.replace(/ /i, '') + 'Hover'], false);

      return link;
  },

  _createSliderTime: function(className, container) {
      var sliderContainer,
          sliderbar,
          max,
          knob, limits;
      sliderContainer = L.DomUtil.create('div', className, container);
      sliderContainer.title = this._map.timeDimensionControl.mapState.getVueInstance().$t('{playerProgressBar}');;
      /*L.DomEvent
          .addListener(sliderContainer, 'click', L.DomEvent.stopPropagation)
          .addListener(sliderContainer, 'click', L.DomEvent.preventDefault);*/

      sliderbar = L.DomUtil.create('div', 'slider', sliderContainer);
      max = this._timeDimension.getAvailableTimes().length - 1;

      if (this.options.limitSliders) {
          limits = this._limitKnobs = this._createLimitKnobs(sliderbar);
      }
      knob = new L.UI.Knob(sliderbar, {
          className: 'knob main',
          rangeMin: 0,
          rangeMax: max
      });
      knob.on('dragend', function(e) {
          var value = e.target.getValue();
          this._sliderTimeValueChanged(value);
          this._slidingTimeSlider = false;
      }, this);
      knob.on('drag', function(e) {
          this._slidingTimeSlider = true;
          var time = this._timeDimension.getAvailableTimes()[e.target.getValue()];
          if (time) {
              var date = new Date(time);
              if (this._displayDate) {
                this._displayDate.innerHTML = this._getDisplayDateFormat(date);
              }
              if (this.options.timeSliderDragUpdate){
                  this._sliderTimeValueChanged(e.target.getValue());
              }
          }
      }, this);

      knob.on('predrag', function() {
          var minPosition, maxPosition;
          if (limits) {
              //limits the position between lower and upper knobs
              minPosition = limits[0].getPosition();
              maxPosition = limits[1].getPosition();
              if (this._newPos.x < minPosition) {
                  this._newPos.x = minPosition;
              }
              if (this._newPos.x > maxPosition) {
                  this._newPos.x = maxPosition;
              }
          }
      }, knob);
      L.DomEvent.on(sliderbar, 'click', function(e) {
          if (L.DomUtil.hasClass(e.target, 'knob')) {
              return; //prevent value changes on drag release
          }
          var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
              x = L.DomEvent.getMousePosition(first, sliderbar).x;
          if (limits) { // limits exits
              if (limits[0].getPosition() <= x && x <= limits[1].getPosition()) {
                  knob.setPosition(x);
                  this._sliderTimeValueChanged(knob.getValue());
              }
          } else {
              knob.setPosition(x);
              this._sliderTimeValueChanged(knob.getValue());
          }

      }, this);
      knob.setPosition(0);

      return knob;
  },


  _createLimitKnobs: function(sliderbar) {
      L.DomUtil.addClass(sliderbar, 'has-limits');
      var max = this._timeDimension.getAvailableTimes().length - 1;
      var rangeBar = L.DomUtil.create('div', 'range', sliderbar);
      var lknob = new L.UI.Knob(sliderbar, {
          className: 'knob lower',
          rangeMin: 0,
          rangeMax: max
      });
      var uknob = new L.UI.Knob(sliderbar, {
          className: 'knob upper',
          rangeMin: 0,
          rangeMax: max
      });


      L.DomUtil.setPosition(rangeBar, 0);
      lknob.setPosition(0);
      uknob.setPosition(max);

      //Add listeners for value changes
      lknob.on('dragend', function(e) {
          var value = e.target.getValue();
          this._sliderLimitsValueChanged(value, uknob.getValue());
      }, this);
      uknob.on('dragend', function(e) {
          var value = e.target.getValue();
          this._sliderLimitsValueChanged(lknob.getValue(), value);
      }, this);

      //Add listeners to position the range bar
      lknob.on('drag positionchanged', function() {
          L.DomUtil.setPosition(rangeBar, L.point(lknob.getPosition(), 0));
          rangeBar.style.width = uknob.getPosition() - lknob.getPosition() + 'px';
      }, this);

      uknob.on('drag positionchanged', function() {
          rangeBar.style.width = uknob.getPosition() - lknob.getPosition() + 'px';
      }, this);

      //Add listeners to prevent overlaps
      uknob.on('predrag', function() {
          //bond upper to lower
          var lowerPosition = lknob._toX(lknob.getValue() + this.options.limitMinimumRange);
          if (uknob._newPos.x <= lowerPosition) {
              uknob._newPos.x = lowerPosition;
          }
      }, this);

      lknob.on('predrag', function() {
          //bond lower to upper
          var upperPosition = uknob._toX(uknob.getValue() - this.options.limitMinimumRange);
          if (lknob._newPos.x >= upperPosition) {
              lknob._newPos.x = upperPosition;
          }
      }, this);

      lknob.on('dblclick', function() {
          this._timeDimension.setLowerLimitIndex(0);
      }, this);
      uknob.on('dblclick', function() {
          this._timeDimension.setUpperLimitIndex(this._timeDimension.getAvailableTimes().length - 1);
      }, this);

      return [lknob, uknob];
  },


  _createSliderSpeed: function(className, container) {
      var sliderContainer = L.DomUtil.create('div', className, container);
      sliderContainer.title = this._map.timeDimensionControl.mapState.getVueInstance().$t('{playerSpeedSlider}');
      /* L.DomEvent
          .addListener(sliderContainer, 'click', L.DomEvent.stopPropagation)
          .addListener(sliderContainer, 'click', L.DomEvent.preventDefault);
*/
      var speedLabel = L.DomUtil.create('span', 'speed', sliderContainer);
      var sliderbar = L.DomUtil.create('div', 'slider', sliderContainer);
      var initialSpeed = Math.round(10000 / (this._player.getTransitionTime() || 1000)) / 10;
      speedLabel.innerHTML = this._getDisplaySpeed(initialSpeed);

      var knob = new L.UI.Knob(sliderbar, {
          step: this.options.speedStep,
          rangeMin: this.options.minSpeed,
          rangeMax: this.options.maxSpeed
      });

      knob.on('dragend', function(e) {
          var value = e.target.getValue();
          this._draggingSpeed = false;
          speedLabel.innerHTML = this._getDisplaySpeed(value);
          this._sliderSpeedValueChanged(value);
      }, this);
      knob.on('drag', function(e) {
          this._draggingSpeed = true;
          speedLabel.innerHTML = this._getDisplaySpeed(e.target.getValue());
      }, this);
       knob.on('positionchanged', function (e) {
          speedLabel.innerHTML = this._getDisplaySpeed(e.target.getValue());
      }, this);

      L.DomEvent.on(sliderbar, 'click', function(e) {
          if (e.target === knob._element) {
              return; //prevent value changes on drag release
          }
          var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
              x = L.DomEvent.getMousePosition(first, sliderbar).x;
          knob.setPosition(x);
          speedLabel.innerHTML = this._getDisplaySpeed(knob.getValue());
          this._sliderSpeedValueChanged(knob.getValue());
      }, this);
      return knob;
  },

  _buttonBackwardClicked: function() {
      this._timeDimension.previousTime(this._steps);
  },

  _buttonForwardClicked: function() {
      this._timeDimension.nextTime(this._steps);
  },
  _buttonLoopClicked: function() {
      this._player.setLooped(!this._player.isLooped());
  },

  _buttonPlayClicked: function() {
      if (this._player.isPlaying()) {
          this._player.stop();
          //this.mapState.playerPaused = true;
      } else {
          this._player.start(this._steps);
          //this.mapState.playerPaused = false;
      }
  },

  _buttonPlayReverseClicked: function() {
      if (this._player.isPlaying()) {
          this._player.stop();
      } else {
          this._player.start(this._steps * (-1));
      }
  },

  _buttonDateClicked: function(){
      //this._toggleDateUTC();
  },

  _buttonDateMinClicked: function(){
      //this._toggleDateUTC();
  },

  _buttonHover: function(){
      // if (this.mapState.dateRangeTimeOut)
      //     clearTimeout(this.mapState.dateRangeTimeOut);
      // this.mapState.playerDateRangeVisibility = true;
  },

  _buttonOut: function(){
      // this.mapState.dateRangeTimeOut = setTimeout(() => {
      //     this.mapState.playerDateRangeVisibility = false;    
      // }, 750);
  },

  _sliderTimeValueChanged: function(newValue) {
      //var time = this._timeDimension._availableTimes[newValue];
      //this.mapState.setCurrentPlayerTime(time);
      this.mapState.setCurrentTimeIndex(newValue);
      this.mapState.setVisibleParticleLayers(false);
      this._timeDimension.setCurrentTimeIndex(newValue);
  },

  _sliderLimitsValueChanged: function(lowerLimit, upperLimit) {
      this._timeDimension.setLowerLimitIndex(lowerLimit);
      this._timeDimension.setUpperLimitIndex(upperLimit);
  },

  _sliderSpeedValueChanged: function(newValue) {
      this._player.setTransitionTime(1000 / newValue);
  },

  _toggleDateUTC: function() {
      if (this._dateUTC) {
          L.DomUtil.removeClass(this._displayDate, 'utc');
          this._displayDate.title = 'Local Time';
      } else {
          L.DomUtil.addClass(this._displayDate, 'utc');
          this._displayDate.title = 'UTC Time';
      }
      this._dateUTC = !this._dateUTC;
      this._update();
  },

  _getDisplayDateFormat: function(date) {
      //return this._dateUTC ? date.toISOString() : date.toLocaleString();
      var locale = this._map.timeDimensionControl.mapState.getVueInstance().$getLocale();
      var options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', timeZone: 'UTC', hour12: false };
      return this._dateUTC ? date.toLocaleDateString(locale == 'es' ? 'es-ES' : 'en-US', options).replaceAll(',','').replaceAll('.','') : date.toLocaleString();
  },
  _getDisplaySpeed: function(fps) {
      return fps + 'fps';
  },
  _getDisplayLoadingText: function(available, buffer) {
      return '<span>' + Math.floor(available / buffer * 100) + '%</span>';
  },
  _getDisplayNoTimeError: function() {
      return 'Time not available';
  }

});

L.Map.addInitHook(function() {
  if (this.options.timeDimensionControl) {
      this.timeDimensionControl = L.control.timeDimension(this.options.timeDimensionControlOptions || {});
      this.addControl(this.timeDimensionControl);
  }
});

L.control.timeDimension = function(options) {
  return new L.Control.TimeDimension(options);
};


