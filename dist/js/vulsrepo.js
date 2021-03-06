$(document).ready(function () {
  $.each(vulsrepo_template, function (index, val) {
    localStorage.setItem("vulsrepo_pivot_conf_user_" + val.key, val.value);
  });

  setEvents();
  createFolderTree();
  db.remove("vulsrepo_pivot_conf");
  $('#drawerLeft').drawer('show');
});

var initPivotTable = function () {
  $.blockUI(blockUI_opt_all);
  getData().done(function (resultArray) {
    displayPivot(createPivotData(resultArray));
    vulsrepo.detailRawData = resultArray;
    setPulldown("#drop_topmenu");
    setPulldownDisplayChangeEvent("#drop_topmenu");
    filterDisp.off("pivot_conf");
    $.unblockUI(blockUI_opt_all);
  }).fail(function (result) {
    $.unblockUI(blockUI_opt_all);
    if (result === "notSelect") {
      showAlert("Not Selected", "File is not selected.");
    } else {
      showAlert(result.status + " " + result.statusText, result.responseText);
    }
  });

};

var db = {
  set: function (key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
  },
  get: function (key) {
    return JSON.parse(localStorage.getItem(key));
  },
  remove: function (key) {
    localStorage.removeItem(key);
  },
  setPivotConf: function (key, obj) {
    localStorage.setItem("vulsrepo_pivot_conf_user_" + key, JSON.stringify(obj));
  },
  getPivotConf: function (key) {
    return JSON.parse(localStorage.getItem("vulsrepo_pivot_conf_user_" + key));
  },
  removePivotConf: function (key) {
    localStorage.removeItem("vulsrepo_pivot_conf_user_" + key);
  },
  listPivotConf: function (key) {
    var array = [];
    for (var i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i).indexOf('vulsrepo_pivot_conf_user_') != -1) {
        array.push(localStorage.key(i).replace(/vulsrepo_pivot_conf_user_/g, ''));
      }
    }
    return array;
  }
};

var filterDisp = {
  on: function (labelName) {
    $(labelName).removeClass("label-info").addClass("label-warning").text("Filter ON");
  },

  off: function (labelName) {
    $(labelName).removeClass("label-warning").addClass("label-info").text("Filter OFF");
  }
};

var fadeAlert = function (target) {
  $(target).fadeIn(1000).delay(2000).fadeOut(1000);
};

var showAlert = function (code, text) {
  $("#alert_error_code").empty();
  $("#alert_responce_text").empty();
  $("#alert_error_code").append("<div>" + code + "</div>");
  $("#alert_responce_text").append("<div>" + text + "</div>");
  $("#modal-alert").modal('show');
};

var blockUI_opt_all = {
  message: '<h4><img src="./dist/img/loading.gif" />　Please Wait...</h4>',
  fadeIn: 200,
  fadeOut: 200,
  css: {
    border: 'none',
    padding: '15px',
    backgroundColor: '#000',
    '-webkit-border-radius': '10px',
    '-moz-border-radius': '10px',
    opacity: .5,
    color: '#fff'
  }
};

