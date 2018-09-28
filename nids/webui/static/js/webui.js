
function getSelectedDeviceRole(id, role) {
    var ret = document.createElement('select');
    ret.classList.add("form-control");
    ret.id = "drole-" + id;
    var brg = document.createElement('option');
    brg.value = "bridge";
    brg.innerHTML = "Bridge";
    brg.selected = (role == "bridge");
    ret.add(brg);
    var fld = document.createElement('option');
    fld.value = "field";
    fld.innerHTML = "Field network";
    fld.selected = (role == "field");
    ret.add(fld);
    var hnp = document.createElement('option');
    hnp.value = "honeypot";
    hnp.innerHTML = "Honeypot network";
    hnp.selected = (role == "honeypot");
    ret.add(hnp);
    var spn = document.createElement('option');
    spn.value = "span";
    spn.innerHTML = "Traffic mirror";
    spn.selected = (role == "span");
    ret.add(spn);
    var una = document.createElement('option');
    una.value = "na";
    una.innerHTML = "Unassigned";
    una.selected = (role == "na");
    ret.add(una);
    return ret;
}

function getSelectedHostRole(id, role) {
    var ret = document.createElement('select');
    ret.classList.add('form-control');
    ret.id = "hrole-" + id;
    var act = document.createElement('option');
    act.value = "actuator";
    act.innerHTML = "Actuator";
    act.selected = (role == "actuator");
    ret.add(act);
    var hmi = document.createElement('option');
    hmi.value = "hmi";
    hmi.innerHTML = "HMI";
    hmi.selected = (role == "hmi");
    ret.add(hmi);
    var plc = document.createElement('option');
    plc.value = "plc";
    plc.innerHTML = "PLC";
    plc.selected = (role == "plc");
    ret.add(plc);
    var sensor = document.createElement('option');
    sensor.value = "sensor";
    sensor.innerHTML = "Sensor";
    sensor.selected = (role == "sensor");
    ret.add(sensor);
    var una = document.createElement('option');
    una.value = "na";
    una.innerHTML = "Unassigned";
    una.selected = (role == "na");
    ret.add(una);
    return ret;
}

