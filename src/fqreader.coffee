fs = require "fs"

class FQReader
  constructor: (@filename, @params)->
    # input validation
    @params = {data: @params} if typeof @params is "function"
    @filename = process.stdin if @filename is "-"
    @npause = 0
    @freader = null
    @_queue = []
    @ended = null

    throw new Error "required 'data' method in the secound argument" if typeof @params.data isnt "function"
    throw new Error "#{@filename} : no such file" if not @filename.readable and not fs.existsSync(@filename)
  
  _read: ->
    n = 0
    readOption = deepCopy @params
    delete readOption.data
    delete readOption.end

    ondata = @params.data.bind(@)

    freader = if @filename.readable then @filename else fs.createReadStream @filename, readOption
    freader.setEncoding "utf-8"

    reminder = ""
    freader.on "data", (chunk)=>
      chunk = [reminder, chunk].join("")
      lines = chunk.split("\n")

      for i in [0...Math.floor((lines.length-1) / 4)]
        i4 = i * 4
        fqdata =
          id   : lines[i4].slice(1)
          seq  : lines[i4 + 1]
          qual : lines[i4 + 3]
          n    : ++n

        if @npause
          @_queue.push fqdata
        else
          ondata fqdata

      reminder = lines[4*i..].join("\n")

    freader.once "end", =>
      if reminder
        lines = reminder.split("\n")
        @_queue.push
          id   : lines[0].slice(1)
          seq  : lines[1]
          qual : lines[3]
          n    : ++n

      @_ended = n
      @pause()
      @resume()

    freader.resume()
    @freader = freader
    return @

  resume: ->
    @npause-- if @npause > 0
    @params.data.call @, @_queue.shift() while @_queue.length and @npause is 0

    return unless @npause is 0
    @freader.resume()
    if @_ended?
      @params.end(@_ended) if typeof @params.end is "function"
      clearTimeout @timer if @timer

  pause: ->
    @freader.pause() if @npause is 0
    ++@npause
    @timer = setTimeout(timeoutError, 2e9) unless @timer # keeping about 23 days!

    
  @read = (filename, obj)->
    reader = new FQReader(filename, obj)
    return reader._read()

# deepcopy val
deepCopy = (val)->
  return val.map(deepCopy)  if Array.isArray(val)
  return val if typeof val isnt "object" or val is null or val is undefined
  ret = {}
  ret[attr] = deepCopy val[attr] for attr in val when val.hasOwnProperty attr
  return ret

timeoutError = ->
  console.error "fqreader: operation timed out."
  process.exit()

module.exports = FQReader

if require.main is module
  module.exports.read process.argv[2], (data)->
    console.log data
