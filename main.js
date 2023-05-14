const express = require("express")
const app = express()
const path = require("path")
const mysql = require("./connection.js")

const db = new mysql("localhost", "root", "AACEF6E8D16F04BB", "informatica")


//para poder leer las resuestas de las peticiones
app.use(express.urlencoded({extended: false}))

//Para los css
app.use(express.static(path.join(__dirname, 'public')))
//Para poder usar un modelo de tamplates
app.set('view engine', 'ejs')
//Para las paginas
app.set('views', path.join(__dirname, 'views'))


app.get('/', (req, res) => {
    res.render("index")
})


let types = {
    none: '',
    warning: 'warning',
    success: 'success'
}

function checkBoxes(req, res, next) {
    let nombre = req.body.nombre
    let pswd1 = req.body.pswd1
    let pswd2 = req.body.pswd2

    req.type = types.none

    if(nombre === "" || pswd1 === "" || pswd2 === "") {
        req.success = 'no debe de haber campos vacios'
        req.type = types.warning
        return next()
    } else if(pswd1 != pswd2) {
        req.success = 'las contraseñas no coinciden'
        req.type = types.warning
    }
   
    next()
}

function inset() {

}

async function queryUser(req, res, next) {
    let cn = db.getConnection()
    

    cn.query(`SELECT * FROM usuarios WHERE nombre='${req.body.nombre}'`, function(err, result, fields) { 
        if(err) throw err;
        if(result.length > 0) {
            req.success = "EL NOMBRE DE USUARIO YA ESTA EN USO"
            req.type = types.warning
            throw new Error("AAAA");
        }
    }).then(()=> {
        cn.query(`INSERT INTO usuarios(nombre, contra) VALUES('${req.body.nombre}', '${req.body.pswd1}')`)
    }).catch((e)=> {
        return next()
    })

    
    req.success = "SE A REGISTRADO CON EXITO"
    req.type = types.success;
    next()
}

app.post('/registrar', checkBoxes, queryUser,(req, res) => {
    res.render("registrar", {success: req.success, type: req.type})
})

app.get('/registrar', (req, res) => {
    res.render("registrar", {type: types.none})
})


app.listen(80)