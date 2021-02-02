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
  modulated display monitor for combina- tion with other video signals and
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
  Main AsciiArt pseudoclass.
*/
p5.prototype.ScanProcessor = function() {

  /*
    Pseudo-constans defining drawing modes. The mode names are rather self
    explanatory. The modes are used to control the ScanProcessor.draw()
    function. 
  */
  this.HORIZONTAL_LINES             = 0;
  this.VERTICAL_LINES               = 1;
  this.GRID                         = 2;
  this.HORIZONTAL_CURVES            = 3;
  this.VERTICAL_CURVES              = 4;

  /*
    Something that should be useful in the future. In addition to the basic
    image conversion mode in the style of the classic Scan Processor, it will
    be possible to supplement the library with other mechanisms (eg RGB-> XYZ).
  */
  this.RELIEF                       = 0;
  this.RGBXYZ                       = 1;
  this.mode                         = this.RELIEF;

  /*
    "Private" instance of the p5.Graphics. This will be the main graphic buffer
    that stores the image being converted.
  */
  this.__graphics = createGraphics(10, 10);

  /*
    If this flag is set to "true". AsciiArt will call loadPixels and
    updatePixels functions for processed images. It's a "private" variable.
  */
  this.__automaticPixelsDataTransferFlag = true;
}

// p5js bug (?) workaround
p5.prototype.ScanProcessor.prototype.resizeGraphicsWorkaround = function(_g, _w, _h) {
  if(_g === null || _g === undefined) {
    _g = createGraphics(_w, _h);
    _g.pixelDensity(1);
  }
  else {
    _g.width = _w;
    _g.height = _h;
    _g.elt.width = _w;// * this._pInst._pixelDensity;
    _g.elt.height = _h;// * this._pInst._pixelDensity;
    _g.elt.style.width = _w + 'px';
    _g.elt.style.height = _h + 'px';
    /*
    if (this._isMainCanvas) {
      this._pInst._setProperty('width', this.width);
      this._pInst._setProperty('height', this.height);
    }*/
    //_g.remove();
    //_g = null;
    //_g = createGraphics(_w, _h); // ugly!
    //_g.width = _w; _g.height = _h;
    //_g.size(_w, _h);
    //_g.elt.setAttribute('style', 'width:' + _w + 'px; height:' + _h + 'px');
    //_g.elt.style.width = _w +'px'; _g.elt.style.height = _h + 'px';
    //_g.resize(_w, _h);
    _g.pixelDensity(1);
    _g.loadPixels(); // console.log(_g.width);
    //_g.elt.style.width = _w +'px'; _g.elt.style.height = _h + 'px';
    _g.elt.setAttribute('style', 'display: none');
  }
  _g.updatePixels();
  _g.background(0);
  _g.loadPixels();
  if(_w * _h !== _g.pixels.length / 4) {
    console.log(
      '[ScanProcessor, resizeGraphicsWorkaround] _w * _h !== _g.pixels.length / 4:' +
      '\n_w = ' + _w + ' _h = ' + _h +
      '\n_g.width = ' + _g.width + ' _g.height = ' + _g.height +
      '\n_w * _h = ' + (_w * _h) +
      '\n_g.pixels.length / 4 = ' + (_g.pixels.length / 4)
    );
  }
}

// helper function creating 2-dimentional arrays
p5.prototype.ScanProcessor.prototype.createArray2d = function(_w, _h) {
  var temp_arr = [];
  for(var temp_x = 0; temp_x < _w; temp_x++) {
    var temp_column = [];
    for(var temp_y = 0; temp_y < _h; temp_y++) temp_column[temp_y] = 0;
    temp_arr[temp_x] = temp_column;
  }
  return temp_arr;
}

