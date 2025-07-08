import ModbusRTU from "modbus-serial";
import onChange from "on-change";
import dayjs from "dayjs";
import db from "./firebase.js";
import cron from 'node-cron'
import eventBus from "./eventBus.js";
import './src/service.js'
import './src/sparing.js'

const ref = db.ref('dwitama/marunda/modbus')
let sensor = {
    datetime: null,
    pH: 0,
    tmp: 0,
    cod: 0,
    tss: 0,
    nh3n: 0,
    debit: 0
}

const modbusChange = onChange(sensor, () => {
    ref.set({
        datetime: sensor.datetime,
        ph: sensor.pH,
        tmp: sensor.tmp,
        cod: sensor.cod,
        tss: sensor.tss,
        nh3n: sensor.nh3n,
        debit: sensor.debit,
    })
})

const client = new ModbusRTU()
try {
    client.connectRTUBuffered('COM6', {baudRate: 9600})
    client.setTimeout(1000)
} catch (error) {
    console.log(error)
}

const metersIdList = [1, 2]
const getMetersValue = async (meters) => {
    try {
        for(let meter of meters) {
            await getMeterValue(meter)
            await sleep(500)
        }
    } catch (error) {
        console.log(error)
    } finally {
        setImmediate(() => {
            getMetersValue(metersIdList)
        })
    }
    
}

const getMeterValue = async (id) => {
    try {
        client.setID(id)
        if(id == 1) {
            try {
                const val = await client.readHoldingRegisters(0, 4)
                const raw = val.buffer.swap16().readFloatLE(0);
                const cubicPerMinute = Number.isFinite(raw) ? raw / 60 : 0.0;
                modbusChange.debit = cubicPerMinute.toFixed(4)

            } catch (error) {
                modbusChange.debit = 0
                console.log('debit: ' +error)
            }
        }
        if(id == 2) {
            try {
                const val = await client.readHoldingRegisters(0, 30)
                modbusChange.pH = val.buffer.swap16().readFloatLE().toFixed(4)
                modbusChange.tmp = val.buffer.readFloatLE(4).toFixed(4)
                modbusChange.cod = val.buffer.readFloatLE(32).toFixed(4)
                modbusChange.tss = val.buffer.readFloatLE(40).toFixed(4)
                modbusChange.nh3n = val.buffer.readFloatLE(48).toFixed(4)
            } catch (error) {
                modbusChange.pH = 0
                modbusChange.tmp = 0
                modbusChange.cod = 0
                modbusChange.tss = 0
                modbusChange.nh3n = 0
                console.log('muc: '+error)
            }
        }
        return modbusChange
    } catch (error) {
        console.log('error: ' +error)
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
getMetersValue(metersIdList)

cron.schedule('*/2 * * * *', () => {
    const now = dayjs(new Date).unix()
    sensor.datetime = now
    eventBus.emit('logger', sensor)
    eventBus.emit('sparing', sensor)
})
