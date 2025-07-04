import axios from "axios";
import eventBus from "../eventBus.js";

const api_url_ndp = 'https://apimarunda.ndpteknologi.com/api/modbus'
const token = '173|5tZLAuhefbDXWbk08yRRSH66MVeltOXEA6Ph2Lfu'

eventBus.on('logger', (data) => {
    const { pH, tmp, cod, tss, nh3n, debit, datetime} = data
    const payload = {
        ph: pH,
        tmp: tmp,
        cod: cod,
        tss: tss,
        nh3n: nh3n,
        debit: debit,
        timestamp: datetime
    }
    try {
        axios.post(api_url_ndp, payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    } catch (error) {
        console.log('error send to server ndp')
    }
})