/*
  A simple function to help us draw meshes on the screen. The function
  draws a two-dimensional array of points and it is used similarly to the
  standard method of diplaying images. It can be used in versions with 3, 5 or
  7 parameters. When using the version with 3 parameters, the function assumes
  that the width and height of the drawed image is equal to the width and
  height of the working space (that's mean: equal to the _dst size) and it
  starts drawing from upper left corner (coords: 0, 0). When using the version
  with 5 parameters, the function assumes that the width and height of the
  drawed image is equal to the width and height of the working space (that's
  mean: equal to the _dst size). _arr2d is the two-dimensional array of points,
  _dst is destinetion. _mode parameter takes values of one of pseudo-constants
  defined in the ScanProcessor constructor and distinguishing different drawing
  modes. Instead of one of the pseudo-constants, you can also pass the function
  object p5.Image, p5.Graphics (or other object with "pixels" property) as a
  texture that will be superimposed on the generated mesh.
*/
p5.prototype.ScanProcessor.prototype.draw = function(
  _arr2d, _dst, _mode, _x, _y, _z, _w, _h, _d
) {
  if(_arr2d === null) {
    console.log('[ScanProcessor, mesh] _arr2d === null');
    return;
  }
  if(_arr2d === undefined) {
    console.log('[ScanProcessor, mesh] _arr2d === undefined');
    return;
  }
  if(_mode.hasOwnProperty('width')) {
    this.__draw_texture(
      _arr2d, _dst, _mode, _x, _y, _z, _w, _h, _d
    );
  }
  else {
    switch(_mode) {
      case this.HORIZONTAL_LINES:
        this.__draw_horizontal_lines(
          _arr2d, _dst, _x, _y, _z, _w, _h, _d
        );
      break;
      case this.VERTICAL_LINES:
        this.__draw_vertical_lines(
          _arr2d, _dst, _x, _y, _z, _w, _h, _d
        );
      break;
      case this.GRID:
        this.__draw_horizontal_lines(
          _arr2d, _dst, _x, _y, _z, _w, _h, _d
        );
        this.__draw_vertical_lines(
          _arr2d, _dst, _x, _y, _z, _w, _h, _d
        );
      break;
      case this.HORIZONTAL_CURVES:
        this.__draw_horizontal_curves(
          _arr2d, _dst, _x, _y, _z, _w, _h, _d
        );
      break;
      case this.VERTICAL_CURVES:
        this.__draw_vertical_curves(
          _arr2d, _dst, _x, _y, _z, _w, _h, _d
        );
      break;
      default:
        console.log(
          '[ScanProcessor, mesh] unhandled _mode value: ' + _mode
        );
    }
  }
}

/*
  Function that draws the calculated mesh as a warped surface with texture.
*/
p5.prototype.ScanProcessor.prototype.__draw_texture = function(
  _arr2d, _dst, _tex, _x, _y, _z, _w, _h, _d
) {
  var temp_n_x = _arr2d.length - 1;
  var temp_n_y = _arr2d[0].length - 1;
  _dst.push();
    //_dst.noStroke();
    _dst.texture(_tex);
    _dst.textureMode(NORMAL);
    _dst.translate(_x - 0.5 * _w, _y - 0.5 * _h, _z);
    for(var temp_y = 0; temp_y < temp_n_y; temp_y++) {
      for(var temp_x = 0; temp_x < temp_n_x; temp_x++) {
        _dst.beginShape();
          _dst.vertex(
            _arr2d[temp_x][temp_y][0] * _w,
            _arr2d[temp_x][temp_y][1] * _h,
            _arr2d[temp_x][temp_y][2] * _d,
            _arr2d[temp_x][temp_y][0],
            _arr2d[temp_x][temp_y][1]
          );
          _dst.vertex(
            _arr2d[temp_x + 1][temp_y][0] * _w,
            _arr2d[temp_x + 1][temp_y][1] * _h,
            _arr2d[temp_x + 1][temp_y][2] * _d,
            _arr2d[temp_x + 1][temp_y][0],
            _arr2d[temp_x + 1][temp_y][1]
          );
          _dst.vertex(
            _arr2d[temp_x + 1][temp_y + 1][0] * _w,
            _arr2d[temp_x + 1][temp_y + 1][1] * _h,
            _arr2d[temp_x + 1][temp_y + 1][2] * _d,
            _arr2d[temp_x + 1][temp_y + 1][0],
            _arr2d[temp_x + 1][temp_y + 1][1]
          );
          _dst.vertex(
            _arr2d[temp_x][temp_y + 1][0] * _w,
            _arr2d[temp_x][temp_y + 1][1] * _h,
            _arr2d[temp_x][temp_y + 1][2] * _d,
            _arr2d[temp_x][temp_y + 1][0],
            _arr2d[temp_x][temp_y + 1][1]
          );
        _dst.endShape();
      }
    }
  _dst.pop();
}

/*
  Function that draws the calculated mesh as horizontal lines.
*/
p5.prototype.ScanProcessor.prototype.__draw_horizontal_lines = function(
  _arr2d, _dst, _x, _y, _z, _w, _h, _d
) {
  _dst.push();
    _dst.noFill();
    /*
      Although we do not use texture, we call the textureMode method - we do it
      as a workaround, because p5js version 0.7.3 is affected by an error that
      does not allow using the vertex method without parameters u and v when
      texture mode is set to IMAGE.
    */
    _dst.textureMode(NORMAL);
    _dst.translate(_x - 0.5 * _w, _y - 0.5 * _h, _z);
      for(var temp_y = 0; temp_y < _arr2d[0].length; temp_y++) {
      _dst.beginShape();
        for(var temp_x = 0; temp_x < _arr2d.length; temp_x++)
          _dst.vertex(
            _arr2d[temp_x][temp_y][0] * _w,
            _arr2d[temp_x][temp_y][1] * _h,
            _arr2d[temp_x][temp_y][2] * _d
          );
      _dst.endShape();
    }
  _dst.pop();
}

