(function(){
	//基础属性和默认值
	let snake_move = undefined;//移动定时器
	let when_used = undefined;//用时定时器
	let whenUseTime = 0; //用时
	let startGameBool = true;//开始游戏
	let startPauseBool = true;//暂停和继续游戏
	let speed = 200; //默认速度
	let gameBGImg = 'url(../img/start.png)';//默认背景
	
	//封装let方法
	let $ = (id) =>{//获取id节点
		return document.getElementById(id);
	};
	let removeEleId = (removeEle) =>{//删除id节点 
		removeEle.parentNode.remove(removeEle);
	};
	let removeElementsByClass = (classname) =>{//删除class节点
		let elements = document.getElementsByClassName(classname);
		while(elements.length>0){
			elements[0].parentNode.removeChild(elements[0]);
		}
	};
	//游戏设置变更属性
	let setGame = {
		speed:200,
		gameBGImg:'url(../img/start.png)'
	};
	let speedClass = document.getElementsByClassName('speed');
	speedClass[0].setAttribute('checked','true');
	for (let i = 0;i<speedClass.length;i++) {
		speedClass[i].onclick = () =>{
			setGame.speed = speedClass[i].value;
		}
	}
	let bgClass = document.getElementsByClassName('gameBGImgRadio');
	bgClass[0].setAttribute('checked','true');
	for (let i = 0;i<bgClass.length;i++) {
		bgClass[i].onclick = ()=>{
			setGame.gameBGImg=bgClass[i].value;
		}
	}
	//定义蛇类
	class RETRO_SNAKER{
		constructor(){
			//共有属性
			this.positionRe='relative';4
			this.positionAb='absolute';
			//游戏地图属性
			this.mapWidth = 560;
			this.mapHeight = 560;
			this.mapDiv = $('gameMainContent');
			//食物属性
			this.foodWidth = 20;
			this.foodHeight = 20;
			this.food_x = 0;
			this.food_y = 0;
			this.foodColor = '#ff5500';
			//蛇的属性
			this.snakeWidth = 20;
			this.snakeHeight = 20;
			this.snakeBody = [[3,2,'#DC143C'],[2,2,'#FF1493'],[1,2,'#FF1493']];
			this.snakeEyeWidth = 5;
			this.snakeEyeHeight = 5;
			this.snakeEyeColor='#000000';
			//游戏属性
			this.direct = 'right';
			this.left = false;
			this.right = false;
			this.up = true;
			this.down = true;
			//分数
			this.score = 0;
		}
		init(){
			this.numShow();//显示分数和用时
		}
		startGame(){
			this.food();//创建食物
			this.snake();//创建蛇
		}
		numShow(){
			$('score').innerHTML = this.score;
			$('whenUsedTime').innerHTML = 0 + 's';
		}
		food(){
			let food = document.createElement('div');
			food.style.width = this.foodWidth +'px';
			food.style.height = this.foodHeight +'px';
			food.style.borderRadius = '50%';
			this.food_x = Math.floor(Math.random()*(this.mapWidth/this.foodWidth));
			this.food_y = Math.floor(Math.random()*(this.mapHeight/this.foodHeight));
			food.style.left = this.food_x*this.foodWidth +'px';
			food.style.top = this.food_y*this.foodHeight +'px';
			food.style.backgroundColor = this.foodColor;
			food.style.position = this.positionAb;
			this.mapDiv.appendChild(food).setAttribute('class','food');
		}
		snake(){
			for(let i = 0;i<this.snakeBody.length;i++){
				let snake = document.createElement('div');
				snake.style.width = this.snakeWidth +'px';
				snake.style.height = this.snakeHeight +'px';
				snake.style.borderRadius = '50%';
				snake.style.position = this.positionAb;
				snake.style.left = this.snakeBody[i][0]*20 +'px';
				snake.style.top = this.snakeBody[i][1]*20 +'px';
				snake.style.backgroundColor = this.snakeBody[i][2];
				this.mapDiv.appendChild(snake).setAttribute('class','snake');
			}
			//蛇头眼睛
			let snakeEye1 = document.createElement('div');
			let snakeEye2 = document.createElement('div');
			let snakeHead = document.getElementsByClassName('snake')[0];
			snakeHead.appendChild(snakeEye1).setAttribute('class','snakeEye');
			snakeHead.appendChild(snakeEye2).setAttribute('class','snakeEye');
			let snakeEye = document.getElementsByClassName('snakeEye');
			for(let i=0;i<snakeEye.length;i++){
				snakeEye[i].style.width = this.snakeEyeWidth +'px';
				snakeEye[i].style.height = this.snakeEyeHeight +'px';
				snakeEye[i].style.backgroundColor = this.snakeEyeColor;
				snakeEye[i].style.position = this.positionAb;
				snakeEye[i].style.borderRadius='50%';
			}
			switch(this.direct){
				case 'right':
					snakeEye[0].style.left = '10px';
					snakeEye[0].style.top = '3px';
					snakeEye[1].style.left = '12px';
					snakeEye[1].style.top = '3px';
					break;
				case 'up':
					snakeEye[0].style.left = '3px';
					snakeEye[0].style.top = '3px';
					snakeEye[1].style.left = '12px';
					snakeEye[1].style.top = '3px';
					break;
				case 'left':
					snakeEye[0].style.left = '3px';
					snakeEye[0].style.top = '3px';
					snakeEye[1].style.left = '3px';
					snakeEye[1].style.top = '12px';
					break;
				case 'down':
					snakeEye[0].style.left = '3px';
					snakeEye[0].style.top = '12px';
					snakeEye[1].style.left = '12px';
					snakeEye[1].style.top = '12px';
					break;
				default:
					break;
			}
		}
		move(){
			//蛇身体的位置
			for(let i = this.snakeBody.length-1;i>0;i--){
				this.snakeBody[i][0] = this.snakeBody[i-1][0];
				this.snakeBody[i][1] = this.snakeBody[i-1][1];
			}
			//蛇头的位置
			switch(this.direct){
				case 'right':
					this.snakeBody[0][0] +=1;
					break;
				case 'up':
					this.snakeBody[0][1] -=1;
					break;
				case 'left':
					this.snakeBody[0][0] -=1;
					break;
				case 'down':
					this.snakeBody[0][1] +=1;
					break;
				default:
					break;
			}
			//删除之前蛇的节点再渲染
			removeElementsByClass('snake');
			this.snake();
			//当蛇头和食物x，y同时相等代表吃到食物
			if(this.snakeBody[0][0]==this.food_x&&this.snakeBody[0][1]==this.food_y){
				let snakeTail_x = this.snakeBody[this.snakeBody.length-1][0];
				let snakeTail_y = this.snakeBody[this.snakeBody.length-1][1];
				switch(this.direct){
					case 'right':
						this.snakeBody.push([snakeTail_x+1,snakeTail_y,'#FF1493']);
						break;
					case 'up':
						this.snakeBody.push([snakeTail_x,snakeTail_y-1,'#FF1493']);
					case 'left':
						this.snakeBody.push([snakeTail_x-1,snakeTail_y,'#FF1493']);
						break;
					case 'down':
						this.snakeBody.push([snakeTail_x,snakeTail_y+1,'#FF1493']);
						break;
					default:
						break;
				}
				this.score +=1;
				$('score').innerHTML = this.score;
				removeElementsByClass('food');
				this.food();
			}
			//判断撞到边界
			if(this.snakeBody[0][1]<0 || this.snakeBody[0][1]>=this.mapHeight/this.snakeHeight){
				this.reloadGame();
			}
			if(this.snakeBody[0][0]<0 || this.snakeBody[0][0]>=this.mapWidth/this.snakeWidth){
				this.reloadGame();
			}
			//判断蛇头撞到蛇身
			let snakeHeader_x = this.snakeBody[0][0];
			let snakeHeader_y = this.snakeBody[0][1];
			for(let i=1;i<this.snakeBody.length;i++){
				let snakeBody_x = this.snakeBody[i][0];
				let snakeBody_y = this.snakeBody[i][1];
				if(snakeHeader_x == snakeBody_x && snakeHeader_y == snakeBody_y){
					this.reloadGame();
				}
			}
		}
		setDirect(code){
			switch(code){
				case 37:
					if(this.left){
						this.direct = 'left';
						this.left = false;
						this.right = false;
						this.up = true;
						this.down = true;
					}
					break;
				case 38:
					if(this.up){
						this.direct = 'up';
						this.left = true;
						this.right = true;
						this.up = false;
						this.down = false;
					}
					break;
				case 39:
					if(this.right){
						this.direct = 'right';
						this.left = false;
						this.right = false;
						this.up = true;
						this.down = true;
					}
					break;
				case 40:
					if(this.down){
						this.direct = 'down';
						this.left = true;
						this.right = true;
						this.up = false;
						this.down = false;
					}
					break;
				default:
					break;
			}
		}
		reloadGame(){
			removeElementsByClass('snake');
			removeElementsByClass('food');
			clearInterval(snake_move);
			clearInterval(when_used);
			document.onkeydown = function(e){
				e.returnValue = false;
				return false;
			};
			//记录最佳成绩
			if(this.score>$('bestScore').innerHTML){
				$('bestScore').innerHTML = this.score;
			}
			//初始化
			$('startPause').setAttribute('src','../img/start.png');
			this.snakeBody = [[3,2,'#DC143C'],[2,2,'#FF1493'],[1,2,'#FF1493']];
			this.direct = 'right';
			this.left = false;
			this.right = false;
			this.up = true;
			this.down = true;
			startPauseBool = true;
			startGameBool = true;
			$('loserModel').style.display = 'block';
			$('loserGetScore').innerHTML = this.score +'分';
			$('loserUseTime').innerHTML = whenUseTime +'s';
			this.score = 0;
			$('score').innerHTML = this.score;
			whenUseTime = 0;
			$('whensedTime').innerHTML = 0+'s';
		}
	}
	//页面加载完成
	window.onload = () => {
		window.quitGame = () =>{//退出游戏
			if(confirm("您确定要走吗？嘤嘤嘤")){
				window.opener = null;
				window.open('','_self');
				window.close();
			}
		};
		window.enterGame = () => {//进入游戏
			$('game-inter-box').style.backgroundImage = gameBGImg;
			$('start-interface-box').style.webkitAnimation = 'bounceOutRight 2s ease 0s 1 both';
			$('game-inter-box').style.display = 'block';
			$('game-inter-box').style.webkitAnimation = 'bounceInLeft 2s ease 0s 1 both';
			setTimeout(() =>{
				$('start-interface-box').removeAttribute('style');
				$('start-interface-box').style.display = 'none';
			},2000)
		};
		//游戏设置
		window.setGame = () =>{
			$('setModel-box').style.display = 'block';
		};
		window.sureSet = () =>{//点击确定
			speed = setGame.speed;
			gameBGImg = setGame.gameBGImg;
			$('setModel-box').style.display = 'none';
		};
		window.cancelSet = () =>{//点击取消
			$('setModel-box').style.display = 'none';
		};
		//实例化对象
		let retro_snaker = new RETRO_SNAKER();
		retro_snaker.init();
		document.onkeyup = (event) =>{
			let code = undefined;
			if(window.event){
				code = window.event.keyCode;
			}else{
				code = event.keyCode;
			}
			switch(code){
				case 32:
					startAndPauseGame();
					break;
				default:
					break;
			}
		};
		window.startPause = () =>{//开始游戏和暂停游戏
			startAndPauseGame();
		}
		//失败模式
		window.cancelLoser = () =>{
			$('loserModel').style.display = 'none';
		};
		window.playAgain = () =>{
			$('loserModel').style.display = 'none';
			startAndPauseGame();
		};
		//开始和暂停游戏 逻辑封装
		let startAndPauseGame = () =>{
			if(startPauseBool){
				//开始
				if(startGameBool){
					retro_snaker.startGame();
					startGameBool = false;
				}
				$('startPause').setAttribute('src','img/pause.png');
				//不按键时蛇自动移动起来
				snake_move = setInterval(()=>{
					retro_snaker.move();
				},speed);
				when_used = setInterval(()=>{
					whenUseTime += 1;
					$('whenUsedTime').innerHTML = whenUseTime +'s';
				},1000);
				//按键
				document.onkeydown = (event) =>{
					let code = undefined;
					if(window.event){
						code = window.event.keyCode;
					}else{
						code = event.keyCode;
					}
					retro_snaker.setDirect(code);
				};
				startPauseBool = false;
			}else{
				//暂停
				$('startPause').setAttribute('src','img/start.png');
				clearInterval(snake_move);
				clearInterval(when_used);
				document.onkeydown = function(e){
					e.returnValue = false;
					return false;
				};
				startPauseBool = true;
			}
		};
	}
})();