var getData = function () {

  $.ajaxSetup({
    timeout: vulsrepo.timeOut
  });

  var kickCount = 0;
  var endCount = 0;
  var resultArray = [];
  var defer = new $.Deferred();

  var selectedFiles = getSelectedFile();

  if (selectedFiles.length === 0) {
    defer.reject("notSelect");
    return defer.promise();
  }

  $.each(selectedFiles, function (key, value) {
    var url = value.url;
    $.getJSON(url).done(function (json_data) {
      endCount++;
      var resultMap = {
        scanTime: value.parent_title,
        data: json_data
      };
      resultArray.push(resultMap);
      if (kickCount == endCount) {
        defer.resolve(resultArray);
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
      defer.reject(jqXHR);
    });
    kickCount++;
  });
  return defer.promise();
};

var getSelectedFile = function () {
  var selectedFile = $.map($("#folderTree").dynatree("getSelectedNodes"), function (node) {
    if (node.data.isFolder === false) {
      var data = {
        title: node.data.title,
        url: "results" + node.data.url,
        parent_title: node.parent.data.title
      };
      return (data);
    }
  });
  return selectedFile;
};

var getSeverity = function (Score) {
  if (Score >= 7.0) {
    return Array("High", "red");
  } else if ((Score < 7.0) && (Score >= 4.0)) {
    return Array("Medium", "orange");
  } else if ((Score < 4.0)) {
    return Array("Low", "#e6e600");
  }
};

var getSplitArray = function (full_vector) {
  return full_vector.replace(/\(|\)/g, '').split("/");
};

var getVector = {

  jvn: function (vector) {
    var subscore = vector.split(":");

    switch (subscore[0]) {
      case 'AV':
        switch (subscore[1]) {
          case 'L':
            return Array("LOCAL", "cvss-info");
            break;
          case 'A':
            return Array("ADJACENT_NETWORK", "cvss-warning");
            break;
          case 'N':
            return Array("NETWORK", "cvss-danger");
            break;
        }
      case 'AC':
        switch (subscore[1]) {
          case 'H':
            return Array("HIGH", "cvss-info");
            break;
          case 'M':
            return Array("MEDIUM", "cvss-warning");
            break;
          case 'L':
            return Array("LOW", "cvss-danger");
            break;
        }
      case 'Au':
        switch (subscore[1]) {
          case 'N':
            return Array("NONE", "cvss-danger");
            break;
          case 'S':
            return Array("SINGLE_INSTANCE", "cvss-warning");
            break;
          case 'M':
            return Array("MULTIPLE_INSTANCES", "cvss-info");
            break;
        }
      case 'C':
        switch (subscore[1]) {
          case 'N':
            return Array("NONE", "cvss-info");
            break;
          case 'P':
            return Array("PARTIAL", "cvss-warning");
            break;
          case 'C':
            return Array("COMPLETE", "cvss-danger");
            break;
        }
      case 'I':
        switch (subscore[1]) {
          case 'N':
            return Array("NONE", "cvss-info");
            break;
          case 'P':
            return Array("PARTIAL", "cvss-warning");
            break;
          case 'C':
            return Array("COMPLETE", "cvss-danger");
            break;
        }
      case 'A':
        switch (subscore[1]) {
          case 'N':
            return Array("NONE", "cvss-info");
            break;
          case 'P':
            return Array("PARTIAL", "cvss-warning");
            break;
          case 'C':
            return Array("COMPLETE", "cvss-danger");
            break;
        }
    }
  },

  nvd: function (category, impact) {

    switch (category) {
      case 'AV':
        switch (impact) {
          case 'LOCAL':
            return "cvss-info";
            break;
          case 'ADJACENT_NETWORK':
            return "cvss-warning";
            break;
          case 'NETWORK':
            return "cvss-danger";
            break;
        }
      case 'AC':
        switch (impact) {
          case 'HIGH':
            return "cvss-info";
            break;
          case 'MEDIUM':
            return "cvss-warning";
            break;
          case 'LOW':
            return "cvss-danger";
            break;
        }
      case 'Au':
        switch (impact) {
          case 'NONE':
            return "cvss-danger";
            break;
          case 'SINGLE_INSTANCE':
            return "cvss-warning";
            break;
          case 'MULTIPLE_INSTANCES':
            return "cvss-info";
            break;
        }
      case 'C':
        switch (impact) {
          case 'NONE':
            return "cvss-info";
            break;
          case 'PARTIAL':
            return "cvss-warning";
            break;
          case 'COMPLETE':
            return "cvss-danger";
            break;
        }
      case 'I':
        switch (impact) {
          case 'NONE':
            return "cvss-info";
            break;
          case 'PARTIAL':
            return "cvss-warning";
            break;
          case 'COMPLETE':
            return "cvss-danger";
            break;
        }
      case 'A':
        switch (impact) {
          case 'NONE':
            return "cvss-info";
            break;
          case 'PARTIAL':
            return "cvss-warning";
            break;
          case 'COMPLETE':
            return "cvss-danger";
            break;
        }
    }
  }
};

var setPulldown = function (target) {
  $(target).empty();
  $.each(db.listPivotConf(), function (index, val) {
    $(target).append('<li><a href="javascript:void(0)" value=\"' + val + '\">' + val + '</a></li>');
  });

  $(target + ' a').off('click');
  $(target + ' a').on('click', function () {
    $(target + "_visibleValue").html($(this).attr('value'));
    $(target + "_hiddenValue").val($(this).attr('value'));
  });

};

var setPulldownDisplayChangeEvent = function (target) {
  $(target + ' a').on('click', function () {
    var value = db.getPivotConf($(this).attr('value'));
    db.set("vulsrepo_pivot_conf", value);
    initPivotTable();
  });
};

var setEvents = function () {

  if (db.get("vulsrepo_detailLastTab") === null) {
    db.set("vulsrepo_detailLastTab", "jvn");
  }

  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var tabName = e.target.href;
    var items = tabName.split("#");

    if (items[1] === "tab_nvd") {
      db.set("vulsrepo_detailLastTab", "nvd");
    } else {
      db.set("vulsrepo_detailLastTab", "jvn");
    }
  });

  $(".submitSelectfile").click(function () {
    $('#drawerLeft').drawer('hide');
    setTimeout(initPivotTable, 500);
  });

  $("#btnSelectAll").click(function () {
    $("#folderTree").dynatree("getRoot").visit(function (node) {
      node.select(true);
    });
    return false;
  });

  $("#btnDeselectAll").click(function () {
    $("#folderTree").dynatree("getRoot").visit(function (node) {
      node.select(false);
    });
    return false;
  });

  // $("#nvd_help").tooltip({});
  // $("a[data-toggle=popover]").popover();

  $("#save_pivot_conf").click(function () {
    $("#alert_saveDiag_textbox").css("display", "none");
    $("#alert_saveDiag_dropdown").css("display", "none");
    $("#input_saveDiag").val("");
    $("#drop_saveDiag_visibleValue").html("Select setting");
    $("#drop_saveDiag_hiddenValue").val("");

    setPulldown("#drop_saveDiag");
    $("#modal-saveDiag").modal('show');
  });

  $('input[name=radio_setting]:eq(0)').click(function () {
    $("#input_saveDiag").prop("disabled", false);
    $('#drop_saveDiag_buttonGroup button').prop("disabled", true);
  });

  $('input[name=radio_setting]:eq(1)').click(function () {
    $("#input_saveDiag").prop("disabled", true);
    $('#drop_saveDiag_buttonGroup button').prop("disabled", false);
  });

  $("#ok_saveDiag").click(function () {
    var configName;
    if ($('input[name=radio_setting]:eq(0)').prop('checked')) {
      configName = $("#input_saveDiag").val();
      if (configName !== "") {
        db.setPivotConf(configName, db.get("vulsrepo_pivot_conf_tmp"));
      } else {
        $("#alert_saveDiag_textbox").css("display", "");
        return;
      }
    } else {
      configName = $("#drop_saveDiag_hiddenValue").attr('value');

      if (configName !== "") {
        db.setPivotConf(configName, db.get("vulsrepo_pivot_conf_tmp"));
      } else {
        $("#alert_saveDiag_dropdown").css("display", "");
        return;
      }

    }

    setPulldown("#drop_topmenu");
    setPulldownDisplayChangeEvent("#drop_topmenu");
    $("#drop_topmenu_visibleValue").html(configName);
    $("#drop_topnemu_hiddenValue").val(configName);

    $("#modal-saveDiag").modal('hide');
    filterDisp.on("#label_pivot_conf");
    fadeAlert("#alert_pivot_conf");

  });

  $("#cancel_saveDiag").click(function () {
    $("#modal-saveDiag").modal('hide');
  });

  $("#delete_pivot_conf").click(function () {
    db.removePivotConf($("#drop_topmenu_hiddenValue").attr('value'));
    db.remove("vulsrepo_pivot_conf");
    $("#drop_topmenu_visibleValue").html("Select setting");
    $("#drop_topnemu_hiddenValue").val("");
    filterDisp.off("#label_pivot_conf");
    fadeAlert("#alert_pivot_conf");
    initPivotTable();
  });

  $("#clear_pivot_conf").click(function () {
    db.remove("vulsrepo_pivot_conf");
    $("#drop_topmenu_visibleValue").html("Select setting");
    $("#drop_topnemu_hiddenValue").val("");
    filterDisp.off("#label_pivot_conf");
    fadeAlert("#alert_pivot_conf");
    initPivotTable();
  });

  $("#Setting").click(function () {
    $("#modal-setting").modal('show');
  });

  $("[name='chkAheadUrl']").bootstrapSwitch();
  var chkAheadUrl = db.get("vulsrepo_chkAheadUrl");
  if (chkAheadUrl === "true") {
    $('input[name="chkAheadUrl"]').bootstrapSwitch('state', true, true);
  }

  $('input[name="chkAheadUrl"]').on('switchChange.bootstrapSwitch', function (event, state) {
    if (state === true) {
      db.set("vulsrepo_chkAheadUrl", "true");
    } else {
      db.remove("vulsrepo_chkAheadUrl");
    }
  });

};