/*
  Function that draws the calculated mesh as vertical lines.
*/
p5.prototype.ScanProcessor.prototype.__draw_vertical_lines = function(
  _arr2d, _dst, _x, _y, _z, _w, _h, _d
) {
  _dst.push();
    _dst.noFill();
    /*
      Although we do not use texture, we call the textureMode method - we do it
      as a workaround, because p5js version 0.7.3 is affected by an error that
      does not allow using the vertex method without parameters u and v when
      texture mode is set to IMAGE.
    */
    _dst.textureMode(NORMAL);
    _dst.translate(_x - 0.5 * _w, _y - 0.5 * _h, _z);
    for(var temp_x = 0; temp_x < _arr2d.length; temp_x++) {
      _dst.beginShape();
        for(var temp_y = 0; temp_y < _arr2d[0].length; temp_y++)
          _dst.vertex(
            _arr2d[temp_x][temp_y][0] * _w,
            _arr2d[temp_x][temp_y][1] * _h,
            _arr2d[temp_x][temp_y][2] * _d
          );
      _dst.endShape();
    }
  _dst.pop();
}

/*
  Function that draws the calculated mesh as horizontal curves.
*/
p5.prototype.ScanProcessor.prototype.__draw_horizontal_curves = function(
  _arr2d, _dst, _x, _y, _z, _w, _h, _d
) {
  _dst.push();
    _dst.noFill();
    /*
      Although we do not use texture, we call the textureMode method - we do it
      as a workaround, because p5js version 0.7.3 is affected by an error that
      does not allow using the curveVertex method without parameters u and v
      when texture mode is set to IMAGE.
    */
    _dst.textureMode(NORMAL);
    _dst.translate(_x - 0.5 * _w, _y - 0.5 * _h, _z);
      for(var temp_y = 0; temp_y < _arr2d[0].length; temp_y++) {
      _dst.beginShape();
        for(var temp_x = 0; temp_x < _arr2d.length; temp_x++)
          _dst.curveVertex(
            _arr2d[temp_x][temp_y][0] * _w,
            _arr2d[temp_x][temp_y][1] * _h,
            _arr2d[temp_x][temp_y][2] * _d
          );
      _dst.endShape();
    }
  _dst.pop();
}

/*
  Function that draws the calculated mesh as vertical curves.
*/
p5.prototype.ScanProcessor.prototype.__draw_vertical_curves = function(
  _arr2d, _dst, _x, _y, _z, _w, _h, _d
) {
  _dst.push();
    _dst.noFill();
    /*
      Although we do not use texture, we call the textureMode method - we do it
      as a workaround, because p5js version 0.7.3 is affected by an error that
      does not allow using the curveVertex method without parameters u and v
      when texture mode is set to IMAGE.
    */
    _dst.textureMode(NORMAL);
    _dst.translate(_x - 0.5 * _w, _y - 0.5 * _h, _z);
    for(var temp_x = 0; temp_x < _arr2d.length; temp_x++) {
      _dst.beginShape();
        for(var temp_y = 0; temp_y < _arr2d[0].length; temp_y++)
          _dst.curveVertex(
            _arr2d[temp_x][temp_y][0] * _w,
            _arr2d[temp_x][temp_y][1] * _h,
            _arr2d[temp_x][temp_y][2] * _d
          );
      _dst.endShape();
    }
  _dst.pop();
}

