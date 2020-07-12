const env = require("dotenv");
const sharp = require("sharp");
const crypto = require("crypto");

const companyModel = require("../models/company");
const teamModel = require("../models/team");
const userModel = require("../models/user");
const serviceUser = require("../models/service_user");
const { TeamInviteModel, CompanyInviteModel } = require("../models/invite");
const jwtUtil = require("../security/jwtAuth");
const { errHandler } = require("../handlers/errorHandlers");

env.config();

const user = {
  addServiceUser: (req, res) => {
    try {
      const email = req.body.email;
      const newUser = new serviceUser({
        email,
        apiKey: jwtUtil.generateApiKey(),
      });
      newUser
        .save()
        .then((user) => {
          res.json({
            status: "Success",
            message: `Created Service User`,
            data: user,
          });
        })
        .catch((e) => {
          res
            .status(400)
            .json({ status: "Failed", message: `${e.message}`, data: null });
        });
    } catch (e) {
      res
        .status(400)
        .json({ status: "Failed", message: `${e.message}`, data: null });
    }
  },

  getToken: async (req, res) => {
    const { email = "" } = req.body;
    try {
      const user = await serviceUser.findOne({ email });
      if (!user)
        return res.status(401).json({
          status: "Failed",
          message: "Invalid email",
        });

      return res.status(200).json({
        status: "Success",
        message: "Your apiKey",
        data: user.apiKey,
      });
    } catch (error) {
      errHandler(error, res);
    }
  },

  getMe: (req, res) => {
    return res
      .status(200)
      .json({ status: "Success", message: "your profile", data: req.user });
  },

  deleteMe: async (req, res) => {
    try {
      const user = await req.user.remove();
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "Delete failed: user not found",
          data: null,
        });
      res.status(200).json({
        status: "Success",
        message: "Account deleted successfully!",
        data: null,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },

  getAllUsers: (req, res) => {
    userModel
      .find({ creatorId: req.user._id })
      .select(["-avatar"])
      .then((users) =>
        res.json({ status: "Success", message: "List of Users", data: users })
      )
      .catch((err) =>
        res
          .status(400)
          .json({ status: "Failed", message: err.message, data: null })
      );
  },
  getUser: async (req, res) => {
    try {
      const user = await userModel
        .findOne({ _id: req.params.id, creatorId: req.user._id })
        .select(["-avatar"]);
      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "user not found", data: null });
      res.json({ status: "Success", message: "User Details", data: user });
    } catch (err) {
      errHandler(err, res);
    }
  },
  addUser: async (req, res) => {
    const {
      firstName,
      lastName,
      userName,
      email,
      phone,
      age,
      country,
      status,
      address,
    } = req.body;
    const gender =
      (req.body.gender && req.body.gender.toLowerCase()) || undefined;
    try {
      const userNames = await userModel.findOne({
        userName,
        creatorId: req.user._id,
      });
      if (userNames) {
        res.status(400).json({
          status: "Failed",
          message: `Username has been taken `,
          data: null,
        });
      } else {
        const user = await userModel.findOne({ email: req.body.email });
        if (!user) {
          const newUser = new userModel({
            firstName,
            lastName,
            userName,
            email,
            phone,
            age,
            country,
            status,
            address,
            gender,
            creatorId: req.user._id,
          });
          await newUser.save();
          res.json({
            status: "Success",
            message: "New user created!",
            data: newUser,
          });
        } else {
          res.status(400).json({
            status: "Fail",
            message: "User already Exists",
          });
        }
      }
    } catch (err) {
      errHandler(err, res);
    }
  },
  removeUser: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user) {
        return res.status(404).json({
          status: "Failed",
          message: "Delete failed: user not found",
          data: null,
        });
      }
      await companyModel.updateOne(
        { _id: user.company },
        { $pull: { users: { $in: [user._id] } } }
      );
      await teamModel.updateOne(
        { _id: user.team },
        { $pull: { users: { $in: [user._id] } } }
      );
      const result = await userModel.deleteOne({ _id: user._id });
      if (result.deletedCount > 0) {
        res
          .status(200)
          .json({ status: "Success", message: "User removed!", data: null });
      } else {
        res.status(500).json({
          status: "Failed",
          message: "Failed to remove user",
          data: null,
        });
      }
    } catch (err) {
      errHandler(err, res);
    }
  },
  setUserFirstName: async (req, res) => {
    try {
      const user = await userModel
        .findOneAndUpdate(
          { _id: req.params.id, creatorId: req.user._id },
          { firstName: req.body.firstName },
          { new: true, runValidators: true }
        )
        .select(["-avatar"]);
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "First name not set: user not found",
          data: null,
        });
      res.status(200).json({
        status: "Success",
        message: "First name updated!",
        data: user,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  setUserLastName: async (req, res) => {
    try {
      const user = await userModel
        .findOneAndUpdate(
          { _id: req.params.id, creatorId: req.user._id },
          { lastName: req.body.lastName },
          { new: true, runValidators: true }
        )
        .select(["-avatar"]);
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "Last name not set: user not found",
          data: null,
        });
      res.status(200).json({
        status: "Success",
        message: "Last name updated!",
        data: user,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getUserFirstName: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "user not found", data: null });
      res.json({
        status: "Success",
        message: "User first name",
        data: user.firstName,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getUserLastName: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "user not found", data: null });
      res.json({
        status: "Success",
        message: "User last name",
        data: user.lastName,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  setUserEmail: async (req, res) => {
    try {
      const user = await userModel
        .findOneAndUpdate(
          { _id: req.params.id, creatorId: req.user._id },
          { email: req.body.email },
          { new: true, runValidators: true }
        )
        .select(["-avatar"]);
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "Email not set: user not found",
          data: null,
        });
      res.json({ status: "Success", message: "Email Updated!", data: user });
    } catch (err) {
      errHandler(err, res);
    }
  },
  setUserPhone: async (req, res) => {
    try {
      const user = await userModel
        .findOneAndUpdate(
          { _id: req.params.id, creatorId: req.user._id },
          { phone: req.body.phone },
          { new: true, runValidators: true }
        )
        .select(["-avatar"]);
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "Phone not set: user not found",
          data: null,
        });
      res.json({
        status: "Success",
        message: "Phone number updated!",
        data: user,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getUserEmail: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "user not found", data: null });
      res.json({
        status: "Success",
        message: "User email",
        data: user.email,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },

  getUserName: async (req, res) => {
    try {
      const user = await userModel.findOne({ _id: req.params.id });
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "user not found",
          data: null,
        });
      res.json({
        status: "Success",
        message: "User Name",
        data: user.userName,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },

  getUserCountry: async (req, res) => {
    try {
      const user = await userModel.findOne({ _id: req.params.id });
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "user not found",
          data: null,
        });
      res.json({
        status: "Success",
        message: "User Country",
        data: user.country,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },

  setUserName: async (req, res) => {
    try {
      const user = await userModel.findOneAndUpdate(
        { _id: req.params.id },
        { userName: req.body.userName },
        { new: true, runValidators: true }
      );

      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "User Name not set: user not found",
          data: null,
        });
      res.json({
        status: "Success",
        message: "User's UserName updated!",
        data: user,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  setUserCountry: async (req, res) => {
    try {
      const user = await userModel.findOneAndUpdate(
        { _id: req.params.id },
        { country: req.body.country },
        { new: true, runValidators: true }
      );

      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "Country not set: user not found",
          data: null,
        });
      res.json({
        status: "Success",
        message: "User country updated!",
        data: user,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getUserPhone: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "user not found", data: null });
      res.json({
        status: "Success",
        message: "User phone number",
        data: user.phone,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  setUserAge: async (req, res) => {
    try {
      const user = await userModel
        .findOneAndUpdate(
          { _id: req.params.id, creatorId: req.user._id },
          { age: req.body.age },
          { new: true, runValidators: true }
        )
        .select(["-avatar"]);
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "Age not set: user not found",
          data: null,
        });
      res.json({
        status: "Success",
        message: "User Age updated!",
        data: user,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getUserAge: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "user not found", data: null });
      res.json({ status: "Success", message: "User Age", data: user.age });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getUserStatus: async (req, res) => {
    try {
      const user = await userModel.findOne({ _id: req.params.id });
      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "user not found", data: null });
      res.json({
        status: "Success",
        message: "User Status",
        data: user.status,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  setUserGender: async (req, res) => {
    try {
      const user = await userModel
        .findOneAndUpdate(
          { _id: req.params.id, creatorId: req.user._id },
          { gender: req.body.gender },
          { new: true, runValidators: true }
        )
        .select(["-avatar"]);
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "Gender not set: user not found",
          data: null,
        });
      res.json({
        status: "Success",
        message: "User gender updated!",
        data: user,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  activateUsers: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user) {
        return res.status(404).send({
          message: "User not found with id " + req.params.id,
        });
      } else {
        user.status = "ACTIVE";
        user.save();
        res.json({
          status: "Success",
          message: "User Activated",
          data: user.status,
          user,
        });
      }
    } catch (err) {
      errHandler(err, res);
    }
  },

  deActivateUsers: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user) {
        return res.status(404).send({
          message: "User not found with id " + req.params.id,
        });
      } else {
        user.status = "INACTIVE";
        user.save();
        res.json({
          status: "Success",
          message: "User Deactivated",
          data: user.status,
          user,
        });
      }
    } catch (err) {
      errHandler(err, res);
    }
  },
  getUserGender: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "user not found", data: null });
      res.json({
        status: "Success",
        message: "User gender",
        data: user.gender,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  setUserAddress: async (req, res) => {
    try {
      const user = await userModel
        .findOneAndUpdate(
          { _id: req.params.id, creatorId: req.user._id },
          { address: req.body.address },
          { new: true, runValidators: true }
        )
        .select(["-avatar"]);
      if (!user)
        return res.status(404).json({
          status: "Failed",
          message: "address not set: user not found",
          data: null,
        });
      res.json({
        status: "Success",
        message: "User address updated!",
        data: user,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getUserAddress: async (req, res) => {
    try {
      const user = await userModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "user not found", data: null });
      res.json({
        status: "Success",
        message: "User address",
        data: user.address,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getActiveUsers: async (req, res) => {
    try {
      const users = await userModel
        .find({ status: "ACTIVE", creatorId: req.user._id })
        .select(["-avatar"]);
      res.json({
        status: "Success",
        message: "List of active users",
        data: users,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getInActiveUsers: async (req, res) => {
    try {
      const users = await userModel
        .find({ status: "INACTIVE", creatorId: req.user._id })
        .select(["-avatar"]);
      res.json({
        status: "Success",
        message: "List of inactive users",
        data: users,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  // getUserAvatar: async (req, res) => {
  //   try {
  //     const user = await userModel.findById(req.params.id);
  //     if (!user)
  //       return res
  //         .status(404)
  //         .json({ status: "Failed", message: "user not found", data: null });
  //     if (!user.avatar)
  //       return res.status(404).json({
  //         status: "Failed",
  //         message: "user does not have an avatar",
  //         data: null,
  //       });
  //     res.set("Content-Type", "image/png");
  //     res.send(user.avatar);
  //   } catch (err) {
  //     errHandler(err, res);
  //   }
  // },

  // setUserAvatar: async (req, res) => {
  //   try {
  //     const user = await userModel.findById(req.params.id);
  //     if (!user)
  //       return res.status(404).json({
  //         status: "Failed",
  //         message: "Avatar not set: user not found",
  //         data: null,
  //       });
  //     const url = req.protocol + "://" + req.get("host") + req.originalUrl;
  //     const buffer = await sharp(req.file.buffer)
  //       .resize({ width: 200, height: 200 })
  //       .png()
  //       .toBuffer();
  //     user.avatar = buffer;
  //     user.url = url;
  //     await user.save().then(() =>
  //       res.status(200).json({
  //         status: "Success",
  //         message: "Avatar updated!",
  //         data: { url },
  //       })
  //     );
  //   } catch (err) {
  //     errHandler(err, res);
  //   }
  // },

  // removeUserAvatar: async (req, res) => {
  //   try {
  //     const user = await userModel.findById(req.params.id);
  //     if (!user)
  //       return res.status(404).json({
  //         status: "Failed",
  //         message: "Delete operation failed: user not found",
  //         data: null,
  //       });
  //     user.avatar = undefined;
  //     user.url = "N/A";
  //     await user.save();
  //     res.status(200).send({
  //       status: "Success",
  //       message: "Profile image deleted successfully",
  //       data: null,
  //     });
  //   } catch (err) {
  //     errHandler(err, res);
  //   }
  // },

  inviteUserToTeam: async (req, res) => {
    try {
      const { userId, teamId, invitedUserId } = req.params;
      if (userId === invitedUserId) throw new Error("Cannot invite self");

      const team = await teamModel.findOne({
        _id: teamId,
        creatorId: req.user._id,
      });
      const user = await userModel.findOne({
        _id: userId,
        creatorId: req.user._id,
      });
      const invitedUser = await userModel.findById(invitedUserId);

      if (!user) throw new Error("User not found");
      if (!team) throw new Error("Team not found");
      if (!invitedUser) throw new Error("Invited User not found");

      team.users = team.users.concat(invitedUser);
      invitedUser.team = team;

      await team.save();
      await invitedUser.save();

      const newInvite = await new TeamInviteModel({
        userId,
        teamId,
        invitedUserId,
      });

      newInvite
        .save()
        .then((invite) => {
          res.status(200).json({
            status: "Success",
            message: `User invited Successfully`,
            data: invite,
          });
        })
        .catch((e) => {
          throw new Error(e.message);
        });
    } catch (err) {
      errHandler(err, res);
    }
  },
  inviteUserToCompany: async (req, res) => {
    try {
      const { userId, companyId, invitedUserId } = req.params;
      if (userId === invitedUserId) throw new Error("Cannot invite self");

      const company = await companyModel.findOne({
        _id: companyId,
        creatorId: req.user._id,
      });
      const user = await userModel.findOne({
        _id: userId,
        creatorId: req.user._id,
      });
      const invitedUser = await userModel.findById(invitedUserId);

      if (!user) throw new Error("User not found");
      if (!company) throw new Error("Team not found");
      if (!invitedUser) throw new Error("Invited User not found");

      company.users = company.users.concat(invitedUser);
      invitedUser.company = company;

      await company.save();
      await invitedUser.save();

      const newInvite = await new CompanyInviteModel({
        userId,
        companyId,
        invitedUserId,
      });

      newInvite
        .save()
        .then((invite) => {
          res.status(200).json({
            status: "Success",
            message: `User invited successfully`,
            data: invite,
          });
        })
        .catch((e) => {
          throw new Error(e.message);
        });
    } catch (err) {
      errHandler(err, res);
    }
  },
};

module.exports = user;
