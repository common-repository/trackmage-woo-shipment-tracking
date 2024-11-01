"use strict";

(function ($, window, document, undefined) {
  var params = {
    main: trackmageAdmin
  };

  /**
   * Activate/deactivate spinner.
   *
   * @param {object} el - Spinner activator.
   * @param {string} action - Activate/deactivate.
   */
  window.trackmageToggleSpinner = function trackmageToggleSpinner(el, action) {
    if (action === "activate") {
      $(el).siblings(".spinner").addClass("is-active");
    } else if (action === "deactivate") {
      $(el).siblings(".spinner").removeClass("is-active");
    }
  };

  /**
   * Enable/Disable form element.
   *
   * @param {object} el - The element object.
   * @param {string} action - Enable/disable.
   */
  window.trackmageToggleFormElement = function trackmageToggleFormElement(el, action) {
    if (action === "enable" || action === "disable") {
      $(el).prop("disabled", action === "enable" ? false : true);
    }
  };

  /**
   * Create and append alerts container to the body.
   */
  window.trackmageAlerts = function trackmageAlerts() {
    if ($("#trackmage-alerts").length === 0) {
      var alerts = $("<div></div>").attr("id", "trackmage-alerts");
      $("body").append(alerts);
    }
  };
  window.trackmageAlert = function trackmageAlert(title, paragraph) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "default";
    var autoClose = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    if ($("#trackmage-alerts").length === 0) {
      trackmageAlerts();
    }
    var alert = $("\n      <div class=\"trackmage-alert trackmage-alert--".concat(type, "\">\n        <div class=\"trackmage-alert__content\">\n          <strong class=\"trackmage-alert__title\">").concat(title, "</strong>\n          <p class=\"trackmage-alert__paragraph\">").concat(paragraph, "</p>\n        </div>\n        <div class=\"trackmage-alert__close\">\n          <span class=\"dashicons dashicons-dismiss\"></span>\n        </div>\n      </div>\n    "));
    if (autoClose) {
      setTimeout(function () {
        $(alert).slideUp(100);
      }, 10000);
    }
    $("#trackmage-alerts").append(alert);
    $(alert).find(".trackmage-alert__close span").on("click", function () {
      $(alert).slideUp(100);
    });
  };
  window.trackmageBlockUi = function trackmageBlockUi(el) {
    $(el).block({
      message: null,
      overlayCSS: {
        background: "#fff",
        opacity: 0.6
      }
    });
  };
  window.trackmageUnblockUi = function trackmageUnblockUi(el) {
    $(el).unblock();
  };
  window.trackmageConfirmDialog = function (container) {
    var okBtnCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var dialogTitle = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'Confirm Changes';
    var okBtnTitle = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : params.main.i18n.ok || 'OK';
    var defer = $.Deferred();
    var buttons = {};
    buttons[okBtnTitle] = function () {
      var canClose = okBtnCallback !== null ? okBtnCallback() : true;
      if (canClose) {
        defer.resolve("yes");
        $(this).attr('yesno', true);
        $(this).dialog("close");
      }
    };
    buttons[params.main.i18n.cancel || "Cancel"] = function () {
      $(this).dialog('close');
    };
    $(container).dialog({
      title: dialogTitle,
      dialogClass: 'wp-dialog',
      autoOpen: true,
      draggable: false,
      width: $(window).width() > 600 ? 600 : $(window).width(),
      height: 'auto',
      modal: true,
      resizable: false,
      closeOnEscape: true,
      position: {
        my: "center",
        at: "center",
        of: window
      },
      buttons: buttons,
      open: function open() {
        $('.ui-widget-overlay').bind('click', function () {
          $(container).dialog('close');
        });
      },
      create: function create() {
        $('.ui-dialog-titlebar-close').addClass('ui-button');
      },
      close: function close() {
        if ($(this).attr('yesno') === undefined) {
          defer.resolve("no");
        }
        $(this).dialog('destroy');
      }
    });
    return defer.promise();
  };

  /**
   * On document ready.
   */
  $(document).ready(function () {
    // Append alerts container.
    trackmageAlerts();
  });
})(jQuery, window, document);