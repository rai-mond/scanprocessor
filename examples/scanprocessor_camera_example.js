/*****************************************************************************\
                       _________                                      
                      /   _____/ ____ _____    ____                   
                      \_____  \_/ ___\\__  \  /    \                  
                      /        \  \___ / __ \|   |  \                 
                     /_______  /\___  >____  /___|  /                 
                             \/     \/     \/     \/                  
     __________                                                       
     \______   \_______  ____   ____  ____   ______ _________________ 
      |     ___/\_  __ \/  _ \_/ ___\/ __ \ /  ___//  ___/  _ \_  __ \
      |    |     |  | \(  <_> )  \__\  ___/ \___ \ \___ (  <_> )  | \/
      |____|     |__|   \____/ \___  >___  >____  >____  >____/|__|   
                                   \/    \/     \/     \/ 
           
**********************   S C A N   P R O C E S S O R   ************************
*******************************************************************************

  p5.acanprocessor 0.2.01a by Paweł Janicki, 2017-2019
    https://tetoki.eu/scanprocessor | https://paweljanicki.jp

*******************************************************************************

  SCANPROCESSOR by Paweł Janicki is licensed under a Creative Commons
  Attribution-ShareAlike 4.0 International License
  (http://creativecommons.org/licenses/by-sa/4.0/). Based on a work at:
  https://tetoki.eu.

*******************************************************************************

  The Rutt/Etra Scan Processor is a real-time system which electronically
  alters the deflection signals that generate the television raster. Developed
  in the early 1970's in New York by Steve Rutt and Bill Etra, this analog scan
  processor loosely resembled the Scanimate, but was simplified in operation
  and offered at a lower cost. Steve Rutt manufactured the unit, while Bill
  Etra refined the scan processor concept, placing an emphasis on external
  voltage control of the processing modules. It's principle of operation is to
  intercept the sweep signals of a black and white video monitor and modulate
  these signals with analog control voltages. The voltage control directly
  modifies the sweep waveforms and is more predictable than other magnetic
  versions such as gluing or winding additional yokes onto the necks of black
  and white monitors. Images are "re-scanned" by avideo camera facing the
  modulated display monitor for combination with other video signals and
  final recording to video tape.

  The Rutt/Etra Scan Processor was widely used by artists (eg. Steina & Woody
  Vasulka created their classic "Scan Processor Studies" (1978) - a series of
  experiments based on the possibilities and unique features of the device.

  The specific nature of the image obtained with the device (the image was
  often converted to a 3D-looking form consisting of pleated lines with
  horizontal orientation) has been recognized so far, and the device has been
  subjected to a whole range of expansions and emulations also in the digital
  domain. In addition, some modern techniques of 3D image generation (eg. bump
  mapping) use similar concepts (using texture content to move the vertices of
  objects apparently).

  This library re-emphasize the basic aesthetics of the original Rutt/Etra Scan
  Processor, adding some possibilities and variations possible in the digital
  environment.

\*****************************************************************************/

/*
  Video capture device.
*/
var myCapture

/*
  This object (p5.Graphics) will serve as a label with information about the
  currently selected drawing mode.
*/
var label;

/*
  Yet another p5.Graphics object, which mediate between the camera and the
  ScanProcessor library - the use of this buffer results from the need to avoid
  the instability of some web browsers when working with the camera image (you
  can try to re-write the code so that you do not use this buffer if your
  browser works steadily when using "raw" camera image as a texture together
  with WEBGL).
*/
var gfx;

/*
  The object that will be responsible for generating "Scan Processor"-like
  graphics. The object will be derived from the ScanProcessor pseudo-class from
  the p5.scanprocessor library, so remember to add the p5.scanprocessor library
  to the project in the appropriate html file.
*/
var myScanProcessor;

/*
  This variable will store an array of vertices obtained after image conversion.
*/
var mesh;

/*
  The library contains several procedures for drawing the vertex array. The
  "style" variable will be used to switch between the built-in procedures and
  their combinations.
*/
var style;

/*
  This variable stores the value of the grid extrusion in the Z-axis. Depending
  on whether the given value is positive or negative, the grid will be pushed
  towards the camera or into the 3D space.
*/
var warp = -150;

/*
  Helper variables which will be used to keep compatibility with some devices
  equipped with a touchscreen.
*/
var touchStartTimetag = 0; var tapLag = 200;

/*
  A pair of variables to store current rotation.
*/
var rx = 0.0; var ry = 0.0;

/*
  In addition to the standard mechanisms of detection of mobile platforms built
  into p5js, we will use additional ones.
*/
var touchScreenDeviceFlag = false;

/*
  In addition to the standard mechanisms of framerate detection built into p5js,
  we will use additional ones. This will allow you to slightly improve click/tap
  support.
*/
var altPrevFrameTimetag = 0; var altFrameDuration = 0;

