require("termcolor").define
fs = require "fs"
module.exports = read: (filename, obj)->
  # input validation
  obj = {data: obj} if typeof obj is "function"

  throw new Error "required 'data' method in the secound argument, in fqreader.read()" if typeof obj.data isnt "function"
  throw new Error "#{filename} : no such file" unless fs.existsSync(filename)

  ondata = obj.data
  onend = obj.end

  delete obj.data
  delete obj.end

  # read
  readOption = obj
  freader = fs.createReadStream filename, obj
  freader.setEncoding "utf-8"

  reminder = ""
  freader.on "data", (chunk)->
    chunk = [reminder, chunk].join("")
    lines = chunk.split("\n")

    for i in [0...Math.floor((lines.length-1) / 4)]
      i4 = i * 4
      ondata
        id   : lines[i4].slice(1)
        seq  : lines[i4 + 1]
        qual : lines[i4 + 3]


    reminder = lines[4*i..].join("\n")

  freader.on "end", ->
    if reminder
      lines = reminder.split("\n")
      ondata
        id   : lines[0].slice(1)
        seq  : lines[1]
        qual : lines[3]
    onend() if typeof onend is "function"

if require.main is module
  module.exports.read process.argv[2], (data)->
    console.log data
