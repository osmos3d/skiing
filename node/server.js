const axios = require('axios');
const vMixTCP = require('node-vmix');
const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser();
const readXlsxFile = require('read-excel-file/node');
const express=require('express')
const bodyParser = require("body-parser");


const vMixIPaddres = process.env.VMIX_IP || '127.0.0.1'
const vMix = new vMixTCP.ConnectionTCP(process.env.VMIX_IP || vMixIPaddres );



const app = express();
const PORT ="3000";
let EVID = 9297;
let id = 15 ;
let round, stage_text;
let isRequestInProgress = false;
let totalLaps = ''
// let pvLaps = [ {laps:0, in: false} , {laps:0, in: false},{laps:0, in: false},{laps:0, in: false},{laps:0, in: false},{laps:0, in: false}] ;
let overlay1 = ''
var leaderLapsCompleted = ''
var leaderLastLapTime = ''
let stage_title = ''
let laps_headers = []
let laps_distance = 0
let r = []
let newr = []
let jsonHtmlTable = []
let selectedRow = 0 ;
let selectedAtForTable = ''


app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.listen ( PORT, () => {
    console.log( 'server is workking on ' + PORT )
})

// сервер результатов в браузер
app.get('/', (req, res) => {
    res.send(__dirname + '/index.html');
    res.ok; 
})

let athlets=''
app.post( '/athlets', (req,res) => {
    res.send( jsonHtmlTable )
    res.ok
})

app.get('/r', (req, res) => {
  res.send(r);
});


// сервер данных json (для обзора)
app.get('/json', (req,res)=> {
  res.send( athlets)
  res.ok
})


vMix.on('connect', () => {
    console.log('vMix Connected!');
    setInterval(updateData, 2000);
});


app.post( '/setColumn', (req,res) => {
    console.log( 'получена команда на устанавленеи столбца', req.body )
    selectedRow = req.body.col
    res.sendStatus(200)
})

app.post( '/setPlayerIndex', (req,res) => {
    console.log( 'атлет в таблице выбран', req.body )
    selectedAtForTable = req.body ;
    res.sendStatus(200)
})

app.post( '/selectedAtForTable', (req,res) => {
    res.status(200).send(selectedAtForTable);
})




function readExcelData() {
    return readXlsxFile('./setka.xlsx').then((sheets) => {
        rows = sheets[0].data
        evid = process.env.EVID || rows[0][1];
        id = rows[1][1];
        console.log ( 'id', id)
        console.log ( 'evid', evid)
        mode = rows[3][1];
        stage_text = rows[4][1];
        cat_title=rows[5][1];
        round = rows[7][1];
        
        totalLaps = rows[8][1]
        // количество отсечек
        breaks = rows[9][1] ;
        // количество разгонных кругов
        warmLaps = rows[10][1];

        //console.log(four, four_finish);
    }).catch(error => handleError(error, 'reading Excel data'));
}



// let api = 'https://myfinish.info/php/gate_online.php?evid='
// let headers =
//     {
//         'Referer': 'https://new.myfinish.info/',
//         'Origin': 'https://new.myfinish.info',
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
//         'Accept': 'application/json, text/plain, */*',
//         'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
//     }


// function updateData() {
//     if (isRequestInProgress) {
//         console.log('Request already in progress');
//         return;
//     }
//     isRequestInProgress = true;
//     readExcelData()
//         .then(() => axios.get( apiUrl( api, evid, 2 ),{headers}))
//         .then(response => {
//             let json = response.data
//             //console.log( json )
//             json.g.forEach( body => {
//                 console.log( [body.name, body.descr, body.id] )
//             })
//             //stage_title =  json.g[ id-1 ].name
//             stage_title =  json.g[ id-1 ].name
//             laps_headers = json.g[id-1].meta.lapNames
//             laps_headers = ["1.6 км", "3.5 км", "5 км", "6.6 км", "8.5 км", "10 км", "11.6 км", "13.5 км", "15 км" , "16.6 км" , "18.6 км", "20 км"]
//             console.log( 'Круги текущего соревнования:', laps_headers )
//             console.log( 'Текущая категория:', stage_title )
//             laps_distance = json.g[id-1].meta.len*0.001
//             console.log( `Дистанция:${laps_distance}км`)
//             let competition_title = json.n 
//             console.log( 'Текущее соревнование:', competition_title)
//             updateTpl('time', 'class', stage_title )
//             return axios.get(  apiUrl( api, evid, `1${id}`) , {headers} )
//         })
//         .then( response => {
//             //console.log( 'response data ',response.data )
//             const json = response.data;
//             r = json.r // Сырой json
//             //console.log( r)
//             newr = createNewR(r) // json c просчитанными разницами в лидере
//             jsonHtmlTable = buildSortedLapTable(newr, selectedRow) // json для таблицы,для выбранного круга
//             let table_title = `${stage_text}. ${stage_title}`;
//             processStartList(r, table_title);
//             athlets = buildSortedLapTable(newr, selectedRow)
//             processResults(newr, table_title);
//             processLastSingle(r, table_title);
//             processTop3(newr, table_title, mode);

