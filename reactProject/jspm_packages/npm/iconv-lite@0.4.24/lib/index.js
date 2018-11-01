/* */ 
(function(Buffer, process) {
  "use strict";
  var Buffer = require('safer-buffer').Buffer;
  var bomHandling = require('./bom-handling'),
      iconv = module.exports;
  iconv.encodings = null;
  iconv.defaultCharUnicode = '�';
  iconv.defaultCharSingleByte = '?';
  iconv.encode = function encode(str, encoding, options) {
    str = "" + (str || "");
    var encoder = iconv.getEncoder(encoding, options);
    var res = encoder.write(str);
    var trail = encoder.end();
    return (trail && trail.length > 0) ? Buffer.concat([res, trail]) : res;
  };
  iconv.decode = function decode(buf, encoding, options) {
    if (typeof buf === 'string') {
      if (!iconv.skipDecodeWarning) {
        console.error('Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding');
        iconv.skipDecodeWarning = true;
      }
      buf = Buffer.from("" + (buf || ""), "binary");
    }
    var decoder = iconv.getDecoder(encoding, options);
    var res = decoder.write(buf);
    var trail = decoder.end();
    return trail ? (res + trail) : res;
  };
  iconv.encodingExists = function encodingExists(enc) {
    try {
      iconv.getCodec(enc);
      return true;
    } catch (e) {
      return false;
    }
  };
  iconv.toEncoding = iconv.encode;
  iconv.fromEncoding = iconv.decode;
  iconv._codecDataCache = {};
  iconv.getCodec = function getCodec(encoding) {
    if (!iconv.encodings)
      iconv.encodings = require('../encodings/index');
    var enc = iconv._canonicalizeEncoding(encoding);
    var codecOptions = {};
    while (true) {
      var codec = iconv._codecDataCache[enc];
      if (codec)
        return codec;
      var codecDef = iconv.encodings[enc];
      switch (typeof codecDef) {
        case "string":
          enc = codecDef;
          break;
        case "object":
          for (var key in codecDef)
            codecOptions[key] = codecDef[key];
          if (!codecOptions.encodingName)
            codecOptions.encodingName = enc;
          enc = codecDef.type;
          break;
        case "function":
          if (!codecOptions.encodingName)
            codecOptions.encodingName = enc;
          codec = new codecDef(codecOptions, iconv);
          iconv._codecDataCache[codecOptions.encodingName] = codec;
          return codec;
        default:
          throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '" + enc + "')");
      }
    }
  };
  iconv._canonicalizeEncoding = function(encoding) {
    return ('' + encoding).toLowerCase().replace(/:\d{4}$|[^0-9a-z]/g, "");
  };
  iconv.getEncoder = function getEncoder(encoding, options) {
    var codec = iconv.getCodec(encoding),
        encoder = new codec.encoder(options, codec);
    if (codec.bomAware && options && options.addBOM)
      encoder = new bomHandling.PrependBOM(encoder, options);
    return encoder;
  };
  iconv.getDecoder = function getDecoder(encoding, options) {
    var codec = iconv.getCodec(encoding),
        decoder = new codec.decoder(options, codec);
    if (codec.bomAware && !(options && options.stripBOM === false))
      decoder = new bomHandling.StripBOM(decoder, options);
    return decoder;
  };
  var nodeVer = typeof process !== 'undefined' && process.versions && process.versions.node;
  if (nodeVer) {
    var nodeVerArr = nodeVer.split(".").map(Number);
    if (nodeVerArr[0] > 0 || nodeVerArr[1] >= 10) {
      require('./streams')(iconv);
    }
    require('./extend-node')(iconv);
  }
  if ("Ā" != "\u0100") {
    console.error("iconv-lite warning: javascript files use encoding different from utf-8. See https://github.com/ashtuchkin/iconv-lite/wiki/Javascript-source-file-encodings for more info.");
  }
})(require('buffer').Buffer, require('process'));
