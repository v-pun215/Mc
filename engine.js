/*

================
= BrowserCraft =
================

Author: Nareshkumar Rao
Copyright: All parts of this document and the BrowserCraft project belongs to Nareshkumar Rao.

*/

//Global Variable Initialization Begins.
var BCEngine = 
{
	//The Height and Width of the Screen.
height:0,
width:0,

	//Size of each cube.
cubeSize:0,

	//Size (Height) of the Envelope Boxes.
evnBoxSize:0,

	//Reference to the playArea HTML DIV.
playArea:null,

	//Reference to the player HTML DIV.
player:null,

	//Currently selected block.
currentSelection:0,

	//Speed of gravity
gravity:3,

	//The map object holds all the chunks(for future, currently only 1 chunk)
map:{
		//Initiailizes the chunk (In future all chunks will be initialized automatically)
chunk1:null
	},
	
	//Key Presses to determine if a key is being pressed or not.
keyPresses:{
isLeft:false,
isRight:false
	},

sliding:{
isSliding:false,
curSpeed:0,
slideDirection:"right"
	},

blockDestruction:{
lastReferredBlock:null,
lastRunningTimer:null
	},

	//The handlers for all the events.
eventHandlers:{},
	
	//These utils include functions to help calculate certain values needed for physics/etc.
utils:{},

Block:function(name,id,strength)
	{
		this.name = name;
		this.id = id;
		this.strength = strength;
		this.img = name.toLowerCase()+".png";
	}
}

/*The available and playable blocks.

name: The name of to block to be shown to users.
img: The linked image of the block.
id: The block ID. (The renderer uses the same ID's to render a chunk)

*/
BCEngine.objects=[
new BCEngine.Block("Stone",1,2),
new BCEngine.Block("Cobblestone",2,2),
new BCEngine.Block("Dirt",3,0.5),
new BCEngine.Block("Grass",4,0.5),
new BCEngine.Block("Plank",5,1.5),
new BCEngine.Block("Brick",6,4)
]

//This function creates the 3 black envelope boxes.
BCEngine.createEnvBoxes=function()
{
	//Determine what the size(height) of the envelope box should be.
	BCEngine.evnBoxSize = ( BCEngine.height -( BCEngine.cubeSize * 5 ) ) / 2 ;
	
	//Creates top envelope box.
	var evn1 = document.createElement("div");
	evn1.setAttribute("id","evn1");
	document.getElementById("envBox").appendChild(evn1);
	
	//Creates bottom envelope box.
	var evn2 = document.createElement("div");
	evn2.setAttribute("id","evn2");
	document.getElementById("envBox").appendChild(evn2);
	
	//Creates right-side envelope box.
	var evn3 = document.createElement("div");
	evn3.setAttribute("id","evn3");
	document.getElementById("envBox").appendChild(evn3);
	
	//Displays the created envelope boxes.
	evn1.style.height = BCEngine.evnBoxSize + "px";
	evn2.style.height = BCEngine.evnBoxSize + "px";
	evn3.style.width = (BCEngine.width - (BCEngine.cubeSize*16))+"px";

}

//Initializes the playing area. The playing area holds the player object and the blocks
BCEngine.initPlayArea = function()
{
	//Sets the height of the play area then positioning it.
	BCEngine.playArea = document.getElementById("playBox");
	BCEngine.playArea.style.height = ( BCEngine.cubeSize * 5 ) + "px";
	BCEngine.playArea.style.top = BCEngine.evnBoxSize+"px";
}

//This renders any chunk passed to it to the play area.
BCEngine.renderChunk = function(chunk)
{
	//Clears the play area.
	BCEngine.playArea.innerHTML = "";
	
	//For each row, render every block in it.
	for(var i = 0, len=chunk.length; i < len; i++)
	{
		for(var i2 = 0, len2=chunk[i].length; i2 < len2; i2++)
		{
			//Creates block then displays it
			var block = document.createElement("div");
			BCEngine.playArea.appendChild(block);
			
			//Each block is given the same height and width,
			//Then positioned depending on where the block is in the chunk.
			block.style.width = BCEngine.cubeSize + "px";
			block.style.height = BCEngine.cubeSize + "px";
			block.style.top = ( i * BCEngine.cubeSize ) + "px";	
			block.style.left = ( BCEngine.cubeSize * i2 ) + "px";
			block.style.position = "absolute";
			
			/*
			Each block is given it's unique attributes to be accessed by other parts of the engine.
			horz: The row number of the block. 0-4
			vertz: The vertical number. 0-15
			blockID: The type of block
			*/
			block.setAttribute("horz", i);
			block.setAttribute("vertz", i2);
			block.setAttribute("blockID", chunk[i].substr(i2,1));
			
			
			
			//If the created block should be air, set it's color to light blue
			//then exit the function
			if(chunk[i].substr(i2,1)=="0")
			{
				block.style.background="lightblue"
			}else{
				var accessNum = Number( chunk[i].substr(i2,1) ) - 1;
				
				//Set the strength attribute of the block
				block.setAttribute("strength", BCEngine.objects[ accessNum ].strength);
				
				//If the created block is not air, get the background url from the BCEngine.objects object.
				block.style.background="url(" + BCEngine.objects[ accessNum ].img + ")";
				
				//Then give it the neccessary style attributes.
				block.style.backgroundRepeat="repeat";
				block.style.backgroundSize="100% 100%";
			}
		}
	}

}

