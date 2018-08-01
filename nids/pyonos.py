#!/usr/bin/env python3
# -*- coding: utf-8 -*-
'''
ONOS Core REST API python client module
BASE URL: /onos/v1 , API VERSION: 1.0
'''

import json
import requests
import re

class ONOSClient():
    '''
    REST API client interface.

    Currently only works using the default URI based on the IPv4 address of the ONOS controller: http://IPv4-address:port/onos/v1
    '''

    IPV4_REGEX = re.compile(r'^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)\.){3}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d))$')
    MAC_REGEX = re.compile(r'^(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$')
    OFDEV_REGEX = re.compile(r'^of:[0-9a-fA-F]{16}$')
    APPCK_REGEX = re.compile(r'^0x[0-9a-fA-F]{8}$')

    def __init__(self, uribase: str, uriport: int, user: str, password: str):
        if uribase is None or type(uribase) is not str or ONOSClient.IPV4_REGEX.match(uribase) is None:
            raise TypeError('uribase must be a string representing an IPv4 address')
        if uriport is None or type(uriport) is not int or uriport < 1 or uriport > 65535:
            raise TypeError('uriport must be an integer between 1 and 65535, inclusive')
        if user is not None and type(user) is not str:
            raise TypeError('user must be a string')
        if password is not None and type(password) is not str:
            raise TypeError('password must be a string')
        if user is None:
            user = 'onos'
        if password is None:
            password = 'rocks'
        self.__url = 'http://{0:s}:{1:d}/onos/v1'.format(uribase, uriport)
        self.__auth = requests.auth.HTTPBasicAuth(user, password)
    
    # Basic REST methods (GET, POST, DELETE)
    def __get(self, urisuffix: str) -> dict:
        '''
        Sends a raw GET request based on the provided urisuffix.

        urisuffix must be a string representing the object to be requested with the API (e.g. '/flows/of:0000000000000001')
        '''
        if urisuffix[0] != '/':
            urisuffix = '/' + urisuffix
        headers = {'Accept': 'application/json'}
        response = requests.get(self.__url + urisuffix, headers=headers, auth=self.__auth)
        try:
            return response.json()
        except ValueError:
            return None
    
    def __post(self, urisuffix: str, body: dict) -> dict:
        '''
        Sends a POST request based on the provided urisuffix and body.

        urisuffix must be a string representing the object to be posted with the API and any required parameters
        (e.g. '/flows/of:0000000000000001?appId=org.onosproject.fwd')

        body must be a dictionary containing the values of the object to be posted, so that those values can be
        represented as a JSON string to be sent as a stream using the REST API.
        '''
        if body is None or type(body) is not dict:
            raise TypeError('body must be a dictionary with the data to be posted in the request')
        if urisuffix[0] != '/':
            urisuffix = '/' + urisuffix
        headers = {'Content-type': 'application/json', 'Accept': 'application/json'}
        stream = json.dumps(body)
        response = requests.post(self.__url + urisuffix, data=stream, auth=self.__auth, headers=headers)
        try:
            return response.json()
        except ValueError:
            return None

    def __delete(self, urisuffix: str, body: dict) -> dict:
        '''
        Sends a DELETE request based on the provided urisuffix and body.

        urisuffix must be a string representing the object to be deleted with the API and any required parameters
        (e.g. '/flows/of:0000000000000001?appId=org.onosproject.fwd')

        If the request requires a body, it must be a dictionary containing the values of the object to be deleted,
        so that those values can be represented as a JSON string to be sent as a stream using the REST API. If no
        body is required, it can be left as a None value and no data will be added to the request.
        '''
        if body is not None and type(body) is not dict:
            raise TypeError('body must be a dictionary with the data to be deleted in the request')
        if urisuffix[0] != '/':
            urisuffix = '/' + urisuffix
        if body is not None:
            headers = {'Content-type': 'application/json', 'Accept': 'application/json'}
            stream = json.dumps(body)
            response = requests.delete(self.__url + urisuffix, data=stream, auth=self.__auth, headers=headers)
        else:
            headers = {'Accept': 'application/json'}
            response = requests.delete(self.__url + urisuffix, auth=self.__auth, headers=headers)
        try:
            return response.json()
        except ValueError:
            return None

    # DEVICES: Manage the inventory of infrastructure devices
    def devices(self) -> list:
        '''
        Request a list of the current infrastructure devices included in the inventory
        of the controller.
        '''
        response = self.__get('/devices')
        if response is not None and 'devices' in response.keys():
            return response['devices']
        return None
    
    def device(self, devId: str) -> dict:
        '''
        Request the details of the specified infrastructure device.
        '''
        if ONOSClient.OFDEV_REGEX.match(devId) is not None:
            response = self.__get('/devices/{0:s}'.format(devId.lower()))
            return response
        else:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')

    def devicePorts(self, devId: str) -> list:
        '''
        Request the details of the ports associated with the specified infrastructure device.
        '''
        if ONOSClient.OFDEV_REGEX.match(devId) is not None:
            response = self.__get('/devices/{0:s}/ports'.format(devId.lower()))
            if 'ports' in response.keys():
                return response['ports']
            return None
        else:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')
    
    def delDevice(self, devId: str) -> dict:
        '''
        Administratively delete the specified device from the inventory of known devices.
        '''
        if ONOSClient.OFDEV_REGEX.match(devId) is not None:
            return self.__delete('/devices/{0:s}'.format(devId.lower()), None)
        else:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')

    # GROUPS: Query and program group rules
    def groups(self) -> list:
        '''
        Request a list of all groups currently stored in the inventory
        '''
        response = self.__get('/groups')
        if 'groups' in response.keys():
            return response['groups']
        return None

    def deviceGroups(self, devId: str) -> list:
        '''
        Request a list of all the groups associated with the specified device
        '''
        if ONOSClient.OFDEV_REGEX.match(devId) is not None:
            response = self.__get('/groups/{0:s}'.format(devId.lower()))
            if 'groups' in response.keys():
                return response['groups']
            return None
        else:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')

    def addGroup(self, devId: str, group: dict) -> dict:
        '''
        Create a new group rule in the specified device
        '''
        if ONOSClient.OFDEV_REGEX.match(devId) is None:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')
        if group is None or type(group) is not dict:
            raise TypeError('group must be a dictionary containing the data structure of the new group.')
        return self.__post('/groups/{0:s}'.format(devId.lower()), group)

    def addBuckets(self, devId: str, appCookie: str, buckets: dict) -> dict:
        '''
        Adds buckets to an existing group in a specified device
        '''
        if ONOSClient.OFDEV_REGEX.match(devId) is None:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')
        if ONOSClient.APPCK_REGEX.match(appCookie) is None:
            raise TypeError('appCookie must be a string representing a valid application cookie.')
        if buckets is None or type(buckets) is not dict:
            raise TypeError('buckets must be a dictionary containing the data structure of the new buckets.')
        return self.__post('/groups/{0:s}/{1:d}/buckets'.format(devId.lower(), appCookie.lower()), buckets)

    def delBuckets(self, devId: str, appCookie: str, bucketIds: list) -> dict:
        '''
        Delete the specified buckets from the specified group from a given device
        '''
        if ONOSClient.OFDEV_REGEX.match(devId) is None:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')
        if ONOSClient.APPCK_REGEX.match(appCookie) is None:
            raise TypeError('appCookie must be a string representing a valid application cookie.')
        if bucketIds is None or type(bucketIds) is not list or any(type(bucket) is not int for bucket in bucketIds):
            raise TypeError('bucketIds must be a list containing the integer IDs of the buckets to be deleted.')
        ids = ','.join(str(b) for b in bucketIds)
        return self.__delete('/groups/{0:s}/{1:s}/buckets/{2:s}'.format(devId.lower(), appCookie.lower(), ids), None)

    def delGroup(self, devId: str, appCookie: str) -> dict:
        '''
        Delete the specified group having the provided appCookie from a given device
        '''
        if ONOSClient.OFDEV_REGEX.match(devId) is None:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')
        if ONOSClient.APPCK_REGEX.match(appCookie) is None:
            raise TypeError('appCookie must be a string representing a valid application cookie.')
        return self.__delete('/groups/{0:s}/{1:s}'.format(devId.lower(), appCookie.lower()), None)

    def getGroup(self, devId: str, appCookie: str) -> dict:
        '''
        Request the details of a group given the device ID and the application cookie.
        '''
        if ONOSClient.OFDEV_REGEX.match(devId) is None:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')
        if ONOSClient.APPCK_REGEX.match(appCookie) is None:
            raise TypeError('appCookie must be a string representing a valid application cookie.')
        return self.__get('/groups/{0:s}/{1:s}'.format(devId.lower(), appCookie.lower()))

    # HOSTS: Query the inventory of end-station hosts
    def hosts(self) -> list:
        '''
        Request a list of the currently known end-station hosts included in the inventory
        of the controller
        '''
        response = self.__get('/hosts')
        if response is not None and 'hosts' in response.keys():
            return response['hosts']
        return None

    def host(self, mac: str, vlan: int) -> dict:
        '''
        Request the detailed propoerties of the specified end-station host.
        '''
        if mac is None or type(mac) is not str or ONOSClient.MAC_REGEX.match(mac) is None:
            raise TypeError('mac must be a string representing a MAC address of a host device')
        if vlan is not None and ( vlan > 4095 or vlan < 1 ):
            raise ValueError('vlan must be an integer between 1 and 4095, inclusive')
        elif vlan is not None:
            response = self.__get('/hosts/{0:s}/{1:d}'.format(mac, vlan))
        else:
            response = self.__get('/hosts/{0:s}/None'.format(mac))
        return response

    # LINKS: Query the inventory of infrastructure links
    def links(self, devId: str) -> list:
        '''
        Request a list of the infrastructure links currently stored in the inventory.

        Optionally, a device ID can be specified to request the links associated with
        the specified infrastructure device.
        '''
        if devId is None:
            response = self.__get('/links')
        elif ONOSClient.OFDEV_REGEX.match(devId) is not None:
            response = self.__get('/links?device={0:s}'.format(devId.lower()))
        else:
            raise TypeError('devId must be a string representing a valid infrastructure device ID.')
        if 'links' in response.keys():
            return response['links']
        return None

if __name__ == '__main__':
    import code
    import readline
    import rlcompleter
    context = globals()
    context = context.copy()
    context.update(locals())
    readline.set_completer(rlcompleter.Completer(context).complete)
    readline.parse_and_bind('tab: complete')
    shell = code.InteractiveConsole(context)
    shell.interact()
