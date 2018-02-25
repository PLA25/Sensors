# -*- coding: cp1252 *-

'''
  Client-Side code of the Sensor hub.
  Copyright (C) 2018  Martijn Vegter

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
'''

import sys
import Adafruit_DHT

import json, io

from os import remove
from shutil import move

while True:
    humidity, temperature = Adafruit_DHT.read_retry(11, 4)
    print ('Temp: {0:0.1f} C  Humidity: {1:0.1f} %'.format(temperature, humidity))

    data = {
        {
            'type': 'temperature',
            'value': temperature
        },
        {
            'type': 'humidity',
            'value': humidity
        }
    }

    try:
        to_unicode = unicode
    except NameError:
        to_unicode = str

    with io.open('data.txt', 'w', encoding='utf8') as outfile:
        str_ = json.dumps(data,
                          indent=4,
                          sort_keys = True,
                          separators=(',', ': '),
                          ensure_ascii = False
        )
        outfile.write(to_unicode(str_))

    remove('data.json')
    move('data.txt', 'data.json')