/*
  A simple touch screen detection mechanism.
*/
function detectTouchScreen() {
  return !!('ontouchstart' in window) || (!!('onmsgesturechange' in window) &&
  !!window.navigator.maxTouchPoints);
}

/*
  Here we are trying to get access to the camera.
*/
function initCaptureDevice() {
  try {
    myCapture = createCapture(VIDEO);
    myCapture.size(320, 240);
    myCapture.elt.setAttribute('playsinline', '');
    myCapture.hide();
    console.log(
      '[initCaptureDevice] capture ready. Resolution: ' +
      myCapture.width + ' ' + myCapture.height
    );
  } catch(_err) {
    console.log('[initCaptureDevice] capture error: ' + _err);
  }
}

function setup() {
  createCanvas(640, 480, WEBGL); // we need some space...
  initCaptureDevice(); // and access to the camera
  /*
    Check if device is equipped with touchscreen.
  */
  touchScreenDeviceFlag = detectTouchScreen();
  /*
    Now a little hack to disable depth testing (we want to draw the label
    "over" the mesh).
  */
  var gl = document.getElementById('defaultCanvas0').getContext('webgl');
  gl.disable(gl.DEPTH_TEST); 
  /*
    Here we are creating the label and gfx.
  */
  label = createGraphics(150, 20);
  gfx = createGraphics(160, 120); gfx.pixelDensity(1);
  /*
    Here we create an object derived from the ScanProcessor pseudo-class from
    the p5.scanprocessor library. We do not have to give the constructor any
    parameters.
  */
  myScanProcessor = new ScanProcessor();
  /*
    We initiate variable "style" with one of the pseudo-constants included in
    the ScanProcessor class. Some of handled styles (HORIZONTAL_LINES,
    VERTICAL_LINES, GRID, HORIZONTAL_CURVES, VERTICAL_CURVES) are simply
    internal pseudo-constant values of the ScanProcessor class. You can also
    use a texture (because the ScanProcessor.draw method accepts the graphic
    object (anything with "pixels" property) as a parameter instead of one of
    the pseudo-constants) - see setNextDrawingStyle() and draw() functions for
    details.
  */
  style = myScanProcessor.HORIZONTAL_LINES;
  setLabel('HORIZONTAL_LINES');
  /*
    Finally we set the framerate.
  */
  frameRate(30);
}

