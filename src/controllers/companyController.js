const companyModel = require("../models/company");
const teamModel = require("../models/team");
const userModel = require("../models/user");
const ObjectId = require("mongodb").ObjectID;
const { errHandler } = require("../handlers/errorHandlers");
const team = require("../models/team");

const company = {
  createTeam: async (req, res) => {
    const { name, description } = req.body;
    const companyId = req.params.id;
    try {
      const company = await companyModel.findOne({
        _id: companyId,
        creatorId: req.user._id,
      });

      if (!company) {
        return res.status(404).json({
          status: "Failed",
          message: "Company not found",
        });
      }

      const newTeam = new teamModel({
        name,
        description,
        creatorId: req.user._id,
        company: company._id
      });
      await newTeam.save();

      company.teams = company.teams.concat(newTeam);
      await company.save();

      res.json({
        status: "Success",
        message: "New team created!",
        data: newTeam,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  createCompany: async (req, res) => {
    const { name } = req.body;
    try {
      const company = new companyModel({ name, creatorId: req.user._id });
      await company.save();
      res.json({
        status: "Success",
        message: "New company created!",
        data: company,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getCompany: async (req, res) => {
    const companyId = req.params.id;
    try {
      const company = await companyModel.findOne({
        _id: companyId,
        creatorId: req.user._id,
      });
      if (!company)
        return res
          .status(404)
          .json({ status: "Failed", message: "Company not found", data: null });
      res.json({ status: "Success", message: "Company", data: company });
    } catch (err) {
      errHandler(err, res);
    }
  },

  setCompanyInfo: async (req, res) => {
    try {
      const company = await companyModel.findOneAndUpdate(
        { _id: req.params.id, creatorId: req.user._id },
        { companyinfo: req.body.companyinfo }
      );
      if (!company)
        return res
          .status(404)
          .json({ status: "Failed", message: "Company not found", data: null });
      res.status(200).json({
        status: "Success",
        message: "company info updated",
        data: company,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },

  getAllCompanies: (req, res) => {
    companyModel
      .find({ creatorId: req.user._id })
      .then((companies) =>
        res.json({
          status: "Success",
          message: "List of Companies",
          data: companies,
        })
      )
      .catch((err) =>
        res
          .status(400)
          .json({ status: "Failed", message: err.message, data: null })
      );
  },
  getAllTeams: async (req, res) => {
    const companyId = req.params.id;

    try {
      const company = await companyModel.findOne({
        _id: companyId,
        creatorId: req.user._id,
      });
      if (!company)
        return res
          .status(404)
          .json({ status: "Failed", message: "Company not found", data: null });

      const companyTeams = [];
      for (let teamId in company.teams) {
        companyTeams[teamId] = await teamModel.findById(company.teams[teamId]);
      }

      res.json({
        status: "Success",
        message: "List of Teams",
        data: companyTeams,
      });
    } catch (err) {
      errHandler(err, req);
    }
  },
  updateTeamInfo: async (req, res) => {
    try {
      const team = await teamModel({
        _id: req.params.id,
        creatorId: req.user._id,
      });

      if (!team) {
        return res.status(404).json({
          status: "Failed",
          message: "Team not found",
        });
      }

      team.description = req.body.description || team.description;
      team.name = req.body.name || team.name;
      const data = await team.save();
      return res.status(200).json({
        status: "Success",
        message: "Team updated",
        data,
      });
    } catch (error) {
      errHandler(error, res);
    }
  },
  teamDescription: async (req, res, next) => {
    try {
      const team = await teamModel.findOne({
        _id: req.params.id,
        creatorId: req.user._id,
      });
      if (!team) {
        return res.status(404).json({
          status: "Failed",
          message: "Team not found",
        });
      }
      team.description = req.body.description || team.description;
      const data = await team.save();
      return res.status(200).json({
        status: "Success",
        message: "Team updated",
        data,
      });
    } catch (error) {
      errHandler(error, res);
    }
  },
  getUserTeam: async (req, res) => {
    const user = await userModel.findOne({
      _id: req.params.id,
      creatorId: req.user._id,
    });
    if (!user)
      return res
        .status(404)
        .json({ status: "Failed", message: "User not found", data: null });
    const team = await teamModel.findById(user.team);
    if (!team)
      return res
        .status(404)
        .json({ status: "Failed", message: "Team not found", data: null });
    res.json({ status: "Success", message: "User team name", data: team });
  },
  getUserCompany: async (req, res) => {
    const user = await userModel.findOne({
      _id: req.params.id,
      creatorId: req.user._id,
    });
    if (!user)
      return res
        .status(404)
        .json({ status: "Failed", message: "User not found", data: null });

    const company = await companyModel.findById(user.company);
    if (!company)
      return res
        .status(404)
        .json({ status: "Failed", message: "Company not found", data: null });

    res.json({ status: "Success", message: "User company", data: company });
  },
  getTeamMembers: async (req, res) => {
    const teamId = req.params.id;
    try {
      const team = await teamModel.findOne({
        _id: teamId,
        creatorId: req.user._id,
      });
      if (!team)
        return res
          .status(404)
          .json({ status: "Failed", message: "Team Not Found", data: null });

      const teamMembers = [];

      for (let userId in team.users) {
        teamMembers[userId] = await userModel.findById(team.users[userId]);
      }

      res.json({
        status: "Success",
        message: "Team members",
        data: teamMembers,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  getCompanyMembers: async (req, res) => {
    const companyId = req.params.id;
    try {
      const company = await companyModel.findOne({
        _id: companyId,
        creatorId: req.user._id,
      });
      if (!company)
        return res
          .status(404)
          .json({ status: "Failed", message: "Company not Found", data: null });

      const companyUsers = [];

      for (let userId in company.users) {
        companyUsers[userId] = await userModel.findById(company.users[userId]);
      }

      res.json({
        status: "Success",
        message: "Company members",
        data: companyUsers,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },

  deleteCompany: async (req, res) => {
    const companyId = req.params.companyId;
    const creatorId = req.user.id;
    const company = await companyModel.findOne({_id: companyId, creatorId: creatorId});
    if (!company) {
      res.status(400).json({
        status: "Failed",
        message: `Company not found ${companyId}`,
        data: null
      });
    }
    try {
      const users = company.users;
      const teams = company.teams;
    
      if(users){
        //update all company users
        await userModel.updateMany({_id: {$in: users } },  {company: null});
      }
      if (teams) {
        //delete all teams under company
        await teamModel.deleteMany({ _id: {$in: teams } });  
      }
     
      //delete the company
      await companyModel.deleteOne({_id: company._id})

      res.status(200).json({
        status: "Success",
        message: `Company with id ${company._id} deleted successfully`,
        data: null
      });
      
    } catch (err) {
      errHandler(err, res);
      
    }
  },

  setUserCompany: async (req, res) => {
    const userId = req.params.userId;
    const companyId = req.params.companyId;

    try {
      const company = await companyModel.findOne({
        _id: companyId,
        creatorId: req.user._id,
      });
      const user = await userModel.findOne({
        _id: userId,
        creatorId: req.user._id,
      });

      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "User not found", data: null });
      if (!company)
        return res
          .status(404)
          .json({ status: "Failed", message: "Company not found", data: null });

      company.users = company.users.concat(user);
      user.company = company;

      await company.save();
      await user.save();

      res.status(200).json({
        status: "Success",
        message: "User Company Updated",
        data: company,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
  setUserTeam: async (req, res) => {
    const userId = req.params.userId;
    const teamId = req.params.teamId;

    try {
      const team = await teamModel.findOne({
        _id: teamId,
        creatorId: req.user._id,
      });
      const user = await userModel.findOne({
        _id: userId,
        creatorId: req.user._id,
      });


      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "User not found", data: null });
      if (!team)
        return res
          .status(404)
          .json({ status: "Failed", message: "Team not found", data: null });
      
      const sameCompany = team.company.equals(user.company);
      const userAlreadyInTeam = user.team.equals(team._id);
      if(!sameCompany){
        return res.status(404).json({status:"Failed", message:"User and Team not in the same company", data: null});
      }
      
      if(userAlreadyInTeam){
        return res.status(404).json({status:"Failed", message:"User is already in team", data: team});
      }

      team.users = team.users.concat(user);
      user.team = team;

      await team.save();
      await user.save();

      res
        .status(200)
        .json({ status: "Success", message: "User Team Updated", data: team });
    } catch (err) {
      errHandler(err, res);
    }
  },

  removeUserFromCompany: async (req, res) => {
    const { companyId, userId } = req.params;
    const company = await companyModel.findOne({
      _id: companyId,
      creatorId: req.user._id,
    });
    const team = await teamModel.findOne({
      creatorId: req.user._id,
      users: userId
    })

    if (!company)
      return res
        .status(404)
        .json({ status: "failed", message: "Company not found", data: null });

    try {
      company.users.pull({ _id: userId });
      await company.save();
      if (team) {
        team.users.pull({_id: userId});
        await team.save();
      }
      res
        .status(200)
        .json({ status: "Success", message: "User Deleted.", data: company });
    } catch (err) {
      errHandler(err, res);
    }
  },

  removeUserTeam: async (req, res) => {
    const userId = req.params.userId;
    const teamId = req.params.teamId;

    try {
      const team = await teamModel.findOne({
        _id: teamId,
        creatorId: req.user._id,
      });
      const user = await userModel.findOne({
        _id: userId,
        creatorId: req.user._id,
      });

      if (!user)
        return res
          .status(404)
          .json({ status: "Failed", message: "User not found", data: null });
      if (!team)
        return res
          .status(404)
          .json({ status: "Failed", message: "Team not found", data: null });

      user.team = null;
      await user.save();

      const teamResult = await teamModel.updateOne(
        { _id: teamId },
        { $pull: { users: userId } },
        { new: true, useFindAndModify: false }
      );
      if (teamResult.nModified == 0) {
        return res.status(500).json({
          status: "Failed",
          message: "Failed to remove user from team",
          data: null,
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Successfully removed user",
        data: null,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },

  removeTeamFromCompany: async (req, res) => {
    const companyId = req.params.companyId;
    const teamId = req.params.teamId;

    try {
      const team = await teamModel.findOne({
        _id: teamId,
        creatorId: req.user._id,
      });
      const company = await companyModel.findOne({
        _id: companyId,
        creatorId: req.user._id,
      });

      if (!company)
        return res
          .status(404)
          .json({ status: "Failed", message: "Company not found", data: null });
      if (!team)
        return res
          .status(404)
          .json({ status: "Failed", message: "Team not found", data: null });
        
      await userModel.updateMany({_id: {$in: team.users}}, {team: null});
      await teamModel.deleteOne({_id: teamId});
      const companyResult = await companyModel.updateOne(
        { _id: companyId },
        { $pull: { teams: teamId } },
        { new: true, useFindAndModify: false }
      );
      if (companyResult.nModified == 0) {
        return res.status(500).json({
          status: "Failed",
          message: "Failed to remove team from company",
          data: null,
        });
      }

      return res.status(200).json({
        status: "Success",
        message: "Successfully removed team",
        data: null,
      });
    } catch (err) {
      errHandler(err, res);
    }
  },
};
module.exports = company;