//Initialize the player HTML DIV object
BCEngine.initPlayer = function()
{
	//Creates the object then sets it's dimensions and gives it an ID (For use in Style Sheet)
	var playerDiv = document.createElement("div");
	document.getElementById("playBox").appendChild(playerDiv);
	playerDiv.setAttribute("id", "player");
	playerDiv.style.width = BCEngine.cubeSize + "px";
	playerDiv.style.height = ( BCEngine.cubeSize * 2 ) + "px";
	BCEngine.player = document.getElementById("player");
	
	//Start the physics engine, with an interval every 10milliseconds
	setInterval(BCEngine.startPhysics, 10);
}

BCEngine.startPhysics = function()
{	
	//Get the styles of the player HTML DIV
	var playerStyles = window.getComputedStyle(BCEngine.player);
	
	//Get the position of the player DIV
	var playerTop = Number(playerStyles.top.substr(0,playerStyles.top.length-2));
	var playerLeft = Number(playerStyles.left.substr(0,playerStyles.left.length-2));
	
	//playerFoot determines the position of the player's foot vertically (Y-Axis)
	var playerFoot = playerTop + ( BCEngine.cubeSize * 2);
	playerFoot = BCEngine.utils.ceilFoot(playerFoot)-1;
	
	//playerHori determines the position of the player's foot horizontally (X-Axis)
	var playerHori = playerLeft + ( BCEngine.cubeSize * 1 );
	playerHori=BCEngine.utils.ceilHori(playerHori)-1;
	
	//The block the player is stepping on, from it's right "foot" (The lower right hand corner of the player box)
	var playerOn = BCEngine.map.chunk1[playerFoot].substr(playerHori,1);
	//The block the player is stepping on, from it's left "foot" (The lower left hand corner of the player box)
	var playerOn2 = BCEngine.map.chunk1[playerFoot].substr(playerHori-1,1);
	//If player is stepping on air, fall
	if(playerOn=="0" && playerOn2=="0")
	{
		BCEngine.player.style.top=(playerTop+BCEngine.gravity)+"px";
	}
	
	//Move, if
	//The key is down
	//There is nothing blocking the bottom half of the player
	//There is nothing blocking the uppper half of the player
	if(BCEngine.keyPresses.isRight && BCEngine.map.chunk1[playerFoot-1].substr(playerHori,1)==0 && BCEngine.map.chunk1[playerFoot-2].substr(playerHori,1)==0)
	{
		BCEngine.player.style.left=(playerLeft+BCEngine.gravity)+"px"
	}
	if(BCEngine.keyPresses.isLeft && BCEngine.map.chunk1[playerFoot-1].substr(playerHori-1,1)==0 && BCEngine.map.chunk1[playerFoot-2].substr(playerHori-1,1)==0)
	{
		BCEngine.player.style.left=(playerLeft-BCEngine.gravity)+"px"
	}
	if(BCEngine.sliding.isSliding)
	{
		BCEngine.sliding.curSpeed=BCEngine.sliding.curSpeed-0.2;
		if(BCEngine.sliding.curSpeed<1)
		{
			BCEngine.sliding.isSliding=false;
		}else{
			if(BCEngine.sliding.slideDirection=="right" && BCEngine.map.chunk1[playerFoot-1].substr(playerHori,1)==0 && BCEngine.map.chunk1[playerFoot-2].substr(playerHori,1)==0)
			{
				BCEngine.player.style.left=(playerLeft+BCEngine.sliding.curSpeed)+"px";
			}else if(BCEngine.sliding.slideDirection=="left" && BCEngine.map.chunk1[playerFoot-1].substr(playerHori-1,1)==0 && BCEngine.map.chunk1[playerFoot-2].substr(playerHori-1,1)==0)
			{
				BCEngine.player.style.left=(playerLeft-BCEngine.sliding.curSpeed)+"px";
			}else{
				BCEngine.sliding.isSliding=false;
			}
		}
	}
	

}

