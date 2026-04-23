const vMixService = require("./vmixservice");
const fs = require('node:fs')
//const vMix = new vMixService("127.0.0.1");
const vMix = new vMixService(process.env.VMIX_IP || "127.0.0.1");
const axios = require('axios')
const path = require('path')
const express = require('express')
const bodyParser = require("body-parser");
require('log-timestamp')(console, '[HH:MMS:ss]');


const app = express()
const PORT = 7000
var json = []
const titlename = 'lower'
const titlephoto = 'lower_photo'
var titleon = false
const photoFolder = 'D://bmx_race_jul_2025/photo'
var selectedCol = 0 ;

const serverUrl = process.env.SERVER_IP || 'http://localhost:3000'
const url = `${serverUrl}/newr`;
console.log( 'url', url )

app.use( express.static('public') )
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.listen ( PORT, () => {
	console.log( 'server is workking on ' + PORT )
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


function getJson() {
	axios.get( url )
		.then( response => {
			const {data} = response
			//console.log( data )
            console.log( ' Данные обновлены ')
			json = data
		})
        .catch( error => {
            console.error('❌ Ошибка при получении данных с сервера:', error.message);
        })
}

app.post( '/r', (req,res) => {
	res.send( json )
})

app.post('/send-index', (req, res) => {

    console.log('Получен :', req.body);
    res.send('ok');
    let index = req.body.index
    let title = req.body.title
    let pv = req.body.pv

    if ( !titleon ) {
        setText(index, title)
        if ( pv ) {
            vMix.setPreview( title );
        } else {
            vMix.showTitle( title, 1)
            titleon = true
        }
        
    } 

    if ( titleon ) {
        setTimeout(() => {
            vMix.hideTitle(1);
            titleon = false
        }, 5000);
    }
});

// app.post('/setText', (req,res) => {
//     const index = req.body.index
//     console.log('Получен индекс для текста')
//     if ( !titleon ) setText(index, titlename)
//     if ( !titleon ) setText(index, titlephoto)
//     updatePhoto( titlephoto, json[index].Bib )
//     //vMix.setPreview( titlename );
//     res.send('ok');
    
// })

function setText(index, title) {
    console.log( 'set', json[index] )
    vMix.updateText( title, `name 1` , json[index].i )
    vMix.updateText( title, `city 1` , json[index].k  )
    vMix.updateText( title, `num 1` ,  json[index].n  )
    vMix.updateText( title, `place 1` ,  index+1  )
    vMix.updateText( title, `info 1` ,  json[index].k  )
    vMix.updateText( title, `age 1` ,  `${2025-json[index].d.year} лет ` )
    vMix.updateText( title, `dist` ,  json[0].d.headers[selectedCol] )
    vMix.updateText( title, `result 1` ,  json[index].d.laps[selectedCol]?.dif )

    
}

app.post('/titleOut', (req,res) => {
	vMix.hideTitle(1);
    titleon = false
    res.sendStatus(200)
})

app.post('/setColumn' , (req,res) => {
    console.log( req.body )
    axios.post( `${serverUrl}/setColumn` , req.body )
    selectedCol = req.body.col; 
    res.sendStatus(200)
})

app.post('/setPlayerIndexForTable' , (req,res) => {
    console.log( req.body )
    axios.post( `${serverUrl}/setPlayerIndex` , req.body )
    res.sendStatus(200)
})



setInterval( getJson, 1000 )

app.use((err, req, res, next) => {
    console.error("Express error:", err);
    res.status(500).send('Internal server error');
});


function updatePhoto( title, index ){
    let photoPatch =  path.join( photoFolder, `${index}.jpg`).replace(/\\/g, '/');
    fs.readFile( photoPatch, (err,data) => {
        if ( !err && data) {
            console.log(`${index}.jpg`, '   <••• photo is exist' )
            try {   
                    vMix.updateImage( title, `Photo_1` ,  photoPatch ) 
                } catch (error) {
                    console.error(error)
                } 
        } else {
            vMix.updateImage( title, `Photo_1` ,  path.join( photoFolder, `empty.jpg`).replace(/\\/g, '/')  )
            console.log( `${index}.jpg`, '   ◄◄◄ file is empty ')
        }
    })
}
