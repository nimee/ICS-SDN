#!/usr/bin/env python3

import os
import json
import netaddr
import cherrypy
import pyonos

class MainApp():

    def __init__(self, idsconfig: str):
        iconf = open(idsconfig, 'r').read()
        self.__i_path = idsconfig
        self.__i_conf = json.loads(iconf)
        self.__onos = pyonos.ONOSClient('192.168.56.50', 8181, 'onos', 'rocks')

    @cherrypy.expose
    def index(self):
        return open('webui/templates/index.html', 'r').read()
    
    @cherrypy.expose
    @cherrypy.tools.json_out()
    def getdevices(self, *args, **kwargs):
        devices = self.__onos.devices()
        if 'devroles' not in self.__i_conf:
            self.__i_conf['devroles'] = {}
        for i in range(len(devices)):
            dev = devices[i]
            if dev['id'] in self.__i_conf['devroles']:
                dev['role'] = self.__i_conf['devroles'][dev['id']]
            else:
                dev['role'] = 'na'
            devices[i] = dev
        return {'devs': devices}
    
    @cherrypy.expose
    @cherrypy.tools.json_out()
    def gethosts(self, *args, **kwargs):
        hosts = self.__onos.hosts()
        if 'IP' not in self.__i_conf.keys():
            self.__i_conf['IP'] = {}
        for i in range(len(hosts)):
            hst = hosts[i]
            if hst['ipAddresses'][0] in self.__i_conf['IP'].values():
                for ip in self.__i_conf['IP']:
                    if self.__i_conf['IP'][ip] == hst['ipAddresses'][0]:
                        hst['name'] = ip
                        break
            else:
                hst['name'] = '*** UNKNOWN ***'
            mac = netaddr.EUI(hst['mac'])
            try:
                oui = mac.oui
                oui = oui.registration()
                hst['mac'] += ' ({0:s})'.format(oui['org'])
            except netaddr.core.NotRegisteredError:
                hst['mac'] += ' (UNKNOWN)'
            hosts[i] = hst
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
            if role not in ['bridge', 'field', 'honeypot']:
                raise cherrypy.HTTPError(status=400, message='Invalid role')
            else:
                if 'devroles' not in self.__i_conf:
                    self.__i_conf['devroles'] = {}
                self.__i_conf['devroles'][dev_id] = role
                json.dump(self.__i_conf, open(self.__i_path, 'w'), indent='  ')
                return 'OK'

if __name__ == '__main__':
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
    cherrypy.config.update(global_conf)
    cherrypy.tree.mount(MainApp('sdnconfig.json'), '/', conf)
    cherrypy.engine.start()
    cherrypy.engine.block()