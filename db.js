import Database from "better-sqlite3";

const sql = new Database('logger.db')

sql.prepare(`
    CREATE TABLE IF NOT EXISTS loggers(
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       payload TEXT
    )
`).run()

export default sql