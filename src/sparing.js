import axios from "axios";
import jwt from 'jsonwebtoken'
import eventBus from "../eventBus.js";
import cron from 'node-cron'
import { insertLogger, getLogger, deleteLoggerById, deleteLoggerMany } from "./controller.js";

const mode = 'hourly' // testing minute hourly
const uid = "65489c6e4649964b989523dc"


eventBus.on('sparing', (data) => {
    const { pH, cod, tss, nh3n, debit, datetime} = data
    const payload = {
        uid: uid,
        datetime: datetime,
        pH: pH,
        cod: cod,
        tss: tss,
        nh3n: nh3n,
        debit: debit,
    }
    if(mode == 'testing') {
        sendTesting(payload)
    } else if(mode == 'minute') {
        sendMinute(payload)
    } else if(mode == 'hourly') {
        delete payload.uid
        bufferHourly(payload)
    }
})

const getApiScreet = async () => {
    const res = await axios.get('https://sparing.kemenlh.go.id/api/secret-sensor')
    return res.data
}

const createJwtToken = (payload, secret) => {
    const header = {
        "typ": "JWT",
        "alg": "HS256"
    }
    return jwt.sign(payload, secret, {
        algorithm: "HS256",
        header: header,
        noTimestamp: true
    })
}


const resendFailedQueue = async () => {
    const rows = getLogger()
    for (const row of rows) {
        const data = JSON.parse(row.payload)
        const secret = await getApiScreet()
        const token = createJwtToken(data, secret)
        let res
        try {
            if(mode == 'testing') {
                res = await axios.post('https://sparing.kemenlh.go.id/api/testing', {token: token}, {
                    header: {
                        'Content-Type': 'application/json'
                    }
                })
                console.log(res.data)
            } else if(mode == 'minute') {
                res = await axios.post('https://sparing.kemenlh.go.id/api/send', {token: token}, {
                    header: {
                        'Content-Type': 'application/json'
                    }
                })
                console.log(res.data)
            }
        } catch (error) {
            console.log(error.response.data)
        }
        if(res) {
            deleteLoggerById(row.id)
        } else {
            break
        }
    }
}

const sendTesting = async (payload) => {
    const url = 'https://sparing.kemenlh.go.id/api/testing'
    await resendFailedQueue()
    try {
        const secret = await getApiScreet()
        const token = createJwtToken(payload, secret)
        const res = await axios.post(url, {token: token}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        console.log(res.data)
    } catch (error) {
        console.log(error.response.data)
        insertLogger(payload)
    }

}

const sendMinute = async (payload) => {
    const url = 'https://sparing.kemenlh.go.id/api/send'
    await resendFailedQueue()
    try {
        const secret = await getApiScreet()
        const token = createJwtToken(payload, secret)
        const res = await axios.post(url, {token: token}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        console.log(res.data)
    } catch (error) {
        console.log(error.response.data)
        insertLogger(payload)
    }
}


const bufferHourly =  (payload) => {
    insertLogger(payload)
}
const sendHourly = async () => {
    const itmes = getLogger()
    const payload = itmes.map(row => JSON.parse(row.payload))
    
    const data = {
        uid: uid,
        data: payload
    }
   
    const url = 'https://sparing.kemenlh.go.id/api/send-hourly'
    if(itmes.length >= 0) {
        console.log(payload)
        deleteLoggerMany(itmes.map(i => i.id).join(','))
        try {
            const secret = await getApiScreet()
            const token = createJwtToken(data, secret)
            const res = await axios.post(url, {token: token}, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            console.log(res.data)
            if(res.data) {
    
            }
        } catch (error) {
            console.log(error.response.data)
        }
    }
}

cron.schedule('0 * * * *', async () => {
    if(mode == 'hourly') {
        sendHourly()
    }
})