#!/usr/bin/env python3

import os
import json
import base64
import netaddr
import threading
import time
import collections
import cherrypy
import sdnids
import pyonos



class SnifferHandler(threading.Thread):

    def __init__(self, iface: str, parent):
        threading.Thread.__init__(self)
        self.__parent = parent
        self.__buffer = collections.deque(iterable=[], maxlen=65536)
        self.__sniffer = sdnids.ICSSniffer(interface=iface)
        self.__should_stop = False
        self.__pps = 0

    def status(self) -> tuple:
        return self.__buffer, self.__pps

    def set_stop(self):
        self.__should_stop = True
    
    def sniffed_stats(self) -> collections.OrderedDict:
        return self.__sniffer.get_stats()

    def run(self):
        self.__sniffer.start()
        while not self.__should_stop:
            self.__buffer.clear()
            self.__pps = self.__sniffer.size()
            i = self.__pps
            enip = 0
            while i > 0:
                curr_msg = self.__sniffer.pop()
                if 'rawdata' in curr_msg.keys():
                    enip += 1
                self.__buffer.append(curr_msg)
                i -= 1
            self.__parent.pushHPPS([time.time(), self.__pps, enip])
            time.sleep(1)
        self.__sniffer.set_stop()
        self.__sniffer.join(1)

