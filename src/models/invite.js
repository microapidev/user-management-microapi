const mongoose = require('mongoose');

const TeamInviteSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    unique: true,
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'team',
    unique: true,
    required: true
  },
  invitedUserId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    unique: true,
    required: true
  },
  accepted: {
    type: Boolean,
    default: false
  }
},
  {
    timestamps: true
  });


const TeamInviteModel = mongoose.model('TeamInvite', TeamInviteSchema);

module.exports = { TeamInviteModel };