function refreshDevices() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var tbldata = JSON.parse(this.responseText);
            var tblcontent = "";
            var tblelem = document.getElementById('devices');
            while(tblelem.rows.length > 0)
                tblelem.deleteRow(0);
            for (d in tbldata.devs) {
                tblelem.insertRow();
                var lrow = tblelem.lastElementChild;
                currdev = tbldata.devs[d];
                annot = currdev.annotations;
                lrow.insertCell();
                var ccell = lrow.lastElementChild;
                ccell.innerHTML = currdev.id;
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                if (currdev.available) 
                    ccell.innerHTML = "YES";
                else
                    ccell.innerHTML = "NO";
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = currdev.humanReadableLastUpdate;
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = currdev.mfr;
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = currdev.hw;
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = annot.protocol;
                var ig = document.createElement('div');
                ig.classList.add("input-group");
                ig.classList.add("input-group-sm");
                ig.appendChild(getSelectedDeviceRole(currdev.id, currdev.role));
                var selrole = ig.lastElementChild;
                iga = document.createElement('div');
                iga.classList.add("input-group-append");
                var btn = document.createElement('button');
                btn.type = "button";
                btn.classList.add("btn");
                btn.classList.add("btn-sm");
                btn.classList.add("btn-outline-success");
                btn.onclick = (function (did, rvl) { return function(){ updateDeviceRole(did, rvl); }; })(currdev.id, selrole.value);
                btn.innerHTML = "Update";
                iga.appendChild(btn);
                ig.appendChild(iga);
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.appendChild(ig);
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = ((currdev.spanport == 0) ? "Local" : ((currdev.spanport > 0) ? currdev.spanport : "No mirror"));
            }
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
            tblelem = document.getElementById('hosts');
            while(tblelem.rows.length > 0)
                tblelem.deleteRow(0);
            for (h in tbldata.hosts) {
                currhost = tbldata.hosts[h];
                tblelem.insertRow();
                var lrow = tblelem.lastElementChild;
                lrow.insertCell();
                var ccell = lrow.lastElementChild;
                ccell.innerHTML = currhost.mac;
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = currhost.ipAddresses.join(', ');
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                var ig = document.createElement('div');
                ig.classList.add('input-group');
                ig.classList.add('input-group-sm');
                var hname = document.createElement('input');
                hname.classList.add('form-control');
                hname.id = "hname-" + h;
                hname.type = "text";
                hname.value = currhost.name;
                ig.appendChild(hname);
                var iga = document.createElement('div');
                iga.classList.add('input-group-append');
                var btn = document.createElement('button');
                btn.classList.add('btn');
                btn.classList.add('btn-sm');
                btn.classList.add('btn-outline-success');
                btn.onclick = (function(ip, nm){ return function() { updateHostName(ip, nm); }; })(currhost.ipAddresses[0], currhost.name);
                btn.innerHTML = "Update";
                iga.appendChild(btn);
                ig.appendChild(iga);
                ccell.appendChild(ig);
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                for (l in currhost.locations) {
                    var cloc = currhost.locations[l];
                    cloc = cloc.elementId + " port: " + cloc.port + ",";
                    cloc = cloc.substr(0, cloc.length - 1);
                    ccell.innerHTML += cloc;
                }
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ig = document.createElement('div');
                ig.classList.add('input-group');
                ig.classList.add('input-group-sm');
                var currhrole = getSelectedHostRole(h, currhost.role);
                ig.appendChild(currhrole);
                iga = document.createElement('div');
                iga.classList.add('input-group-append');
                btn = document.createElement('button');
                btn.classList.add('btn');
                btn.classList.add('btn-sm');
                btn.classList.add('btn-outline-success');
                btn.onclick = (function(m, r){ return function() { updateHostRole(m, r); }; })(currhost.mac.split(" ")[0], currhrole.value);
                btn.innerHTML = "Update";
                iga.appendChild(btn);
                ig.appendChild(iga);
                ccell.appendChild(ig);
            }
        }
    }
    xhttp.open('GET', '/gethosts', true);
    xhttp.send();
}

function refreshTopSniffed() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            tbldata = JSON.parse(this.responseText);
            tbldata = tbldata.top;
            tblelem = document.getElementById('topsniffed');
            accum = 0;
            cnt = 1;
            var lrow;
            var ccell;
            while(tblelem.rows.length > 0)
                tblelem.deleteRow(0);
            for(datap in tbldata) {
                srdt = datap.split('/');
                tblelem.insertRow();
                lrow = tblelem.lastElementChild;
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = cnt;
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = srdt[0];
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = srdt[1];
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = srdt[2];
                lrow.insertCell();
                ccell = lrow.lastElementChild;
                ccell.innerHTML = tbldata[datap];
                accum += tbldata[datap];
                cnt += 1;
            }
            tblelem.insertRow();
            lrow = tblelem.lastElementChild;
            lrow.classList.add('table-secondary');
            lrow.classList.add('font-weight-bold');
            lrow.insertCell();
            lrow.insertCell();
            ccell = lrow.lastElementChild;
            ccell.colSpan = 3;
            ccell.innerHTML = "Total";
            lrow.insertCell();
            ccell = lrow.lastElementChild;
            ccell.innerHTML = accum;
        }
    }
    xhttp.open('GET', '/gettopsniffed', true);
    xhttp.send();
}

