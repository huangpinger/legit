/* */ 
(function(Buffer) {
  "use strict";
  var Buffer = require('safer-buffer').Buffer;
  exports._sbcs = SBCSCodec;
  function SBCSCodec(codecOptions, iconv) {
    if (!codecOptions)
      throw new Error("SBCS codec is called without the data.");
    if (!codecOptions.chars || (codecOptions.chars.length !== 128 && codecOptions.chars.length !== 256))
      throw new Error("Encoding '" + codecOptions.type + "' has incorrect 'chars' (must be of len 128 or 256)");
    if (codecOptions.chars.length === 128) {
      var asciiString = "";
      for (var i = 0; i < 128; i++)
        asciiString += String.fromCharCode(i);
      codecOptions.chars = asciiString + codecOptions.chars;
    }
    this.decodeBuf = Buffer.from(codecOptions.chars, 'ucs2');
    var encodeBuf = Buffer.alloc(65536, iconv.defaultCharSingleByte.charCodeAt(0));
    for (var i = 0; i < codecOptions.chars.length; i++)
      encodeBuf[codecOptions.chars.charCodeAt(i)] = i;
    this.encodeBuf = encodeBuf;
  }
  SBCSCodec.prototype.encoder = SBCSEncoder;
  SBCSCodec.prototype.decoder = SBCSDecoder;
  function SBCSEncoder(options, codec) {
    this.encodeBuf = codec.encodeBuf;
  }
  SBCSEncoder.prototype.write = function(str) {
    var buf = Buffer.alloc(str.length);
    for (var i = 0; i < str.length; i++)
      buf[i] = this.encodeBuf[str.charCodeAt(i)];
    return buf;
  };
  SBCSEncoder.prototype.end = function() {};
  function SBCSDecoder(options, codec) {
    this.decodeBuf = codec.decodeBuf;
  }
  SBCSDecoder.prototype.write = function(buf) {
    var decodeBuf = this.decodeBuf;
    var newBuf = Buffer.alloc(buf.length * 2);
    var idx1 = 0,
        idx2 = 0;
    for (var i = 0; i < buf.length; i++) {
      idx1 = buf[i] * 2;
      idx2 = i * 2;
      newBuf[idx2] = decodeBuf[idx1];
      newBuf[idx2 + 1] = decodeBuf[idx1 + 1];
    }
    return newBuf.toString('ucs2');
  };
  SBCSDecoder.prototype.end = function() {};
})(require('buffer').Buffer);
