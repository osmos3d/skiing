
Vue.createApp( {
	
	data() {
		return {
			counter: 0,
			at: [], 
			pvLaps : 0,
			reset : false,
			selectedPlayer : ''
		}
	},
	methods: {

	getItemStyle(index) {
		const baseTop = 100;
		const baseLeft = 100; 
		const spacing = 31;
		return {
			top: `${baseTop + index*spacing }px`,
			left:`${baseLeft}px`
		};
	},

	
	getJson(){
		var thisMain = this;
		axios.post('/athlets')	
			.then( (res) => { 
				console.log( res.data )
				// 
				res.data.forEach( (body,index)=> {
					if (( res.data[index].result == '+0:00')||( res.data[index].result == '.0')) {
						res.data[index].result='';
					}
				} )

				this.at = res.data;
			})

		

		const staticLines = 15; // количество статичных строк
		const dynamicLines = 10; // количество строк, которые будут меняться 
		const totalLines = staticLines+dynamicLines ; 
		const baseTop = 100; // отступ сверху страницы первого титра
		const baseLeft = 110;
		const spacing = 35;
		let leaderLaps =  this.at[0] ? this.at[0].laps : '' ;
		let nextLap = false; 
		const listItems = document.querySelectorAll('.at');
		console.log( listItems )

		//if ( this.counter == 14 ) {
		if ( leaderLaps > this.pvLaps) {
			resetLaps();
		}
		// console.log( 'leaderLaps', leaderLaps)
		// console.log( 'pvLaps', this.pvLaps )
		// console.log( this.at )
		// if ( this.counter == 6 ) {
		// 		resetLaps();	
		// }




		function resetLaps() {
			console.log( 'new LAPS reset ')
			console.log( leaderLaps, thisMain.pvLaps)
			thisMain.pvLaps = leaderLaps; 
			thisMain.reset = true;
			thisMain.counter = 0 ; 

			listItems.forEach( (body,index)=> {
				body.style.left='-250px';
				body.style.opacity=0;
				body.classList.remove('transitionIN');
				console.log( body )
				console.log( index )
			})

			
			
			setTimeout( ()=> {
				thisMain.reset = false
				thisMain.counter = 0 ; 
			}, 2000)
		}

		
		if ( !this.reset)  staticLinesIN( this.at)
		let at = this.at[thisMain.counter]

		if ( (thisMain.counter >= totalLines )&&( !this.reset))  {
			 console.log( (thisMain.counter >= totalLines ) )
			 dynamicLinesIN(at);
			 
		}
		
		
		
		function staticLinesIN(at) {
			// Выход всех статичных линий
			
				if ( thisMain.counter < totalLines ) { 
					for ( let index=0; index<totalLines; index++ ) {
						// Задаем позицию титров
						let item = listItems[index]
						if ( item ) {
							item.style.top = `${baseTop + index*spacing }px`
							item.style.left=`${baseLeft}px`
						} 
						if ( listItems[index+1] ) {
							listItems[index+1].style.top = `${baseTop + (index+1)*spacing }px`
							
						}

						setTimeout( ()=> {
						// Анимация появления при условии, что данные пришли 
						if ( at[index] ) { // проверка на ошибку если существует

							if (( thisMain.counter === index)&&
								( at[index].result !== "+0:00")&&
								( at[index].result !== "+0:00")&&
								( at[index].result !== "")&&
								( at[index].result )&&
								( at[index].laps === leaderLaps )&&
								( index<= totalLines) ) {
								console.log( at[index])
									listItems[index].classList.add('transitionIN')
									listItems[index].style.opacity = 1 ;
									thisMain.counter ++ ;
									console.log( 'line transitionIN -->', thisMain.counter)
							}
						}
						}, 500)
					}
				}
			
		}

		

		function dynamicLinesIN( at) {
			console.log( 'counter', thisMain.counter, at.result)
			if (at) {
				if ( ( at.time !== "0:00")&& ( at.laps === leaderLaps )&&( at.time !== "")&&( at.time )) { // если данные пришли 
					thisMain.counter ++ ;
					console.log( ' counter after iteration ', thisMain.counter)
					const offset = thisMain.counter - dynamicLines;
					console.log( 'offset', offset )
					// Задаем появление и сдвиг линий
					setTimeout( ()=> {
							for (let i = 0; i < dynamicLines; i++) {
							    const index = offset+i;
							    if ( listItems[index] ) {
							    	    listItems[index].style.top = `${baseTop + (i+staticLines)*spacing }px`;
							    	    listItems[index].style.left=`${baseLeft}px`

							    	    listItems[index+1].style.top = `${baseTop + (i+staticLines+1)*spacing }px`;
							    	    listItems[index+1].style.left=`${baseLeft}px`
							    	   

							    	   	listItems[index].classList.add('lastAthlets')

							    	   	if ( i === 0 ) {
							    	   		listItems[index].style.opacity = 0 ;
							    	   		listItems[index].style.zIndex = -1 ;
							    	   	}
							    	   	if ( i === dynamicLines-1) {
							    	   		listItems[index].style.opacity = 1 ;
							    			listItems[index].classList.add('transitionIN')
							    		}
							    	    console.log( '-->> ', index, `${baseTop + (i+staticLines)*spacing }px` )
							    }
							    
							}
					}, 1000)
				}
			}
		}
	},

	getSelectedJson() {
			axios.post('/selectedAtForTable')
				.then( (res) => {
					this.selectedPlayer = res.data.index
					console.log( 'selectedPlayer', this.selectedPlayer )
				})
		}
	},

	// запуск функции перед загрузкой 
	beforeMount(){
   		this.getJson();
   		setInterval( ()=> {
   		 	this.getJson()
   		 } , 2000)
   		this.getSelectedJson()
   		setInterval( ()=> {
   		 	this.getSelectedJson()
   		 } , 500)
 	},


} ).mount('#app')