function refreshPPSChart() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            rawdata = JSON.parse(this.responseText);
            rawdata = rawdata.pps;
            var ppsdata = new Array(rawdata.length);
            var enipdata = new Array(rawdata.length);
            var dt = 0;
            var maxv = 0;
            while (dt < rawdata.length) {
                dpt = rawdata[dt];
                currt = new Date(Math.round(dpt[0]*1000));
                ppsdata[dt] = { t: currt, y: dpt[1] };
                enipdata[dt] = { t: currt, y: dpt[2] };
                maxv = (dpt[1] > maxv) ? dpt[1] : maxv;
                maxv = (dpt[2] > maxv) ? dpt[2] : maxv;
                dt ++;
            }
            var ctcol = document.getElementById('chpps');
            if(ctcol.hasChildNodes())
                ctcol.removeChild(ctcol.lastElementChild);
            var ctx = document.createElement('canvas');
            ctx.classList.add('h-100');
            ctcol.appendChild(ctx);
            ctx = ctx.getContext("2d");
            var ppschart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Sniffed IP packets',
                            data: ppsdata,
                            borderColor: 'rgba(199,91,18,1.0)',
                            backgroundColor: 'rgba(199,91,18,0.33)',
                            pointRadius: 0,
                        },
                        {
                            label: 'Sniffed ENIP SendRR packets',
                            data: enipdata,
                            borderColor: 'rgba(0,133,66,1.0)',
                            backgroundColor: 'rgba(0,133,66,0.33)',
                            pointRadius: 0,
                        }
                    ]
                },
                options: {
                    scales: {
                        xAxes: [{
                            type: 'time',
                            distribution: 'linear',
                            position: 'bottom'
                        }],
                        yAxes: [{
                            type: 'linear',
                            ticks: {
                                beginAtZero: true,
                                suggestedMax: (maxv > 10) ? Math.round(maxv * 1.15) : ((maxv > 0) ? maxv * 1.15 : 1),
                            },
                            stacked: false,
                        }]
                    },
                    animation: {
                        duration: 0,
                    },
                    elements: {
                        line: {
                            tension: 0.2,
                            borderWidth: 2,
                        },
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        position: 'top',
                        text: 'Last 10 minutes',
                        fontColor: '#008542',
                        fontSize: 16,
                    },
                    responsive: true,
                }
            });
        }
    }
    xhttp.open('GET', '/getppsdata', true);
    xhttp.send();
    refreshTopSniffed();
}

function refreshGroups() {
    var devs = document.getElementById("devices");
    var gdev = document.getElementById('group-device');
    if(devs) {
        if (gdev.length != devs.rows.length) {
            while(gdev.options.length > 0)
                gdev.options.remove(0);
            for (i = 0; i < devs.rows.length; i++) {
                var devid = devs.rows[i].cells[0].innerHTML;
                var opt = document.createElement('option');
                opt.value = devid;
                opt.innerHTML = devid;
                gdev.add(opt);
            }
        }
        if (gdev.selectedIndex >= 0) {
            var devid = gdev.options[gdev.selectedIndex].value;
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    grdata = JSON.parse(this.responseText);
                    grdata = grdata.groups;
                    tblelem = document.getElementById('device-groups');
                    while(tblelem.rows.length > 0)
                        tblelem.deleteRow(0);
                    for (g in grdata) {
                        gr = grdata[g];
                        gid = gr.id;
                        acook = gr.appCookie;
                        bck = gr.buckets;
                        tblelem.insertRow();
                        var lrow = tblelem.lastElementChild;
                        lrow.insertCell();
                        var ccell = lrow.lastElementChild;
                        ccell.innerHTML = gid;
                        ccell.rowSpan = bck.length;
                        ccell.style.verticalAlign = 'middle';
                        ccell.style.textAlign = "center";
                        lrow.insertCell();
                        ccell = lrow.lastElementChild;
                        ccell.innerHTML = acook;
                        ccell.rowSpan = bck.length;
                        ccell.style.verticalAlign = 'middle';
                        ccell.style.textAlign = "center";
                        for(b in bck) {
                            bkt = bck[b];
                            if (b > 0) {
                                tblelem.insertRow();
                                lrow = tblelem.lastElementChild;
                            }
                            lrow.insertCell();
                            ccell = lrow.lastElementChild;
                            ccell.innerHTML = bkt.bucketId;
                            ccell.style.textAlign = "center";
                            lrow.insertCell();
                            ccell = lrow.lastElementChild;
                            ccell.innerHTML = "";
                            ccell.style.textAlign = "center";
                            bact = bkt.treatment;
                            bact = bact.instructions;
                            for (i in bact) {
                                cact = bact[i];
                                for(el in cact) {
                                    ccell.innerHTML += el + "=" + cact[el] + " ";
                                }
                                ccell.innerHTML += "<br>";
                            }
                            if (b == 0) {
                                lrow.insertCell();
                                ccell = lrow.lastElementChild;
                                var delbtn = document.createElement('button');
                                delbtn.type = "button";
                                delbtn.classList.add('btn');
                                delbtn.classList.add('btn-sm');
                                delbtn.classList.add('btn-danger');
                                delbtn.onclick = (function (did, ack){ return function() { deleteGroup(did, ack); }; })(devid, acook);
                                delbtn.innerHTML = "delete";
                                ccell.rowSpan = bck.length;
                                ccell.style.verticalAlign = 'middle';
                                ccell.style.textAlign = "center";
                                ccell.appendChild(delbtn);
                            }
                        }

                    }
                }
            }
            xhttp.open('POST', '/getdevicegroups', true);
            xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhttp.send("devid=" + devid);
        }
    }
}

