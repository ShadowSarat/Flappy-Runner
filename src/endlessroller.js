
window.addEventListener('load', init, false);
alert("Press up arrow to jump, you have 3 lives");

var lives=200;

var sceneWidth;

var sceneHeight;

var camera;

var scene;

var renderer;

var dom;

var sun;

var ground;

var orbitControl;

var rollingGroundSphere;

var heroSphere;

var rollingSpeed=0.004;

var heroRollingSpeed;

var worldRadius=26;

var heroRadius=0.2;

var sphericalHelper;

var pathAngleValues;

var heroBaseY=2;

var bounceValue=0.2;

var gravity=0.003;

var middleLane=0;

var currentLane;

var clock;

var jumping;

var pipeReleaseInterval=0.5;

var lastTreeReleaseTime=0;

var pipesInPath;

var pipesPool;

var particleGeometry;

var particleCount=20;

var explosionPower =1.06;

var particles;

var stats;

var scoreText;

var score;

var hasCollided;


function init() {
	createScene();
	update();
}

function createScene(){
	hasCollided=false;
	score=0;
	pipesInPath=[];
	pipesPool=[];
	clock=new THREE.Clock();
	clock.start();
	heroRollingSpeed=(rollingSpeed*worldRadius/heroRadius)/5;
	sphericalHelper = new THREE.Spherical();
	pathAngleValues=[1.52,1.57,1.62];
    sceneWidth=window.innerWidth;
    sceneHeight=window.innerHeight;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xf0fff0, 0.1 );
    camera = new THREE.PerspectiveCamera( 60, sceneWidth / sceneHeight, 0.1, 1000 );
    renderer = new THREE.WebGLRenderer({alpha:true});
    renderer.setClearColor(0xfffafa, 1); 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( sceneWidth, sceneHeight );
    dom = document.getElementById('TutContainer');
	dom.appendChild(renderer.domElement);
	stats = new Stats();
	dom.appendChild(stats.dom);
	createTreesPool();
	addWorld();
	addHero();
	addLight();
	addExplosion();
	
	camera.position.z = 12.5;
	camera.position.y = 4.5;
	orbitControl = new THREE.OrbitControls( camera, renderer.domElement );
	orbitControl.addEventListener( 'change', render );
	orbitControl.noKeys = true;
	orbitControl.noPan = true;
	orbitControl.enableZoom = true;
	orbitControl.minDistance = 8;
	orbitControl.maxDistance = 10;
	orbitControl.minPolarAngle = 1.1;
	orbitControl.maxPolarAngle = 1.1;
	orbitControl.minAzimuthAngle = -0.2;
	orbitControl.maxAzimuthAngle = 0.2;
	
	window.addEventListener('resize', onWindowResize, false);

	document.onkeydown = handleKeyDown;
	
	scoreText = document.createElement('div');
	scoreText.style.position = 'absolute';
	scoreText.style.width = 100;
	scoreText.style.height = 100;

	scoreText.innerHTML = "0";
	scoreText.style.top = 10 + 'px';
	scoreText.style.left = 100 + 'px';
	document.body.appendChild(scoreText);
}
function addExplosion(){
	particleGeometry = new THREE.Geometry();
	for (var i = 0; i < particleCount; i ++ ) {
		var vertex = new THREE.Vector3();
		particleGeometry.vertices.push( vertex );
	}
	var pMaterial = new THREE.ParticleBasicMaterial({
	  color: 0xfffafa,
	  size: 0.2
	});
	particles = new THREE.Points( particleGeometry, pMaterial );
	scene.add( particles );
	particles.visible=false;
}
function createTreesPool(){
	var maxTreesInPool=10;
	var newTree;
	for(var i=0; i<maxTreesInPool;i++){
		newTree=createTree();
		pipesPool.push(newTree);
	}
}
function handleKeyDown(keyEvent){
	var validMove=true;

	if ( keyEvent.keyCode === 38){
		bounceValue=0.1;
		jumping=true;
	}
		validMove=false;
	
	if(validMove){
		jumping=true;
		bounceValue=0.06;
	}
}
function addHero(){
	var sphereGeometry = new THREE.SphereGeometry( heroRadius, 20, 10 );
	var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xe5f2f2 ,shading:THREE.FlatShading} )
	jumping=false;
	heroSphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
	heroSphere.receiveShadow = true;
	heroSphere.castShadow=true;
	scene.add( heroSphere );
	heroSphere.position.y=heroBaseY;
	heroSphere.position.z=4.8;
	currentLane=middleLane;
	heroSphere.position.x=currentLane;
}
function addWorld(){
	var sides=40;
	var tiers=40;
	var sphereGeometry = new THREE.CylinderGeometry( worldRadius,worldRadius, sides,tiers);
	var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0x303030 ,shading:THREE.FlatShading} )

	rollingGroundSphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
	rollingGroundSphere.receiveShadow = true;
	rollingGroundSphere.castShadow=false;
	rollingGroundSphere.rotation.z=-Math.PI/2;
	scene.add( rollingGroundSphere );
	rollingGroundSphere.position.y=-24;
	rollingGroundSphere.position.z=2;
	addWorldTrees();
}
function addLight(){
	var hemisphereLight = new THREE.HemisphereLight(0xfffafa,0x000000, .9)
	scene.add(hemisphereLight);
	sun = new THREE.DirectionalLight( 0xcdc1c5, 0.9);
	sun.position.set( 12,6,-7 );
	sun.castShadow = true;
	scene.add(sun);
	sun.shadow.mapSize.width = 256;
	sun.shadow.mapSize.height = 256;
	sun.shadow.camera.near = 0.5;
	sun.shadow.camera.far = 50 ;
}
function addPathTree(){
	var options=[1];
	var lane= Math.floor(Math.random()*3);
	lane=1;
	addTree(true,lane);
	
}
function addWorldTrees(){
	var numTrees=36;
	var gap=6.28/36;
	for(var i=0;i<numTrees;i++){
		addTree(false,i*gap, true);
		addTree(false,i*gap, false);
	}
}
function addTree(inPath, row, isLeft){
	var newTree;
	if(inPath){
		if(pipesPool.length==0)return;
		newTree=pipesPool.pop();
		newTree.visible=true;
		pipesInPath.push(newTree);
		sphericalHelper.set( worldRadius-0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x+4 );
	}else{
		newTree=createTree();
		var forestAreaAngle=0;
		if(isLeft){
			forestAreaAngle=1.68+Math.random()*0.1;
		}else{
			forestAreaAngle=1.46-Math.random()*0.1;
		}
		sphericalHelper.set( worldRadius-0.3, forestAreaAngle, row );
	}
	newTree.position.setFromSpherical( sphericalHelper );
	var rollingGroundVector=rollingGroundSphere.position.clone().normalize();
	var pipeVector=newTree.position.clone().normalize();
	newTree.quaternion.setFromUnitVectors(pipeVector,rollingGroundVector);
	newTree.rotation.x+=(Math.random()*(2*Math.PI/10))+-Math.PI/10;
	
	rollingGroundSphere.add(newTree);
}
function createTree(){
	var midPointVector= new THREE.Vector3();
	var pipeGeometry = new THREE.CylinderGeometry( 0.5, 0.5,1.5+Math.random());
	var pipeMaterial = new THREE.MeshStandardMaterial( { color: 0x33ff33,shading:THREE.FlatShading  } );
	midPointVector=pipeGeometry.vertices[0].clone();
	var pipeTop = new THREE.Mesh( pipeGeometry, pipeMaterial );
	pipeTop.castShadow=true;
	pipeTop.receiveShadow=false;
	pipeTop.position.y=2.8+Math.random();
	pipeTop.rotation.y=(Math.random()*(Math.PI));
	var pipeTrunkGeometry = new THREE.CylinderGeometry( 0.5, 0.5,1+Math.random());
	var trunkMaterial = new THREE.MeshStandardMaterial( { color: 0x886633,shading:THREE.FlatShading  } );
	var pipeTrunk = new THREE.Mesh( pipeTrunkGeometry, trunkMaterial );
	pipeTrunk.position.y=0.35;
	var pipe =new THREE.Object3D();
	pipe.add(pipeTrunk);
	pipe.add(pipeTop);
	return pipe;
}
function update(){
	stats.update();
    //animate
    rollingGroundSphere.rotation.x += rollingSpeed;
    heroSphere.rotation.x -= heroRollingSpeed;
    if(heroSphere.position.y<=heroBaseY){
    	jumping=false;
    	bounceValue=(Math.random()*0.04)+0.005;
    }
    heroSphere.position.y+=bounceValue;
    heroSphere.position.x=THREE.Math.lerp(heroSphere.position.x,currentLane, 2*clock.getDelta());
    bounceValue-=gravity;
    if(clock.getElapsedTime()>pipeReleaseInterval){
    	clock.start();
    	addPathTree();
    	if(!hasCollided){
			score+=2*pipeReleaseInterval;
			scoreText.innerHTML=score.toString();
		}
    }
    doTreeLogic();
    doExplosionLogic();
    render();
	requestAnimationFrame(update);
}
function doTreeLogic(){
	var oneTree;
	var pipePos = new THREE.Vector3();
	var pipesToRemove=[];
	pipesInPath.forEach( function ( element, index ) {
		oneTree=pipesInPath[ index ];
		pipePos.setFromMatrixPosition( oneTree.matrixWorld );
		if(pipePos.z>6 &&oneTree.visible){
			pipesToRemove.push(oneTree);
		}else{//check collision
			if(pipePos.distanceTo(heroSphere.position)<=0.6){
				console.log("hit");
				hasCollided=true;
					
				explode();
				
			}
		}
	});
	var fromWhere;
	pipesToRemove.forEach( function ( element, index ) {
		oneTree=pipesToRemove[ index ];
		fromWhere=pipesInPath.indexOf(oneTree);
		pipesInPath.splice(fromWhere,1);
		pipesPool.push(oneTree);
		oneTree.visible=false;
		console.log("remove pipe");
	});
}
function doExplosionLogic(){
	if(!particles.visible)return;
	for (var i = 0; i < particleCount; i ++ ) {
		particleGeometry.vertices[i].multiplyScalar(explosionPower);
	}
	if(explosionPower>1.005){
		explosionPower-=0.001;
	}else{
		particles.visible=false;
		
	}
	particleGeometry.verticesNeedUpdate = true;
	lives=lives-1;
				if (lives < 1) { 
					gameOver();
					}
}
function explode(){
	particles.position.y=2;
	particles.position.z=4.8;
	particles.position.x=heroSphere.position.x;
	for (var i = 0; i < particleCount; i ++ ) {
		var vertex = new THREE.Vector3();
		vertex.x = -0.2+Math.random() * 0.4;
		vertex.y = -0.2+Math.random() * 0.4 ;
		vertex.z = -0.2+Math.random() * 0.4;
		particleGeometry.vertices[i]=vertex;
	}
	explosionPower=1.07;
	particles.visible=true;
	
}
function render(){
    renderer.render(scene, camera);
}
function gameOver () {
	alert("Game Over!");
}
function onWindowResize() {
	sceneHeight = window.innerHeight;
	sceneWidth = window.innerWidth;
	renderer.setSize(sceneWidth, sceneHeight);
	camera.aspect = sceneWidth/sceneHeight;
	camera.updateProjectionMatrix();
}
