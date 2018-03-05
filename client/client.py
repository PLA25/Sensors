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

print("Press CTRL+C to abort.")
print("")

# System
import io
import json
import sys
import time

# System functions
from os import remove
from shutil import move

# Adafruit
import Adafruit_DHT

# MCP3008
import Adafruit_GPIO.SPI as SPI
import Adafruit_MCP3008

SPI_PORT   = 0
SPI_DEVICE = 0
mcp = Adafruit_MCP3008.MCP3008(spi=SPI.SpiDev(SPI_PORT, SPI_DEVICE))

# Gas (MQ-2) Sensor
from mq import *
mq = MQ();

while True:
    # LDR
    luxVoltage = mcp.read_adc(0)
    print("Light    : {}".format(luxVoltage))
    
    # Gas sensor
    perc = mq.MQPercentage()
    print("LPG      : {} ppm ({})".format(round(perc["GAS_LPG"], 10), perc["GAS_LPG"]))
    print("CO       : {} ppm ({})".format(round(perc["CO"], 10), perc["CO"]))
    print("Smoke    : {} ppm ({})".format(round(perc["SMOKE"], 10), perc["SMOKE"]))
    
    # Temp/Hum Sensor
    humidity, temperature = Adafruit_DHT.read_retry(11, 4)
    print("Tempe    : {} C".format(temperature))
    print("Humidity : {} %".format(humidity))
    
    # Sensordata
    data = [
        {
            'type': 'lux',
            'value': luxVoltage
        },
        {
            'type': 'lpg',
            'value': perc["GAS_LPG"]
        },
        {
            'type': 'co',
            'value': perc["CO"]
        },
        {
            'type': 'smoke',
            'value': perc["SMOKE"]
        },
        {
            'type': 'humidity',
            'value': humidity
        },
        {
            'type': 'temperature',
            'value': temperature
        }
    ]
    
    # Attempt to use UniCode
    try:
        to_unicode = unicode
    except NameError:
        to_unicode = str
        
    # Convert to JSON
    with io.open('data.txt', 'w', encoding='utf8') as outfile:
        str_ = json.dumps(data,
                          indent=4,
                          sort_keys = True,
                          separators=(',', ': '),
                          ensure_ascii = False
        )
        outfile.write(to_unicode(str_))

    # Trigger Node.JS watchFile
    remove('data.json')
    move('data.txt', 'data.json')
    
    # Beautify
    print("")
    time.sleep(5)
