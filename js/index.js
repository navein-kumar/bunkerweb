var multiples = {};
var bunkerweb_version = "1.4.0";
var site_ui = "";

function addMultiple(id, paramsEnc) {
  var params = JSON.parse(paramsEnc);
  var div = document.getElementById(id);

  if (!multiples.hasOwnProperty(id)) {
    multiples[id] = 0;
  }

  multiples[id]++;
  x = 0;

  for (const param in params) {
    var input = "";
    var input_id =
      id + "-" + params[param]["id"] + "-" + multiples[id].toString();
    var input_name =
      params[param]["env"] +
      (multiples[id] - 1 > 0 ? "_" + (multiples[id] - 1).toString() : "");
    var input_label = params[param]["label"] + " #" + multiples[id].toString();
    var input_value = params[param]["default"];
    var input_help = params[param]["help"];
    var input_selects = params[param]["select"];
    var input_regex = params[param]["regex"];
    var pt = "";
    var padding_bottom = "";

    if (params[param]["type"] == "text" || params[param]["type"] == "number") {
      input = `<input type="${params[param]["type"]}" class="form-control" id="${input_id}" value="${input_value}" name="${input_name}" pattern="${input_regex}">`;
    } else if (params[param]["type"] == "check") {
      if (input_value == "yes") {
        input_value = "checked";
      } else {
        input_value = "";
      }

      input = `<div class="form-check form-switch"><input type="hidden" id="${input_id}-hidden" name="${input_name}" value="off"><input type="checkbox" class="form-check-input" role="switch" id="${input_id}" name="${input_name}" ${input_value}></div>`;
      pt = "pt-0";
    } else if (params[param]["type"] == "select") {
      input = `<select type="form-select" class="form-control form-select" id="${input_id}" name="${input_name}">`;
      for (const select in input_selects) {
        selected = "";
        if (input_value == select) {
          selected = "selected";
        }

        input += `<option value="${select}" ${selected}>${select}</option>`;
      }
      input += `</select>`;
    }

    if (x === 0 && multiples[id] > 1) {
      padding_bottom = "pb-3";
    }

    div.insertAdjacentHTML(
      "afterend",
      `<div class="d-flex flex-row justify-content-between align-items-center mb-3 ${padding_bottom}" id="${input_id}"><div class="px-2 d-sm-inline" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${input_help}"><i class="fas fa-question-circle"></i></div><label for="${input_id}" class="flex-grow-1 d-sm-inline ${pt}" id="${input_id}">${input_label}</label><div class="d-sm-inline" id="${input_id}">${input}</div></div>`
    );
    x++;
  }
}

function delMultiple(id, paramsEnc) {
  if (multiples.hasOwnProperty(id) && multiples[id] > 0) {
    var params = JSON.parse(paramsEnc);
    for (const param in params) {
      var input_id =
        id + "-" + params[param]["id"] + "-" + multiples[id].toString();
      document.getElementById(input_id).remove();
    }
    multiples[id]--;
  }
}

function init_bunkerweb_version(version) {
  bunkerweb_version = version;
}

