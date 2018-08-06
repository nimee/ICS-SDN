function refreshDevices() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            tbldata = JSON.parse(this.responseText);
            var tblcontent = "<tr>";
            tblcontent += "<th>Device ID</th>";
            tblcontent += "<th>Available</th>";
            tblcontent += "<th>Last update</th>";
            tblcontent += "<th>Manufacturer</th>";
            tblcontent += "<th>Hardware</th>";
            tblcontent += "<th>Protocol</th>";
            tblcontent += "</tr>\r\n";
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
                tblcontent += "</tr>\r\n";
            }
            tblelem = document.getElementById('devices');
            tblelem.innerHTML = tblcontent;
        }
    }
    xhttp.open('GET', '/getdevices', true);
    xhttp.send();
}

function refreshAll() {
    localTime = document.getElementById('localtime');
    ctime = new Date();
    localTime.innerHTML = ctime.toLocaleDateString() + " " + ctime.toLocaleTimeString();
    refreshDevices();
}

var timerId = -1;

function setAutoRefresh(timeout) {
    if (timerId > 0)
        clearInterval(timerId);
    timerId = setInterval(refreshAll, timeout);
}

function stopAutoRefresh() {
    if(timerId > 0)
        clearInterval(timerId);
}