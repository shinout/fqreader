(function() {
  var fs;

  require("termcolor").define;

  fs = require("fs");

  module.exports = {
    read: function(filename, obj) {
      var freader, ondata, onend, readOption, reminder;
      if (typeof obj === "function") {
        obj = {
          data: obj
        };
      }
      if (typeof obj.data !== "function") {
        throw new Error("required 'data' method in the secound argument, in fqreader.read()");
      }
      if (!fs.existsSync(filename)) {
        throw new Error("" + filename + " : no such file");
      }
      ondata = obj.data;
      onend = obj.end;
      delete obj.data;
      delete obj.end;
      readOption = obj;
      freader = fs.createReadStream(filename, obj);
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
      return freader.on("end", function() {
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
    }
  };

  if (require.main === module) {
    module.exports.read(process.argv[2], function(data) {
      return console.log(data);
    });
  }

}).call(this);
