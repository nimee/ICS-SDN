#!/usr/bin/env python2

import sys
from vsctl import VSCtl
from base64 import standard_b64encode
import json
import requests
from requests.auth import HTTPBasicAuth
from time import sleep

CONTROLLER_IP = '192.168.56.50'
CONTROLLER_PORT = 6633
REST_PORT = 8181
REST_USER = 'onos'
REST_PASS = 'rocks'

def mirror():
    try:
        rest_auth = HTTPBasicAuth(REST_USER, REST_PASS)
        ovs = VSCtl()
        switches = ovs.listbr()
        ovs.addbr('span')
        ovs.setbrtcpcontroller('span', CONTROLLER_IP, CONTROLLER_PORT)
        span_id = 'of:' + ovs.getbrid('span')
        ovs.createveth('sp-span', 'sp-out')
        ovs.addport('span', 'sp-span')
        flow = {}
        flow['priority'] = 60000
        flow['timeout'] = 0
        flow['isPermanent'] = True
        flow['deviceId'] = span_id
        treatment = {}
        treatment['instructions'] = []
        treatment['instructions'].append({'type': 'OUTPUT', 'port': '1'})
        flow['treatment'] = treatment
        headers = {
            'Content-type': 'application/json',
            'Accept': 'application/json'
        }
        flow = json.dumps(flow)
        params = {'appid': 'org.onosproject.core'}
        uri = 'http://{0:s}:{1:d}/onos/v1/flows/{2:s}'.format(CONTROLLER_IP, REST_PORT, span_id)
        resp = requests.post(uri, data=flow, headers=headers, auth=rest_auth, params=params)
        print resp.text
        ecnt = 0
        for sw in switches:
            ovs.createveth(sw + '-span', 'sp-eth{0:d}'.format(ecnt))
            ovs.addport(sw, sw + '-span')
            ovs.addport('span', 'sp-eth{0:d}'.format(ecnt))
            ovs.createmirror(sw, sw + '-span', False)
            ecnt += 1
    except OSError:
        print 'SDN Mirroring requires root privileges'
        sys.exit(1)

def cleanup():
    try:
        ovs = VSCtl()
        switch_id = ovs.getbrid('span')
        for sw in ovs.listbr():
            if ovs.hasmirror(sw):
                ovs.removemirror(sw)
                ovs.delport(sw, sw + '-span')
        rest_auth = HTTPBasicAuth(REST_USER, REST_PASS)
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'curl/7.52.1'
        }
        uri = 'http://{0:s}:{1:d}/onos/v1/devices/of:{2:s}'.format(CONTROLLER_IP, REST_PORT, switch_id)
        ovs.delbr('span')
        ovs.destroyport('sp-out')
        for sw in ovs.listbr():
            ovs.destroyport(sw + '-span')
        sres = {}
        while 'message' not in sres.keys():
            sleep(1)
            resp = requests.delete(uri, auth=rest_auth, headers=headers )
            sres = resp.json()

    except OSError:
        print 'SDN Mirroring requires root privileges'
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print '''Usage: {0:s} m|c

m   Mirror
c   Cleanup
        '''.format(sys.argv[0])
        sys.exit(1)
    elif sys.argv[1] == 'm':
        mirror()
    elif sys.argv[1] == 'c':
        cleanup()
    else:
        print 'Unknown argument: ' + sys.argv[1]
        sys.exit(1)