//         })
//         .catch(error => handleError(error, 'updating data'))
//         .finally(() => {
//             isRequestInProgress = false;
//         });
// }


// -------------------------- FLGR PARSING ---------------------------
const https = require('https') // устранение проблемы с сертификатом
const agent = new https.Agent({
    rejectUnauthorized: false
})


const REGION_MAP = require('./region-map.js'); // таблица соотвествия с регионов
function updateData() {
        if (isRequestInProgress) {
            console.log('Request FLGR already in progress');
            return;
        }

        isRequestInProgress = true;

        const classesUrl = `https://live.flgr-results.ru/api/v1/live/${EVID}/classes/?t=0&callback=ng_jsonp_callback_0`;
        const runnersUrl = `https://live.flgr-results.ru/api/v1/live/${EVID}/runners/1/?t=0&callback=ng_jsonp_callback_1`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Referer': `https://live.flgr-results.ru/${EVID}`,
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'X-Requested-With': 'XMLHttpRequest'
        };

        readExcelData()
            .then(() => {
                return axios.get(classesUrl, { headers, httpsAgent: agent })
                    .then(response => {
                        const raw = response.data;
                        const match = raw.match(/ng_jsonp_callback_0\(([\s\S]*)\);?$/);

                        if (!match || match.length < 2) {
                            throw new Error('JSON заголовков не найден в ответе');
                        }

                        const parsed = JSON.parse(match[1])[0];

                        stage_title = parsed.name;
                        laps_headers = [...parsed.lapNames, '10 км', 'Финиш'];

                        console.log('Круги текущего соревнования:', laps_headers);
                        console.log('Текущая категория:', stage_title);

                        const competition_title = parsed.prog;
                        console.log('Текущее соревнование:', competition_title);

                        updateTpl('time', 'class', stage_title);
                    })
                    .catch(error => {
                        console.warn('Не удалось получить classes, продолжаем без заголовков:', error.message);
                    });
            })
            .then(() => {
                return axios.get(runnersUrl, { headers, httpsAgent: agent });
            })
            .then(response => {
                const raw = response.data;
                const match = raw.match(/ng_jsonp_callback_1\(([\s\S]*)\);?$/);

                if (!match || match.length < 2) {
                    throw new Error('JSON спортсменов не найден в ответе');
                }

                const parsed = JSON.parse(match[1]);

                console.log('Найдено участников:', parsed.runners.length);

                const r = transformFlgrToMyfinish(parsed.runners);
                newr = createNewR(r);
                jsonHtmlTable = buildSortedLapTable(newr, selectedRow);

                const table_title = `${stage_text}. ${stage_title || ''}`.trim();

                processStartList(r, table_title);
                athlets = buildSortedLapTable(newr, selectedRow);
                processResults(newr, table_title);
                processLastSingle(r, table_title);
                processTop3(newr, table_title, mode);
            })
            .catch(error => handleError(error, 'updating data'))
            .finally(() => {
                isRequestInProgress = false;
            });
}

function transformFlgrToMyfinish(flgrRunners) {
  return flgrRunners.map((runner) => ({
    n: String(runner.bib),
    i: runner.name,
    k: "", // если появится mapping reg→region — подставим
    reg: REGION_MAP[ runner.reg.trim() ]  ,
    s: runner.start,
    status: runner.status,
    r: runner.res > 0 ? runner.res : 1000000000,
    d: {
      status: runner.status,
      year: '',
      laps: runner.laps.map(lap => lap + runner.start)
    },
    u: "0",
    y: 0
  }));
}