function extractCriteria(criteria) {
    var out = criteria['type'];
    switch(out) {
        case 'ETH_TYPE':
            out += ': ' + criteria['ethType'];
            break;
        case 'ETH_DST':
        case 'ETH_SRC':
        case 'IPV6_ND_SLL':
        case 'IPV6_ND_TLL':
            out += ': ' + criteria['mac'];
            break;
        case 'IN_PORT':
        case 'IN_PHY_PORT':
            out += ': ' + criteria['port'];
            break;
        case 'METADATA':
            out += ': ' + criteria['metadata'];
            break;
        case 'VLAN_VID':
            out += ': ' + criteria['vlanId'];
            break;
        case 'VLAN_PCP':
            out += ': ' + criteria['priority'];
            break;
        case 'INNER_VLAN_VID':
            out += ': ' + criteria['innerVlanId'];
            break;
        case 'INNER_VLAN_PCP':
            out += ': ' + criteria['innerPriority'];
            break;
        case 'IP_DSCP':
            out += ': ' + criteria['ipDscp'];
            break;
        case 'IP_ECN':
            out += ': ' + criteria['ipEcn'];
            break;
        case 'IP_PROTO':
            out += ': ' + criteria['protocol'];
            break;
        case 'IPV4_SRC':
        case 'IPV4_DST':
        case 'IPV6_SRC':
        case 'IPV6_DST':
            out += ': ' + criteria['ip'];
            break;
        case 'TCP_SRC':
        case 'TCP_DST':
            out += ': ' + criteria['tcpPort'];
            break;
        case 'UDP_SRC':
        case 'UDP_DST':
            out += ': ' + criteria['udpPort'];
            break;
        case 'SCTP_SRC':
        case 'SCTP_DST':
            out += ': ' + criteria['sctpPort'];
            break;
        case 'ICMPV4_TYPE':
            out += ': ' + criteria['icmpType'];
            break;
        case 'ICMPV4_CODE':
            out += ': ' + criteria['icmpCode'];
            break;
        case 'IPV6_FLABEL':
            out += ': ' + criteria['flowlabel'];
            break;
        case 'ICMPV6_TYPE':
            out += ': ' + criteria['icmpv6Type'];
            break;
        case 'ICMPV6_CODE':
            out += ': ' + criteria['icmpv6Code'];
            break;
        case 'IPV6_ND_TARGET':
            out += ': ' + criteria['targetAddress'];
            break;
        case 'MPLS_LABEL':
            out += ': ' + criteria['label'];
            break;
        case 'IPV6_EXTHDR':
            out += ': ' + criteria['exthdrFlags'];
            break;
        case 'OCH_SIGID':
            out += ': ' + criteria['ochSignalId'];
            break;
        case 'GRID_TYPE':
            out += ': ' + criteria['gridType'];
            break;
        case 'CHANNEL_SPACING':
            out += ': ' + criteria['channelSpacing'];
            break;
        case 'SPACING_MULTIPLIER':
            out += ': ' + criteria['spacingMultiplier'];
            break;
        case 'SLOT_GRANULARITY':
            out += ': ' + criteria['slotGranularity'];
            break;
        case 'OCH_SIGTYPE':
            out += ': ' + criteria['ochSignalType'];
            break;
        case 'TUNNEL_ID':
            out += ': ' + criteria['tunnelId'];
            break;
        case 'ODU_SIGID':
            out += ': ' + criteria['oduSignalId'];
            break;
        case 'ODU_SIGTYPE':
            out += ': ' + criteria['oduSignalType'];
            break;
    }
    return out;
}

