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
  }
},
  {
    timestamps: true
  });
const CompanyInviteSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    unique: true,
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'company',
    unique: true,
    required: true
  },
  invitedUserId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    unique: true,
    required: true
  }
},
  {
    timestamps: true
  });


const TeamInviteModel = mongoose.model('TeamInvite', TeamInviteSchema);
const CompanyInviteModel = mongoose.model('CompanyInvite', CompanyInviteSchema);

module.exports = { TeamInviteModel, CompanyInviteModel };