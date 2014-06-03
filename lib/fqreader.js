(function() {
  var FQReader, deepCopy, fs;

  fs = require("fs");

  FQReader = (function() {
    function FQReader(filename, params) {
      this.filename = filename;
      this.params = params;
      if (typeof this.params === "function") {
        this.params = {
          data: this.params
        };
      }
      if (this.filename === "-") {
        this.filename = process.stdin;
      }
      if (typeof this.params.data !== "function") {
        throw new Error("required 'data' method in the secound argument");
      }
      if (!this.filename.readable && !fs.existsSync(this.filename)) {
        throw new Error("" + this.filename + " : no such file");
      }
    }

    FQReader.prototype.read = function() {
      var freader, ondata, onend, readOption, reminder;
      readOption = deepCopy(this.params);
      delete readOption.data;
      delete readOption.end;
      ondata = this.params.data;
      onend = this.params.end;
      freader = this.filename.readable ? this.filename : fs.createReadStream(this.filename, readOption);
      freader.setEncoding("utf-8");
      reminder = "";
      freader.on("data", function(chunk) {
        var i, i4, lines, _i, _ref;
        chunk = [reminder, chunk].join("");
        lines = chunk.split("\n");
        for (i = _i = 0, _ref = Math.floor((lines.length - 1) / 4); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          i4 = i * 4;
          ondata({
            id: lines[i4].slice(1),
            seq: lines[i4 + 1],
            qual: lines[i4 + 3]
          });
        }
        return reminder = lines.slice(4 * i).join("\n");
      });
      freader.on("end", function() {
        var lines;
        if (reminder) {
          lines = reminder.split("\n");
          ondata({
            id: lines[0].slice(1),
            seq: lines[1],
            qual: lines[3]
          });
        }
        if (typeof onend === "function") {
          return onend();
        }
      });
      freader.resume();
      return this;
    };

    FQReader.read = function(filename, obj) {
      var reader;
      reader = new FQReader(filename, obj);
      return reader.read();
    };

    return FQReader;

  })();

  deepCopy = function(val) {
    var attr, ret, _i, _len;
    if (Array.isArray(val)) {
      return val.map(deepCopy);
    }
    if (typeof val !== "object" || val === null || val === void 0) {
      return val;
    }
    ret = {};
    for (_i = 0, _len = val.length; _i < _len; _i++) {
      attr = val[_i];
      if (val.hasOwnProperty(attr)) {
        ret[attr] = deepCopy(val[attr]);
      }
    }
    return ret;
  };

  module.exports = FQReader;

  if (require.main === module) {
    module.exports.read(process.argv[2], function(data) {
      return console.log(data);
    });
  }

}).call(this);
