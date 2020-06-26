const multer = require('multer');
const im = require('imagemagick');
const storage = multer.diskStorage({
        
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/.*\.(jpeg|jpg|png)/i)){
            return cb(new Error('Please upload jpeg or png image'))
        }
        cb(undefined, true)
        im.resize({
            square: true,
            threshold: 400,
            responsive: false,
            width: 200
        }, function(err, stdout, stderr){
            if (err) throw err;
            console.log('resized image to fit within 200x200px');
          });
    }
})
const upload = multer({storage: storage, fileFilter : fileFilter});

module.exports = upload;