const mysql2 = require("mysql2")
module.exports = class Connection {

    connection = null;

    constructor(host, user, password, db) {
        this.host = host;
        this.user = user;
        this.password = password;
        this.db = db;
    }

    getConnection() {
        let cn;
        if(this.connection === null) {
            this.connection = mysql2.createConnection({
                host: this.host,
                user: this.user,
                password: this.password,
                database: this.db
            })

            this.connection.connect(function(err) {
                if(err) throw err;
            })
        }

        return this.connection;
    }

    closeConection() {
        this.connection.end()
    }

}