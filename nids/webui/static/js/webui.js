
function getSelecetdDeviceRole(id, role) {
    var ret = "<select class=\"form-control\" id=\"drole-" + id + "\">";
    switch(role) {
        case "bridge":
            ret += "<option value=\"bridge\" selected>Bridge</option><option value=\"field\">Field network</option><option value=\"honeypot\">Honeypot network</option><option value=\"na\">Unassigned</option>";
            break;
        case "field":
            ret += "<option value=\"bridge\">Bridge</option><option value=\"field\" selected>Field network</option><option value=\"honeypot\">Honeypot network</option><option value=\"na\">Unassigned</option>";
            break;
        case "honeypot":
            ret += "<option value=\"bridge\">Bridge</option><option value=\"field\">Field network</option><option value=\"honeypot\" selected>Honeypot network</option><option value=\"na\">Unassigned</option>";
            break;
        default:
            ret += "<option value=\"bridge\">Bridge</option><option value=\"field\">Field network</option><option value=\"honeypot\">Honeypot network</option><option value=\"na\" selected>Unassigned</option>";
    }
    ret += "</select>"
    return ret;
}

function refreshDevices() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            tbldata = JSON.parse(this.responseText);
            var tblcontent = "<thead class=\"thead-light\">\r\n<tr>";
            tblcontent += "<th>Device ID</th>";
            tblcontent += "<th>Available</th>";
            tblcontent += "<th>Last update</th>";
            tblcontent += "<th>Manufacturer</th>";
            tblcontent += "<th>Hardware</th>";
            tblcontent += "<th>Protocol</th>";
            tblcontent += "<th>Configured role</th>";
            tblcontent += "</tr>\r\n</thead>\r\n<tbody>\r\n";
            for (d in tbldata.devs) {
                currdev = tbldata.devs[d];
                annot = currdev.annotations;
                tblcontent += "<tr>";
                tblcontent += "<td>" + currdev.id + "</td>";
                if (currdev.available) 
                    tblcontent += "<td>YES</td>";
                else
                tblcontent += "<td>NO</td>";
                tblcontent += "<td>" + currdev.humanReadableLastUpdate + "</td>";
                tblcontent += "<td>" + currdev.mfr + "</td>";
                tblcontent += "<td>" + currdev.hw + "</td>";
                tblcontent += "<td>" + annot.protocol + "</td>";
                tblcontent += "<td><div class=\"input-group input-group-sm\">" + getSelecetdDeviceRole(d, currdev.role) + "<div class=\"input-group-append\"><button type=\"button\" class=\"btn btn-sm btn-outline-success\" onclick=\"updateDeviceRole('" + currdev.id + "', document.getElementById('drole-" + d + "').value);\">Update</button></div></div></td>";
                tblcontent += "</tr>\r\n";
            }
            tblcontent += "</tbody>\r\n";
            tblelem = document.getElementById('devices');
            tblelem.innerHTML = tblcontent;
        }
    }
    xhttp.open('GET', '/getdevices', true);
    xhttp.send();
}

function refreshHosts() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            tbldata = JSON.parse(this.responseText);
            var tblcontent = "<thead class=\"thead-light\">\r\n<tr>";
            tblcontent += "<th>MAC address</th>";
            tblcontent += "<th>IP addresses</th>";
            tblcontent += "<th>Configured name</th>";
            tblcontent += "<th>Locations</th>";
            tblcontent += "</tr>\r\n</thead>\r\n<tbody>\r\n";
            for (h in tbldata.hosts) {
                currhost = tbldata.hosts[h];
                tblcontent += "<tr>";
                tblcontent += "<td>" + currhost.mac + "</td>";
                tblcontent += "<td>" + currhost.ipAddresses.join(', ') + "</td>";
                tblcontent += "<td><div class=\"input-group input-group-sm\"><input id=\"hname-" + h + "\" type=\"text\" class=\"form-control\" value=\"" + currhost.name + "\"><div class=\"input-group-append\"><button type=\"button\" class=\"btn btn-sm btn-outline-success\" onclick=\"updateHostName('" + currhost.ipAddresses[0] + "', document.getElementById('hname-" + h + "').value);\">Update</button></div></div></td>";
                tblcontent += "<td>"
                for (l in currhost.locations) {
                    cloc = currhost.locations[l];
                    cloc = cloc.elementId + " port: " + cloc.port + ",";
                    cloc = cloc.substr(0, cloc.length - 1);
                    tblcontent += cloc;
                }
                tblcontent += "</td>";
                tblcontent += "</tr>\r\n";
            }
            tblcontent += "</tbody>\r\n";
            tblelem = document.getElementById('hosts')
            tblelem.innerHTML = tblcontent
        }
    }
    xhttp.open('GET', '/gethosts', true);
    xhttp.send();
}

function refreshAll() {
    localTime = document.getElementById('localtime');
    ctime = new Date();
    localTime.innerHTML = ctime.toLocaleDateString() + " " + ctime.toLocaleTimeString();
    refreshDevices();
    refreshHosts();
}

function updateHostName(ip, name) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', '/updatehostname', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("ip=" + ip + "&name=" + name);
    refreshHosts();
}

function updateDeviceRole(id, role) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', '/updatedevrole', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("id=" + id + "&role=" + role);
    refreshDevices();
}

// Timer
var timerId = -1;

function setAutoRefresh(timeout) {
    if (timerId > 0)
        clearInterval(timerId);
    timerId = setInterval(refreshAll, timeout);
    bt = document.getElementById('btn-timer');
    bt.setAttribute('onclick', 'stopAutoRefresh();');
    bt.innerHTML = "Stop auto-refresh";
}

function stopAutoRefresh() {
    if(timerId > 0)
        clearInterval(timerId);
    bt = document.getElementById('btn-timer');
    bt.setAttribute('onclick', 'setAutoRefresh(10000);');
    bt.innerHTML = "Start auto-refresh";
}