var createFolderTree = function () {
  var tree = $("#folderTree").dynatree({
    initAjax: {
      url: "dist/cgi/getfilelist.cgi"
    },
    ajaxDefaults: {
      cache: false,
      timeout: 5000,
      dataType: "json"
    },
    minExpandLevel: 1,
    persist: false,
    clickFolderMode: 2,
    checkbox: true,
    selectMode: 3,
    fx: {
      height: "toggle",
      duration: 200
    },
    noLink: false,
    debugLevel: 0
  });
};

var isCheckNull = function (o) {
  if (o === null) {
    return true;
  } else {
    if (o.length === 0) {
      return true;
    }
  }
  return false;
}

var createPivotData = function (resultArray) {

  var array = [];

  $.each(resultArray, function (x, x_val) {
    $.each(x_val.data.KnownCves, function (y, y_val) {

      var knownValue;
      if (isCheckNull(y_val.CpeNames) === false) {
        knownValue = y_val.CpeNames;
      } else {
        knownValue = y_val.Packages;
      }

      $.each(knownValue, function (p, p_val) {
        var KnownObj = {
          "ScanTime": x_val.scanTime,
          "ServerName": x_val.data.ServerName,
          "Family": x_val.data.Family,
          "Release": x_val.data.Release,
          "CveID": '<a class="cveid">' + y_val.CveDetail.CveID + '</a>',
        };

        if (y_val.Confidence !== undefined) {
          KnownObj["Confidence.Score"] = y_val.Confidence.Score;
          KnownObj["Confidence.DetectionMethod"] = y_val.Confidence.DetectionMethod;
        } else {
          KnownObj["Confidence.Score"] = "Unknown";
          KnownObj["Confidence.DetectionMethod"] = "Unknown";
        }

        if (p_val.Name !== undefined) {
          KnownObj["Packages"] = p_val.Name;
        } else {
          KnownObj["Packages"] = p_val;
        }


        if (y_val.CveDetail.Nvd.CweID === "" || y_val.CveDetail.Nvd.CweID === undefined) {
          KnownObj["CweID"] = "Unknown";
        } else {
          KnownObj["CweID"] = y_val.CveDetail.Nvd.CweID;
        }

        if (x_val.data.Platform.Name !== "") {
          KnownObj["Platform"] = x_val.data.Platform.Name;
        } else {
          KnownObj["Platform"] = "None";
        }

        if (x_val.data.Container.Name !== "") {
          KnownObj["Container"] = x_val.data.Container.Name;
        } else {
          KnownObj["Container"] = "None";
        }

        if (y_val.CveDetail.Jvn.Score !== 0) {
          KnownObj["CVSS Score"] = y_val.CveDetail.Jvn.Score;
          KnownObj["CVSS Severity"] = y_val.CveDetail.Jvn.Severity;
          KnownObj["Summary"] = y_val.CveDetail.Jvn.Title;

          // ex) CveDetail.Jvn.Vector (AV:A/AC:H/Au:N/C:N/I:P/A:N)
          var arrayVector = getSplitArray(y_val.CveDetail.Jvn.Vector);
          KnownObj["CVSS (AV)"] = getVector.jvn(arrayVector[0])[0];
          KnownObj["CVSS (AC)"] = getVector.jvn(arrayVector[1])[0];
          KnownObj["CVSS (Au)"] = getVector.jvn(arrayVector[2])[0];
          KnownObj["CVSS (C)"] = getVector.jvn(arrayVector[3])[0];
          KnownObj["CVSS (I)"] = getVector.jvn(arrayVector[4])[0];
          KnownObj["CVSS (A)"] = getVector.jvn(arrayVector[5])[0];
        } else if (y_val.CveDetail.Nvd.Score !== 0) {
          KnownObj["CVSS Score"] = y_val.CveDetail.Nvd.Score;
          KnownObj["CVSS Severity"] = getSeverity(y_val.CveDetail.Nvd.Score)[0];
          KnownObj["Summary"] = y_val.CveDetail.Nvd.Summary;
          KnownObj["CVSS (AV)"] = y_val.CveDetail.Nvd.AccessVector;
          KnownObj["CVSS (AC)"] = y_val.CveDetail.Nvd.AccessComplexity;
          KnownObj["CVSS (Au)"] = y_val.CveDetail.Nvd.Authentication;
          KnownObj["CVSS (C)"] = y_val.CveDetail.Nvd.ConfidentialityImpact;
          KnownObj["CVSS (I)"] = y_val.CveDetail.Nvd.IntegrityImpact;
          KnownObj["CVSS (A)"] = y_val.CveDetail.Nvd.AvailabilityImpact;
        }

        array.push(KnownObj);

      });

    });

    $.each(x_val.data.UnknownCves, function (y, y_val) {

      var unknownValue;
      if (isCheckNull(y_val.CpeNames) === false) {
        unknownValue = y_val.CpeNames;
      } else {
        unknownValue = y_val.Packages;
      }

      $.each(unknownValue, function (p, p_val) {
        var UnknownObj = {
          "ScanTime": x_val.scanTime,
          "ServerName": x_val.data.ServerName,
          "Family": x_val.data.Family,
          "Release": x_val.data.Release,
          "CveID": '<a class="cveid">' + y_val.CveDetail.CveID + '</a>',
          "CweID": "Unknown",
          "CVSS Score": "Unknown",
          "CVSS Severity": "Unknown",
          "Summary": "Unknown",
          "CVSS (AV)": "Unknown",
          "CVSS (AC)": "Unknown",
          "CVSS (Au)": "Unknown",
          "CVSS (C)": "Unknown",
          "CVSS (I)": "Unknown",
          "CVSS (A)": "Unknown"
        };

        if (y_val.Confidence !== undefined) {
          UnknownObj["Confidence.Score"] = y_val.Confidence.Score;
          UnknownObj["Confidence.DetectionMethod"] = y_val.Confidence.DetectionMethod;
        } else {
          UnknownObj["Confidence.Score"] = "Unknown";
          UnknownObj["Confidence.DetectionMethod"] = "Unknown";
        }

        if (p_val.Name !== undefined) {
          UnknownObj["Packages"] = p_val.Name;
        } else {
          UnknownObj["Packages"] = p_val;
        }

        if (x_val.data.Platform.Name !== "") {
          UnknownObj["Platform"] = x_val.data.Platform.Name;
        } else {
          UnknownObj["Platform"] = "None";
        }

        if (x_val.data.Container.Name !== "") {
          UnknownObj["Container"] = x_val.data.Container.Name;
        } else {
          UnknownObj["Container"] = "None";
        }

        array.push(UnknownObj);
      });

    });

    if ((isCheckNull(x_val.data.KnownCves) == true) && (isCheckNull(x_val.data.UnknownCves) == true)) {
      var nothingObj = {
        "ScanTime": x_val.scanTime,
        "ServerName": x_val.data.ServerName,
        "Family": x_val.data.Family,
        "Release": x_val.data.Release,
        "CveID": "healthy",
        "CweID": "healthy",
        "Packages": "healthy",
        "CVSS Score": "healthy",
        "CVSS Severity": "healthy",
        "Summary": "healthy",
        "CVSS (AV)": "healthy",
        "CVSS (AC)": "healthy",
        "CVSS (Au)": "healthy",
        "CVSS (C)": "healthy",
        "CVSS (I)": "healthy",
        "CVSS (A)": "healthy"
      };

      if (x_val.data.Platform.Name !== "") {
        nothingObj["Platform"] = x_val.data.Platform.Name;
      } else {
        nothingObj["Platform"] = "None";
      }

      if (x_val.data.Container.Name !== "") {
        nothingObj["Container"] = x_val.data.Container.Name;
      } else {
        nothingObj["Container"] = "None";
      }

      array.push(nothingObj);
    }
  });

  return array;
};

