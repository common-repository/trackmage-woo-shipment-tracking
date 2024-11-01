"use strict";

(function ($, window, document, undefined) {
  var params = {
    main: window.trackmageAdmin,
    metaBoxes: window.trackmageAdminMetaBoxes
  };

  /**
   * Init selectWoo on a `<select>` element to get order items.
   *
   * @param {object} el The select element.
   * @param {number} orderId Order ID.
   */
  function initSelectWooOrderItems(el, orderId) {
    $(el).selectWoo({
      width: "100%",
      ajax: {
        url: params.main.urls.ajax,
        method: "post",
        dataType: "json",
        delay: 250,
        data: function data(p) {
          return {
            term: p.term,
            action: "trackmage_get_order_items",
            orderId: orderId
          };
        },
        processResults: function processResults(data) {
          return {
            results: data.map(function (item) {
              return {
                id: item.id,
                text: item.name
              };
            })
          };
        }
      }
    });
  }

  /**
   * Toggle action group in the meta box.
   *
   * @param {string} group The id of the group to be displayed.
   * @return {object} The element of the displayed group.
   */
  function toggleActionGroup(group) {
    // Hide all other groups and the associated elements.
    $("#trackmage-shipment-tracking .actions__action-group").hide();
    $("#trackmage-shipment-tracking [data-action-group]").hide();

    // Display the desired group and its associated elements.
    var groupEl = $("#trackmage-shipment-tracking .actions__action-group--".concat(group));
    $(groupEl).show();
    $("#trackmage-shipment-tracking [data-action-group=".concat(group, "]")).show();

    // Return the element of the displayed group.
    return groupEl;
  }
  function showMergeShipmentsDialog(shipmentId, trackingNumber) {
    var container = $("<div>It seems that you are trying to add tracking number ".concat(trackingNumber.toUpperCase(), " to two different shipments. Please use a different tracking number or connect to existing shipment.</div>"));
    //$('body').append(container);
    var doMerge = function doMerge() {
      var data = {
        action: "trackmage_merge_shipments",
        security: params.metaBoxes.nonces.mergeShipments,
        trackingNumber: trackingNumber,
        shipmentId: shipmentId,
        orderId: params.metaBoxes.orderId
      };
      $.ajax({
        url: params.main.urls.ajax,
        method: "post",
        data: data,
        beforeSend: function beforeSend() {
          trackmageBlockUi($("#trackmage-shipment-tracking .inside"));
          $(container).dialog('close');
        },
        success: function success(response) {
          var _response$data;
          var alert = {
            title: response !== null && response !== void 0 && response.success ? params.main.i18n.success : params.main.i18n.failure,
            message: response !== null && response !== void 0 && (_response$data = response.data) !== null && _response$data !== void 0 && _response$data.message ? response.data.message : !(response !== null && response !== void 0 && response.success) ? params.main.i18n.unknownError : "",
            type: response !== null && response !== void 0 && response.success ? "success" : "failure"
          };
          trackmageAlert(alert.title, alert.message, alert.type, true);

          // Re-load the meta box.
          $("#trackmage-shipment-tracking .inside").html(response.data.html);
          var notesContainer = $("ul.order_notes").parent();
          $("ul.order_notes").remove();
          notesContainer.prepend($(response.data.notes));
        },
        error: function error(response) {
          var _response$data2;
          var message = (response === null || response === void 0 ? void 0 : (_response$data2 = response.data) === null || _response$data2 === void 0 ? void 0 : _response$data2.message) || params.main.i18n.unknownError;
          trackmageAlert(params.main.i18n.failure, message, "failure", true);
        },
        complete: function complete() {
          trackmageUnblockUi($("#trackmage-shipment-tracking .inside"));
        }
      });
    };
    trackmageConfirmDialog(container, doMerge, 'Error', 'Connect to existing');
  }

  // Add items row.
  $(document).on("click", "#trackmage-shipment-tracking .items__btn-add-row", function (e) {
    e.preventDefault();
    var btnAddRow = $(this);

    // Get row HTML.
    $.ajax({
      url: params.main.urls.ajax,
      method: "post",
      data: {
        action: "trackmage_get_view",
        path: "order-add-shipment-items-row.php"
      },
      beforeSend: function beforeSend() {
        trackmageBlockUi($("#trackmage-shipment-tracking .inside"));
      },
      success: function success(response) {
        var row = $(response.data.html);

        // Show the delete icon.
        $(row).find(".items__delete").css("display", "block");

        // Init selectWoo.
        initSelectWooOrderItems($(row).find('[name="order_item_id"]'), params.metaBoxes.orderId);

        // Append row.
        $(btnAddRow).before(row);
      },
      error: function error(response) {
        var _response$data3;
        var message = (response === null || response === void 0 ? void 0 : (_response$data3 = response.data) === null || _response$data3 === void 0 ? void 0 : _response$data3.message) || params.main.i18n.unknownError;
        trackmageAlert(params.main.i18n.failure, message, "failure", true);
      },
      complete: function complete() {
        trackmageUnblockUi($("#trackmage-shipment-tracking .inside"));
      }
    });
  });

  // Remove items row.
  $(document).on("click", "#trackmage-shipment-tracking .items__row .items__delete", function (e) {
    e.preventDefault();
    var row = $(this).closest(".items__row");
    $(row).remove();
  });

  /*
   * Edit shipment.
   */
  $(document).on("click", "#trackmage-shipment-tracking .shipment__actions__action--edit", function (e) {
    var shipment = $(this).closest("tr.shipment");
    var shipmentId = $(shipment).data("id");

    // Show the edit shipment form.

    // Toggle action group.
    var shipmentActions = $(shipment).find('.shipment__actions').eq(0);
    var actionGroup = $('div.actions .actions__action-group.actions__action-group--edit').clone();
    $(shipmentActions).find('.shipment__actions__wrap').hide();
    $(shipmentActions).append(actionGroup);
    $(actionGroup).addClass('shipment__actions__wrap').show();

    // On cancel.
    $(actionGroup).off("click", ".btn-cancel").on("click", ".btn-cancel", function (e) {
      e.preventDefault();
      //toggleActionGroup("default");
      $(actionGroup).remove();
      $(shipmentActions).find('.shipment__actions__wrap').show();
      $("#trackmage-shipment-tracking tr#edit-tr-" + shipmentId).remove();
    });

    // On save.
    $(actionGroup).off("click", ".btn-save").on("click", ".btn-save", function (e) {
      e.preventDefault();
      var items = [];
      $("#trackmage-shipment-tracking tr#edit-tr-" + shipmentId + " .edit-shipment .items__rows .items__row").each(function () {
        var id = $(this).find('[name="id"]').val();
        var orderItemId = $(this).find('[name="order_item_id"]').val();
        var qty = $(this).find('[name="qty"]').val();
        if (qty > 0) {
          items.push({
            id: id,
            order_item_id: orderItemId,
            qty: qty
          });
        }
      });

      // Request data.
      var data = {
        action: "trackmage_update_shipment",
        security: params.metaBoxes.nonces.updateShipment,
        orderId: params.metaBoxes.orderId,
        id: shipmentId,
        trackingNumber: $("#trackmage-shipment-tracking tr#edit-tr-" + shipmentId + ' .edit-shipment [name="tracking_number"]').val(),
        carrier: $("#trackmage-shipment-tracking tr#edit-tr-" + shipmentId + ' .edit-shipment [name="carrier"]').val(),
        items: items
      };
      $.ajax({
        url: params.main.urls.ajax,
        method: "post",
        data: data,
        beforeSend: function beforeSend() {
          trackmageBlockUi($("#trackmage-shipment-tracking .inside"));
        },
        success: function success(response) {
          var _response$data4, _response$data5, _response$data8;
          if ((response === null || response === void 0 ? void 0 : response.success) === false && !!(response !== null && response !== void 0 && (_response$data4 = response.data) !== null && _response$data4 !== void 0 && _response$data4.shipmentId) && ((response === null || response === void 0 ? void 0 : (_response$data5 = response.data) === null || _response$data5 === void 0 ? void 0 : _response$data5.message) || '').includes('It seems that you are trying to add the same tracking number to two different shipments')) {
            var _response$data6, _response$data7;
            showMergeShipmentsDialog(response === null || response === void 0 ? void 0 : (_response$data6 = response.data) === null || _response$data6 === void 0 ? void 0 : _response$data6.shipmentId, response === null || response === void 0 ? void 0 : (_response$data7 = response.data) === null || _response$data7 === void 0 ? void 0 : _response$data7.trackingNumber);
            return;
          }
          var alert = {
            title: response !== null && response !== void 0 && response.success ? params.main.i18n.success : params.main.i18n.failure,
            message: response !== null && response !== void 0 && (_response$data8 = response.data) !== null && _response$data8 !== void 0 && _response$data8.message ? response.data.message : !(response !== null && response !== void 0 && response.success) ? params.main.i18n.unknownError : "",
            type: response !== null && response !== void 0 && response.success ? "success" : "failure"
          };
          trackmageAlert(alert.title, alert.message, alert.type, true);

          // Re-load the meta box.
          $("#trackmage-shipment-tracking .inside").html(response.data.html);
          var notesContainer = $("ul.order_notes").parent();
          $("ul.order_notes").remove();
          notesContainer.prepend($(response.data.notes));
        },
        error: function error(response) {
          var _response$data9;
          var message = (response === null || response === void 0 ? void 0 : (_response$data9 = response.data) === null || _response$data9 === void 0 ? void 0 : _response$data9.message) || params.main.i18n.unknownError;
          trackmageAlert(params.main.i18n.failure, message, "failure", true);
        },
        complete: function complete() {
          trackmageUnblockUi($("#trackmage-shipment-tracking .inside"));
        }
      });
    });

    // Get the edit shipment form.
    $.ajax({
      url: params.main.urls.ajax,
      method: "post",
      data: {
        action: "trackmage_edit_shipment",
        id: shipmentId,
        security: params.metaBoxes.nonces.editShipment,
        orderId: params.metaBoxes.orderId
      },
      beforeSend: function beforeSend() {
        trackmageBlockUi($("#trackmage-shipment-tracking .inside"));
      },
      success: function success(response) {
        if (!response.success) {
          toggleActionGroup("default");
          return;
        }
        var html = $(response.data.html);
        var trackingNumber = response.data.trackingNumber;
        var carrier = response.data.carrier;
        var items = response.data.items;

        // Show the delete icon for all rows except the first one.
        $(html).find(".items__rows .items__row .items__delete").css("display", "block");

        // Append the HTML.
        var formDiv = $("#trackmage-shipment-tracking .shipments + .edit-shipment").clone().append($(html)).show();
        var formTr = $('<tr></tr>').attr('id', 'edit-tr-' + shipmentId).append($('<td></td>').attr('style', 'padding: 0 !important').attr('colspan', 5).append($(formDiv)));
        $(formTr).insertAfter($(shipment));

        // Init selectWoo and set values.
        $(html).find('[name="carrier"]').selectWoo({
          width: "100%"
        }).val(carrier).trigger("change");
        var index = 1;
        Object.keys(items).forEach(function (idx) {
          var item = items[idx];
          var itemEl = $("#trackmage-shipment-tracking tr#edit-tr-".concat(shipmentId, " .edit-shipment .items__rows .items__row:nth-of-type(").concat(index, ")"));
          var itemIdEl = $(itemEl).find('[name="id"]');
          var itemProductEl = $(itemEl).find('[name="order_item_id"]');
          var itemQtyEl = $(itemEl).find('[name="qty"]');
          $(itemIdEl).val(item.id);
          $(itemQtyEl).val(item.qty);

          // Select product item.
          itemProductEl.parent().append($('<span></span>').text(item.name)).append($('<input type="hidden" name="order_item_id">').val(item.order_item_id));
          itemProductEl.remove();
          index++;
        });
      },
      complete: function complete() {
        trackmageUnblockUi($("#trackmage-shipment-tracking .inside"));
      }
    });
  });

  /*
   * Add new shipment.
   */
  $(document).on("click", "#trackmage-shipment-tracking .actions__action-group--default .btn-new", function (e) {
    e.preventDefault();

    // Show the add shipment form.
    $("#trackmage-shipment-tracking .add-shipment").show();

    // Toggle action group.
    var actionGroup = toggleActionGroup("new");

    // Listen to add all order items button.
    $('#trackmage-shipment-tracking .add-shipment [name="add_all_order_items"]').off("change").on("change", function (e) {
      var checked = $(this).is(":checked");
      var itemRows = $("#trackmage-shipment-tracking .add-shipment .items__rows");
      if (checked) {
        $(itemRows).hide();
      } else {
        $(itemRows).show();
      }
    }).trigger("click");

    // Init selectWoo.
    $('#trackmage-shipment-tracking .add-shipment [name="carrier"]').selectWoo({
      width: "100%"
    });
    initSelectWooOrderItems($('#trackmage-shipment-tracking .add-shipment [name="order_item_id"]'), params.metaBoxes.orderId);

    // On cancel.
    $(actionGroup).off("click", ".btn-cancel").on("click", ".btn-cancel", function (e) {
      e.preventDefault();
      toggleActionGroup("default");
      $("#trackmage-shipment-tracking .add-shipment").hide();
    });

    // On add shipment.
    $(document).off("click", "#trackmage-shipment-tracking .actions__action-group--new .btn-add-shipment").on("click", "#trackmage-shipment-tracking .actions__action-group--new .btn-add-shipment", function (e) {
      e.preventDefault();
      var items = [];
      $("#trackmage-shipment-tracking .add-shipment .items__rows .items__row").each(function () {
        var orderItemId = $(this).find('[name="order_item_id"]').val();
        var qty = $(this).find('[name="qty"]').val();
        items.push({
          id: '',
          order_item_id: orderItemId,
          qty: qty
        });
      });

      // Request data.
      var data = {
        action: "trackmage_add_shipment",
        security: params.metaBoxes.nonces.addShipment,
        orderId: params.metaBoxes.orderId,
        trackingNumber: $('#trackmage-shipment-tracking .add-shipment [name="tracking_number"]').val(),
        carrier: $('#trackmage-shipment-tracking .add-shipment [name="carrier"]').val(),
        addAllOrderItems: $('#trackmage-shipment-tracking .add-shipment [name="add_all_order_items"]').is(":checked"),
        items: items
      };
      $.ajax({
        url: params.main.urls.ajax,
        method: "post",
        data: data,
        beforeSend: function beforeSend() {
          trackmageBlockUi($("#trackmage-shipment-tracking .inside"));
        },
        success: function success(response) {
          var alert = {
            title: response.success ? params.main.i18n.success : params.main.i18n.failure,
            message: response.data.message ? response.data.message : !response.success ? params.main.i18n.unknownError : "",
            type: response.success ? "success" : "failure"
          };
          trackmageAlert(alert.title, alert.message, alert.type, true);

          // Re-load the meta box.
          $("#trackmage-shipment-tracking .inside").html(response.data.html);
          var notesContainer = $("ul.order_notes").parent();
          $("ul.order_notes").remove();
          notesContainer.prepend($(response.data.notes));
        },
        error: function error(response) {
          var _response$data10;
          var message = (response === null || response === void 0 ? void 0 : (_response$data10 = response.data) === null || _response$data10 === void 0 ? void 0 : _response$data10.message) || params.main.i18n.unknownError;
          trackmageAlert(params.main.i18n.failure, message, "failure", true);
        },
        complete: function complete() {
          trackmageUnblockUi($("#trackmage-shipment-tracking .inside"));
        }
      });
    });
  });
  function deleteShipment(shipment) {
    var unlink = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var shipmentId = $(shipment).data("id");
    $.ajax({
      url: params.main.urls.ajax,
      method: "post",
      data: {
        action: 'trackmage_delete_shipment',
        security: params.metaBoxes.nonces.deleteShipment,
        orderId: params.metaBoxes.orderId,
        id: shipmentId,
        unlink: unlink
      },
      beforeSend: function beforeSend() {
        trackmageBlockUi($("#trackmage-shipment-tracking .inside"));
      },
      success: function success(response) {
        var alert = {
          title: response.success ? params.main.i18n.success : params.main.i18n.failure,
          message: response.data.message ? response.data.message : !response.success ? params.main.i18n.unknownError : "",
          type: response.success ? "success" : "failure"
        };
        trackmageAlert(alert.title, alert.message, alert.type, true);

        // Re-load the meta box.
        $("#trackmage-shipment-tracking .inside").html(response.data.html);
        var notesContainer = $("ul.order_notes").parent();
        $("ul.order_notes").remove();
        notesContainer.prepend($(response.data.notes));
      },
      error: function error(response) {
        var _response$data11;
        var message = (response === null || response === void 0 ? void 0 : (_response$data11 = response.data) === null || _response$data11 === void 0 ? void 0 : _response$data11.message) || params.main.i18n.unknownError;
        trackmageAlert(params.main.i18n.failure, message, "failure", true);
      },
      complete: function complete() {
        trackmageUnblockUi($("#trackmage-shipment-tracking .inside"));
      }
    });
  }

  /*
   * Delete shipment.
   */
  $(document).on("click", "#trackmage-shipment-tracking .shipment__actions__action--delete", function (e) {
    e.preventDefault();
    var shipment = $(this).closest(".shipment");
    window.trackmageConfirmDialog('#delete-shipment-confirm-dialog', function () {
      return true;
    }, params.metaBoxes.i18n.confirmDeleteShipment, params.metaBoxes.i18n.yes).then(function (yesno) {
      if (yesno === 'yes') {
        deleteShipment(shipment);
      } else {
        return false;
      }
    });
  });

  /*
   * Delete shipment.
   */
  $(document).on("click", "#trackmage-shipment-tracking .shipment__actions__action--unlink", function (e) {
    e.preventDefault();
    var shipment = $(this).closest(".shipment");
    window.trackmageConfirmDialog('#delete-shipment-confirm-dialog', function () {
      return true;
    }, params.metaBoxes.i18n.confirmUnlinkShipment, params.metaBoxes.i18n.yes).then(function (yesno) {
      if (yesno === 'yes') {
        deleteShipment(shipment, true);
      } else {
        return false;
      }
    });
  });

  /*
   * Block UI if click edit address.
   */
  $(document).on("click", "#order_data a.edit_address", function (e) {
    trackmageBlockUi($("#trackmage-shipment-tracking .inside"));
    if ($('#trackmage-shipment-tracking h2 .blocked-shipments').length < 1) {
      $("#trackmage-shipment-tracking h2").append('<span class="blocked-shipments" style="color: #f00; margin-left: 10px;"> - ' + params.main.i18n.cannot_edit + '</span>');
    }
  });
})(jQuery, window, document);