function extractTreatment(treatment) {
    out = treatment['type'];
    switch(out) {
        case 'OUTPUT':
            out += ': ' + treatment['port'];
            break;
        case 'TABLE':
            out += ': ' + treatment['tableId'];
            break;
        case 'GROUP':
            out += ': ' + treatment['groupId'];
            break;
        case 'METER':
            out += ': ' + treatment['meterId'];
            break;
        case 'QUEUE':
            out += ': id=' + treatment['queueId'] + ' port=' + treatment['port'];
            break;
        case 'L0MODIFICATION':
        case 'L1MODIFICATION':
        case 'L2MODIFICATION':
        case 'L3MODIFICATION':
        case 'L4MODIFICATION':
            out += ': subtype=' + treatment['subtype'];
            break;
    }
    return out;
}

function refreshFlows() {
    // TODO: Implement
    var devs = document.getElementById("devices");
    if(devs) {
        var fdev = document.getElementById('flows-device');
        if (fdev.length != devs.rows.length) {
            while (fdev.options.length > 0)
                fdev.options.remove(0);
            for (i = 0; i < devs.rows.length; i++) {
                var devid = devs.rows[i].cells[0].innerHTML;
                var opt = document.createElement('option');
                opt.value = devid;
                opt.innerHTML = devid;
                fdev.add(opt);
            }
        }
        if (fdev.selectedIndex >= 0) {
            var devid = fdev.options[fdev.selectedIndex].value;
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var flows = JSON.parse(this.responseText);
                    flows = flows.flows;
                    var tbdy = document.getElementById('device-flows');
                    while (tbdy.rows.length > 0)
                        tbdy.deleteRow(0);
                    for (f in flows) {
                        var flow = flows[f];
                        tbdy.insertRow();
                        var crow = tbdy.lastElementChild;
                        crow.insertCell();
                        var ccell = crow.lastElementChild;
                        ccell.innerHTML = flow['id'];
                        crow.insertCell();
                        ccell = crow.lastElementChild;
                        ccell.innerHTML = flow['state'];
                        crow.insertCell();
                        ccell = crow.lastElementChild;
                        ccell.innerHTML = flow['priority'];
                        crow.insertCell();
                        ccell = crow.lastElementChild;
                        var tdt = flow['selector'];
                        tdt = tdt['criteria'];
                        for(i in tdt)
                            ccell.innerHTML += extractCriteria(tdt[i]) + '<br>';
                        crow.insertCell();
                        ccell = crow.lastElementChild;
                        tdt = flow['treatment'];
                        ccell.innerHTML = extractTreatment(tdt['instructions'][0]);
                        ccell.innerHTML += ' cleared:' + ((tdt['clearDeferred']) ? 'true' : 'false');
                        crow.insertCell();
                        ccell = crow.lastElementChild;
                        ccell.innerHTML = flow['appId'];
                        crow.insertCell();
                        ccell = crow.lastElementChild;
                        var btn = document.createElement('button');
                        btn.classList.add('btn');
                        btn.classList.add('btn-sm');
                        btn.classList.add('btn-danger');
                        btn.onclick = (function (did, fid){ return function() { deleteFlow(did, fid); }; })(devid, flow['id']);
                        btn.innerHTML = "delete";
                        ccell.appendChild(btn);
                    }
                }
            }
            xhttp.open('POST', '/getdeviceflows', true);
            xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhttp.send("devid=" + devid);
        }
    }
}

