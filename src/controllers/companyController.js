const companyModel = require( '../models/company');
const teamModel = require('../models/team');
const userModel = require('../models/user');
const ObjectId = require('mongodb').ObjectID
const { errHandler } = require('../handlers/errorHandlers');
const team = require('../models/team');

const company = {
    createTeam: async (req, res) => {
        const { name } = req.body;
        const companyId = req.params.id
        try{
            const newTeam = new teamModel({name});
            await newTeam.save()

            const company = await companyModel.findOne({_id: companyId})

            company.teams = company.teams.concat(newTeam)
            await company.save()

            res.json({status: 'Success', message: 'New team created!', data: newTeam})
        }
        catch(err){
            errHandler(err, res)
        }
    },
    createCompany: async (req, res) => {
        const { name } = req.body;
        try{
            const company = new companyModel({name});
            await company.save()
            res.json({status: 'Success', message: 'New company created!', data: company})
        }
        catch(err){
            errHandler(err, res)
        }
    },
    getCompany: async (req, res) => {
        const companyId = req.params.id
        try{
            const company = await companyModel.findOne({_id: companyId})
            if(!company) return res.status(404).json({status: 'Failed', message: "Company not found", data: null })
            res.json({status: 'Success', message: "Company", data: company})
        }
        catch(err){
            errHandler(err, res)
        }
        
    },
    getAllCompanies: (req, res) => {
        companyModel.find()
          .then((companies) => res.json({status: 'Success', message: 'List of Companies', data: companies}))
          .catch(err => res.status(400).json({status: 'Failed', message: err.message, data: null}));
    },
    getAllTeams: async (req, res) => {

        const companyId = req.params.id

        try {
            const company = await companyModel.findById(companyId)
            if(!company) return res.status(404).json({status: 'Failed', message: "Company not found", data: null })

            const companyTeams = []
            for (let teamId in company.teams) {
                companyTeams[teamId] = await teamModel.findById(company.teams[teamId])
            }

            res.json({status: 'Success', message: 'List of Teams', data: companyTeams})

        }catch (err) {
            errHandler(err,req)
        }
    },
    deleteTeam = (req, res) => {
        Team.findOne({_id: req.params.id}).then(
            (Team) => {
              Team.deleteOne({_id: req.params.id}).then(
                  () => {
                    res.status(200).json({
                        message: 'Deleted'
                    });
                  }
              ).catch(
                  (error) => {
                    res.status(400).json({
                        error:error
                    });
                  }
              );
            }
        );
    },
    updateTeamInfo = (req, res, next) => {
        const Team = new Team({
            _id: req.params.id,
            name: req.body.name,
            description: req.body.description,
        });
        Team.updateOne({_id: req.params.id}, Team).then(
            () => {
              res.status(201).json({
                message: 'Team updated successfully!'
              });
            }
          ).catch(
            (error) => {
              res.status(400).json({
                error: error
              });
            }
        );
    },
    teamDescription = (req, res, next) => {
        const Team = new Team({
            _id: req.params.id,
            description: req.body.description,
          });
          Team.save().then(
            () => {
              res.status(201).json({
                message: 'Post saved successfully!'
              });
            }
          ).catch(
            (error) => {
              res.status(400).json({
                error: error
              });
            }
           );
    },
    getUserTeam: async(req, res) =>{
        const user = await userModel.findOne({_id: req.params.id})
        if(!user) return res.status(404).json({status: 'Failed', message: "User not found", data: null })
        const team = await teamModel.findById(user.team)
        if(!team) return res.status(404).json({status: 'Failed', message: "Team not found", data: null })
        res.json({status: 'Success', message: "User team name", data: team})
    },
    getUserCompany: async(req, res) =>{
        const user = await userModel.findOne({_id: req.params.id})
        if(!user) return res.status(404).json({status: 'Failed', message: "User not found", data: null })

        const company = await companyModel.findById(user.company)
        if(!company) return res.status(404).json({status: 'Failed', message: "Company not found", data: null })

        res.json({status: 'Success', message: "User company", data: company})
    },
    getTeamMembers: async(req, res) =>{
        const teamId = req.params.id
        try{
            const team = await teamModel.findById(teamId)
            if(!team) return res.status(404).json({status: 'Failed', message: "Team Not Found", data: null })

            const teamMembers = []

            for (let userId in team.users) {
                teamMembers[userId] = await userModel.findById(team.users[userId])
            }

            res.json({status: 'Success', message: "Team members", data: teamMembers})
        }
        catch(err){
            errHandler(err, res)
        }

    },
    getCompanyMembers: async(req, res) =>{
        const companyId = req.params.id
        try{
            const company = await companyModel.findById(companyId)
            if(!company) return res.status(404).json({status: 'Failed', message: "Company not Found", data: null })

            const companyUsers = []

            for (let userId in company.users) {
                companyUsers[userId] = await userModel.findById(company.users[userId])
            }

            res.json({status: 'Success', message: "Company members", data: companyUsers})
        }
        catch(err){
            errHandler(err, res)
        }

    },
    
    deleteCompany: async (req, res) => {
        companyModel.findByIdAndRemove(req.params.companyId)
        .then(transaction => {
            if(!transaction) {
                return res.status(404).send({
                    message: "Company not found with id " + req.params.companyId
                })
            }
            else{
            res.send({message: "Company deleted successfully! " + req.params.companyId});
        }}).catch(err => {
            errHandler(err, res)
            
        })
    },
    
    setUserCompany: async (req, res) =>{

        const userId = req.params.userId
        const companyId = req.params.companyId

        try{
            const company = await companyModel.findOne({_id:companyId})
            const user = await userModel.findById(userId)

            if(!user) return res.status(404).json({status: 'Failed', message:'User not found',  data: null })
            if(!company) return res.status(404).json({status: 'Failed', message:'Company not found',  data: null })

            company.users = company.users.concat(user)
            user.company = company

            await company.save()
            await user.save();

            res.status(200).json({status: 'Success', message: 'User Company Updated', data: company})
        }
        catch(err){
            errHandler(err, res)
        }

    },
    setUserTeam: async (req, res) => {

        const userId = req.params.userId
        const teamId = req.params.teamId

        try{
            const team = await teamModel.findOne({_id:teamId})
            const user = await userModel.findById(userId)

            if(!user) return res.status(404).json({status: 'Failed', message:'User not found',  data: null })
            if(!team) return res.status(404).json({status: 'Failed', message:'Team not found',  data: null })

            team.users = team.users.concat(user)
            user.team = team

            await team.save()
            await user.save();

            res.status(200).json({status: 'Success', message: 'User Team Updated', data: team})
        }
        catch(err){
            errHandler(err, res)
        }
    },
    
    removeUserFromCompany: async (req,res) => {
        const {companyId, userId} = req.params;
        const company = await companyModel.findById(companyId);
        
        if(!company) return res.status(404).json({status:"failed", message:"Company not found", data:null});

        try{
        company.users.pull({_id : userId});
        await company.save();
        res.status(200).json({ status: "Success", message: "User Deleted.", data: company });
        } catch (err){
            errHandler(err, res);
        }
    },

    removeUserTeam: async (req, res) => {

        const userId = req.params.userId
        const teamId = req.params.teamId

        try{
            const team = await teamModel.findOne({_id:teamId})
            const user = await userModel.findById(userId)

            if(!user) return res.status(404).json({status: 'Failed', message:'User not found',  data: null })
            if(!team) return res.status(404).json({status: 'Failed', message:'Team not found',  data: null })

            user.team = null;
            await user.save();

            const teamResult = await teamModel.updateOne({ _id: teamId },  { $pull: { users: userId} }, {new: true, useFindAndModify: false});
            if (teamResult.nModified == 0) {
                return res.status(500).json({status: 'Failed', message:'Failed to remove user from team',  data: null })
            }

            return res.status(200).json({status: 'Success', message:'Successfully removed user',  data: null })
        }
        catch(err){
            errHandler(err, res)
        }
    },

    removeTeamFromCompany: async (req, res) => {

        const companyId = req.params.companyId
        const teamId = req.params.teamId

        try{
            const team = await teamModel.findOne({_id:teamId})
            const company = await companyModel.findById(userId)

            if(!company) return res.status(404).json({status: 'Failed', message:'Company not found',  data: null })
            if(!team) return res.status(404).json({status: 'Failed', message:'Team not found',  data: null })

            const companyResult = await companyModel.updateOne({ _id: companyId },  { $pull: { teams: teamId} }, {new: true, useFindAndModify: false});
            if (companyResult.nModified == 0) {
                return res.status(500).json({status: 'Failed', message:'Failed to remove team from company',  data: null })
            }

            return res.status(200).json({status: 'Success', message:'Successfully removed team',  data: null })
        }
        catch(err){
            errHandler(err, res)
        }
    }
};
module.exports = company;
