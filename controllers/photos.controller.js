const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (
      title &&
      author &&
      email &&
      file &&
      title.length < 20 &&
      author.length < 50
    ) {
      // if fields are not empty...

      const pattern = new RegExp(/(([A-z0-9-]|\s|\.)*)/, 'g');
      const titleMatched = title.match(pattern).join('');
      const authorMatched = author.match(pattern).join('');
      if (
        titleMatched.length < title.length ||
        authorMatched.length < author.length
      ) {
        throw new Error('Invalid characters...');
      }

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if (!(fileExt == 'jpg' || fileExt == 'gif' || fileExt == 'png')) {
        throw new Error('Wrong file!');
      }
      const newPhoto = new Photo({
        title,
        author,
        email,
        src: fileName,
        votes: 0,
      });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    let voterIp = await Voter.findOne({ user: req.clientIp });
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) {
      res.status(404).json({ message: 'Not found' });
    } else if (!voterIp) {
      voterIp = new Voter({ user: req.clientIp, votes: [req.params.id] });
      photoToUpdate.votes++;
      await voterIp.save();
      await photoToUpdate.save();
      res.send({ message: 'OK' });
    } else if (voterIp.votes.includes(req.params.id)) {
      res.status(500).json({ message: 'Already voted' });
    } else {
      voterIp.votes.push(req.params.id)
      photoToUpdate.votes++;
      await voterIp.save();
      await photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
