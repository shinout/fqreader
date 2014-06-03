fs = require "fs"

class FQReader
  constructor: (@filename, @params)->
    # input validation
    @params = {data: @params} if typeof @params is "function"
    @filename = process.stdin if @filename is "-"

    throw new Error "required 'data' method in the secound argument" if typeof @params.data isnt "function"
    throw new Error "#{@filename} : no such file" if not @filename.readable and not fs.existsSync(@filename)
  
  read: ->
    readOption = deepCopy @params
    delete readOption.data
    delete readOption.end

    ondata = @params.data
    onend  = @params.end

    freader = if @filename.readable then @filename else fs.createReadStream @filename, readOption
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

    freader.resume()
    return @

  @read = (filename, obj)->
    reader = new FQReader(filename, obj)
    return reader.read()

# deepcopy val
deepCopy = (val)->
  return val.map(deepCopy)  if Array.isArray(val)
  return val if typeof val isnt "object" or val is null or val is undefined
  ret = {}
  ret[attr] = deepCopy val[attr] for attr in val when val.hasOwnProperty attr
  return ret

module.exports = FQReader

if require.main is module
  module.exports.read process.argv[2], (data)->
    console.log data
