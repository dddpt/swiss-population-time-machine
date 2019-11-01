"use strict";

/**
 * Class handling Internationalisation
 *
 * The basics:
 * 1) It uses (flat) dictionaries key->translation for each language.
 * 2) Each tag containing text should have a tag attribute "data-i18n" containing the corresponding dictionary key.
 *    Internationalisation constantly watches for changes to "data-i18n" attributes, so they can be added or removed on-the-fly
 * It also handles dynamic content:
 * 3) dynamic data for each tag can be held as JSON in its "data-i18n-data" attribute, to add data, you can use i18n.data().
 *    The data in the "data-i18n-data" can be any valid JSON object.
 * 4) Texts are dynamically modified by adding a function to the corresponding "data-i18n" keys in
 *    Internationalisation "dynamic" dictionary. those function should be of the form function(str,JSONdata) -> str.
 *
 *
 * For example:
 * <div class="node-name" spellcheck="false" data-i18n="node-name-you" maxlength="26" rows="2"></div>
 * Indicates that this div contains the text corresponding to "node-name-you"
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Internationalisation = function () {

  /**
   *
   * @param {Array[string]} supportedLanguages an array of language string identifiers (e.g ["en", "fr","de"])
   * @param {function} languageLoader a (possibly async) function taking as argument a language string from
   *         supportedLanguages and returning the translations.
   * @param {string} lng a language string identifier, the chosen language to display the website.
   * @param {dictionary[string,function]} dynamic a dictionary str->function to handle dynamic content.
   * @param {string} keyAttr the name of the html5 attribute to watch for keys, by default "data-i18n"
   * @param {string} dataAttr the name of the html5 attribute to watch for data, by default "data-i18n-data".
   */
  function Internationalisation(supportedLanguages, languageLoader) {
    var lng = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var dynamic = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var keyAttr = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "data-i18n";
    var dataAttr = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : "data-i18n-data";
    var useLocalStorage = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : true;

    _classCallCheck(this, Internationalisation);

    this.dynamic = dynamic;
    this.keyAttr = keyAttr;
    this.dataAttr = dataAttr;
    this.useLocalStorage = useLocalStorage;
    this.supportedLanguages = supportedLanguages;
    this.defaultLanguage = this.supportedLanguages[0];
    this.languageChangeCallbacks = [];
    // take language from url (if lng param present): on all browsers but IE
    if (!(navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1)) {
      //not-IE detection
      var params = new URL(document.location).searchParams;
      if (supportedLanguages.includes(params.get("lng"))) {
        lng = params.get("lng");
      }
    }
    this.lng = lng;
    // try to take it from navigator.language:
    if (!this.lng) {
      this.lng = this.supportedLanguages.find(function (ln) {
        return navigator.language.match(ln);
      });
    }
    // try to take it from navigator.languageS:
    if (!this.lng && navigator.languages) {
      this.lng = this.supportedLanguages.find(function (ln) {
        return navigator.languages.includes(ln);
      });
    }
    //otherwise, use default:
    if (!this.lng) {
      this.lng = this.defaultLanguage;
    }
    this.languageLoader = languageLoader;
    this.translations = {};
    // translationsPromises: ensure we await the translations are loaded before we t()/fill()/refresh()
    this.translationsPromises = {};

    // observerConfig: we follow changes to this.keyAttr (="data-i18n") attribute
    this._observerConfig = {
      attributes: true,
      attributeFilter: [this.keyAttr, this.dataAttr],
      subtree: true

      // function wrapper needed as "this" will actually refer to the MutationObserver
    };var mutationCallback = function (obj) {
      return function (mutations) {
        mutations.forEach(function (m) {
          return obj.fill(m.target);
        });
      };
    }(this);

    this._observer = new MutationObserver(mutationCallback);

    this.changeLanguage(this.lng);
  }

  /** Get or sets the data for the given data-i18n key
   *
   * @param {str} key a data-i18n key
   * @param {Object} data null to get the current data, or an object to set the data for the key
   */


  _createClass(Internationalisation, [{
    key: "data",
    value: function data(key) {
      var _data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var elList = document.querySelectorAll("[" + this.keyAttr + "=" + key + "]");
      if (elList.length == 0) {
        return null;
      }
      if (!_data) {
        return elList[0];
      }
      _data = JSON.stringify(_data);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = elList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var el = _step.value;

          el.setAttribute(this.dataAttr, _data);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    /** Gives text in currently selected language, with optional string formatter
     * @param {string} key a valid translation key
     * @param {Object} data data for the formatter (or an array of replacements for {})
     * @param {function(string, data): string} formatter an optional formatter, by default the corresponding function in this.dynamic
     */

  }, {
    key: "t",
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(key) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
        var formatter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.dynamic[key];
        var lng = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.lng;

        var text, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, d;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.translationsPromises[lng];

              case 2:
                //console.log("t(), key: ",key,", data: ", data, ", formatter: ",formatter)
                text = this.translations[lng][key];
                //console.log("t(), text: ", text)

                if (!formatter) {
                  _context.next = 7;
                  break;
                }

                text = formatter(text, data);
                _context.next = 26;
                break;

              case 7:
                _iteratorNormalCompletion2 = true;
                _didIteratorError2 = false;
                _iteratorError2 = undefined;
                _context.prev = 10;

                for (_iterator2 = data[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  d = _step2.value;

                  text = text.replace("{}", d);
                }
                _context.next = 18;
                break;

              case 14:
                _context.prev = 14;
                _context.t0 = _context["catch"](10);
                _didIteratorError2 = true;
                _iteratorError2 = _context.t0;

              case 18:
                _context.prev = 18;
                _context.prev = 19;

                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }

              case 21:
                _context.prev = 21;

                if (!_didIteratorError2) {
                  _context.next = 24;
                  break;
                }

                throw _iteratorError2;

              case 24:
                return _context.finish(21);

              case 25:
                return _context.finish(18);

              case 26:
                return _context.abrupt("return", text);

              case 27:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[10, 14, 18, 26], [19,, 21, 25]]);
      }));

      function t(_x10) {
        return _ref.apply(this, arguments);
      }

      return t;
    }()

    /** fills the given DOM node with its text in the current language.
     */

  }, {
    key: "fill",
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(DOMnode) {
        var key, data;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!DOMnode.hasAttribute(this.keyAttr)) {
                  _context2.next = 9;
                  break;
                }

                key = DOMnode.getAttribute(this.keyAttr);
                // if tag also as i18n data fill the text with it

                data = DOMnode.hasAttribute(this.dataAttr) ? JSON.parse(DOMnode.getAttribute(this.dataAttr)) : [];
                //console.log(DOMnode, "to be filled with key: '"+key+"' and data: ", data)

                _context2.next = 5;
                return this.t(key, data);

              case 5:
                DOMnode.innerHTML = _context2.sent;
                return _context2.abrupt("return", DOMnode.innerHTML);

              case 9:
                return _context2.abrupt("return", -1);

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function fill(_x11) {
        return _ref2.apply(this, arguments);
      }

      return fill;
    }()

    /** Observe changes to the given DOM node for translations.
     */

  }, {
    key: "observe",
    value: function observe() {
      var DOMnode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

      return this._observer.observe(DOMnode, this._observerConfig);
    }

    /** refreshes the translations of the given DOM node and its subtree.
     */

  }, {
    key: "refresh",
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var _this = this;

        var DOMnode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt("return", Promise.all([].concat(_toConsumableArray(DOMnode.querySelectorAll("[" + this.keyAttr + "]"))).map(function (n) {
                  return _this.fill(n);
                })));

              case 1:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function refresh() {
        return _ref3.apply(this, arguments);
      }

      return refresh;
    }()

    /** Loads the asked language.
     * @param {string} lng language string identifier
     */

  }, {
    key: "loadLanguage",
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(lng) {
        var translation;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                translation = this.useLocalStorage ? this.loadLngFromLocalStorage(lng) : false;

                if (!translation) {
                  _context4.next = 5;
                  break;
                }

                this.translations[lng] = translation;
                _context4.next = 10;
                break;

              case 5:
                this.translationsPromises[lng] = this.languageLoader(lng);
                _context4.next = 8;
                return this.translationsPromises[lng];

              case 8:
                this.translations[lng] = _context4.sent;

                if (this.useLocalStorage) {
                  this.saveLngToLocalStorage(lng);
                }

              case 10:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function loadLanguage(_x14) {
        return _ref4.apply(this, arguments);
      }

      return loadLanguage;
    }()

    /** Change to given language, handles the loading of translations if needed
     * @param {string} lng language string identifier
     */

  }, {
    key: "changeLanguage",
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(lng) {
        var oldLng;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                oldLng = this.lng;

                this.lng = lng;

                if (this.translations[lng]) {
                  _context5.next = 11;
                  break;
                }

                _context5.prev = 3;
                _context5.next = 6;
                return this.loadLanguage(lng);

              case 6:
                _context5.next = 11;
                break;

              case 8:
                _context5.prev = 8;
                _context5.t0 = _context5["catch"](3);

                console.log('Unable to change language, loading of translations for "' + lng + '" failed. Error: ', _context5.t0);

              case 11:
                if (!this.translations[lng]) {
                  _context5.next = 15;
                  break;
                }

                _context5.next = 14;
                return this.refresh();

              case 14:
                this.languageChangeCallbacks.forEach(function (cb) {
                  return cb(oldLng, lng);
                });

              case 15:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[3, 8]]);
      }));

      function changeLanguage(_x15) {
        return _ref5.apply(this, arguments);
      }

      return changeLanguage;
    }()
  }, {
    key: "loadLngFromLocalStorage",
    value: function loadLngFromLocalStorage(lng) {
      var transKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "translation." + lng;
      var saveDateKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "translation_save_date." + lng;

      var transDict = localStorage.getItem(transKey);
      var transDictSaveDate = +localStorage.getItem(saveDateKey);
      if (Boolean(transDict) & transDictSaveDate + 2 * 3600 * 1000 >= +new Date()) {
        return JSON.parse(transDict);
      }
      return null;
    }
  }, {
    key: "saveLngToLocalStorage",
    value: function saveLngToLocalStorage(lng) {
      var transKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "translation." + lng;
      var saveDateKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "translation_save_date." + lng;

      localStorage.setItem(transKey, JSON.stringify(this.translations[lng]));
      localStorage.setItem(saveDateKey, +new Date());
    }
  }, {
    key: "resetLngLocalStorage",
    value: function resetLngLocalStorage() {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.supportedLanguages[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var lng = _step3.value;

          localStorage.setItem("translation." + lng, null);
          localStorage.setItem("translation_save_date." + lng, null);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }]);

  return Internationalisation;
}();