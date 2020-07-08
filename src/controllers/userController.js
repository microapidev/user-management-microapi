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

  generateToken: async (req, res) => {
    const email = req.query.email;
    await serviceUser.findOne({ email }).then((user) => {
      if (!user) {
        res.status(400).json({
          status: "Failed",
          message: `User was Not found`,
          data: null,
        });
        return;
      }

      try {
        res.json({
          status: "Success",
          message: `Generated Token for ${email}`,
          data: jwtUtil.createToken(user.email, user.apiKey),
        });
      } catch (e) {
        res
          .status(400)
          .json({ status: "Failed", message: `${e.message}`, data: null });
      }
    });
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
      const user = await userModel.findById(req.params.id).select(["-avatar"]);
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
      email,
      phone,
      age,
      status,
      address
    } = req.body;
    const gender = req.body.gender.toLowerCase();
    try {
      const user = await userModel.findOne({ email: req.body.email });
      if (!user) {
        const newUser = new userModel({
          firstName,
          lastName,
          email,
          phone,
          age,
          status,
          address,
          gender,
          creatorId : req.user._id
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

    } catch (err) {
      errHandler(err, res);
    }
  },
  removeUser: async (req, res) => {
    const users = await userModel.find({creatorId : req.user_id});
    if(users){
      try {
        const user = await userModel.findByIdAndDelete({ _id: req.params.id });
        if (!user)
          return res.status(404).json({
            status: "Failed",
            message: "Delete failed: user not found",
            data: null,
          });
        res
          .status(200)
          .json({ status: "Success", message: "User removed!", data: null });
      } catch (err) {
        errHandler(err, res);
      }
      return res.status(404).json({
        status: "Failed",
        message: "Delete failed: user not found",
        data: null,
      });
    }

  },
  setUserFirstName: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel
          .findOneAndUpdate(
            { _id: req.params.id },
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
    }return res.status(404).json({
      status: "Failed",
      message: "First name not set: user not found",
      data: null,
    });

  },
  setUserLastName: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel
          .findOneAndUpdate(
            { _id: req.params.id },
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
        res
          .status(200)
          .json({ status: "Success", message: "Last name updated!", data: user });
      } catch (err) {
        errHandler(err, res);
      }
    }
    return res.status(404).json({
      status: "Failed",
      message: "Last name not set: user not found",
      data: null,
    });

  },
  getUserFirstName: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel.findOne({ _id: req.params.id });
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
    } res
      .status(404)
      .json({ status: "Failed", message: "user not found", data: null });

  },
  getUserLastName: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
    try {
      const user = await userModel.findOne({ _id: req.params.id });
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
  }res
    .status(404)
    .json({ status: "Failed", message: "user not found", data: null });
  },
  setUserEmail: async (req, res) => {
    const users = await userModel.find({creatorId : req.user.user_id});
    if (users){
    try {
      const user = await userModel
        .findOneAndUpdate(
          { _id: req.params.id },
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
  }res
    .status(404)
    .json({ status: "Failed", message: "user not found", data: null });
  },
  setUserPhone: async (req, res) => {
    const users = await userModel . find ({creatorId : req.user._id});
    if (users){
    try {
      const user = await userModel
        .findOneAndUpdate(
          { _id: req.params.id },
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
  }res
    .status(404)
    .json({ status: "Failed", message: "user not found", data: null });
  },
  getUserEmail: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel.findOne({ _id: req.params.id });
        if (!user)
          return res
            .status(404)
            .json({ status: "Failed", message: "user not found", data: null });
        res.json({ status: "Success", message: "User email", data: user.email });
      } catch (err) {
        errHandler(err, res);
      }
    }res
      .status(404)
      .json({ status: "Failed", message: "user not found", data: null });
  },
  getUserPhone: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel.findOne({ _id: req.params.id });
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
    }res
      .status(404)
      .json({ status: "Failed", message: "user not found", data: null });

  },
  setUserAge: async (req, res) => {
    const users = await userModel.find({creatorId: req.user._id});
    if(users){
      try {
        const user = await userModel
          .findOneAndUpdate(
            { _id: req.params.id },
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
        res.json({ status: "Success", message: "User Age updated!", data: user });
      } catch (err) {
        errHandler(err, res);
      }
    }res.status(404).json({
      status: "Failed",
      message: "Age not set: user not found",
      data: null,
    });
  },
  getUserAge: async (req, res) => {
    const users = await user.find({creatorId : req.users._id});
    if(users){
      try {
        const user = await userModel.findOne({ _id: req.params.id });
        if (!user)
          return res
            .status(404)
            .json({ status: "Failed", message: "user not found", data: null });
        res.json({ status: "Success", message: "User Age", data: user.age });
      } catch (err) {
        errHandler(err, res);
      }
    } res
      .status(404)
      .json({ status: "Failed", message: "user not found", data: null });

  },
  getUserStatus: async (req, res) => {
    const users =  await userModel.find({creatorId : req.user._id});
    if(users){
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
    }res
      .status(404)
      .json({ status: "Failed", message: "user not found", data: null });

  },
  setUserGender: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel
          .findOneAndUpdate(
            { _id: req.params.id },
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
    }res.status(404).json({
      status: "Failed",
      message: "Gender not set: user not found",
      data: null,
    });

  },
  activateUsers: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel.findOne({ _id: req.params.id });
        if (!user) {
          return res.status(404).send({
            message: "User not found with id " + req.params.id,
          });
        } else {
          user.status = "ACTIVE";
          user.save()
          res.json({
            status: "Success",
            message: "User Activated",
            data: user.status,
            user
          });
        }
      } catch (err) {
        errHandler(err, res);
      }
    }res.status(404).send({
      message: "User not found with id " + req.params.id,
    });

  },

  deActivateUsers: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel.findOne({ _id: req.params.id });
        if (!user) {
          return res.status(404).send({
            message: "User not found with id " + req.params.id,
          });
        } else {
          user.status = "INACTIVE";
          user.save()
          res.json({
            status: "Success",
            message: "User Deactivated",
            data: user.status,
            user

          });
        }
      } catch (err) {
        errHandler(err, res);
      }
    }
    return res.status(404).send({
        message: "User not found with id " + req.params.id,
      });

  },
  getUserGender: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel.findOne({ _id: req.params.id });
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
    }res
      .status(404)
      .json({ status: "Failed", message: "user not found", data: null });

  },
  setUserAddress: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if (users){
      try {
        const user = await userModel
          .findOneAndUpdate(
            { _id: req.params.id },
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
    }
    return res.status(404).json({
      status: "Failed",
      message: "address not set: user not found",
      data: null,
    });

  },
  getUserAddress: async (req, res) => {
    const users = await userModel.find({creatorId: req.user._id});
    if(users){
      try {
        const user = await userModel.findOne({ _id: req.params.id });
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
    }res
      .status(404)
      .json({ status: "Failed", message: "user not found", data: null });

  },
  getActiveUsers: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const users = await userModel
          .find({ status: "ACTIVE" })
          .select(["-avatar"]);
        res.json({
          status: "Success",
          message: "List of active users",
          data: users,
        });
      } catch (err) {
        errHandler(err, res);
      }
    }res
      .status(404)
      .json({ status: "Failed", message: "users not found", data: null });


  },
  getInActiveUsers: async (req, res) => {
    const users = await userModel.find({creatorId: req.user._id});
    if(users){
      try {
        const users = await userModel
          .find({ status: "INACTIVE" })
          .select(["-avatar"]);
        res.json({
          status: "Success",
          message: "List of inactive users",
          data: users,
        });
      } catch (err) {
        errHandler(err, res);
      }
    }res
      .status(404)
      .json({ status: "Failed", message: "users not found", data: null });

  },
  getUserAvatar: async (req, res) => {
    const users = await userModel.find({creatorId: req.user._id});
    if(users){
      try {
        const user = await userModel.findById(req.params.id);
        if (!user)
          return res
            .status(404)
            .json({ status: "Failed", message: "user not found", data: null });
        if (!user.avatar)
          return res.status(404).json({
            status: "Failed",
            message: "user does not have an avatar",
            data: null,
          });
        res.set("Content-Type", "image/png");
        res.send(user.avatar);
      } catch (err) {
        errHandler(err, res);
      }
    }
    return res.status(404).json({
      status: "Failed",
      message: "Cannot find user",
      data: null,
    });

  },

  setUserAvatar: async (req, res) => {
    const users = await userModel.find({creatorId: req.user._id});
    if(users){
      try {
        const user = await userModel.findById(req.params.id);
        if (!user)
          return res.status(404).json({
            status: "Failed",
            message: "Avatar not set: user not found",
            data: null,
          });
        const url = req.protocol + "://" + req.get("host") + req.originalUrl;
        const buffer = await sharp(req.file.buffer)
          .resize({ width: 200, height: 200 })
          .png()
          .toBuffer();
        user.avatar = buffer;
        user.url = url;
        await user.save().then(() =>
          res.status(200).json({
            status: "Success",
            message: "Avatar updated!",
            data: { url },
          })
        );
      } catch (err) {
        errHandler(err, res);
      }
    }
    return res.status(404).json({
      status: "Failed",
      message: "Avatar not set: user not found",
      data: null,
    });

  },

  removeUserAvatar: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      try {
        const user = await userModel.findById(req.params.id);
        if (!user)
          return res.status(404).json({
            status: "Failed",
            message: "Delete operation failed: user not found",
            data: null,
          });
        user.avatar = undefined;
        user.url = "N/A";
        await user.save();
        res.status(200).send({
          status: "Success",
          message: "Profile image deleted successfully",
          data: null,
        });
      } catch (err) {
        errHandler(err, res);
      }
    }  return res.status(404).json({
        status: "Failed",
        message: "Delete operation failed: user not found",
        data: null,
      });

  },
  // setUserLevel: async (req, res) => {
  //   try {
  //     const user = await userModel
  //       .findOneAndUpdate(
  //         { _id: req.params.id },
  //         { level: req.body.level },
  //         { new: true, runValidators: true }
  //       )
  //       .select(["-avatar"]);
  //     if (!user)
  //       return res.status(404).json({
  //         status: "Failed",
  //         message: "level not set: user not found",
  //         data: null,
  //       });
  //     res.json({
  //       status: "Success",
  //       message: "User level updated!",
  //       data: user,
  //     });
  //   } catch (err) {
  //     errHandler(err, res);
  //   }
  // },
  // getUserLevel: async (req, res) => {
  //   try {
  //     const user = await userModel.findOne({ _id: req.params.id });
  //     if (!user)
  //       return res
  //         .status(404)
  //         .json({ status: "Failed", message: "user not found", data: null });
  //     res.json({ status: "Success", message: "User level", data: user.level });
  //   } catch (err) {
  //     errHandler(err, res);
  //   }
  // },

  sendOtpSms: async (req, res) => {
     const users = await userModel.find({creatorId : req.user._id});
     if(users){
       let nums = crypto.randomBytes(4).toString("hex");
       try {
         const user = await userModel.findOne({ _id: req.params.id });
         if (!user)
           return res
             .status(404)
             .json({ status: "Failed", message: "user not found", data: null });
         const sent = await userModel.findOneAndUpdate(
           { _id: user._id },
           { otp: nums }
         );

         if (!sent)
           return res
             .status(404)
             .json({ status: "Failed", message: "Otp not found", data: null });
         return res.status(200).json({
           status: "Success",
           message:
             "Otp sent to your registered phone number,use it to change your phone number",
           otp: nums,
         });
       } catch (err) {
         errHandler(err, res);
       }
     }return res
       .status(404)
       .json({ status: "Failed", message: "user not found", data: null });

  },
  changePhoneWithSms: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      const phoneNumber = req.body.phone;
      try {
        const otp = req.query.otp;
        const change = await userModel.findOne({ otp: otp });
        if (!change)
          return res
            .status(404)
            .json({ status: "Failed", message: "Otp not found", data: null });

        const user = await userModel.findOneAndUpdate(
          { _id: change._id },
          { phone: phoneNumber },
          { new: true, runValidators: true }
        );
        if (!user)
          return res.status(404).json({
            status: "Failed",
            message:
              "Error phone number cannot be changed at this time. please try again later",
            data: null,
          });
        return res.status(200).json({
          status: "Success",
          message: "Phone number changed successfully",
          data: phoneNumber,
        }), userModel.findOneAndUpdate({ _id: change._id }, { $unset: { otp: 1 } });

        //can refactor to insert sms sending api for confirmation
      } catch (err) {
        errHandler(err, res);
      }
    }return res.status(404).json({
      status: "Failed",
      message:
        "Error phone number cannot be changed at this time. please try again later",
      data: null,
    });

  },
  sendOtpEmail: async (req, res) => {
    const users = await userModel.find({creatorId : req.user_id});
    if(users){
      let nums = crypto.randomBytes(4).toString("hex");
      try {
        const user = await userModel.findOne({ _id: req.params.id });
        if (!user)
          return res
            .status(404)
            .json({ status: "Failed", message: "user not found", data: null });
        const sent = await userModel.findOneAndUpdate(
          { _id: user._id },
          { otp: nums }
        );
        if (!sent)
          return res
            .status(404)
            .json({ status: "Failed", message: "Otp not found", data: null });
        return res.status(200).json({
          status: "Success",
          message:
            "Otp sent to your email,use it to change your email address",
          otp: nums,
        });
      } catch (err) {
        errHandler(err, res);
      }
    }return res
      .status(404)
      .json({ status: "Failed", message: "user not found", data: null });

  },
  changeEmail: async (req, res) => {
    const users = await userModel.find({creatorId : req.user._id});
    if(users){
      const email = req.body.email;
      try {
        const otp = req.query.otp;
        const change = await userModel.findOne({ otp: otp });
        if (!change)
          return res
            .status(404)
            .json({ status: "Failed", message: "Otp not found", data: null });
        const user = await userModel.findOneAndUpdate(
          { _id: change._id },
          { email: email },
          { new: true, runValidators: true }
        );
        if (!user)
          return res.status(404).json({
            status: "Failed",
            message:
              "Error, Email address cannot be changed at this time. please try again later",
            data: null,
          });
        return res.status(200).json({
          status: "Success",
          message: "Email address changed successfully",
          data: email,
        }), userModel.findOneAndUpdate({ _id: change._id }, { $unset: { otp: 1 } })
        //can refactor to insert email sending api for confirmation
      } catch (err) {
        errHandler(err, res);
      }
    }return res.status(404).json({
      status: "Failed",
      message:
        "Error, user with this email not found",
      data: null,
    });

  },

  inviteUserToTeam: async (req, res) => {
    const users = await userModel.find({creatorId: req.user._id});
    if (users){
      try {
        const { userId, teamId, invitedUserId } = req.params;
        if (userId === invitedUserId) throw new Error("Cannot invite self");

        const team = await teamModel.findOne({ _id: teamId })
        const user = await userModel.findById(userId)
        const invitedUser = await userModel.findById(invitedUserId)

        if (!user) throw new Error('User not found');
        if (!team) throw new Error('Team not found');
        if (!invitedUser) throw new Error('Invited User not found');

        team.users = team.users.concat(invitedUser)
        invitedUser.team = team

        await team.save()
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
    }res.status(404)
    .json({
      status: "Fail",
      message: "User not found",
      data: null
    })

  },
  inviteUserToCompany: async (req, res) => {
    const users = await userModel.find({creatorId: req.user._id});
    if(users){
      try {
        const { userId, companyId, invitedUserId } = req.params;
        if (userId === invitedUserId) throw new Error("Cannot invite self");

        const company = await companyModel.findOne({ _id: companyId })
        const user = await userModel.findById(userId)
        const invitedUser = await userModel.findById(invitedUserId)

        if (!user) throw new Error('User not found');
        if (!company) throw new Error('Team not found');
        if (!invitedUser) throw new Error('Invited User not found');

        company.users = company.users.concat(invitedUser)
        invitedUser.company = company

        await company.save()
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
    }res.status(404)
    .json({
      status: "Fail",
      message: "User not found",
      data: null
    })

  },
};

module.exports = user;