function processResults(r, table_title) {
     r = [...r].sort((a, b) => {
        const timeA = a.r.raw;
        const timeB = b.r.raw;

        if (timeA == null && timeB == null) return 0;
        if (timeA == null) return 1;
        if (timeB == null) return -1;

        const difA = timeA
        const difB = timeB 
        return difA - difB
    });

    let leaderRaw = r[0].r.raw

    for (let i = 0; i < 160; i++) {
        let page = Math.floor(i / 10);
        let title = `results${page + 1}`;
        let offset = page * 10 - 1;

        if (i % 10 === 0) {
            updateTpl(title, 'class', table_title);
        }
        if (i < 160 && i < r.length) {
            let at = r[i] ;
            updateMultipleTpl(title, {
                [`place ${i - offset}`]: i + 1,
                [`num ${i - offset}`]: at.n || '',
                [`name ${i - offset}`]: formatName(at.i),
                [`city ${i - offset}`]: at.reg || '',
                [`result ${i - offset}`]: i==0 ? msToTime( at.r.raw ) : `+${msToTime( at.r.raw - leaderRaw)}`
            });

            // Обнуление строчек спортсменов без данных
            if ( at.d.laps.slice(-1)[0] == null ) {
                updateMultipleTpl(title, {
                    [`place ${i - offset}`]: '',
                    [`num ${i - offset}`]: '',
                    [`name ${i - offset}`]: '',
                    [`city ${i - offset}`]: '',
                    [`result ${i - offset}`]: ''
                });
            }

        } else {
            updateMultipleTpl(title, {
                [`place ${i - offset}`]: '',
                [`num ${i - offset}`]: '',
                [`name ${i - offset}`]: '',
                [`city ${i - offset}`]: '',
                [`result ${i - offset}`]: ''
            });
        }
    }
}

function processStartList(r, table_title) {
    //console.log( r.sort( (a,b) => a.number-b.number) )
    for (let i = 0; i < 160; i++) {
        let page = Math.floor(i / 10);
        let title = `startlist${page + 1}`;
        let offset = page * 10 - 1;

        if (i % 10 === 0) {
            updateTpl(title, 'class', table_title);
        }

        if (i < 160 && i < r.length) {
            let at = r[i];
            updateMultipleTpl(title, {
                [`num ${i - offset}`]: at.n || '',
                [`place ${i - offset}`] : i+1, 
                [`name ${i - offset}`]: formatName(at.i),
                [`city ${i - offset}`]: at.reg || '',
                [`age ${i - offset}`]: '' //msToTime( at.s ) // 2025-at.d.year+' лет' || '' for myfinish
            });
        } else {
            updateMultipleTpl(title, {
                [`num ${i - offset}`]: '',
                [`place ${i - offset}`] : '', 
                [`name ${i - offset}`]: '',
                [`city ${i - offset}`]: '',
                [`age ${i - offset}`]: ''
            });
        }
    }
}


function processLastSingle(r, table_title) {
    let title = 'last';
    updateTpl(title, 'class', table_title);

   // Количество пройденных кругов лидера
   leaderLapsCompleted = r[0].d.laps ?  r[0].d.laps.filter(lap => lap).length : '' ;
   console.log( 'Laps (raw): ',leaderLapsCompleted )

   var actualLaps = Math.floor( (leaderLapsCompleted- warmLaps)/breaks+1 );
   console.log( actualLaps)

   if ( actualLaps > totalLaps ) actualLaps=totalLaps ;
   if ( actualLaps===0 ) actualLaps=leaderLapsCompleted+1 ;
   console.log( 'actualLaps', actualLaps )

   //если количество кругов еще не опередлено ставим 0 в эксель на кол-во кругов
   // не отображаем общее количество кругов
   if ((totalLaps===0)||(totalLaps===null)) {
      updateTpl('time', 'lap','КРУГ '+ actualLaps)
      
   } else {
      updateTpl('time', 'lap','КРУГ '+ actualLaps+ ( totalLaps ? '/'+totalLaps : '') );
      console.log( 'Laps title : ', 'КРУГ '+ actualLaps+ (totalLaps ? '/'+totalLaps : '') )
   }



   // Фильтруем по количеству пройденных кругов
   let filteredParticipants = r.filter(participant => 
       participant.d.laps.filter(lap => lap.totalTime).length >= leaderLapsCompleted);

   // Находим с максимальным временем
   let at = filteredParticipants.reduce((max, participant) => {
       const participantTime = participant.d.laps.slice(-1) ;
       const maxTime = max.r ;
       return participantTime > maxTime ? participant : max;
   }, filteredParticipants[0]);

    // updateMultipleTpl(title, {
    //     'place 1': at.po || '',
    //     'num 1': at.number || '',
    //     'name 1': formatName(at.account),
    //     'city 1': at.club || '',
    //     'result 1': at.position === 1 ? `${at.resultTime || ''}${at.resultMilliseconds || ''}` : `+${at.leaderDifference || '0:00'}${at.leaderDifferenceMilliseconds || ''}`
    // });

    //console.log('Last finished', at.n, at.i, at.r, at.leaderDifference );
}

