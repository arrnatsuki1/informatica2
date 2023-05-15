const express = require("express")
const app = express()
const path = require("path")
const mysql = require("./connection.js")
const Chiper = require("./chiper.js")
const dotenv = require('dotenv')
dotenv.config()

const db = new mysql("localhost", "root", process.env.DB_PASSWORD, "informatica")
const cipher = new Chiper()

//para poder leer las resuestas de las peticiones
app.use(express.urlencoded({extended: false}))

//Para los css
app.use(express.static(path.join(__dirname, 'public')))
//Para poder usar un modelo de tamplates
app.set('view engine', 'ejs')
//Para las paginas
app.set('views', path.join(__dirname, 'views'))


app.get('/', (req, res) => {
    res.render("index",{
        type:types.none
    })
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
        next()
    } else if(pswd1 != pswd2) {
        req.success = 'las contraseñas no coinciden'
        req.type = types.warning
        next()
    }
    next()
}

async function queryUser(req, res, next) {
    let cn = db.getConnection()

    let nencriptado = req.body.nombre;
    let cencriptada = cipher.encrypt(req.body.pswd1);

    if(req.type === types.warning) {
        return next()
    }

    const querySelect = `SELECT * FROM usuarios WHERE nombre='${nencriptado}'`

    const queryInsert = `INSERT INTO usuarios(nombre, contra) VALUES('${nencriptado}', '${cencriptada}')`

    cn.query(querySelect, function(err, result, fields) { 
        if(err) throw err;
        if(result.length > 0) {
            req.success = "EL NOMBRE DE USUARIO YA ESTA EN USO"
            req.type = types.warning
            next()
        } else {
            cn.query(queryInsert)
            req.success = "SE A REGISTRADO CON EXITO"
            req.type = types.success;
            next()
        }
    })
}

function validacion(req, res,next){ 
    let nom = req.body.nombre
    let pswd = req.body.contra

    req.type = types.none

    if (nom === "" || pswd === "") {
        req.success = "No debe haber campos vacíos";
        req.type = types.warning;
        return next();
      }
      next()
  }

  async function iniciarSesion(req, res, next) {
    let cn = db.getConnection();

    let ncontra = cipher.encrypt(req.body.contra)

    if (req.type === types.warning) {
      return next();
    }
    const inicioSesion = `SELECT * FROM usuarios WHERE nombre='${req.body.nombre}' AND contra='${ncontra}'`;
  
    cn.query(inicioSesion, function (err, result, fields) {
      if (err) throw err;
      if (result.length > 0) {
        req.type = types.success
        req.success = 'INICIO DE SESION HECHO'
        req.nombre = result[0].nombre
        return next()
      } else {
        req.type = types.warning
        return next()
      }
    });
  }



app.post('/registrar', checkBoxes, queryUser,(req, res) => {

    res.render("registrar", {success: req.success, type: req.type})

})

app.get('/registrar', (req, res) => {
    res.render("registrar", {type: types.none})
})

app.post("/login", validacion, iniciarSesion, (req, res) => {
  
  if(req.type === types.warning) {
    res.redirect('/')
  } else {
    res.render("sesion", { success: req.success, type: req.type, nombre: req.nombre });
  }
});

app.listen(process.env.port)
