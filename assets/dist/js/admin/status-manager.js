"use strict";

(function ($, window, document, undefined) {
  var params = {
    main: trackmageAdmin,
    statusManager: trackmageAdminStatusManager
  };

  /**
   * Edit status.
   */
  $(document).on("click", "#statusManager .row-actions .edit-status", function (e) {
    var tbody = $(this).closest("tbody");
    var row = $(this).closest("tr");
    var isCustom = $(row).data("status-is-custom");
    var name = $(row).data("status-name");
    var currentSlug = $(row).data("status-slug");
    var slug = $(row).data("status-slug");
    var alias = $(row).data("status-alias");

    // Hide the selected row,
    // toggle hidden rows
    // and remove any other open edit row if any.
    $(tbody).children("tr.hidden").removeClass("hidden");
    $(row).addClass("hidden");
    $(tbody).children(".adjust-odd-even").remove();
    $(tbody).children(".inline-edit-row").remove();

    // Append edit row.
    var editRow = $("\n          <tr class=\"hidden adjust-odd-even\"></tr>\n          <tr id=\"edit-".concat(slug, "\" class=\"inline-edit-row\">\n            <td colspan=\"4\" class=\"colspanchange\">\n              <fieldset class=\"inline-edit-col-left\">\n                <legend class=\"inline-edit-legend\">").concat(params.statusManager.i18n.edit, "</legend>\n                <div class=\"inline-edit-col\">\n                  <label>\n                    <span class=\"title\">").concat(params.statusManager.i18n.name, "</span>\n                    <span class=\"input-text-wrap\"><input type=\"text\" name=\"status_name\" value=\"\" /></span>\n                  </label>\n                  <label>\n                    <span class=\"title\">").concat(params.statusManager.i18n.slug, "</span>\n                    <span class=\"input-text-wrap\"><input type=\"text\" name=\"status_slug\" value=\"\" /></span>\n                  </label>\n                  <label>\n                    <span class=\"title\">").concat(params.statusManager.i18n.alias, "</span>\n                    <select name=\"status_alias\">\n                      <option value=\"\" selected=\"selected\">").concat(params.main.i18n.noSelect, "</option>\n                      ").concat(Object.keys(params.statusManager.aliases).map(function (key) {
      return "<option value=\"".concat(key, "\">").concat(params.statusManager.aliases[key], "</option>");
    }).join(""), "\n                    </select>\n                  </label>\n                </div>\n              </fieldset>\n              <div class=\"submit inline-edit-save\">\n                <button type=\"button\" class=\"button cancel alignleft\">").concat(params.statusManager.i18n.cancel, "</button>\n                <button type=\"button\" class=\"button button-primary save alignright\">").concat(params.statusManager.i18n.update, "</button>\n                <span class=\"spinner\"></span>\n                <br class=\"clear\">\n              </div>\n            </div>\n            </td>\n          </tr>\n        "));
    $(editRow).insertAfter(row);
    $.each(params.statusManager.used_aliases, function (idx, key) {
      if (alias !== key) {
        $(editRow).find("select[name=status_alias] option[value=" + key + "]").eq(0).hide();
      } else {
        $(editRow).find("select[name=status_alias] option").removeAttr("selected");
        $(editRow).find("select[name=status_alias] option[value=" + key + "]").attr("selected", "selected");
      }
    });

    // Current values.
    $(editRow).find('[name="status_name"]').val(name);
    $(editRow).find('[name="status_slug"]').val(slug);
    $(editRow).find('[name="status_alias"]').val(alias);

    // Disable name and slug field if not a custom status.
    if (isCustom !== 1) {
      $(editRow).find('[name="status_slug"], [name="status_name"]').prop("disabled", true);
    }

    // On cancel.
    $(editRow).find("button.cancel").on("click", function () {
      $(editRow).remove();
      $(row).removeClass("hidden");
    });

    // On save.
    $(editRow).find("button.save").on("click", function () {
      var save = $(this);
      var name = $(editRow).find('[name="status_name"]');
      var slug = $(editRow).find('[name="status_slug"]');
      var alias = $(editRow).find('[name="status_alias"]');

      // Request data.
      var data = {
        action: "trackmage_update_status",
        security: params.statusManager.nonces.updateStatus,
        name: $(name).val(),
        currentSlug: currentSlug,
        slug: $(slug).val(),
        alias: $(alias).val(),
        isCustom: isCustom
      };
      $.ajax({
        url: params.main.urls.ajax,
        method: "post",
        data: data,
        beforeSend: function beforeSend() {
          trackmageToggleSpinner(save, "activate");
          trackmageToggleFormElement(save, "disable");
        },
        success: function success(response) {
          if (response.success) {
            params.statusManager.used_aliases = response.data.result.used;
            updateRow(response.data.result.name, response.data.result.slug, response.data.result.alias);
            $(".add-status select[name=status_alias] option").show();
            $.each(params.statusManager.used_aliases, function (idx, value) {
              $(".add-status select[name=status_alias] option[value=" + value + "]").hide();
            });
            $(editRow).remove();
            $(row).removeClass("hidden").effect("highlight", {
              color: "#c3f3d7"
            }, 500);
          } else {
            $(editRow).removeClass("hidden").effect("highlight", {
              color: "#ffe0e3"
            }, 500);
          }
          var alert = {
            title: response.success ? params.main.i18n.success : params.main.i18n.failure,
            message: response.data.message ? response.data.message : !response.success ? params.main.i18n.unknownError : "",
            type: response.success ? "success" : "failure"
          };
          trackmageAlert(alert.title, alert.message, alert.type, true);
        },
        error: function error() {
          trackmageAlert(params.main.i18n.failure, params.main.i18n.unknownError, "failure", true);
        },
        complete: function complete() {
          trackmageToggleSpinner(save, "deactivate");
          trackmageToggleFormElement(save, "enable");
        }
      });
    });
    function updateRow(name, slug, alias) {
      $(row).find("[data-update-status-name]").html(name);
      $(row).data("status-name", name);
      $(row).find("[data-update-status-slug]").html(slug);
      $(row).data("status-slug", slug);
      $(row).find("[data-update-status-alias]").html(params.statusManager.aliases[alias] ? params.statusManager.aliases[alias] : "");
      $(row).data("status-alias", alias);
    }
  });

  /**
   * Add status.
   */
  $("#statusManager .add-status #addStatus").on("click", function (e) {
    var add = $(this);
    var name = $('#statusManager .add-status [name="status_name"]');
    var slug = $('#statusManager .add-status [name="status_slug"]');
    var alias = $('#statusManager .add-status [name="status_alias"]');

    // Request data.
    var data = {
      action: "trackmage_add_status",
      security: params.statusManager.nonces.addStatus,
      name: $(name).val(),
      slug: $(slug).val(),
      alias: $(alias).val()
    };
    $.ajax({
      url: params.main.urls.ajax,
      method: "post",
      data: data,
      beforeSend: function beforeSend() {
        trackmageToggleSpinner(add, "activate");
        trackmageToggleFormElement(add, "disable");
      },
      success: function success(response) {
        if (response.success) {
          addRow(response.data.result.name, response.data.result.slug, response.data.result.alias);
          params.statusManager.used_aliases = response.data.result.used;
          $(".add-status input, .add-status select").val("");
          $(".add-status select.status_alias option").show();
          $.each(params.statusManager.used_aliases, function (idx, value) {
            $(".add-status select[name=status_alias] option[value=" + value + "]").hide();
          });
        }
        var alert = {
          title: response.success ? params.main.i18n.success : params.main.i18n.failure,
          message: response.data.message ? response.data.message : !response.success ? params.main.i18n.unknownError : "",
          type: response.success ? "success" : "failure"
        };
        trackmageAlert(alert.title, alert.message, alert.type, true);
      },
      error: function error() {
        trackmageAlert(params.main.i18n.failure, params.main.i18n.unknownError, "failure", true);
      },
      complete: function complete() {
        trackmageToggleSpinner(add, "deactivate");
        trackmageToggleFormElement(add, "enable");
      }
    });
    function addRow(name, slug, alias) {
      var statusManagerBody = $("#statusManager tbody");
      var row = "\n            <tr id=\"status-".concat(slug, "\" data-status-name=\"").concat(name, "\" data-status-slug=\"").concat(slug, "\" data-status-alias=\"").concat(alias, "\" data-status-is-custom=\"1\">\n              <td>\n                <span data-update-status-name>").concat(name, "</span>\n                <div class=\"row-actions\">\n                  <span class=\"inline\"><button type=\"button\" class=\"button-link edit-status\">").concat(params.statusManager.i18n.edit, "</button></span>\n                  <span class=\"inline delete\"> | <button type=\"button\" class=\"button-link delete-status\">").concat(params.statusManager.i18n["delete"], "</button></span>\n                </div>\n              </td>\n              <td><span data-update-status-slug>").concat(slug, "</span></td>\n              <td colspan=\"2\"><span data-update-status-alias>").concat(params.statusManager.aliases.hasOwnProperty(alias) ? params.statusManager.aliases[alias] : "", "</span></td>\n            </tr>\n          ");
      $(row).appendTo(statusManagerBody).effect("highlight", {
        color: "#c3f3d7"
      }, 500);
    }
  });

  /**
   * Delete status.
   */
  $(document).on("click", "#statusManager .row-actions .delete-status", function (e) {
    var row = $(this).closest("tr");
    var slug = $(row).data("status-slug");
    var statusToMigrate = null;
    var options = $('#statusManager tr[id*="status-wc"]').toArray().filter(function (item) {
      return $(item).data('status-slug') !== slug;
    }).map(function (item) {
      return '<option value="' + $(item).data('status-slug') + '">' + $(item).data('status-slug') + '</option>';
    });
    var html = $('<div><p>Choose status to migrate orders to:<p><select required id="status_to_migrate">' + options.join() + '</select></div>');
    var cb = function cb() {
      statusToMigrate = $('#status_to_migrate').val();
      return true;
    };
    trackmageConfirmDialog(html, cb, params.statusManager.i18n.confirmDeleteStatus, params.statusManager.i18n["delete"]).then(function (yesno) {
      if (yesno === 'yes') {
        var deleteRow = function deleteRow() {
          $(row).effect("highlight", {
            color: "#ffe0e3"
          }, 500);
          setTimeout(function () {
            $(row).remove();
          }, 500);
        };
        // Request data.
        var data = {
          action: "trackmage_delete_status",
          security: params.statusManager.nonces.deleteStatus,
          slug: slug,
          statusToMigrate: statusToMigrate
        };
        $.ajax({
          url: params.main.urls.ajax,
          method: "post",
          data: data,
          beforeSend: function beforeSend() {},
          success: function success(response) {
            if (response.success) {
              deleteRow();
              params.statusManager.used_aliases = response.data.result.used;
              $(".add-status select[name=status_alias] option").show();
              $.each(params.statusManager.used_aliases, function (idx, value) {
                $(".add-status select[name=status_alias] option[value=" + value + "]").hide();
              });
            }
            var alert = {
              title: response.success ? params.main.i18n.success : params.main.i18n.failure,
              message: response.data.message ? response.data.message : !response.success ? params.main.i18n.unknownError : "",
              type: response.success ? "success" : "failure"
            };
            trackmageAlert(alert.title, alert.message, alert.type, true);
          },
          error: function error() {
            trackmageAlert(params.main.i18n.failure, params.main.i18n.unknownError, "failure", true);
          }
        });
      } else {
        return false;
      }
    });
  });
})(jQuery, window, document);