var displayPivot = function (array) {

  var derivers = $.pivotUtilities.derivers;
  // var renderers = $.extend($.pivotUtilities.renderers,$.pivotUtilities.c3_renderers, $.pivotUtilities.d3_renderers);
  var renderers = $.extend($.pivotUtilities.renderers, $.pivotUtilities.c3_renderers);
  var dateFormat = $.pivotUtilities.derivers.dateFormat;
  var sortAs = $.pivotUtilities.sortAs;

  var pivot_attr = {
    renderers: renderers,
    menuLimit: 3000,
    rows: ["ScanTime"],
    cols: ["CVSS Severity", "CVSS Score"],
    vals: [""],
    exclusions: "",
    aggregatorName: "Count",
    rendererName: "Heatmap",
    sorters: function (attr) {
      if (attr == "CVSS Severity") {
        return sortAs(["healthy", "Low", "Medium", "High", "Unknown"]);
      }

      if (attr == "CveID" || attr == "CweID" || attr == "Packages" || attr == "CVSS Score" || attr == "Summary" || attr == "CVSS (AV)" || attr == "CVSS (AC)" || attr == "CVSS (Au)" || attr == "CVSS (C)" || attr == "CVSS (I)" || attr == "CVSS(I)") {
        return sortAs(["healthy"]);
      }

    },
    onRefresh: function (config) {
      db.set("vulsrepo_pivot_conf_tmp", config);
      $('.cveid').on('click', function () {
        displayDetail(this.text);
      });
      $("#pivot_base").find(".pvtVal[data-value='null']").css("background-color", "palegreen");
      $("#pivot_base").find(".pvtRowLabel:contains('healthy')").css("background-color", "lightskyblue");
      $("#pivot_base").find(".pvtColLabel:contains('healthy')").css("background-color", "lightskyblue");
    }

  };

  var pivot_obj = db.get("vulsrepo_pivot_conf");
  if (pivot_obj != null) {
    pivot_attr["rows"] = pivot_obj["rows"];
    pivot_attr["cols"] = pivot_obj["cols"];
    pivot_attr["vals"] = pivot_obj["vals"];
    pivot_attr["exclusions"] = pivot_obj["exclusions"];
    pivot_attr["aggregatorName"] = pivot_obj["aggregatorName"];
    pivot_attr["rendererName"] = pivot_obj["rendererName"];
    filterDisp.on("#label_pivot_conf");
  } else {
    filterDisp.off("#label_pivot_conf");
  }

  $("#pivot_base").pivotUI(array, pivot_attr, {
    overwrite: "true"
  });

};