class MainApp():

    def __init__(self, idsconfig: str, idsiface: str, onosip: str, onosport: int, onosuser: str, onospass: str):
        iconf = open(idsconfig, 'r').read()
        self.__i_path = idsconfig
        self.__i_conf = json.loads(iconf)
        self.__h_pps = collections.deque(iterable=[], maxlen=600)
        self.__onos = pyonos.ONOSClient(onosip, onosport, onosuser, onospass)
        self.__s_handler = SnifferHandler(idsiface, self)
        self.__s_handler.start()

    def pushHPPS(self, data: list):
        self.__h_pps.append(data)

    @cherrypy.expose
    def index(self, *args, **kwargs):
        return open('webui/templates/index.html', 'r').read()

    @cherrypy.expose
    def reloadconfig(self, *args, **kwargs):
        iconf = open(self.__i_path, 'r').read()
        self.__i_conf = json.loads(iconf)
        return 'OK'

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def getdevices(self, *args, **kwargs):
        devices = self.__onos.devices()
        if 'devroles' not in self.__i_conf:
            self.__i_conf['devroles'] = {}
        spports = {}
        if 'span' in self.__i_conf['devroles'].values():
            for dv in devices:
                if self.__i_conf['devroles'][dv['id']] == 'span':
                    for slink in self.__onos.links(devId=dv['id']):
                        if slink['src']['device'] == dv['id']:
                            spports[slink['dst']['device']] = int(slink['dst']['port'])
                        else:
                            spports[slink['src']['device']] = int(slink['src']['port'])
                    break
        for i in range(len(devices)):
            dev = devices[i]
            if dev['id'] not in spports.keys():
                spports[dev['id']] = -1
            if dev['id'] in self.__i_conf['devroles']:
                dev['role'] = self.__i_conf['devroles'][dev['id']]
            else:
                dev['role'] = 'na'
            if 'span' in self.__i_conf['devroles'].values():
                if dev['role'] == 'span':
                    dev['spanport'] = 0
                else:
                    dev['spanport'] = spports[dev['id']]
            else:
                dev['spanport'] = -1
            devices[i] = dev
        devices = sorted(devices, key=lambda x: x['id'])
        return {'devs': devices}
    
    @cherrypy.expose
    @cherrypy.tools.json_out()
    def gethosts(self, *args, **kwargs):
        hosts = self.__onos.hosts()
        if 'IP' not in self.__i_conf.keys():
            self.__i_conf['IP'] = {}
        if 'hostroles' not in self.__i_conf.keys():
            self.__i_conf['hostroles'] = {}
        for i in range(len(hosts)):
            hst = hosts[i]
            if hst['ipAddresses'][0] in self.__i_conf['IP'].values():
                for ip in self.__i_conf['IP']:
                    if self.__i_conf['IP'][ip] == hst['ipAddresses'][0]:
                        hst['name'] = ip
                        break
            else:
                hst['name'] = '*** UNKNOWN ***'
            if hst['mac'] in self.__i_conf['hostroles'].keys():
                hst['role'] = self.__i_conf['hostroles'][hst['mac']]
            else:
                hst['role'] = 'na'
            mac = netaddr.EUI(hst['mac'])
            try:
                oui = mac.oui
                oui = oui.registration()
                hst['mac'] += ' ({0:s})'.format(oui['org'])
            except netaddr.core.NotRegisteredError:
                hst['mac'] += ' (UNKNOWN)'
            hosts[i] = hst
        hosts = sorted(hosts, key=lambda x: x['ipAddresses'][0])
        return {'hosts': hosts}
    
    @cherrypy.expose
    def updatehostname(self, *args, **kwargs):
        if any(kw not in kwargs.keys() for kw in ['ip', 'name']):
            raise cherrypy.HTTPError(status=400, message='Missing parameters')
        else:
            ip = kwargs.pop('ip')
            name = kwargs.pop('name')
            pname = None
            if 'IP' not in self.__i_conf.keys():
                self.__i_conf['IP'] = {}
            for i in self.__i_conf['IP']:
                if self.__i_conf['IP'][i] == ip:
                    pname = i
                    break
            if pname is not None:
                self.__i_conf['IP'].pop(pname)
            self.__i_conf['IP'][name] = ip
            json.dump(self.__i_conf, open(self.__i_path, 'w'), indent='  ')
            return 'OK'
    
    @cherrypy.expose
    def updatedevrole(self, *args, **kwargs):
        if any(kw not in kwargs.keys() for kw in ['id', 'role']):
            raise cherrypy.HTTPError(status=400, message='Missing parameters')
        else:
            dev_id = kwargs.pop('id')
            role = kwargs.pop('role')
            if role not in ['bridge', 'field', 'honeypot', 'span']:
                raise cherrypy.HTTPError(status=400, message='Invalid role')
            else:
                if 'devroles' not in self.__i_conf:
                    self.__i_conf['devroles'] = {}
                if role == 'span' and role in self.__i_conf['devroles'].values():
                    raise cherrypy.HTTPError(status=503, message='Mirroring device already assigned')
                self.__i_conf['devroles'][dev_id] = role
                json.dump(self.__i_conf, open(self.__i_path, 'w'), indent='  ')
                return 'OK'

    @cherrypy.expose
    def updatehostrole(self, *args, **kwargs):
        if any(kw not in kwargs.keys() for kw in ['mac', 'role']):
            raise cherrypy.HTTPError(status=400, message='Missing parameters')
        else:
            mac = kwargs.pop('mac')
            role = kwargs.pop('role')
            if role not in ['plc', 'sensor', 'actuator', 'hmi']:
                raise cherrypy.HTTPError(status=400, message='Invalid role')
            else:
                if 'hostroles' not in self.__i_conf.keys():
                    self.__i_conf['hostroles'] = {}
                self.__i_conf['hostroles'][mac] = role
                json.dump(self.__i_conf, open(self.__i_path, 'w'), indent='  ')
                return 'OK'
    
    @cherrypy.expose
    @cherrypy.tools.json_out()
    def getppsdata(self, *args, **kwargs):
        return {'pps': list(self.__h_pps)}
    
    @cherrypy.expose
    @cherrypy.tools.json_out()
    def gettopsniffed(self, *args, **kwargs):
        stats = self.__s_handler.sniffed_stats()
        s_keys = list(stats.keys())
        s_iter = 10
        while s_iter < len(s_keys):
            stats.pop(s_keys[s_iter])
            s_iter += 1
        return { 'top': stats }

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def getdevicegroups(self, *args, **kwargs):
        if any(kw not in kwargs.keys() for kw in ['devid']):
            raise cherrypy.HTTPError(status=400, message='Missing parameters')
        else:
            devid = kwargs.pop('devid')
            groups = self.__onos.deviceGroups(devid)
            groups = sorted(groups, key=lambda x: x['id'])
        return {'groups': groups}

    @cherrypy.expose
    def creategroup(self, *args, **kwargs):
        if any(kw not in kwargs.keys() for kw in ['devid', 'grpid', 'appck', 'buckets']):
            raise cherrypy.HTTPError(status=400, message='Missing parameters')
        params = {}
        params['devid'] = kwargs.pop('devid')
        params['grpid'] = kwargs.pop('grpid')
        params['appck'] = kwargs.pop('appck')
        params['buckets'] = json.loads(base64.b64decode(kwargs.pop('buckets')).decode('utf-8'))
        group = {
            'type': 'ALL',
            'appCookie': params['appck'],
            'groupId': params['grpid'],
            'buckets': [],
        }
        for b in params['buckets']:
            newb = { 'treatment': { 'instructions': [ { 'type': b['type'], b['tag']: b['value'] } ] } }
            group['buckets'].append(newb)
        self.__onos.addGroup(params['devid'], group)
        return json.dumps(group)
    
    @cherrypy.expose
    @cherrypy.tools.json_out()
    def deletegroup(self, *args, **kwargs):
        if any(kw not in kwargs.keys() for kw in ['devid', 'appck']):
            raise cherrypy.HTTPError(status=400, message='Missing parameters')
        devid = kwargs.pop('devid')
        appck = kwargs.pop('appck')
        rsp = self.__onos.delGroup(devid, appck)
        return {'response': rsp}

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def getdeviceflows(self, *args, **kwargs):
        if any(kw not in kwargs.keys() for kw in ['devid']):
            raise cherrypy.HTTPError(status=400, message='Missing parameters')
        devid = kwargs.pop('devid')
        flows = self.__onos.deviceFlows(devid)
        flows = sorted(flows, key=lambda x: x['priority'], reverse=True)
        return {'flows': flows}

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def deleteflow(self, *args, **kwargs):
        if any(kw not in kwargs.keys() for kw in ['devid', 'flowid']):
            raise cherrypy.HTTPError(status=400, message='Missing parameters')
        devid = kwargs.pop('devid')
        flowid = kwargs.pop('flowid')
        rsp = self.__onos.delFlow(devid, int(flowid))
        return { 'response': rsp }

    def endApp(self):
        self.__s_handler.set_stop()
        self.__s_handler.join(2)