//Key event handlers set whether the key is down or not in variables BCEngine.isRight and BCEngine.isLeft
BCEngine.eventHandlers.keyDownEvent = function(event)
{
	switch(event.keyCode){
	case 37:
		BCEngine.keyPresses.isLeft=true;
		break;

	case 39:
		BCEngine.keyPresses.isRight=true;
		break;

	default:
		break;
	}
	return false;
}

BCEngine.eventHandlers.keyUpEvent = function(event)
{
	switch(event.keyCode){
	case 37:
		BCEngine.keyPresses.isLeft=false;
		BCEngine.sliding.isSliding=true;
		BCEngine.sliding.curSpeed=3;
		BCEngine.sliding.slideDirection="left";
		break;

	case 39:
		BCEngine.keyPresses.isRight=false;
		BCEngine.sliding.isSliding=true;
		BCEngine.sliding.curSpeed=3;
		BCEngine.sliding.slideDirection="right";
		break;
		
	case 32:
		BCEngine.player.style.top="0px";
		break;
		
	default:
		break;
	}
	return false;
}

BCEngine.removeBlock = function(e)
{
	BCEngine.blockDestruction.lastRunningTimer=null;
	var horz = e.getAttribute("horz");
	var vertz = e.getAttribute("vertz");
	var curChunk = BCEngine.map.chunk1[horz];
	
	var tempChunk = curChunk.substring(0,vertz);
	tempChunk+= "0";
	tempChunk+= curChunk.substring(Number(vertz)+1,curChunk.length);
	BCEngine.map.chunk1[horz]=tempChunk;	
	
	e.setAttribute("blockID", "0");
	e.style.background="lightblue";
	BCEngine.playArea.removeChild(BCEngine.blockDestruction.lastReferredBlock);
	BCEngine.blockDestruction.lastReferredBlock=null;
	return false;
}