var createDetailData = function (cveID) {
  var targetObj;
  $.each(vulsrepo.detailRawData, function (x, x_val) {
    $.each(x_val.data.KnownCves, function (y, y_val) {
      if (cveID === y_val.CveDetail.CveID) {
        targetObj = y_val.CveDetail;
      }
    });

    $.each(x_val.data.UnknownCves, function (y, y_val) {
      if (cveID === y_val.CveDetail.CveID) {
        targetObj = y_val.CveDetail;
      }
    });
  });

  return targetObj;
};


var initDetail = function () {
  $("#modal-label").text("");
  $("#publishedDateJvn,#lastModifiedDateJvn,#publishedDateNvd,#lastModifiedDateNvd").text("------");
  $("#scoreText_jvn,#scoreText_nvd").text("").css('background-color', 'gray');
  $("#cvss_av_jvn,#cvss_ac_jvn,#cvss_au_jvn,#cvss_c_jvn,#cvss_i_jvn,#cvss_a_jvn").removeClass().text("");
  $("#cvss_av_nvd,#cvss_ac_nvd,#cvss_au_nvd,#cvss_c_nvd,#cvss_i_nvd,#cvss_a_nvd").removeClass().text("");
  $("#detailTitle_jvn,#detailTitle_nvd,#Summary_jvn,#Summary_nvd,#CweID,#Link,#References").empty();
};


