(function() {
  var FQReader, deepCopy, fs, timeoutError;

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
      this.npause = 0;
      this.freader = null;
      this._queue = [];
      this.ended = null;
      if (typeof this.params.data !== "function") {
        throw new Error("required 'data' method in the secound argument");
      }
      if (!this.filename.readable && !fs.existsSync(this.filename)) {
        throw new Error("" + this.filename + " : no such file");
      }
    }

    FQReader.prototype._read = function() {
      var freader, n, ondata, readOption, reminder;
      n = 0;
      readOption = deepCopy(this.params);
      delete readOption.data;
      delete readOption.end;
      ondata = this.params.data.bind(this);
      freader = this.filename.readable ? this.filename : fs.createReadStream(this.filename, readOption);
      freader.setEncoding("utf-8");
      reminder = "";
      freader.on("data", (function(_this) {
        return function(chunk) {
          var fqdata, i, i4, lines, _i, _ref;
          chunk = [reminder, chunk].join("");
          lines = chunk.split("\n");
          for (i = _i = 0, _ref = Math.floor((lines.length - 1) / 4); 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            i4 = i * 4;
            fqdata = {
              id: lines[i4].slice(1),
              seq: lines[i4 + 1],
              qual: lines[i4 + 3],
              n: ++n
            };
            if (_this.npause) {
              _this._queue.push(fqdata);
            } else {
              ondata(fqdata);
            }
          }
          return reminder = lines.slice(4 * i).join("\n");
        };
      })(this));
      freader.once("end", (function(_this) {
        return function() {
          var lines;
          if (reminder) {
            lines = reminder.split("\n");
            _this._queue.push({
              id: lines[0].slice(1),
              seq: lines[1],
              qual: lines[3],
              n: ++n
            });
          }
          _this._ended = n;
          _this.pause();
          return _this.resume();
        };
      })(this));
      freader.resume();
      this.freader = freader;
      return this;
    };

    FQReader.prototype.resume = function() {
      if (this.npause > 0) {
        this.npause--;
      }
      while (this._queue.length && this.npause === 0) {
        this.params.data.call(this, this._queue.shift());
      }
      if (this.npause !== 0) {
        return;
      }
      this.freader.resume();
      if (this._ended != null) {
        if (typeof this.params.end === "function") {
          this.params.end(this._ended);
        }
        if (this.timer) {
          return clearTimeout(this.timer);
        }
      }
    };

    FQReader.prototype.pause = function() {
      if (this.npause === 0) {
        this.freader.pause();
      }
      ++this.npause;
      if (!this.timer) {
        return this.timer = setTimeout(timeoutError, 2e9);
      }
    };

    FQReader.read = function(filename, obj) {
      var reader;
      reader = new FQReader(filename, obj);
      return reader._read();
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

  timeoutError = function() {
    console.error("fqreader: operation timed out.");
    return process.exit();
  };

  module.exports = FQReader;

  if (require.main === module) {
    module.exports.read(process.argv[2], function(data) {
      return console.log(data);
    });
  }

}).call(this);
