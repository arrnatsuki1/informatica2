const express = require("express");
const app = express();
const path = require("path");
const mysql = require("./connection.js");
const Chiper = require("./chiper.js");
const dotenv = require("dotenv");
const multer = require("multer");
//File system


const storage = multer.diskStorage({
  destination: path.join(__dirname, "./images"),
  filename: (req, file, cb) => {
    let nombre = `${Date.now()}-${file.originalname}`;
    req.nombre = nombre;
    cb(null, nombre);
  }
});

const upload = multer({storage: storage});

dotenv.config();

const db = new mysql(
  "localhost",
  "root",
  process.env.DB_PASSWORD,
  "informatica"
);
const cipher = new Chiper();

//para poder leer las resuestas de las peticiones
app.use(express.urlencoded({ extended: false }));

//Para los css
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "images")))
//Para poder usar un modelo de tamplates
app.set("view engine", "ejs");
//Para las paginas
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index", {
    type: types.none,
  });
});

let types = {
  none: "",
  warning: "warning",
  success: "success",
};

function validarImagen(req, res, next) {
  let profileImage;
  if(typeof req.file != 'undefined') {
    profileImage = req.file.originalname;
  }
  // Verificar si la extensión es PNG o JPG
  if (typeof profileImage === 'undefined' || !/\.(png|jpg)$/i.test(profileImage)) {
    req.success = "La imagen debe ser en formato PNG o JPG";
    req.type = types.warning;
    next();
  } else {
    next();
  }
}

function checkBoxes(req, res, next) {
  let nombre = req.body.nombre;
  let pswd1 = req.body.pswd1;
  let pswd2 = req.body.pswd2;
  let profileImage;
  if(typeof req.file != 'undefined') {
    profileImage = req.file.originalname;
  }

  

  req.type = types.none;

  // Verificar si nombre solo contiene letras
  if (!/^[a-zA-Z]+$/.test(nombre)) {
    req.success = "el nombre solo debe contener letras";
    req.type = types.warning;
    next();
    // Verificar si pswd1 solo contiene letras
  } else if (!/^[a-zA-Z]+$/.test(pswd1)) {
    req.success = "la contraseña solo debe contener letras";
    req.type = types.warning;
    next();
    // Verificar si pswd2 solo contiene letras
  } else if (!/^[a-zA-Z]+$/.test(pswd2)) {
    req.success = "la confirmación de contraseña solo debe contener letras";
    req.type = types.warning;
    next();
    // Verificar si imagen es un archivo PNG
  } else if (typeof profileImage === 'undefinded' || !/\.(png|jpg)$/.test(profileImage)) {
    req.success = "La imagen debe ser en formato PNG o JPG";
    req.type = types.warning;
    next();
  } else if (nombre === "" || pswd1 === "" || pswd2 === "") {
    req.success = "no debe de haber campos vacios";
    req.type = types.warning;
    next();
  } else if (pswd1 != pswd2) {
    req.success = "las contraseñas no coinciden";
    req.type = types.warning;
    next();
  } else {
    next();
  }
}

async function queryUser(req, res, next) {
  let cn = db.getConnection();

  let nencriptado = req.body.nombre;
  let cencriptada = cipher.encrypt(req.body.pswd1);

  let profileImage;
  if(typeof req.file != 'undefined') {
    profileImage = req.file.originalname;
  }
  if (req.type === types.warning) {
    return next();
  }

  const querySelect = `SELECT * FROM usuarios WHERE nombre='${nencriptado}'`;

  const queryInsert = `INSERT INTO usuarios(nombre, contra, imagen_ruta) VALUES('${nencriptado}', '${cencriptada}','${req.nombre}')`;

  cn.query(querySelect, function (err, result, fields) {
    if (err) throw err;
    if (result.length > 0) {
      req.success = "EL NOMBRE DE USUARIO YA ESTA EN USO";
      req.type = types.warning;
      next();
    } else {
      cn.query(queryInsert);
      req.success = "SE A REGISTRADO CON EXITO";
      req.type = types.success;
      next();
    }
  });
}

function validacion(req, res, next) {
  let nom = req.body.nombre;
  let pswd = req.body.contra;

  req.type = types.none;

  if (nom === "" || pswd === "") {
    req.success = "No debe haber campos vacíos";
    req.type = types.warning;
    return next();
  }
  next();
}

async function iniciarSesion(req, res, next) {
  let cn = db.getConnection();

  let ncontra = cipher.encrypt(req.body.contra);

  if (req.type === types.warning) {
    return next();
  }
  const inicioSesion = `SELECT * FROM usuarios WHERE nombre='${req.body.nombre}' AND contra='${ncontra}'`;

  cn.query(inicioSesion, function (err, result, fields) {
    if (err) throw err;
    if (result.length > 0) {
      req.type = types.success;
      req.success = "INICIO DE SESION HECHO";
      req.nombre = result[0].nombre;
      req.profileImage = `${result[0].imagen_ruta}`;
      return next();
    } else {
      req.type = types.warning;
      return next();
    }
  });
}

app.post("/registrar", upload.single("profileImage"),checkBoxes,validarImagen,queryUser, (req, res) => {
    res.render("registrar", { success: req.success, type: req.type });
});

app.get("/registrar", (req, res) => {
  res.render("registrar", { type: types.none });
});

app.post("/login", validacion, iniciarSesion, (req, res) => {
  if (req.type === types.warning) {
    res.redirect("/");
  } else {
    res.render("sesion", {
      success: req.success,
      type: req.type,
      nombre: req.nombre,
      profileImage: req.profileImage,
    });
  }
});

app.get('/images', (req, res) => {
  console.log(req)
})

app.listen(process.env.port);
