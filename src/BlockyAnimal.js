var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE =
  `precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

//Globals
  let canvas;
  let gl;
  let a_Position;
  let u_FragColor;
  let u_Size;
  let u_ModelMatrix; 
  let u_GlobalRotateMatrix;
  
  function setupGLContext() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl', { preserveDrawingBuffer: true });
  
    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

  }

  function connectVariablesToGLSL() {
  
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    //Set an initial value for this matrix to identity
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  }

  //Constants
  const POINT = 0;
  const TRIANGLE = 1;
  const CIRCLE = 2;

  //Globals related to UI elements 
  let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
  let g_selectedSize=5;
  let g_selectedType=POINT;
  let g_selectedSegments=10;
  let g_globalAngle;
  let g_xRotate=0;
  let g_yRotate=0;
  let g_armAngle=0;
  let g_rarmAngle=0;
  let g_larmAngle=0;
  let g_animation=false;
  let g_moveSpeed=3;
  
  //Add actions for HTML UI
  function addHTMLActions() {

    //Button Events (Shape Type)
    document.getElementById('clear').onclick =function() { renderScene(); };
    document.getElementById('animateButton').onclick = function() { g_animation=true; updateAnimationAngles(); };
    document.getElementById('animateOffButton').onclick = function() { g_animation=false; };

    //Slide Events 
    document.getElementById('armsSlide').addEventListener('mousemove', function() { g_larmAngle, g_rarmAngle = this.value; renderScene(); });
    document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderScene(); });
    document.getElementById('xRotateSlide').addEventListener('mousemove', function() { g_xRotate = this.value; renderScene(); });
    document.getElementById('yRotateSlide').addEventListener('mousemove', function() { g_yRotate = this.value; renderScene(); })
    document.getElementById('moveSpeedSlide').addEventListener('mousemove', function() { g_moveSpeed = this.value; renderScene(); })
  }

  function main() {
  
    setupGLContext();
    connectVariablesToGLSL();
    addHTMLActions();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;

  canvas.onmousemove = function(ev) { if(ev.buttons==1) { click(ev) }};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.6, 0.6, .6, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Render
  renderScene();

  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;

  renderScene();

  requestAnimationFrame(tick);
}

function click(ev) {

  let [x, y] = convertCoordinatesEventtoGL(ev);
    
  renderScene();

}

function convertCoordinatesEventtoGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
  
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);  

    return ([x, y]);
  }

function updateAnimationAngles() {
    if (g_animation) {
        // Oscillate the right arm angle based on the current time
        g_rarmAngle = 45 * Math.sin(g_seconds * g_moveSpeed/8);

        // Add a constant phase shift for the left arm, e.g., 0.5 seconds
        const phaseShift = 0.5;  // This value can be adjusted for more or less delay
        g_larmAngle = 45 * Math.sin((g_seconds + phaseShift)/8 * g_moveSpeed);
    }
}

function renderScene() {

  //Check the time at the start of this function
  var startTime = performance.now();

  //Pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
  globalRotMat.rotate(g_xRotate,1,0,0);
  globalRotMat.rotate(g_yRotate,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Draw the body cube
  var body = new Cube();
  body.color = [0.2,0.2,.2,1.0];
  body.matrix.translate(-.23, -.05, 0);
  // body.matrix.rotate(190, 0, 1, 1);
  body.matrix.scale(0.3, 0.4, 0.15);
  // body.matrix.scale(0.5,1,.5);
  body.render();

  //Head
  var head = new Cube();
  head.color = [.2,.2,.2,1.0];
  head.matrix.translate(-.23, .35, -.07);
  head.matrix.scale(0.3, 0.3, 0.3);
  head.render();

  //Legs
  var lleg = new Cube();
  lleg.color = [.2,.2,.2,1.0];
  lleg.matrix.translate(-.2, -.95, .03);
  lleg.matrix.scale(0.07, .9, 0.07);
  lleg.render();

  var rleg = new Cube();
  rleg.color = [.2,.2,.2,1.0];
  rleg.matrix.translate(-0.05, -.95, .03);
  rleg.matrix.scale(0.07, .9, 0.07);
  rleg.render();

  //Arms
  var rarm = new Cube();
  rarm.color = [0.2,.2,.2,1.0];
  rarm.matrix.translate(0.12, -0.3, .05);
  rarm.matrix.rotate(5, 0, 0, 1);
  rarm.matrix.scale(0.06, .6, 0.06);
  rarm.render();

  var rfarm = new Cube();
  rfarm.color = [0.2,.2,.2,1.0];
  rfarm.matrix.translate(0.12, -0.29, .11);
  rfarm.matrix.rotate(180,1,0,0);
  // if (g_animation) {
  //   rfarm.matrix.rotate(315*Math.sin((g_seconds+ 3)*g_moveSpeed)/8, 1, 0, 0);
  // }
  // else {
  //   rfarm.matrix.rotate(g_armAngle, 1, 0,0);
  // }
  rfarm.matrix.rotate(g_rarmAngle, 1,0,0);
  rfarm.matrix.rotate(5, 0, 0, 1);
  rfarm.matrix.scale(0.06, .4, 0.06);
  rfarm.render();

  var larm = new Cube();
  larm.color = [.2,.2,.2,1.0];
  larm.matrix.translate(-.33, -.3, 0.05);
  larm.matrix.rotate(-5, 0, 0, 1);
  larm.matrix.scale(.06, .6, .06);
  larm.render();


  var lfarm = new Cube();
  lfarm.color = [0.2,.2,.2,1.0];
  lfarm.matrix.translate(-.33, -0.29, 0.11);
  lfarm.matrix.rotate(180,1,0,0);
  // if (g_animation) {
  //   lfarm.matrix.rotate(315*Math.sin(g_seconds*g_moveSpeed)/8, 1, 0,0);
  // }
  // else {
  //   lfarm.matrix.rotate(g_armAngle, 1, 0,0);
  // }
  lfarm.matrix.rotate(g_larmAngle, 1, 0, 0);
  lfarm.matrix.rotate(-5, 0, 0, 1);
  lfarm.matrix.scale(0.06, .4, 0.06);
  lfarm.render();

  var leye = new Cube();
  leye.color = [.718,.431,.768,0.8];
  leye.matrix.translate(-0.2, .5, -.08);
  leye.matrix.scale(0.08, .04, 0.08);
  leye.render();

  var liris = new Cube();
  liris.color = [.718,.431,.768,1];
  liris.matrix.translate(-0.18,.5,-.09);
  liris.matrix.scale(0.04,0.04,0.08);
  liris.render();

  var reye = new Cube();
  reye.color = [.718,.431,.768,0.8];
  reye.matrix.translate(-.05, .5, -.08);
  reye.matrix.scale(0.08, .04, 0.08);
  reye.render();

  var riris = new Cube();
  riris.color = [.718,.431,.768,1];
  riris.matrix.translate(-0.03,.5,-.09);
  riris.matrix.scale(0.04,0.04,0.08);
  riris.render();

  //Check the time at the end fo the function, and show on console
  var duration = performance.now() - startTime;
  console.log( " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration));

}