function refreshAll() {
    localTime = document.getElementById('localtime');
    ctime = new Date();
    localTime.innerHTML = ctime.toLocaleDateString() + " " + ctime.toLocaleTimeString();
    refreshDevices();
    refreshHosts();
    refreshPPSChart();
    refreshGroups();
    refreshFlows();
}

function addBucket() {
    var btype = document.getElementById('buckettype').value;
    var bvalue = document.getElementById('bucketvalue').value;
    switch(btype) {
        case "OUTPUT":
            bvalue = "port=" + bvalue;
            break;
        case "TABLE":
            bvalue = "tableId=" + bvalue;
            break;
        case "METER":
            bvalue = "meterId=" + bvalue;
            break;
        default:
            bvalue = "value=" + bvalue;
    }
    var bbody = document.getElementById('groupbuckets');
    bbody.insertRow();
    var brows = bbody.rows;
    var crow = brows.item(brows.length - 1);
    crow.insertCell();
    crow.insertCell();
    crow.cells[0].innerHTML = btype;
    crow.cells[1].innerHTML = bvalue;
}

function removeBucket() {
    var bbody = document.getElementById('groupbuckets');
    if (bbody.rows.length > 0)
        bbody.deleteRow(bbody.rows.length - 1);
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

function updateHostRole(mac, role) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', '/updatehostrole', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("mac=" + mac + "&role=" + role);
    refreshHosts();
}

function updateBucketLabel() {
    lbl = document.getElementById('buckvallbl');
    bval = document.getElementById('bucketvalue');
    btype = document.getElementById('buckettype');
    btype = btype.options[btype.selectedIndex].value;
    switch(btype) {
        case "OUTPUT":
            lbl.innerHTML = "Port";
            bval.placeholder = "123";
            break;
        case "TABLE":
            lbl.innerHTML = "Table ID";
            bval.placeholder = "123";
            break;
        case "METER":
            lbl.innerHTML = "Meter ID";
            bval.placeholder = "123";
            break;
        default:
            lbl.innerHTML = "Value";
            bval.placeholder = "value";
    }
}

function createGroup() {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', '/creategroup', true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var pdata = "";
    pdata += "devid=" + document.getElementById('group-device').value;
    pdata += "&grpid=" + document.getElementById('newgroupid').value;
    pdata += "&appck=" + document.getElementById('newgroupappck').value;
    var bck = document.getElementById('groupbuckets');
    var buckets = [];
    for (i = 0; i < bck.rows.length; i ++) {
        var nbck = {};
        var crow = bck.rows[i];
        nbck['type'] = crow.cells[0].innerHTML;
        var value = crow.cells[1].innerHTML;
        nbck['tag'] = String(value).split("=")[0];
        nbck['value'] = String(value).split("=")[1];
        buckets.push(nbck);
    }
    pdata += "&buckets=" + btoa(JSON.stringify(buckets));
    xhttp.send(pdata);
    while(bck.rows.length > 0)
        bck.deleteRow(0);
    document.getElementById('newgroupid').value = '';
    document.getElementById('newgroupappck').value = '';
    document.getElementById('bucketvalue').value = '';
    refreshGroups();
}

function deleteGroup(devid, appck) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', '/deletegroup', true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    var pdata = "";
    pdata += "devid=" + devid;
    pdata += "&appck=" + appck;
    xhttp.send(pdata);
    refreshGroups();
}

function deleteFlow(devid, flowid) {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', '/deleteflow', true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    var pdata = "devid=" + devid;
    pdata += "&flowid=" + flowid;
    xhttp.send(pdata);
    refreshFlows();
}

function pcheck(elem) {
    if (elem.checkValidity()) {
        elem.classList.remove('is-invalid');
        elem.classList.add('is-valid');
    }
    else {
        elem.classList.add('is-invalid');
        elem.classList.remove('is-valid');
    }
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