var displayDetail = function (th) {
  initDetail();

  if (db.get("vulsrepo_detailLastTab") === "nvd") {
    $('a[href="#tab_nvd"]').tab('show');
  } else {
    $('a[href="#tab_jvn"]').tab('show');
  }

  var data = createDetailData(th);
  $("#modal-label").text(data.CveID);

  if (data.Jvn.Summary !== "") {
    $("#publishedDateJvn").text(data.Jvn.PublishedDate.split("T")[0]);
    $("#lastModifiedDateJvn").text(data.Jvn.LastModifiedDate.split("T")[0]);

    var arrayVector = getSplitArray(data.Jvn.Vector);
    $("#scoreText_jvn").text(data.Jvn.Score + " (" + data.Jvn.Severity + ")").css('background-color', getSeverity(data.Jvn.Score)[1]);
    $("#cvss_av_jvn").text(getVector.jvn(arrayVector[0])[0]).addClass(getVector.jvn(arrayVector[0])[1]);
    $("#cvss_ac_jvn").text(getVector.jvn(arrayVector[1])[0]).addClass(getVector.jvn(arrayVector[1])[1]);
    $("#cvss_au_jvn").text(getVector.jvn(arrayVector[2])[0]).addClass(getVector.jvn(arrayVector[2])[1]);
    $("#cvss_c_jvn").text(getVector.jvn(arrayVector[3])[0]).addClass(getVector.jvn(arrayVector[3])[1]);
    $("#cvss_i_jvn").text(getVector.jvn(arrayVector[4])[0]).addClass(getVector.jvn(arrayVector[4])[1]);
    $("#cvss_a_jvn").text(getVector.jvn(arrayVector[5])[0]).addClass(getVector.jvn(arrayVector[5])[1]);
    $("#Summary_jvn").append("<div>" + data.Jvn.Summary + "<div>");

  } else {
    $("#scoreText_jvn").text("NO DATA");
    $("#Summary_jvn").append("NO DATA");
  }

  if (data.Nvd.Summary !== "") {
    $("#publishedDateNvd").text(data.Nvd.PublishedDate.split("T")[0]);
    $("#lastModifiedDateNvd").text(data.Nvd.LastModifiedDate.split("T")[0]);

    $("#scoreText_nvd").text(data.Nvd.Score + " (" + getSeverity(data.Nvd.Score)[0] + ")").css('background-color', getSeverity(data.Nvd.Score)[1]);
    $("#cvss_av_nvd").text(data.Nvd.AccessVector).addClass(getVector.nvd("AV", data.Nvd.AccessVector));
    $("#cvss_ac_nvd").text(data.Nvd.AccessComplexity).addClass(getVector.nvd("AC", data.Nvd.AccessComplexity));
    $("#cvss_au_nvd").text(data.Nvd.Authentication).addClass(getVector.nvd("Au", data.Nvd.Authentication));
    $("#cvss_c_nvd").text(data.Nvd.ConfidentialityImpact).addClass(getVector.nvd("C", data.Nvd.ConfidentialityImpact));
    $("#cvss_i_nvd").text(data.Nvd.IntegrityImpact).addClass(getVector.nvd("I", data.Nvd.IntegrityImpact));
    $("#cvss_a_nvd").text(data.Nvd.AvailabilityImpact).addClass(getVector.nvd("A", data.Nvd.AvailabilityImpact));
    $("#Summary_nvd").append("<div>" + data.Nvd.Summary + "<div>");

  } else {
    $("#scoreText_nvd").text("NO DATA");
    $("#Summary_nvd").append("NO DATA");
  }

  if (data.Nvd.CweID === "" || data.Nvd.CweID === undefined) {
    $("#CweID").append("<span>NO DATA</span>");
  } else {
    $("#CweID").append("<span>[" + data.Nvd.CweID + "] </span>");
    $("#CweID").append("<a href=\"" + vulsrepo.link.cwe_nvd.url + data.Nvd.CweID.split("-")[1] + "\" target='_blank'>MITRE</a>");
    $("#CweID").append("<span> / </span>");
    $("#CweID").append("<a href=\"" + vulsrepo.link.cwe_jvn.url + data.Nvd.CweID + ".html\" target='_blank'>JVN</a>");
  }

  addLink("#Link", vulsrepo.link.mitre.url + "?name=" + data.CveID, vulsrepo.link.mitre.disp, vulsrepo.link.mitre.find, "mitre");
  addLink("#Link", vulsrepo.link.cve.url + data.CveID, vulsrepo.link.cve.disp, vulsrepo.link.cve.find, "cve");
  addLink("#Link", vulsrepo.link.nvd.url + "?vulnId=" + data.CveID, vulsrepo.link.nvd.disp, vulsrepo.link.nvd.find, "nvd");

  var chkAheadUrl = db.get("vulsrepo_chkAheadUrl");
  if (data.Jvn.JvnLink === "") {
    $("#Link").append("<a href=\"" + vulsrepo.link.jvn.url + data.CveID + "\" target='_blank'>JVN</a>");
    if (chkAheadUrl === "true") {
      $("#Link").append("<img class='linkCheckIcon' src=\"dist/img/error.svg\"></img>");
    }

  } else {
    $("#Link").append("<a href=\"" + data.Jvn.JvnLink + "\" target='_blank'>JVN</a>");
    if (chkAheadUrl === "true") {
      $("#Link").append("<img class='linkCheckIcon' src=\"dist/img/ok.svg\"></img>");
    }
  }
  $("#Link").append("<span> / </span>");

  addLink("#Link", vulsrepo.link.rhel.url + data.CveID, vulsrepo.link.rhel.disp, vulsrepo.link.rhel.find, "rhel");
  addLink("#Link", vulsrepo.link.debian.url + data.CveID, vulsrepo.link.debian.disp, vulsrepo.link.debian.find, "debian");
  addLink("#Link", vulsrepo.link.ubuntu.url + data.CveID, vulsrepo.link.ubuntu.disp, vulsrepo.link.ubuntu.find, "ubuntu");

  if (isCheckNull(data.Jvn.References) === false) {
    $.each(data.Jvn.References, function (x, x_val) {
      $("#References").append("<div>[" + x_val.Source + "]<a href=\"" + x_val.Link + "\" target='_blank'> (" + x_val.Link + ")</a></div>");
    });
  }
  if (isCheckNull(data.Nvd.References) === false) {
    $.each(data.Nvd.References, function (x, x_val) {
      $("#References").append("<div>[" + x_val.Source + "]<a href=\"" + x_val.Link + "\" target='_blank'> (" + x_val.Link + ")</a></div>");
    });
  }

  $("#modal-detail").modal('show');

};

