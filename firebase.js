import admin from 'firebase-admin'
import { readFile } from 'fs/promises'

const serviceAccount = JSON.parse(
    await readFile('./serviceAccountKey.json', 'utf8')
)


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://probest-763de-default-rtdb.firebaseio.com'
})

const db = admin.database()

export default db