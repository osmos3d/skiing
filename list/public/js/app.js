
Vue.createApp( {
	
	data() {
		return {
			at: [], 
			clickedIndexes: [],
			selectedColumnKey: null // ← добавлено
		}
	},

	methods: {

		getJson(){
			var thisMain = this;
			axios.post('/r')	
		  	.then( (res) => { 
		 		console.log( 'resposed data from sever ' , res.data )
		 		this.at = res.data;
				// 
			})
		},

		sendIndex( data ) {
		  data.col = this.selectedColumnKey ; 
		  console.log( data )
		  axios.post('/send-index', data )
		    .then(res => {
		    	console.log('Индекс отправлен:', data, res.data);
		    	if (!this.clickedIndexes.includes(data.index) && !data.pv ) {
		        	this.clickedIndexes.push(data.index);
		        }
		    })
		    .catch(err => {
		      console.error('Ошибка при отправке индекса:', err);
		    });
		},

		setColumn() {
			console.log( 'Нажата кнопка ')
			axios.post('/setColumn', {col: this.selectedColumnKey}  )
				.then( res => {
					console.log( 'Столбец отправлен на сервер')
				})
		},

		setText( index ) {
			axios.post('/setText', { index: index })
			  .then(res => {
			  	console.log('Установить текст:', index, res.data);
			  })
			  .catch(err => {
			    console.error('Ошибка при установке текста:', err);
			  });
		},
		setPlayerIndex( data ) {
			axios.post('/setPlayerIndexForTable', data)
			.then( res => {
				console.log( 'Установили номер игрока в таблице', data)
			})
			.catch( err => {
				console.log( 'Ошибка при установке номера игрока', err)
			})
		},

		titleOut(){
			axios.post( '/titleOut')
		},
		selectColumn(key) {
			this.selectedColumnKey = key;
		},

		msToTime( ms ) {
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

	},

	// запуск функции перед загрузкой 
	beforeMount(){
   		this.getJson();
   		setInterval( ()=> {
   		 	this.getJson()
   		 } , 1000)
 	},


} ).mount('#app')

