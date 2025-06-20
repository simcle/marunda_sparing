import sql from  '../db.js'

export const insertLogger = (payload) => {
    sql.prepare(`
        INSERT INTO loggers (payload)
        VALUES (?)
    `).run(JSON.stringify(payload))
}

export const getLogger =  () => {
    const rows =  sql.prepare(`SELECT * FROM loggers`).all()
    return rows
}

export const deleteLoggerById = (id) => {
    sql.prepare(`DELETE FROM loggers WHERE id = ?`).run(id)
}

export const deleteLoggerMany = (ids) => {
    sql.prepare(`DELETE FROM loggers WHERE id IN(${ids}) `).run()
}

export const deleteLogger = () => {
    sql.prepare(`DELETE FROM loggers`).run()
}

