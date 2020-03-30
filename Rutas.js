const express = require('express')
const router = express.Router()
const db = require('./dbconsultas')
const nodemailer = require('nodemailer');
require('dotenv').config()
const mensaje = require('./generarcorreo');
const mysqldb = require('./mysqldb');
const pako = require("pako")
const fs = require('fs')
///////////////////////////////
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/medpacs', {useNewUrlParser: true});
///////////////////////////////

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {type: 'oauth2',
            user: 'jose.camacho@medicaltecsrl.com',
            clientId: '1016773695194-0pvkmmakfrfdv2jev11mbcqifj2fpk54.apps.googleusercontent.com',
            clientSecret: 'BkBnu-R9Yk88Rh7SQSga0A-U',
            refreshToken: '1//041s8Get3Yo0UCgYIARAAGAQSNwF-L9IrSQbn4FBAzfikUbeU1ci0sNaUpQaeQlTAKwStqbOMU8SSDlIGJHsNF02oWrBAvf4zObw'
        }
    //auth:{
    //    user:'jose.camacho@medicaltecsrl.com',
    //    pass:'Camachomm310188'
    //}
});


router.all("/",(req,res)=>{
    console.log("ingreso")
    console.log(req)
    res.send("Fuera de aqui")
})

router.post('/login',(req,res)=>{
    db.login(req.body)
    .then((dbres)=>{
        res.json({db:dbres})
    })
})

router.get('/autenticacion/:token',(req,res)=>{
    db.comprobar(req.param('token'))
    .then((Fres)=>{
        res.json(Fres)
    })
})


router.get('/getestudios',(req,res)=>{
    let inicio,final
    req.param("inicio")?inicio= parseInt( req.param("inicio") ):inicio=19000101
    req.param("fin")?final=parseInt( req.param("fin") ):final=40001212
    mysqldb.buscarestudios(inicio,final)
    .then((dbres)=>{
        res.json(dbres)
    })
})


router.post('/sharecorreo',(req,res)=>{
    let destinatario = req.body.destino
    let nombre = req.body.nombre
    let modalidad = req.body.modalidad
    let fechasys = new Date()
    let fecha = `${fechasys.getDate()}/${fechasys.getMonth()+1}/${fechasys.getFullYear()} ${fechasys.getHours()}:${fechasys.getMinutes()}`
    let titulo = `Estudio:${nombre} - ${modalidad} ${fecha}`
    let datos = req.body.data
    var mailOptions = {
        from: 'MedicalTec SRL',
        to: destinatario,
        subject: titulo,
        html: mensaje.mail(datos,modalidad,nombre)
    }
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
            res.json({res:false})
        } else {
            console.log('Email sent: ' + info.response);
            res.send({res:true})
        }
    });
})

router.post('/cargarInforme',(req,res)=>{
    try{
        let estudio = JSON.parse(req.body.estudio)
        let informe = req.files.file
        let fechasubida = req.body.fechasubida
        db.guardarinforme(informe,estudio,fechasubida)
        res.json({estado:true})
    }catch(e){
        console.log(e)
    }
})

router.get('/listaclientes',(req,res)=>{
    db.leerlistaclientes()
    .then((Pres)=>{
        res.json(Pres)
    })
})

router.get('/getfiles/:id',(req,res)=>{
    mysqldb.files(req.param('id'))
    .then((DBres)=>{
        res.send(DBres)
    })
})

router.get('/getfiles2/:id',(req,res)=>{
    mysqldb.files2(req.param('id'))
    .then((DBres)=>{
        let newfile = pako.gzip(DBres.toString())
        res.send(newfile)
    })
})


router.get('/existeinforme/:id',(req,res)=>{
    db.informesF(req.params.id)
    .then((DBres)=>{
        if(DBres !== null){
            res.json({"existe":true,"nombre":DBres.INFORME.NOMBRE})
        }else{
            res.json({"existe":false,"nombre":null})
        }
    })
})

router.get('/descargarinforme/:file',(req,res)=>{
    res.download(`./informes/${req.params.file}`,`${req.params.file}.pdf`)
})


router.get('/visorexterno/:token',(req,res)=>{
    mysqldb.externo(req.params.token)
    .then((Fres)=>{
        res.json(Fres)
    })
})
module.exports = router