$(document).ready(function () {
  var toastLive = new bootstrap.Toast($("#liveToast"));
  show_toast();
  setInterval(show_toast, 60000);

  var sites = {};
  var global_params = {};
  update_form_data();
  update_form_data("global", true);
  const default_site = JSON.parse(JSON.stringify(sites["www.example.com"]));
  default_site["SERVER_NAME"] = "";
  const default_global_params = JSON.parse(
    JSON.stringify(global_params["global"])
  );
  var multiple_keys = {};
  var checkbox_keys = [];
  window.Prism = window.Prism || {};
  update_inline_code(true);

  $("input[type='checkbox']").each(function () {
    checkbox_keys.push($(this).attr("name"));
  });

  function show_toast() {
    toastLive.show();
  }

  $("#form-new-multisite button").each(function () {
    if ($(this).attr("onclick").startsWith("addMultiple")) {
      var params = JSON.parse(
        $(this)
          .attr("onclick")
          .substring(
            $(this).attr("onclick").indexOf("{"),
            $(this).attr("onclick").length -
              $(this).attr("onclick").split("").reverse().join("").indexOf("}")
          )
      );
      var defaults = {};
      for (const param in params) {
        defaults[param] = params[param]["default"];

        if (params[param]["type"] == "check") {
          checkbox_keys.push(params[param]["env"]);
        }
      }

      multiple_keys[
        Object.keys(params)[0]
          .split("_")
          .slice(
            0,
            $(this)
              .parent()
              .attr("id")
              .replace("form-new-multisite-", "")
              .split("-").length
          )
          .join("_")
      ] = {
        id: $(this).parent().attr("id"),
        params: Object.keys(params).length,
        defaults: defaults,
      };
    }
  });

  function update_form_data(current_key = "", global = false) {
    var unindexed_array;
    if (global) {
      unindexed_array = $("#form-new-global").serializeArray();
    } else {
      unindexed_array = $("#form-new-multisite").serializeArray();
    }

    var indexed_array = {};

    $.map(unindexed_array, function (n, i) {
      indexed_array[n["name"]] = n["value"];
    });

    if (!global) {
      for (site in sites) {
        if (
          !$("#services-creations")
            .children()
            .toArray()
            .slice(0, -2)
            .map((el) => el.children[0].innerText)
            .includes(site)
        ) {
          delete sites[site];
        }
      }
    }

    let key;

    if (current_key != "") {
      key = current_key;
    } else {
      key = $("#services-creations").find("a[aria-selected='true']").html();
    }

    if (global) {
      global_params[key] = indexed_array;
    } else {
      sites[key] = indexed_array;
    }
  }

  function load_form_data(site) {
    var form_data = $("#form-new-multisite").serializeArray();
    for (const key in multiple_keys) {
      keys = form_data.filter((el) => el.name.startsWith(key));
      for (let i = 0; i < keys.length; i++) {
        $(`#${multiple_keys[key].id}`).find(".btn-outline-danger").click();
      }
      keys = Object.keys(site).filter((el) => el.startsWith(key));
      for (let i = 0; i < keys.length / multiple_keys[key].params; i++) {
        $(`#${multiple_keys[key].id}`).find(".btn-outline-success").click();
      }
    }

    for (let val in site) {
      let input = $("#form-new-multisite").find(`[name="${val}"]`).toArray();

      if (input.length > 1) {
        input = input.filter((el) => el.type === "checkbox")[0];
      } else {
        input = input[0];
      }

      if (input.type === "checkbox") {
        site[val] == "on" ? (input.checked = true) : (input.checked = false);
      } else {
        input.value = site[val];
      }
    }
  }

  $("#form-new-multisite-server-name").on("change", function () {
    let current_aria = $("#services-creations").find("a[aria-selected='true']");

    current_aria.attr("id", `site-${$(this).val().split(" ")[0]}`);
    current_aria.html($(this).val().split(" ")[0]);

    if ($(this).val() === "") {
      $("#pills-tab-new-multisite a").addClass("disabled");
      $("#services-creations a").addClass("disabled");
      $(
        "<div class='invalid-feedback'>A valid server name is required!</div>"
      ).insertAfter(this);
      $(this).addClass("is-invalid");
    } else {
      $("#pills-tab-new-multisite a").removeClass("disabled");
      $("#services-creations a").removeClass("disabled");
      current_aria.addClass("disabled");
      $(this).parent().find(".invalid-feedback").remove();
      $(this).removeClass("is-invalid");

      if (
        $("#services-creations")
          .children()
          .toArray()
          .slice(0, -2)
          .filter(
            (el) => el.children[0].getAttribute("aria-selected") !== "true"
          )
          .map((el) => el.children[0].innerText)
          .includes($(this).val())
      ) {
        $("#pills-tab-new-multisite a").addClass("disabled");
        $("#services-creations a").addClass("disabled");
        $(
          "<div class='invalid-feedback'>This server name is already used by another site!</div>"
        ).insertAfter(this);
        $(this).addClass("is-invalid");
      }
    }

    $("#delete-site").removeClass("disabled");
  });

  $("#new-multisite").on("click", function () {
    let current_aria = $("#services-creations").find("a[aria-selected='true']");

    current_aria.attr("aria-selected", "false");
    current_aria.removeClass("active");
    current_aria.removeClass("disabled");
    update_form_data(current_aria.html());
    $(this).addClass("disabled");
    $("#delete-site").removeAttr("hidden");

    $(
      `<li class="nav-item"><a class="nav-link active disabled" id="site-new.example.com" data-bs-toggle="tab" href="#" role="tab" aria-controls="" aria-selected="true">new.example.com</a></li>`
    ).insertBefore($(this).parent());
    load_form_data(default_site);

    if (
      $("#services-creations")
        .children()
        .toArray()
        .slice(0, -2)
        .filter((el) => el.children[0].getAttribute("aria-selected") !== "true")
        .map((el) => el.children[0].innerText)
        .includes("new.example.com")
    ) {
      $("#pills-tab-new-multisite a").addClass("disabled");
      $("#services-creations a").addClass("disabled");
      $(
        "<div class='invalid-feedback'>This server name is already used by another site!</div>"
      ).insertAfter("#form-new-multisite-server-name");
      $("#form-new-multisite-server-name").addClass("is-invalid");
      $("#delete-site").removeClass("disabled");
    }

    $("#form-new-multisite-server-name").val("new.example.com");

    let current_pill_tab = $("#pills-tab-new-multisite").find(".active");
    current_pill_tab.removeClass("active");
    let current_pill = $(current_pill_tab.attr("href"));
    current_pill.removeClass("active");
    current_pill.removeClass("show");

    $("#new-multisite-general-tab").addClass("active");
    let general_pill = $("#new-multisite-general");
    general_pill.addClass("active");
    general_pill.addClass("show");

    $("#form-new-multisite-server-name").focus();
    update_inline_code();
  });

  $("#delete-site").on("click", function () {
    let navs = $("#services-creations").children().toArray().slice(0, -2);
    navs.pop().remove();
    $("#form-new-multisite-server-name")
      .parent()
      .find(".invalid-feedback")
      .remove();
    $("#form-new-multisite-server-name").removeClass("is-invalid");

    if (navs.length <= 1) {
      $("#delete-site").attr("hidden", true);
    }

    $("#new-multisite").attr("aria-selected", "false");
    $("#new-multisite").removeClass("active");
    $("#new-multisite").removeClass("disabled");

    let current_aria = navs.pop().children[0];

    current_aria.setAttribute("aria-selected", "true");
    current_aria.classList.add("active");
    current_aria.classList.add("disabled");
    load_form_data(sites[current_aria.innerText]);
    update_form_data();
    update_inline_code();
  });

  $("#services-creations").on("click", "a", function () {
    if (["new-multisite", "delete-site"].includes($(this).attr("id"))) return;
    update_form_data($("#services-creations").find(".disabled").html());
    $("#services-creations a").removeClass("disabled");
    $(this).addClass("disabled");
    load_form_data(sites[$(this).html()]);
  });

  function diff(obj1, obj2) {
    const result = {};
    if (Object.is(obj1, obj2)) {
      return undefined;
    }

    if (!obj2 || typeof obj2 !== "object") {
      return obj2;
    }

    Object.keys(obj1 || {})
      .concat(Object.keys(obj2 || {}))
      .forEach((key) => {
        if (obj2[key] !== obj1[key] && !Object.is(obj1[key], obj2[key]))
          result[key] = checkbox_keys.includes(
            parseInt(key.split("_").pop())
              ? key.split("_").slice(0, -1).join("_")
              : key
          )
            ? obj2[key] == "on"
              ? "yes"
              : "no"
            : obj2[key];

        if (typeof obj2[key] === "object" && typeof obj1[key] === "object") {
          const value = diff(obj1[key], obj2[key]);
          if (value !== undefined) result[key] = value;
        }
      });

    for (const multiple_key in multiple_keys)
      for (const result_key in JSON.parse(JSON.stringify(result)))
        if (
          result.hasOwnProperty(result_key) &&
          result_key.startsWith(multiple_key) &&
          multiple_keys[multiple_key].defaults[
            parseInt(result_key.split("_").pop())
              ? result_key.split("_").slice(0, -1).join("_")
              : result_key
          ] == result[result_key]
        )
          delete result[result_key];

    return result;
  }

  function update_inline_code(init = false) {
    let current_integration = $("#integrations-selection").find(
      "a[aria-selected='true']"
    );
    let diff_global_params = diff(
      default_global_params,
      global_params["global"]
    );
    let diffs_sites_params = {};

    for (let site of Object.keys(sites)) {
      diffs_sites_params[site] = diff(default_site, sites[site]);
    }
    var use_ui = false;
    var ui_site;

    for (let site of Object.keys(diffs_sites_params)) {
      use_ui =
        diffs_sites_params[site].hasOwnProperty("USE_UI") &&
        diffs_sites_params[site]["USE_UI"] == "yes";
      ui_site = site;

      if (use_ui) break;
      else ui_site = undefined;
    }

    if (
      use_ui &&
      ["docker-integration", "linux-integration"].includes(
        current_integration.attr("id")
      )
    ) {
      diffs_sites_params[ui_site]["REVERSE_PROXY_URL"] = diffs_sites_params[
        ui_site
      ].hasOwnProperty("REVERSE_PROXY_URL")
        ? diffs_sites_params[ui_site]["REVERSE_PROXY_URL"]
        : "/changeme";
      diffs_sites_params[ui_site]["REVERSE_PROXY_HOST"] = "http://myui:7000";
      diffs_sites_params[ui_site][
        "REVERSE_PROXY_HEADERS"
      ] = `X-Script-Name ${diffs_sites_params[ui_site]["REVERSE_PROXY_URL"]}`;
      diffs_sites_params[ui_site]["REVERSE_PROXY_INTERCEPT_ERRORS"] = "no";

      var nbr_limit_req = 0;
      for (var key in diffs_sites_params[ui_site]) {
        if (key.startsWith("LIMIT_REQ_RATE")) {
          nbr_limit_req++;
        }
      }

      diffs_sites_params[ui_site][
        `LIMIT_REQ_URL${
          nbr_limit_req > 0 ? "_" + nbr_limit_req.toString() : ""
        }`
      ] = `${diffs_sites_params[ui_site]["REVERSE_PROXY_URL"]}${
        diffs_sites_params[ui_site]["REVERSE_PROXY_URL"].endsWith("/")
          ? ""
          : "/"
      }plugins/upload`;
      diffs_sites_params[ui_site][
        `LIMIT_REQ_RATE${
          nbr_limit_req > 0 ? "_" + nbr_limit_req.toString() : ""
        }`
      ] = "4r/s";
      diffs_sites_params[ui_site][
        `LIMIT_REQ_URL_${
          nbr_limit_req > 0 ? (nbr_limit_req + 1).toString() : "1"
        }`
      ] = `${diffs_sites_params[ui_site]["REVERSE_PROXY_URL"]}${
        diffs_sites_params[ui_site]["REVERSE_PROXY_URL"].endsWith("/")
          ? ""
          : "/"
      }logs`;
      diffs_sites_params[ui_site][
        `LIMIT_REQ_RATE_${
          nbr_limit_req > 0 ? (nbr_limit_req + 1).toString() : "1"
        }`
      ] = "4r/s";
    }

    if (current_integration.attr("id") === "docker-integration") {
      let el_shell = $("#inline-code-docker-shell");
      let el_yaml = $("#inline-code-docker-yaml");
      let inline_code_shell = `docker volume create bw-data && \\\n${
        use_ui ? "docker volume create bw-confs && \\\n" : ""
      }\n${
        use_ui
          ? "docker network create --subnet 10.20.30.0/24 bw-ui && \\\ndocker network create bw-docker && \\\n"
          : ""
      }docker network create bw-services && \\\n\ndocker run -d \\\n       --name mybunker \\\n       --network bw-services \\\n       -p 80:8080 \\\n       -p 443:8443 \\\n       -v bw-data:/data \\${
        use_ui
          ? '\n       -v bw-confs:/etc/nginx \\\n       -l "bunkerweb.UI" \\'
          : ""
      }\n       -e ${
        Object.keys(sites).length > 1
          ? '"SERVER_NAME=' + Object.keys(sites).join(" ") + '"'
          : "SERVER_NAME=" + Object.keys(sites)[0]
      } \\${
        Object.keys(sites).length > 1 || use_ui
          ? "\n       -e MULTISITE=yes \\"
          : ""
      }`;
      let inline_code_yaml = `version: '3'\nservices:\n  mybunker:\n    image: bunkerity/bunkerweb:${bunkerweb_version}\n    ports:\n      - 80:8080\n      - 443:8443\n    volumes:\n      - bw-data:/data${
        use_ui
          ? '\n      - bw-confs:/etc/nginx\n    labels:\n      - "bunkerweb.UI"'
          : ""
      }\n    environment:\n      - SERVER_NAME=${Object.keys(sites).join(" ")}${
        Object.keys(sites).length > 1 || use_ui ? "\n      - MULTISITE=yes" : ""
      }`;

      for (let key in diff_global_params) {
        inline_code_shell +=
          `\n       -e ` +
          (diff_global_params[key].includes(" ")
            ? `"${key}=${diff_global_params[key]}"`
            : `${key}=${diff_global_params[key]}`) +
          " \\";
        inline_code_yaml += `\n      - ${key}=${diff_global_params[key]}`;
      }

      for (let site in diffs_sites_params) {
        for (let key in diffs_sites_params[site]) {
          if (Object.keys(sites).length <= 1 && key == "SERVER_NAME") continue;

          inline_code_shell +=
            `\n       -e ` +
            (diffs_sites_params[site][key].includes(" ")
              ? (Object.keys(sites).length > 1 || use_ui
                  ? `"${site}_${key}`
                  : `"${key}`) + `=${diffs_sites_params[site][key]}"`
              : (Object.keys(sites).length > 1 || use_ui
                  ? `${site}_${key}`
                  : key) + `=${diffs_sites_params[site][key]}`) +
            " \\";
          inline_code_yaml +=
            `\n      - ` +
            (Object.keys(sites).length > 1 || use_ui ? `${site}_${key}` : key) +
            `=${diffs_sites_params[site][key]}`;
        }
      }

      el_shell.html(
        inline_code_shell +
          `\n       bunkerity/bunkerweb:${bunkerweb_version}${
            use_ui
              ? ` && \\\n\ndocker run -d \\\n      --name mydocker \\\n      --network bw-docker \\\n      --privileged \\\n      -v /var/run/docker.sock:/var/run/docker.sock:ro \\\n      -e CONTAINERS=1 \\\n      tecnativa/docker-socket-proxy && \\\n\ndocker run -d \\\n      --name myui \\\n      --network bw-docker \\\n      -v bw-data:/data \\\n      -v bw-confs:/etc/nginx \\\n      -e DOCKER_HOST=tcp://mydocker:2375 \\\n      -e ADMIN_USERNAME=admin \\\n      -e ADMIN_PASSWORD=changeme \\\n      -e ABSOLUTE_URI=http${
                  diffs_sites_params[ui_site].hasOwnProperty(
                    "GENERATE_SELF_SIGNED_SSL"
                  ) ||
                  diffs_sites_params[ui_site].hasOwnProperty(
                    "AUTO_LETS_ENCRYPT"
                  ) ||
                  diffs_sites_params[ui_site].hasOwnProperty("USE_CUSTOM_HTTPS")
                    ? "s"
                    : ""
                }://${ui_site}${
                  diffs_sites_params[ui_site]["REVERSE_PROXY_URL"]
                } \\\n      bunkerity/bunkerweb-ui:${bunkerweb_version} && \\\n\ndocker network connect bw-ui mybunker && \\\ndocker network connect bw-ui myui`
              : ""
          }`
      );
      el_yaml.html(
        inline_code_yaml +
          `\n    networks:\n      - bw-services${
            use_ui
              ? `\n      - bw-ui\n\n  myui:\n    image: bunkerity/bunkerweb-ui:${bunkerweb_version}\n    depends_on:\n      - mydocker\n    networks:\n      - bw-ui\n      - bw-docker\n    volumes:\n      - bw-data:/data\n      - bw-confs:/etc/nginx\n    environment:\n      - DOCKER_HOST=tcp://mydocker:2375\n      - ADMIN_USERNAME=admin\n      - ADMIN_PASSWORD=changeme\n      - ABSOLUTE_URI=http${
                  diffs_sites_params[ui_site].hasOwnProperty(
                    "GENERATE_SELF_SIGNED_SSL"
                  ) ||
                  diffs_sites_params[ui_site].hasOwnProperty(
                    "AUTO_LETS_ENCRYPT"
                  ) ||
                  diffs_sites_params[ui_site].hasOwnProperty("USE_CUSTOM_HTTPS")
                    ? "s"
                    : ""
                }://${ui_site}${
                  diffs_sites_params[ui_site]["REVERSE_PROXY_URL"]
                }\n\n  mydocker: \n    image: tecnativa/docker-socket-proxy\n    environment:\n      - CONTAINERS=1\n    networks:\n      - bw-docker\n    volumes:\n      - /var/run/docker.sock:/var/run/docker.sock:ro`
              : ""
          }\n\nvolumes:\n  bw-data:${
            use_ui ? "\n  bw-confs:" : ""
          }\n\nnetworks:\n  bw-services:\n    name: bw-services${
            use_ui
              ? "\n  bw-ui:\n    ipam:\n      driver: default\n      config:\n        - subnet: 10.20.30.0/24\n  bw-docker:\n    name: bw-docker"
              : ""
          }`
      );
    } else if (
      current_integration.attr("id") === "docker-autoconf-integration"
    ) {
      let el_global_shell = $("#inline-code-docker-autoconf-global-shell");
      let el_global_yaml = $("#inline-code-docker-autoconf-global-yaml");
      let inline_code_shell = `docker volume create bw-data && \\\n\ndocker network create --subnet 10.20.30.0/24 bw-autoconf && \\\ndocker network create bw-services && \\\n\ndocker run -d \\\n       --name mybunker \\\n       --network bw-autoconf \\\n       -p 80:8080 \\\n       -p 443:8443 \\\n       -e MULTISITE=yes \\\n       -e SERVER_NAME= \\\n       -e "API_WHITELIST_IP=127.0.0.0/8 10.20.30.0/24" \\`;
      let inline_code_yaml = `version: '3'\nservices:\n  mybunker:\n    image: bunkerity/bunkerweb:${bunkerweb_version}\n    ports:\n      - 80:8080\n      - 443:8443\n    environment:\n      - MULTISITE=yes\n      - SERVER_NAME=\n      - API_WHITELIST_IP=127.0.0.0/8 10.20.30.0/24`;

      for (let key in diff_global_params) {
        inline_code_shell +=
          `\n       -e ` +
          (diff_global_params[key].includes(" ")
            ? `"${key}=${diff_global_params[key]}"`
            : `${key}=${diff_global_params[key]}`) +
          " \\";
        5000;
        inline_code_yaml += `\n      - ${key}=${diff_global_params[key]}`;
      }
      el_global_shell.html(
        `${inline_code_shell}\n       -l bunkerweb.AUTOCONF \\\n       bunkerity/bunkerweb:${bunkerweb_version} && \\\n\ndocker network connect bw-services mybunker && \\\n\ndocker run -d \\\n       --name myautoconf \\\n       --network bw-autoconf \\\n       -v bw-data:/data \\\n       -v /var/run/docker.sock:/var/run/docker.sock:ro \\\n       bunkerity/bunkerweb-autoconf:${bunkerweb_version}`
      );
      el_global_yaml.html(
        `${inline_code_yaml}\n    labels:\n      - "bunkerweb.AUTOCONF"\n    networks:\n      - bw-autoconf\n      - bw-services\n\n  myautoconf:\n    image: bunkerity/bunkerweb-autoconf:${bunkerweb_version}\n    volumes:\n      - bw-data:/data\n      - /var/run/docker.sock:/var/run/docker.sock:ro\n    networks:\n      - bw-autoconf\n\nvolumes:\n    - bw-confs:\n\nnetworks:\n    bw-autoconf:\n      ipam:\n        driver: default\n        config:\n          - subnet: 10.20.30.0/24\n    bw-services:\n      name: bw-services`
      );

      let site_ids = $("#services-creations")
        .children()
        .toArray()
        .slice(0, -2)
        .map((el) => el.children[0].innerText);
      let first = true;
      let shells = $("#docker-autoconf-shells-content");
      let yamls = $("#docker-autoconf-yamls-content");
      shells.empty();
      yamls.empty();
      for (let site of site_ids) {
        let site_id = site.replaceAll(".", "-");
        let site_name = site.replaceAll(".", "_");
        let inline_code_shell = `docker run -d \\\n       --name ${site_name} \\\n       --network bw-services \\`;
        let inline_code_yaml = `version: '3'\nservices:\n  ${site_name}:\n    image: mywebapp:4.2\n    networks:\n       bw-services:\n         aliases:\n           - ${site_name}\n    labels:`;

        for (let key in diffs_sites_params[site]) {
          inline_code_shell += `\n       -l ${
            diffs_sites_params[site][key].includes(" ")
              ? `"bunkerweb.${key}=${diffs_sites_params[site][key]}"`
              : `bunkerweb.${key}=${diffs_sites_params[site][key]}`
          } \\`;
          inline_code_yaml += `\n      - "bunkerweb.${key}=${diffs_sites_params[site][key]}"`;
        }

        shells.append(
          `<div class="tab-pane ${
            first ? "show active" : ""
          }" id="docker-autoconf-${site_id}-shell-tab" role="tabpanel" aria-labelledby="docker-autoconf-${site_id}-shell"><pre><code class="language-shell">${inline_code_shell}\n       mywebapp:4.2</code></pre></div>`
        );
        yamls.append(
          `<div class="tab-pane ${
            first ? "show active" : ""
          }" id="docker-autoconf-${site_id}-yaml-tab" role="tabpanel" aria-labelledby="docker-autoconf-${site_id}-yaml"><pre><code class="language-yaml">${inline_code_yaml}\n\nnetworks:\n  bw-services:\n    external:\n      name: bw-services</code></pre></div>`
        );
        first = false;
      }

      first = true;
      navs_shell = $("#inline-code-docker-autoconf-shell-tabs");
      navs_yaml = $("#inline-code-docker-autoconf-yaml-tabs");
      navs_shell.empty();
      navs_yaml.empty();
      site_ids = site_ids.map((el) => el.replaceAll(".", "-"));
      for (let site_id of site_ids) {
        navs_shell.append(
          `<li class="nav-item"><a class="nav-link ${
            first ? "active" : ""
          }" id="docker-autoconf-${site_id}-shell" data-bs-toggle="tab" href="#docker-autoconf-${site_id}-shell-tab" role="tab" aria-controls="docker-autoconf-${site_id}-shell-tab">${site_id.replaceAll(
            "-",
            "."
          )}</a></li>`
        );
        navs_yaml.append(
          `<li class="nav-item"><a class="nav-link ${
            first ? "active" : ""
          }" id="docker-autoconf-${site_id}-yaml" data-bs-toggle="tab" href="#docker-autoconf-${site_id}-yaml-tab" role="tab" aria-controls="docker-autoconf-${site_id}-yaml-tab">${site_id.replaceAll(
            "-",
            "."
          )}</a></li>`
        );
        first = false;
      }
    } else if (current_integration.attr("id") === "swarm-integration") {
      let el_global_shell = $("#inline-code-swarm-global-shell");
      let el_global_yaml = $("#inline-code-swarm-global-yaml");
      let inline_code_shell = `docker network create -d overlay --attachable --subnet 10.20.30.0/24 bw-autoconf && \\\ndocker network create -d overlay --attachable bw-services && \\\n\ndocker service create \\\n       --name mybunker \\\n       --mode global \\\n       --constraint node.role==worker \\\n       --network bw-autoconf \\\n       --network bw-services \\\n       -p published=80,target=8080,mode=host \\\n       -p published=443,target=8443,mode=host \\\n       -e SWARM_MODE=yes \\\n       -e MULTISITE=yes \\\n       -e SERVER_NAME= \\\n       -e "API_WHITELIST_IP=127.0.0.0/8 10.20.30.0/24" \\`;
      let inline_code_yaml = `version: '3.5'\nservices:\n  mybunker:\n    image: bunkerity/bunkerweb:${bunkerweb_version}\n    ports:\n      - published: 80\n        target: 8080\n        mode: host\n        protocol: tcp\n      - published: 443\n        target: 8443\n        mode: host\n        protocol: tcp\n    environment:\n      - SWARM_MODE=yes\n      - MULTISITE=yes\n      - SERVER_NAME=\n      - API_WHITELIST_IP=127.0.0.0/8 10.20.30.0/24`;

      for (let key in diff_global_params) {
        inline_code_shell +=
          `\n       -e ` +
          (diff_global_params[key].includes(" ")
            ? `"${key}=${diff_global_params[key]}"`
            : `${key}=${diff_global_params[key]}`) +
          " \\";
        inline_code_yaml += `\n      - ${key}=${diff_global_params[key]}`;
      }
      el_global_shell.html(
        `${inline_code_shell}\n       -l bunkerweb.AUTOCONF \\\n       bunkerity/bunkerweb:${bunkerweb_version} && \\\n\ndocker service create \\\n       --name myautoconf \\\n       --constraint node.role==manager \\\n       --network bw-autoconf \\\n       --mount type=bind,source=/var/run/docker.sock,destination=/var/run/docker.sock,ro \\\n       --mount type=volume,source=bw-data,destination=/data \\\n       -e SWARM_MODE=yes \\\n       bunkerity/bunkerweb-autoconf:${bunkerweb_version}`
      );
      el_global_yaml.html(
        `${inline_code_yaml}\n    networks:\n      - bw-autoconf\n      - bw-services\n    deploy:\n      mode: global\n      placement:\n        constraints:\n          - "node.role == worker"\n      labels:\n        - "bunkerweb.AUTOCONF"\n\n  myautoconf:\n    image: bunkerity/bunkerweb-autoconf:${bunkerweb_version}\n    environment:\n      - SWARM_MODE=yes\n    volumes:\n      - bw-data:/data\n      - /var/run/docker.sock:/var/run/docker.sock:ro\n    networks:\n      - bw-autoconf\n    deploy:\n      replicas: 1\n      placement:\n        constraints:\n          - "node.role == manager"\n\nnetworks:\n    bw-autoconf:\n      driver: overlay\n      attachable: true\n      name: bw-autoconf\n      ipam:\n        config:\n          - subnet: 10.20.30.0/24\n    bw-services:\n      driver: overlay\n      attachable: true\n      name: bw-services\n\nvolumes:\n    - bw-data:`
      );

      let site_ids = $("#services-creations")
        .children()
        .toArray()
        .slice(0, -2)
        .map((el) => el.children[0].innerText);
      let first = true;
      let shells = $("#swarm-shells-content");
      let yamls = $("#swarm-yamls-content");
      shells.empty();
      yamls.empty();
      for (let site of site_ids) {
        let site_id = site.replaceAll(".", "-");
        let site_name = site.replaceAll(".", "_");
        let inline_code_shell = `docker service create \\\n       --name ${site_name} \\\n       --network bw-services \\`;
        let inline_code_yaml = `version: '3.5'\nservices:\n  ${site_name}:\n    image: mywebapp:4.2\n    networks:\n       - bw-services\n    deploy:\n      placement:\n        constraints:\n          - "node.role==worker"\n      labels:`;

        for (let key in diffs_sites_params[site]) {
          inline_code_shell += `\n       -l ${
            diffs_sites_params[site][key].includes(" ")
              ? `"bunkerweb.${key}=${diffs_sites_params[site][key]}"`
              : `bunkerweb.${key}=${diffs_sites_params[site][key]}`
          } \\`;
          inline_code_yaml += `\n        - "bunkerweb.${key}=${diffs_sites_params[site][key]}"`;
        }

        shells.append(
          `<div class="tab-pane ${
            first ? "show active" : ""
          }" id="swarm-${site_id}-shell-tab" role="tabpanel" aria-labelledby="swarm-${site_id}-shell"><pre><code class="language-shell">${inline_code_shell}\n       mywebapp:4.2</code></pre></div>`
        );
        yamls.append(
          `<div class="tab-pane ${
            first ? "show active" : ""
          }" id="swarm-${site_id}-yaml-tab" role="tabpanel" aria-labelledby="swarm-${site_id}-yaml"><pre><code class="language-yaml">${inline_code_yaml}\n\nnetworks:\n  bw-services:\n    external:\n      name: bw-services</code></pre></div>`
        );
        first = false;
      }

      first = true;
      navs_shell = $("#inline-code-swarm-shell-tabs");
      navs_yaml = $("#inline-code-swarm-yaml-tabs");
      navs_shell.empty();
      navs_yaml.empty();
      site_ids = site_ids.map((el) => el.replaceAll(".", "-"));
      for (let site_id of site_ids) {
        navs_shell.append(
          `<li class="nav-item"><a class="nav-link ${
            first ? "active" : ""
          }" id="swarm-${site_id}-shell" data-bs-toggle="tab" href="#swarm-${site_id}-shell-tab" role="tab" aria-controls="swarm-${site_id}-shell-tab">${site_id.replaceAll(
            "-",
            "."
          )}</a></li>`
        );
        navs_yaml.append(
          `<li class="nav-item"><a class="nav-link ${
            first ? "active" : ""
          }" id="swarm-${site_id}-yaml" data-bs-toggle="tab" href="#swarm-${site_id}-yaml-tab" role="tab" aria-controls="swarm-${site_id}-yaml-tab">${site_id.replaceAll(
            "-",
            "."
          )}</a></li>`
        );
        first = false;
      }
    } else if (current_integration.attr("id") === "kubernetes-integration") {
      let el_yaml = $("#inline-code-kubernetes-yaml");
      let inline_code_yaml = `apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: ingress\n  annotations:\n    - bunkerweb.io/AUTOCONF: "yes"`;
      let reverse_proxy = false;
      let inline_code_specs = `\nspec:\n  rules:`;

      for (let key in diff_global_params) {
        inline_code_yaml += `\n    - bunkerweb.io/${key}: ${diff_global_params[key]}`;
      }

      var reverse_proxies = {};
      for (let site in diffs_sites_params) {
        reverse_proxies[site] = {};
        for (let key in diffs_sites_params[site])
          if (
            !(
              key.startsWith("REVERSE_PROXY_URL") ||
              key.startsWith("REVERSE_PROXY_HOST")
            )
          )
            inline_code_yaml += `\n    - bunkerweb.io/${site}_${key}: ${diffs_sites_params[site][key]}`;
          else if (parseInt(key.split("_").pop())) {
            if (
              !reverse_proxies[site].hasOwnProperty(
                parseInt(key.split("_").pop())
              )
            )
              reverse_proxies[site][parseInt(key.split("_").pop())] = {};

            reverse_proxies[site][parseInt(key.split("_").pop())][
              `REVERSE_PROXY_${key.split("_")[2]}`
            ] = diffs_sites_params[site][key];
          } else {
            if (!reverse_proxies[site].hasOwnProperty(0))
              reverse_proxies[site][0] = {};

            reverse_proxies[site][0][key] = diffs_sites_params[site][key];
          }
      }

      for (let site in reverse_proxies) {
        if (Object.keys(reverse_proxies[site]).length > 0) {
          inline_code_specs += `\n  - host: ${site}\n    http:\n      paths:`;
          for (let key in reverse_proxies[site]) {
            if (Object.keys(reverse_proxies[site][key]).length > 1) {
              reverse_proxy = true;
              console.log(
                reverse_proxies[site][key]["REVERSE_PROXY_HOST"].length
              );
              reverse_proxies[site][key]["REVERSE_PROXY_HOST"] =
                reverse_proxies[site][key]["REVERSE_PROXY_HOST"].replace(
                  "http://",
                  ""
                );
              inline_code_specs += `\n        - path: ${
                reverse_proxies[site][key]["REVERSE_PROXY_URL"]
              }\n          backend:\n            service:\n              name: ${reverse_proxies[
                site
              ][key]["REVERSE_PROXY_HOST"].substring(
                0,
                reverse_proxies[site][key]["REVERSE_PROXY_HOST"].includes(":")
                  ? reverse_proxies[site][key]["REVERSE_PROXY_HOST"].indexOf(
                      ":"
                    )
                  : reverse_proxies[site][key]["REVERSE_PROXY_HOST"].length
              )}\n              port:\n                number: ${
                reverse_proxies[site][key]["REVERSE_PROXY_HOST"].includes(":")
                  ? reverse_proxies[site][key]["REVERSE_PROXY_HOST"]
                      .split(":")[1]
                      .substring(
                        0,
                        reverse_proxies[site][key]["REVERSE_PROXY_HOST"]
                          .split(":")[1]
                          .includes("/")
                          ? reverse_proxies[site][key]["REVERSE_PROXY_HOST"]
                              .split(":")[1]
                              .indexOf("/")
                          : reverse_proxies[site][key][
                              "REVERSE_PROXY_HOST"
                            ].split(":")[1].length
                      )
                  : "80"
              }`;
            }
          }

          if (inline_code_specs.endsWith("paths:")) {
            inline_code_specs = "";
            reverse_proxy = false;
          }
        }
      }

      el_yaml.html(
        `${inline_code_yaml}${reverse_proxy ? inline_code_specs : ""}`
      );
    } else if (current_integration.attr("id") === "linux-integration") {
      let el_conf = $("#inline-code-linux-conf");
      let inline_code_conf = `SERVER_NAME=${Object.keys(sites).join(" ")}${
        Object.keys(sites).length > 1 || use_ui ? "\nMULTISITE=yes" : ""
      }`;
      let warning =
        !diff_global_params.hasOwnProperty("HTTP_PORT") ||
        !diff_global_params.hasOwnProperty("HTTPS_PORT") ||
        !diff_global_params.hasOwnProperty("DNS_RESOLVERS");
      let linux_alert = $("#linux-alert");
      $("#linux-web-ui-text").attr("hidden", !use_ui);
      $("#linux-web-ui-pre").attr("hidden", !use_ui);

      if (warning) {
        linux_alert.removeAttr("style");
        checks = {
          HTTP_PORT: diff_global_params.hasOwnProperty("HTTP_PORT"),
          HTTPS_PORT: diff_global_params.hasOwnProperty("HTTPS_PORT"),
          DNS_RESOLVERS: diff_global_params.hasOwnProperty("DNS_RESOLVERS"),
        };

        $("#linux-alert-p-1").html(
          `The env variables ${checks["HTTP_PORT"] ? "" : "<b>HTTP_PORT</b>"}${
            checks["HTTPS_PORT"]
              ? ""
              : (checks["HTTP_PORT"]
                  ? ""
                  : checks["DNS_RESOLVERS"]
                  ? " and "
                  : ", ") + "<b>HTTPS_PORT</b>"
          }${
            checks["DNS_RESOLVERS"]
              ? ""
              : (!checks["HTTP_PORT"] || !checks["HTTPS_PORT"] ? " and " : "") +
                "<b>DNS_RESOLVERS</b>"
          } have the default values.`
        );

        $("#linux-alert-p-2").html(
          `We recommend to change them accordingly to this: ${
            checks["HTTP_PORT"] ? "" : "<b>HTTP_PORT=80</b>"
          }${
            checks["HTTPS_PORT"]
              ? ""
              : (checks["HTTP_PORT"]
                  ? ""
                  : checks["DNS_RESOLVERS"]
                  ? " and "
                  : ", ") + "<b>HTTPS_PORT=433</b>"
          }${
            checks["DNS_RESOLVERS"]
              ? ""
              : (!checks["HTTP_PORT"] || !checks["HTTPS_PORT"] ? " and " : "") +
                "<b>DNS_RESOLVERS=8.8.8.8 8.8.4.4</b>"
          }.`
        );
      } else {
        linux_alert.attr("style", "display: none !important");
      }

      if (use_ui) {
        diffs_sites_params[ui_site]["REVERSE_PROXY_HOST"] =
          "http://127.0.0.1:7000";
        $("#inline-code-linux-web-ui").html(
          `ADMIN_USERNAME=admin\nADMIN_PASSWORD=changeme\nABSOLUTE_URI=http${
            diffs_sites_params[ui_site].hasOwnProperty(
              "GENERATE_SELF_SIGNED_SSL"
            ) ||
            diffs_sites_params[ui_site].hasOwnProperty("AUTO_LETS_ENCRYPT") ||
            diffs_sites_params[ui_site].hasOwnProperty("USE_CUSTOM_HTTPS")
              ? "s"
              : ""
          }://${ui_site}${diffs_sites_params[ui_site]["REVERSE_PROXY_URL"]}`
        );
      }

      for (let key in diff_global_params) {
        inline_code_conf += `\n${key}=${diff_global_params[key]}`;
      }

      for (let site in diffs_sites_params) {
        for (let key in diffs_sites_params[site]) {
          if (
            (Object.keys(sites).length <= 1 && !use_ui) ||
            key == "SERVER_NAME"
          )
            continue;

          inline_code_conf +=
            "\n" +
            (Object.keys(sites).length > 1 || use_ui
              ? `${site}_${key}`
              : `${key}`) +
            `=${diffs_sites_params[site][key]}`;
        }
      }

      el_conf.html(inline_code_conf);
    }

    Prism.highlightAll();
  }

  $("#integrations-selection").on("click", "a", function () {
    update_inline_code();
  });

  $("form").on("focus", ".form-control", function () {
    if (
      !["form-new-multisite-server-name", "newsletter-email"].includes(
        $(this).attr("id")
      ) &&
      ["text", "number"].includes($(this).attr("type")) &&
      $(this).prop("validity").valid
    ) {
      $(this).addClass("is-valid");
    }
  });

  $("form").on("focusout", ".form-control", function () {
    if (
      !["form-new-multisite-server-name", "newsletter-email"].includes(
        $(this).attr("id")
      ) &&
      ["text", "number"].includes($(this).attr("type"))
    ) {
      $(this).removeClass("is-valid");
    }
  });

  $("#form-new-multisite").on("change", ".form-control", function () {
    let current_aria = $("#services-creations").find("a[aria-selected='true']");
    if (
      $(this).attr("id") !== "form-new-multisite-server-name" &&
      ["text", "number"].includes($(this).attr("type"))
    ) {
      current_aria.attr("id", `site-${$(this).val().split(" ")[0]}`);

      if (!$(this).prop("validity").valid) {
        $("#pills-tab-new-multisite a").addClass("disabled");
        $("#services-creations a").addClass("disabled");
        $(this).addClass("is-invalid");
      } else {
        $("#pills-tab-new-multisite a").removeClass("disabled");
        $("#services-creations a").removeClass("disabled");
        current_aria.addClass("disabled");
        $(this).removeClass("is-invalid");
        $(this).addClass("is-valid");
      }
    }

    if (
      (site_ui === "" || current_aria.html() === site_ui) &&
      $(this).attr("name") === "USE_UI"
    ) {
      is_checked = $(this).is(":checked");
      $("#form-new-global-disable-default-server")
        .find(".form-check-input")
        .prop("checked", is_checked);
      $("#form-new-global-api-whitelist-ip").val(
        is_checked ? "127.0.0.0/8 10.20.30.0/24" : "127.0.0.0/8"
      );
      update_form_data("global", true);

      $("#form-new-multisite-use-client-cache")
        .find(".form-check-input")
        .prop("checked", is_checked);
      $("#form-new-multisite-use-gzip")
        .find(".form-check-input")
        .prop("checked", is_checked);
      $("#form-new-multisite-serve-files")
        .find(".form-check-input")
        .prop("checked", is_checked);

      site_ui = is_checked ? current_aria.html() : "";
    }

    update_form_data($("#services-creations").find(".disabled").html());
    update_inline_code();
  });

  $("#form-new-global").on("change", ".form-control", function () {
    if (["text", "number"].includes($(this).attr("type"))) {
      let current_aria = $("#services-creations").find(
        "a[aria-selected='true']"
      );

      current_aria.attr("id", `site-${$(this).val().split(" ")[0]}`);

      if (!$(this).prop("validity").valid) {
        $("#pills-tab-new-multisite a").addClass("disabled");
        $("#services-creations a").addClass("disabled");
        $(this).addClass("is-invalid");
      } else {
        $("#pills-tab-new-multisite a").removeClass("disabled");
        $("#services-creations a").removeClass("disabled");
        current_aria.addClass("disabled");
        $(this).removeClass("is-invalid");
        $(this).addClass("is-valid");
      }
    }

    update_form_data("global", true);
    update_inline_code();
  });
});