/*
  This function is the first layer of the procedure for converting images to
  the "Scan Processor"-image. The function, first of all, checks the
  correctness of parameters and scales the source image to the required size.
  It can be called with one or three parameters. If it is called with one
  parameter the size of the created mesh returned by the function will be equal
  to the size of the image being converted.
*/
p5.prototype.ScanProcessor.prototype.convert = function(_image, _w, _h) {
  if(arguments.length !== 1 && arguments.length !== 3) {
    console.log(
      '[ScanProcessor, convert] bad number of arguments: ' + arguments.length
    );
    return null;
  }
  if(_image === null) {
    console.log('[ScanProcessor, convert] _image === null');
    return null;
  }
  if(_image === undefined) {
    console.log('[ScanProcessor, convert] _image === undefined');
    return null;
  }
  /*
  if(_image.pixels === null)  {
    console.log('[ScanProcessor, convert] _image.pixels === null');
    return null;
  }
  if(_image.pixels.length === 0)  {
    console.log('[ScanProcessor, convert] _image.pixels.length === 0');
    return null;
  }
  */
  if(arguments.length === 3) {
    if(isNaN(_w)) {
      console.log('[ScanProcessor, convert] _w is not a number (NaN)');
      return null;
    }
    if(isNaN(_h)) {
      console.log('[ScanProcessor, convert] _h is not a number (NaN)');
      return null;
    }
    _w = Math.floor(Math.abs(_w)); _h = Math.floor(Math.abs(_h));
    if(_w < 1) _w = 1; if(_h < 1) _h = 1;
    if(this.__graphics.width !== _w || this.__graphics.height !== _h) {
      this.resizeGraphicsWorkaround(this.__graphics, _w, _h);
    }
  }
  else { // arguments.length === 1
    if(
      this.__graphics.width !== _image.width ||
      this.__graphics.height !== _image.height
    ) {
      this.resizeGraphicsWorkaround(
        this.__graphics, _image.width, _image.height
      );
    }
  }
  this.__graphics.background(0);
  this.__graphics.image(
    _image, 0, 0, this.__graphics.width, this.__graphics.height
  );
  switch(this.mode) {
    case this.RELIEF: return this.__convert_to_relief(); break;
    case this.RGBXYZ: return this.__convert_to_rgbxyz(); break;
    default:
      console.log('[ScanProcessor, convert] unhandled mode: ' + this.mode);
  }
  return this.__convert_to_relief(); // just for safe return (no nulls, etc.)
}

/*
  This function is the second layer of the procedure for converting images to
  the "Scan Processor". The function creates a grid of vertices by setting the
  depth (Z-coordinate) depending on the brightness of the pixel with which it
  corresponds. The function returns two-dimensional array containing vertices
  (from a certain point of view it is therefore a three-dimensional array,
  because each vertex has 3 coordinates).
*/
p5.prototype.ScanProcessor.prototype.__convert_to_relief = function() {
  if(this.__automaticPixelsDataTransferFlag) this.__graphics.loadPixels();
  var temp_result =
    this.createArray2d(this.__graphics.width, this.__graphics.height);
  var temp_maxWeight = 3 * 255; // max r + max g + max b (ignore alpha)
  var temp_range = {
    w: this.__graphics.width  - 1,
    h: this.__graphics.height - 1
  };
  var temp_weight, temp_anchor;
  for(var temp_y = 0; temp_y < this.__graphics.height; temp_y++) {
    for(var temp_x = 0; temp_x < this.__graphics.width; temp_x++) {
      temp_anchor = (temp_y * this.__graphics.width + temp_x) * 4;
      temp_weight =
        (
          this.__graphics.pixels[temp_anchor    ] +
          this.__graphics.pixels[temp_anchor + 1] +
          this.__graphics.pixels[temp_anchor + 2]
        ) / temp_maxWeight;
      temp_result[temp_x][temp_y] = [
        temp_x / temp_range.w, // norm_x
        temp_y / temp_range.h, // norm_y
        temp_weight            // norm_z
      ];
    }  
  }
  if(this.__automaticPixelsDataTransferFlag) this.__graphics.updatePixels();
  return temp_result;
}

/*
  This function is the second layer of the procedure for converting images to
  the mesh. It's slightly different to the "classic" Scan Processor. The
  function creates a grid of vertices by assuming that the starting form is a
  flat surface, which each grid point is moved in the X, Y and Z axes by a
  normalized value resulting from the level of the color component (R, G, B)
  corresponding to one of the axes. The function returns two-dimensional array
  containing vertices (from a certain point of view it is therefore a
  three-dimensional array, because each vertex has 3 coordinates).
*/
p5.prototype.ScanProcessor.prototype.__convert_to_rgbxyz = function() {
  if(this.__automaticPixelsDataTransferFlag) this.__graphics.loadPixels();
  var temp_result =
    this.createArray2d(this.__graphics.width, this.__graphics.height);
  var temp_range = {
    w: this.__graphics.width  - 1,
    h: this.__graphics.height - 1
  };
  var temp_anchor;
  for(var temp_y = 0; temp_y < this.__graphics.height; temp_y++) {
    for(var temp_x = 0; temp_x < this.__graphics.width; temp_x++) {
      temp_anchor = (temp_y * this.__graphics.width + temp_x) * 4;
      temp_result[temp_x][temp_y] = [
        (temp_x / temp_range.w + this.__graphics.pixels[temp_anchor    ] / 255.0) * 0.5, // norm_x
        (temp_y / temp_range.h + this.__graphics.pixels[temp_anchor + 1] / 255.0) * 0.5, // norm_y
                                 this.__graphics.pixels[temp_anchor + 2] / 255.0         // norm_z
      ];
    }
  }
  if(this.__automaticPixelsDataTransferFlag) this.__graphics.updatePixels();
  return temp_result;
}