function processTop3(r, table_title, mode) {
    updateTpl('winners', 'class', table_title);
    for (let i = 0; i < 6; i++) {
        let at = r[i]
        let title = `leader${i + 1}`;
        updateTpl(title, 'class', table_title);

            let upTitles = ['UP1','UP2','UP3','UP3-pages','UP4-6', 'UP3-auto', 'award' ]
            upTitles.forEach( ( body)=> {
                     updateMultipleTpl( body , {
                    [`num ${i + 1}`]:   at.n || '',
                    [`name ${i + 1}`]: at.i ,
                    [`city ${i + 1}`]: at.reg|| '',
                    [`result ${i + 1}`]: at.d.laps?.slice(-1)[0]?.dif,
                    [`place ${i + 1}`]: i+1,
                    [`class`]: stage_title,
                });
            })
            

            updateMultipleTpl('winners', {
                [`num ${i + 1}`]:   at.n || '',
                [`name ${i + 1}`]:formatName(at.i),
                [`city ${i + 1}`]: at.reg || '',
                [`result ${i + 1}`]: at.year || ''
            });
    }

}




function formatName(account) {
    if (account) {
        let first =  (account.split(' ')[0] || '').toUpperCase()
        let second = account.split(' ')[1] || ''
        //console.log ( [first,second].join(' ') )
        return [first,second].join(' ')
    } else {
        return '' 
    }
}

function msToTime( ms ) {
    let s = parseInt(ms).toString().slice(-2)[0]
   
    if (ms<100) {
        return '00:00'+'.'+Math.round(ms*0.1)
    }
    if (ms) {
        ms = ms.toString().slice(0,-1).slice(0,-1)
        let min = Math.floor(parseInt(ms)/60)
        let sec = Math.floor(parseInt(ms)-min*60)
        //console.log( zeroFill(min)+":"+zeroFill(sec)+'.'+s )
        return (zeroFill(min)+":"+zeroFill(sec)+'.'+s);
    } else {
        return '';
    }
}

function zeroFill( num ) {
    return ('0000' + num).slice(-2)
}

function updateTpl(tpl, name, val) {
    vMix.send({ Function: 'SetText', Input: tpl, SelectedName: `${name}.Text`, Value: val });
}

function updateMultipleTpl(tpl, updates) {
    for (const [name, val] of Object.entries(updates)) {
        updateTpl(tpl, name, val);
    }
}

function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
}

function apiUrl( api, evid, id) {
    let timestamp = Date.now()
    return `${api}${evid}&d=${id}&U=${timestamp}`
}

function createNewR(r) {
    //расширяем json заголовками, добавялем просчитанное время
    let extendedR = r.map((body, index) => {
        const laps = body.d.laps || [];
        return {
          ...body,
          r: {
            raw: body.r,
            time: msToTime(body.r),
          },
          d: {
            ...body.d,
            headers: laps_headers,
            laps: laps.map( (ms,i) => ({
                    raw: ms,
                    time: msToTime(ms - body.s),
                }))
          }
        };
    });

    const lapsCount = Math.max(...r.map(body => body.d.laps?.length || 0)); // максимальное колчество кругов
    if (lapsCount==0) {
        return extendedR
    }
    let sorted = []
    for ( let lap = 0; lap<= lapsCount-1 ; lap++ ) {
        sorted = sortByLap( extendedR, lap)

        const leaderRaw = sorted[0]?.d.laps[lap].raw - sorted[0].s || 0; // Безопасно получаем время лидера

        sorted.forEach( (body,index) => {
            if ( body.d.laps[lap] ) {
                body.d.laps[lap].pos = index+1
                body.d.laps[lap].dif = 
                    index === 0 
                        ? msToTime(leaderRaw) 
                        : `+${msToTime( body.d.laps[lap].raw - body.s - leaderRaw)}`
            }
            
        })

    }
     
    sorted = sortByLap( sorted, selectedRow) //сортировка по выбранному переход выходом
    return sorted
}


function buildSortedLapTable(newr, selectedRow) {
    const sorted = sortByLap( newr,selectedRow )

  const leaderRaw = sorted[0]?.d.laps?.[selectedRow]?.raw ?? 0;

  return sorted.map((body, index) => {
    return {
      pos: index + 1,
      num: body.n,
      name: body.i,
      result: body.d.laps?.[selectedRow]?.dif,
      time:  body.d.laps?.[selectedRow]?.dif,
      reg: body.reg,
      d : body.d.headers[selectedRow]
    };
  });
}

function sortByLap( r, selectedRow) {
    return sorted = [...r].sort((a, b) => {
        const timeA = a.d.laps?.[selectedRow]?.raw;
        const timeB = b.d.laps?.[selectedRow]?.raw;

        if (timeA == null && timeB == null) return 0;
        if (timeA == null) return 1;
        if (timeB == null) return -1;

        const difA = timeA - a.s 
        const difB = timeB - b.s 
        return difA - difB
    });
}


// сервер данных json (для обзора)
app.get('/newr', (req,res)=> {
    res.send( newr  )
    res.ok
})