var addLink = function (target, url, disp, find, imgIdTarget) {
  $(target).append("<a href=\"" + url + "\" target='_blank'>" + disp + " </a>");
  var chkAheadUrl = db.get("vulsrepo_chkAheadUrl");
  if (chkAheadUrl === "true") {
    $(target).append("<img class='linkCheckIcon' id=imgId_" + imgIdTarget + " src=\"dist/img/loading_small.gif\"></img>");
    checkLink(url, find, "#imgId_" + imgIdTarget);
  }
  $(target).append("<span> / </span>");

};

var checkLink = function (url, find, imgId) {
  $.ajaxSetup({
    timeout: 30 * 1000
  });
  $.get(url).done(function (data, textStatus, jqXHR) {
    // console.log("done:" + imgID);
    // console.log(data);
  }).fail(function (jqXHR, textStatus, errorThrown) {
    // console.log("fail:" + imgId);
    // console.log(jqXHR);
  }).always(function (data, textStatus, jqXHR) {
    // console.log("always:" + imgId);
    // console.log(data);

    var result_text = data.results[0];
    if (result_text !== undefined) {
      if (result_text.indexOf(find) !== -1) {
        $(imgId).attr("src", "dist/img/error.svg");
      } else {
        $(imgId).attr("src", "dist/img/ok.svg");
      }
    } else {
      $(imgId).attr("src", "dist/img/error.svg");
    }
  });

};
