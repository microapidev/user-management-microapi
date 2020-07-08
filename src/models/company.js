const mongoose = require("mongoose");

const CompanySchema = mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "service_user",
    },
    name: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    companyinfo: {
      type: String,
      trim: true,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        unique: true,
        required: true,
      },
    ],
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "team",
        unique: true,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
