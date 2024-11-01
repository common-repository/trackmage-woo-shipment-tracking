"use strict";

(function ($, window, document, undefined) {
  var params = {
    wizard: trackmageWizard
  };
  var wizard = {
    _instanse: null,
    _container: '',
    _progressbar: '#progressbar',
    _steps: [],
    _stepsContainer: '.steps-container',
    _stepContainerClass: 'tab-pane',
    _loader: '.wizard-loader',
    _errorsContainer: '.wizard-header',
    _validators: [],
    init: function init(container, steps) {
      var self = this;
      self._container = container;
      self._steps = steps;
      self._buildHtml();
      self._instanse = $(this._container).bootstrapWizard({
        'tabClass': 'nav nav-pills',
        'nextSelector': '.btn-next',
        'previousSelector': '.btn-previous',
        'finishSelector': '.btn-finish',
        onFinish: function onFinish(tab, navigation, index) {
          var $step = $(tab).attr('id');
          if (typeof self._validators[$step] !== "undefined" && !$('#step-' + $step).find('form').eq(0).valid()) {
            self._validators[$step].focusInvalid();
            return false;
          }
          if ($(tab).hasClass('changed') || !$(tab).hasClass('completed')) {
            $(self._loader).show();
            var $data = $('#step-' + $step).find('input, select').serialize();
            $data += "&step=" + $step;
            self.processStep($data, $step, function () {
              $(self._container).bootstrapWizard('finish');
            });
            return false;
          } else {
            window.location.href = params.wizard.urls.completed;
          }
        },
        onNext: function onNext(tab, navigation, index) {
          var $step = $(tab).attr('id');
          if (typeof self._validators[$step] !== "undefined" && !$('#step-' + $step).find('form').eq(0).valid()) {
            self._validators[$step].focusInvalid();
            return false;
          }
          if ($(tab).hasClass('changed') || !$(tab).hasClass('completed')) {
            $(self._loader).show();
            var $data = $('#step-' + $step).find('input, select').serialize();
            $data += "&step=" + $step;
            self.processStep($data, $step, function () {
              $(self._container).bootstrapWizard('next');
            });
            return false;
          } else {
            $(tab).addClass('completed');
            $(self._errorsContainer).html('');
            return true;
          }
        },
        onInit: function onInit(tab, navigation, index) {},
        onTabClick: function onTabClick(tab, navigation, index) {
          return false;
        },
        onTabShow: function onTabShow(tab, navigation, index) {
          if ($(tab).hasClass('reload')) self.getStepContent(tab);
          navigation.find('li').removeClass('active');
          $(tab).addClass('active');
          var $total = navigation.find('li').length;
          var $current = index + 1;
          var $wizard = navigation.closest('.wizard-card');

          // If it's the last tab then hide the last button and show the finish instead
          if ($current >= $total) {
            $($wizard).find('.btn-next').hide();
            $($wizard).find('.btn-finish').show();
          } else if ($current == 1) {
            $($wizard).find('.btn-previous').hide();
          } else {
            $($wizard).find('.btn-next').show();
            $($wizard).find('.btn-previous').show();
            $($wizard).find('.btn-finish').hide();
          }
        }
      }).data('bootstrapWizard');
    },
    _buildHtml: function _buildHtml() {
      var self = this;
      $(self._progressbar).html('');
      $(self._stepsContainer).html('');
      $.each(this._steps, function (idx, step) {
        var _btn = $('<li><a data-toggle="tab" href="#step-' + step.code + '">' + step.title + '</a></li>').attr('id', step.code).addClass('reload');
        var _step = $('<div></div>').addClass(self._stepContainerClass).attr('id', 'step-' + step.code).html('Step ' + step.title);
        $(self._progressbar).append(_btn);
        $(self._stepsContainer).append(_step);
      });
    },
    getStepContent: function getStepContent(tab) {
      var self = this;
      var step = $(tab).attr('id');
      var data = {
        action: "trackmage_wizard_get_step_content",
        step: step
      };
      $.ajax({
        url: params.wizard.urls.ajax,
        method: "post",
        data: data,
        beforeSend: function beforeSend() {
          $(self._loader).show();
        },
        success: function success(response) {
          if (response.success) {
            $('#step-' + step).html(response.data.html);
            $('#step-' + step).find('input, select').on('paste, change', function () {
              $(tab).addClass('changed');
            });
            var required = $('#step-' + step).find('.required');
            if (required.length > 0) {
              var rules = {};
              var messages = {};
              $.each(required, function (idx, el) {
                var name = $(el).attr('name');
                rules[name] = {
                  required: true
                };
                messages[name] = {
                  required: "Field is required!"
                };
              });
              self._validators[step] = $('#step-' + step).find('form').eq(0).validate({
                rules: rules,
                messages: messages,
                onsubmit: false,
                errorElement: "div",
                errorPlacement: function errorPlacement(error, element) {
                  error.appendTo(element.parent()).addClass('invalid-feedback');
                },
                highlight: function highlight(element, errorClass, validClass) {
                  $(element).addClass('is-invalid');
                  $(element).parents("form").eq(0).addClass("was-validated");
                },
                unhighlight: function unhighlight(element, errorClass, validClass) {
                  $(element).removeClass('is-invalid');
                  $(element).parents("form").eq(0).addClass("was-validated");
                }
              });
            }
            var wooSelects = $('#step-' + step).find('.woo-select');
            $.each(wooSelects, function (idx, ws) {
              self._initSelectWoo(ws);
            });
            $(tab).removeClass('reload');
          }
          $(self._loader).hide();
        },
        error: function error() {
          $(self._loader).hide();
          $(self._errorsContainer).html('');
          $('<div></div>').addClass('alert').addClass('alert-danger').html(params.wizard.i18n.unknownError).attr('role', 'alert').appendTo($(self._errorsContainer));
        }
      });
    },
    processStep: function processStep($data, $step, cb) {
      var self = this;
      $data += "&action=trackmage_wizard_process_step";
      $.ajax({
        url: params.wizard.urls.ajax,
        method: "post",
        data: $data,
        beforeSend: function beforeSend() {},
        success: function success(response) {
          if (response.success) {
            $('#' + $step).addClass('completed').removeClass('changed').next().addClass('reload').removeClass('completed');
            cb();
          } else {
            if (response.data.status == 'error') {
              $('#' + $data.step).removeClass('completed').next().addClass('reload').removeClass('completed');
              $(self._errorsContainer).html('');
              $.each(response.data.errors, function (idx, err) {
                $('<div></div>').addClass('alert').addClass('alert-danger').html(err).attr('role', 'alert').appendTo($(self._errorsContainer));
              });
              $(self._loader).hide();
            }
          }
        },
        error: function error(jqXHR, textStatus, errorThrown) {
          $(self._loader).hide();
          $(self._errorsContainer).html('');
          $('<div></div>').addClass('alert').addClass('alert-danger').html(params.wizard.i18n.unknownError).attr('role', 'alert').appendTo($(self._errorsContainer));
        }
      });
    },
    queryStringToJSON: function queryStringToJSON($str) {
      var pairs = $str.split('&');
      var result = {};
      pairs.forEach(function (pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
      });
      return JSON.parse(JSON.stringify(result));
    },
    _initSelectWoo: function _initSelectWoo($el) {
      $($el).selectWoo({
        width: "100%",
        ajax: {
          url: params.wizard.urls.ajax,
          method: "post",
          dataType: "json",
          delay: 250,
          data: function data(params) {
            return {
              term: params.term,
              action: "trackmage_get_order_statuses"
            };
          },
          processResults: function processResults(data, params) {
            return {
              results: data.filter(function (s, index) {
                var term = typeof params.term === "undefined" ? "" : params.term;
                if (term === "" || s.id.toLowerCase().includes(params.term.toLowerCase()) || s.text.toLowerCase().includes(params.term.toLowerCase())) {
                  return true;
                }
                return false;
              })
            };
          }
        }
      });
    }
  };
  wizard.init('#wizard', params.wizard.steps);
})(jQuery, window, document);