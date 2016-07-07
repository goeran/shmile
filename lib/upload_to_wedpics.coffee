exec = require('child_process').exec


class UploadToWedPics

  constructor: (args) ->
    console.log 'Creating upload to wedpics!'
    console.log "Will upload: #{args.file_path}"
    exec "phantomjs --ssl-protocol=any wedpics/upload.js #{args.file_path}", (err2, stdout2, stderr2) ->
      console.log(stdout2)

module.exports = UploadToWedPics