def main():
    conf = {
        '/': {
            'tools.sessions.on': True,
            'tools.sessions.storage_class': cherrypy.lib.sessions.FileSession,
            'tools.sessions.storage_path': 'webui/sessions',
            'tools.sessions.timeout': 60,
            'tools.sessions.secure': True,
            'tools.sessions.httponly': True,
        },
        '/static': {
            'tools.staticdir.on': True,
            'tools.staticdir.dir': os.path.abspath(os.path.join(os.path.dirname(__file__), 'webui/static')),
        },
        '/favicon.ico': {
            'tools.staticfile.on': True,
            'tools.staticfile.filename': os.path.abspath(os.path.join(os.path.dirname(__file__), 'webui/static/favicon.ico')),
        }
    }
    global_conf = {
        'server.socket_port': 9999,
        'log.access_file': 'webui/logs/access.log',
        'log.error_file': 'webui/logs/error.log',
    }
    try:
        cherrypy.config.update(global_conf)
        application = MainApp(
            idsconfig='sdnconfig.json',
            idsiface='att2',
            onosip='192.168.56.50',
            onosport=8181,
            onosuser='onos',
            onospass='rocks'
        )
        cherrypy.tree.mount(application, '/', conf)
        cherrypy.engine.signals.subscribe()
        cherrypy.engine.start()
        cherrypy.engine.block()
    except KeyboardInterrupt:
        application.endApp()

if __name__ == '__main__':
    if os.geteuid() != 0:
        print('SDN IDS requires root privileges')
    else:
        main()
