let pool = require('../databaseConnection/createconnection')
let db = {}

/**
 * Check current blocker status
 */
db.getBlockerStatus = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `
                SELECT is_working, process_name
                FROM manual_api_run_blocker
                WHERE id = 1
            `
            pool.query(sql, (error, result) => {
                if (error) return reject(error)
                return resolve(result?.[0])
            })
        } catch (e) {
            throw e
        }
    })
}

/**
 * Try to acquire lock
 * Returns affectedRows = 1 → lock acquired
 * Returns affectedRows = 0 → already running
 */
db.acquireLock = (processName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `
                UPDATE manual_api_run_blocker
                SET is_working = 1,
                    process_name = ?
                WHERE id = 1
                  AND is_working = 0
            `
            pool.query(sql, [processName], (error, result) => {
                if (error) return reject(error)
                return resolve(result)
            })
        } catch (e) {
            throw e
        }
    })
}

/**
 * Release lock (used in finally)
 */
db.releaseLock = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `
                UPDATE manual_api_run_blocker
                SET is_working = 0,
                    process_name = NULL
                WHERE id = 1
            `
            pool.query(sql, (error, result) => {
                if (error) return reject(error)
                return resolve(result)
            })
        } catch (e) {
            throw e
        }
    })
}

db.getStatus = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `
                SELECT id, process_name, is_working, updated_on
                FROM manual_api_run_blocker
                WHERE id = 1
            `
            pool.query(sql, (error, result) => {
                if (error) return reject(error)
                return resolve(result?.[0])
            })
        } catch (e) {
            throw e
        }
    })
}


// db.getStatus = () => {
//     return new Promise((resolve, reject) => {
//         try {
//             let sql = `
//                 SELECT is_working, process_name
//                 FROM manual_api_run_blocker
//                 WHERE id = 1
//             `
//             pool.query(sql, (error, result) => {
//                 if (error) return reject(error)
//                 return resolve(result?.[0])
//             })
//         } catch (e) {
//             throw e
//         }
//     })
// }

/**
 * Start process (only update, no validation on process_name)
 */
db.startProcess = (processName) => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `
                UPDATE manual_api_run_blocker
                SET is_working = 1,
                    process_name = ?
                WHERE id = 1
            `
            pool.query(sql, [processName], (error, result) => {
                if (error) return reject(error)
                return resolve(result)
            })
        } catch (e) {
            throw e
        }
    })
}

/**
 * Reset blocker (used in finally)
 */
db.resetProcess = () => {
    return new Promise((resolve, reject) => {
        try {
            let sql = `
                UPDATE manual_api_run_blocker
                SET is_working = 0,
                    process_name = NULL
                WHERE id = 1
            `
            pool.query(sql, (error, result) => {
                if (error) return reject(error)
                return resolve(result)
            })
        } catch (e) {
            throw e
        }
    })
}

module.exports = db
