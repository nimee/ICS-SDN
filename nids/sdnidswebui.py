#!/usr/bin/env python3

import os
import cherrypy
import pyonos

class MainApp():

    def __init__(self):
        self.__onos = pyonos.ONOSClient('192.168.56.50', 8181, 'onos', 'rocks')

    @cherrypy.expose
    def index(self):
        return open('webui/templates/index.html', 'r').read()
    
    @cherrypy.expose
    @cherrypy.tools.json_out()
    def getdevices(self):
        devices = self.__onos.devices()
        return {'devs': devices}

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
    cherrypy.tree.mount(MainApp(), '/', conf)
    cherrypy.engine.start()
    cherrypy.engine.block()