function draw() {
  if(myCapture !== null && myCapture !== undefined) { // safety first
    background(0);
    /*
      At this point, we create a grid of vertices on the basis of the camera
      image. We can call the "convert" function with one parameter (graphics to
      convert - then the size of the net result obtained as a result of the
      function will be equal to the resolution of the converted image) or with
      three parameters: then the first parameter is the graphic to be converted,
      and the second and third are the width and height of the grid to which the
      image will be converted. We will use the version with three parameters to
      reduce the image resolution and thus reduce the demand for computing power.
      The convert function produces an array of vertices based on the converted
      graphics. The array is three-dimensional, but it's best to treat it as a
      two-dimensional array holding coordinates of vertices in three-dimensional
      space. The structure of the array looks as follows:
        arr[pix_x_coord][pix_y_coord][vertex_x, vertex_y, vertex_z]
        pix_x_coord, pix_y_coord - coordinates corresponding to the position of
        the pixel in the converted image;
        vertex_x, vertex_y, vertex_z - normalized (in the range from 0.0 to 1.0)
        values of the coordinate values of the vertex
    */
    myCapture.loadPixels();
    gfx.image(
      myCapture,
      0, 0, gfx.width, gfx.height,
      0, 0, myCapture.width, myCapture.height
    );
    mesh = myScanProcessor.convert(gfx, gfx.width / 3, gfx.height / 3);
    push();
      /*
        If we have not detected the touchscreen, we will use the mouse cursor
        position to rotate the mesh.
      */
      if(!touchScreenDeviceFlag) setRotation(mouseX, mouseY);
      rotateX(rx); rotateY(ry);
      /*
        Depending on the selected drawing style, we start one or two drawing
        procedures built into the ScanProcessor class. Access to all drawing
        procedures is done using the [ScanProcessor instance].draw function and
        it's parameters:
        [ScanProcessor instance].draw(mesh, destination, mode, x, y, z, w, h, d)
          mesh - mesh to draw, usually an array obtained thanks to the
          [ScanProcessor instance].convert function;
          destination - a destination WEBGL-based canvas;
          mode - drawing mode, you can choose between the following modes (names
          are self-explanatory):
            * [ScanProcessor instance].HORIZONTAL_LINES
            * [ScanProcessor instance].VERTICAL_LINES
            * [ScanProcessor instance].GRID
            * [ScanProcessor instance].HORIZONTAL_CURVES
            * [ScanProcessor instance].VERTICAL_CURVES
            * instead of one of the pseudo-constant you can use the "mode" 
            * parameter to pass a texture object to the [ScanProcessor
              instance].draw function;
          x, y, z - location of the center of the mesh;
          w, h, d - width, height and depth of the mesh.
      */
      switch(style) {
        case 'texture':
          fill(255); noStroke();
          myScanProcessor.draw(
            mesh, this, gfx,
            0, 0, 0, width, height, warp
          );
        break;
        case myScanProcessor.HORIZONTAL_LINES:
          stroke(255); fill(255);
          myScanProcessor.draw(
            mesh, this, myScanProcessor.HORIZONTAL_LINES,
            0, 0, 0, width, height, warp
          );
        break;
        case myScanProcessor.VERTICAL_LINES:
          stroke(255); fill(255);
          myScanProcessor.draw(
            mesh, this, myScanProcessor.VERTICAL_LINES,
            0, 0, 0, width, height, warp
          );
        break;
        case myScanProcessor.GRID:
          stroke(255); fill(255);
          myScanProcessor.draw(
            mesh, this, myScanProcessor.GRID,
            0, 0, 0, width, height, warp
          );
        break;
        case 'texture_and_grid':
          fill(255); noStroke();
          myScanProcessor.draw(
            mesh, this, gfx,
            0, 0, 0, width, height, warp
          );
          stroke(255); fill(255);
          myScanProcessor.draw(
            mesh, this, myScanProcessor.GRID,
            0, 0, 0, width, height, warp
          );
        break;
        case myScanProcessor.HORIZONTAL_CURVES:
          stroke(255); fill(255);
          myScanProcessor.draw(
            mesh, this, myScanProcessor.HORIZONTAL_CURVES,
            0, 0, 0, width, height, warp
          );
        break;
        case myScanProcessor.VERTICAL_CURVES:
          stroke(255); fill(255);
          myScanProcessor.draw(
            mesh, this, myScanProcessor.VERTICAL_CURVES,
            0, 0, 0, width, height, warp
          );
        break;
        default: console.log('unhandled drawing style: ' + style);
      }
    pop();
    /*
      At the end of the draw loop we will display a label indicating which
      display mode we have selected.
    */
    texture(label);
    rect(-width/2, -height/2, label.width, label.height);
  }
  else {
    /*
      If there are problems with the capture device (it's a simple mechanism so
      not every problem with the camera will be detected, but it's better than
      nothing) we will change the background color to alarmistically red.
    */
    background(255, 0, 0);
  }
  /*
    Here we update the values responsible for the alternative mechanism of
    clicks/taps detection.
  */
  altFrameDuration = millis() - altPrevFrameTimetag;
  altPrevFrameTimetag = millis();
}

/*
  A helper function that calculates rotation.
*/
function setRotation(_x, _y) {
  rx = map(_y, 0, height, -PI * 0.125, PI * 0.125);
  ry = map(_x, 0, width,  -PI * 0.125, PI * 0.125);
}

/*
  By clicking / tap we will change the drawing mode.
*/
function touchStarted() {touchStartTimetag = millis(); return false;}
function touchEnded() {
  if(millis() - touchStartTimetag < tapLag || altFrameDuration > tapLag)
    setNextDrawingStyle();
  return false;
}
/*
  Moving your finger or cursor over the screen, we can change the rotation of
  the displayed grid.
*/
function touchMoved() {
  setRotation(mouseX, mouseY);
  return false;
}

function setNextDrawingStyle() {
  if(style === myScanProcessor.HORIZONTAL_LINES) {
    style = myScanProcessor.VERTICAL_LINES;
    setLabel('VERTICAL_LINES');
    return;
  }
  if(style === myScanProcessor.VERTICAL_LINES) {
    style = myScanProcessor.GRID;
    setLabel('GRID');
    return;
  }
  if(style === myScanProcessor.GRID) {
    style = 'texture';
    setLabel('texture');
    return;
  }
  if(style === 'texture') {
    style = 'texture_and_grid';
    setLabel('texture_and_grid');
    return;
  }
  if(style === 'texture_and_grid') {
    style = myScanProcessor.HORIZONTAL_CURVES;
    setLabel('HORIZONTAL_CURVES');
    return;
  }
  if(style === myScanProcessor.HORIZONTAL_CURVES) {
    style = myScanProcessor.VERTICAL_CURVES;
    setLabel('VERTICAL_CURVES');
    return;
  }
  style = myScanProcessor.HORIZONTAL_LINES;
  setLabel('HORIZONTAL_LINES');
}

/*
  Simple helper function facilitating the use of the label object.
*/
function setLabel(_str) {
  label.background(255);
  label.textAlign(CENTER, CENTER);
  label.noStroke();
  label.fill(0);
  label.text(_str, label.width/2, label.height/2);
}