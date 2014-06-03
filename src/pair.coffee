dna = require("dna")

module.exports.pairs = (filename, obj)->
  ids = {}
  obj.data = (data)->
    unless ids[data.id]?
      ids[data.ids] = data
      delete data.id
    else
      d2 = ids[data.id]
      writable1 = dna.writeFastq(data.id, d2.seq, d2.qual, obj.writer1)
      writable2 = dna.writeFastq(data.id, data.seq, data.qual, obj.writer2)

      if not writable1
        @pause()
        obj.writer1.once "drain", => @resume()
      if not writable2
        @pause()
        obj.writer1.once "drain", => @resume()

        
  obj.end = ->
    # singleton reads
    for id, data of ids
      dna.writeFastq(id, data.seq, data.qual, process.stderr) # to stderr

  module.exports.read filename, obj