//Turns a block into air once clicked
BCEngine.eventHandlers.mouseDownEvent = function(e)
{
	if(e.button==0)
	{
		e = e.target || e.srcElement;
		if(e.getAttribute("horz")==null || BCEngine.blockDestruction.lastReferredBlock!=null || e.getAttribute("blockID")=="0")
		{
			return;
		}
		//Create and set all the crack overlay attributes
		var crackOverlay = document.createElement("div");
		crackOverlay.setAttribute("class", "crack");
		BCEngine.playArea.appendChild(crackOverlay);
		
		var eStyle=window.getComputedStyle(e);
		crackOverlay.style.top = eStyle.top;
		crackOverlay.style.left = eStyle.left;
		crackOverlay.style.width = BCEngine.cubeSize;
		crackOverlay.style.height = BCEngine.cubeSize;
		
		BCEngine.blockDestruction.lastReferredBlock = crackOverlay;
		
		BCEngine.blockDestruction.lastRunningTimer = setTimeout(BCEngine.removeBlock, (Number(e.getAttribute("strength"))*1000), e);
	}
	
}
//Removes the crack images and stops the timer (if destroying block halfway)
BCEngine.eventHandlers.mouseUpEvent = function(e)
{
	if(BCEngine.blockDestruction.lastRunningTimer!=null)
	{
		clearTimeout(BCEngine.blockDestruction.lastRunningTimer);
	}
	if(BCEngine.blockDestruction.lastReferredBlock!=null)
	{
		BCEngine.playArea.removeChild(BCEngine.blockDestruction.lastReferredBlock);
		BCEngine.blockDestruction.lastReferredBlock=null;
	}
	return false;
}
//Place a block depending on BCEngine.currentSelection
BCEngine.eventHandlers.rightClickEvent = function(e)
{
	e = e.target || e.srcElement;
	//Only place if right clicked object is a block and is air.
	if(e.getAttribute("horz")==null || e.getAttribute("blockID")!="0")
	{
		return false;
	}
	var horz = e.getAttribute("horz");
	var vertz = e.getAttribute("vertz");
	var curChunk = BCEngine.map.chunk1[horz];
	
	var tempChunk = curChunk.substring(0,vertz);
	tempChunk+= BCEngine.objects[BCEngine.currentSelection].id;
	tempChunk+= curChunk.substring(Number(vertz)+1,curChunk.length);
	
	BCEngine.map.chunk1[horz]=tempChunk;

	e.setAttribute("blockID", BCEngine.objects[BCEngine.currentSelection].id);
	e.setAttribute("strength", BCEngine.objects[BCEngine.currentSelection].strength);
	e.style.backgroundImage="url("+BCEngine.objects[BCEngine.currentSelection].img+")";
	e.style.backgroundRepeat="repeat";
	e.style.backgroundSize="100% 100%";
	
	return false;
}
//Cycles through the available objects
BCEngine.eventHandlers.scrollEvent = function(e)
{
	//e.wheelDelta used by Google Chrome
	if(e.wheelDelta){
		var delta = e.wheelDelta / 60;
		switch(delta)
		{
		case 2:
			BCEngine.currentSelection+=1;
			if(BCEngine.currentSelection>=BCEngine.objects.length){BCEngine.currentSelection=0}
			document.title=BCEngine.objects[BCEngine.currentSelection].name;
			break;
			
		case -2:
			BCEngine.currentSelection-=1;
			if(BCEngine.currentSelection<=-1){BCEngine.currentSelection=BCEngine.objects.length-1}
			document.title=BCEngine.objects[BCEngine.currentSelection].name;
			break;
			
		}
	}else{
		//e.detail used by FireFox
		var delta = e.detail;
		switch(delta)
		{
		case -3:
			BCEngine.currentSelection+=1;
			if(BCEngine.currentSelection>=BCEngine.objects.length){BCEngine.currentSelection=0}
			document.title=BCEngine.objects[BCEngine.currentSelection].name;
			break;
			
		case 3:
			BCEngine.currentSelection-=1;
			if(BCEngine.currentSelection<=-1){BCEngine.currentSelection=BCEngine.objects.length-1}
			document.title=BCEngine.objects[BCEngine.currentSelection].name;
			break;
			
		}
	}
}
//Runs once page loading is complete
window.onload=function()
{
	//Sets the height, width and cubeSize variables
	BCEngine.height = window.innerHeight;
	BCEngine.width = window.innerWidth;
	BCEngine.cubeSize = Math.floor(BCEngine.width / 16);
	
	//This is here because currently only 1 chunk is playable. In the future, this won't be here and
	//chunks will render automatically.
	BCEngine.map.chunk1 = "0550000000000000 0006000000000000 0006000000000000 4444544444444444 3333333333333333";
	BCEngine.map.chunk1 = BCEngine.map.chunk1.split(" ");
	
	//Runs all the initialization functions and renders the first chunk
	BCEngine.createEnvBoxes();
	BCEngine.initPlayArea();
	BCEngine.renderChunk(BCEngine.map.chunk1);
	BCEngine.initPlayer();
	
	//Sets all the event listeners
	document.onkeydown=BCEngine.eventHandlers.keyDownEvent;
	document.onkeyup=BCEngine.eventHandlers.keyUpEvent;
	document.addEventListener('mousedown', function(e){BCEngine.eventHandlers.mouseDownEvent(e);return false;}, false);
	document.addEventListener('mouseup', BCEngine.eventHandlers.mouseUpEvent, false);
	document.oncontextmenu=BCEngine.eventHandlers.rightClickEvent;
	document.addEventListener('DOMMouseScroll', BCEngine.eventHandlers.scrollEvent, false);
	document.onmousewheel = BCEngine.eventHandlers.scrollEvent;

}

//Calculation Utilites
BCEngine.utils.ceilFoot = function(playerFoot)
{
	var cubeSizes = new Array();
	for(var i = 1;i<=5;i++)
	{
		if( playerFoot == BCEngine.cubeSize*i)
		{
			return playerFoot/BCEngine.cubeSize;
		}
		cubeSizes.push(BCEngine.cubeSize*i);
	}
	var nearest;
	for(var h = 0, len=cubeSizes.length; h < len; h++)
	{
		
		if(playerFoot<cubeSizes[h])
		{
			nearest=cubeSizes[h];
			break;
		}
	}
	return nearest/BCEngine.cubeSize;
}

BCEngine.utils.ceilHori = function(playerFoot)
{
	var cubeSizes = new Array();
	for(var i = 1;i<=16;i++)
	{
		if(playerFoot == BCEngine.cubeSize*i)
		{
			return playerFoot/BCEngine.cubeSize;
		}
		cubeSizes.push(BCEngine.cubeSize*i);
	}
	var nearest;
	for(var h = 0, len=cubeSizes.length; h < len; h++)
	{
		
		if( playerFoot< cubeSizes[h])
		{
			nearest=cubeSizes[h];
			break;
		}
	}
	return nearest/BCEngine.cubeSize;
}
