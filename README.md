fqreader
==========
fqreader reads FASTQ files.

installation
----------------
```bash
$ npm install fqreader
```

usage
-------------
call it like this
```js
var fqreader = require("fqreader");
fqreader.read(filename, function(data) {
  console.log(data.id);
  console.log(data.seq);
  console.log("+");
  process.stdout.write(data.qual + "\n"); // to avoid %% -> %. or use consolog (https://github.com/shinout/consolog)
});
```

or like this
```js
var fqreader = require("fqreader");
fqreader.read(filename, 
  data: function(data) {
    console.log("on data", data);
  },
  end: function() {
    console.log("on end");
  }
});
```

fqreader.read(fastqfile, params)
-------------
Reads file with its name **fastqfile** as fastq format.

**fastqfile** is a filename or a readable stream like **process.stdin**.

if **fastqfile** is "-", then it reads from processs.stdin.


**params** is required, must be an object or a function.

**params.data** is called for each fastq unit with **data**.


- **data.id** : sequence id
- **data.seq** : sequence
- **data.qual** : quality values


**params.end** is called after the file is read through.


other values in **params** is used for **fs.createReadStream(fastqfile, params)**

for example, **highWaterMark** can be useful for performancd tuning.
