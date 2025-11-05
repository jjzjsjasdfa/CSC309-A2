const userService = require("../services/userService");
const bcrypt = require('bcrypt');

const userController = {
  async register(req, res) {
    try {
      const { utorid: u, name: n, email: e } = req.body;
      const newUser = await userService.registerRegularUser(u, n, e);
      const { id, utorid, name, email, verified, expiresAt, resetToken } = newUser;

      return res.status(201).json({ id, utorid, name, email, verified, expiresAt, resetToken });
    } catch (error) {
      return res.status(409).json({ error: error.message });
    }
  },

  async getUsers(req, res){
    let page, limit;
    let where = {};

    for(const key in req.query){
      switch(key){
        case "name":
        case "role":
          where[key] = req.query[key];
          break;
        case "verified":
        case "activated":
          where[key] = req.query[key] === "true";
          break;
        case "page":
          page = parseInt(req.query[key], 10);
          break;
        case "limit":
          limit = parseInt(req.query[key], 10);
          break;
      }
    }

    if(page === undefined){
      page = 1;
    }

    if(limit === undefined){
      limit = 10;
    }

    if(page < 1 || limit < 1){
      return res.status(400).json({ error: "page and limit must be positive integers" });
    }

    let users = await userService.getUsers(where);
    const count = users.length;
    if(!users){
      return res.status(200).json({ message: "no users found" });
    }

    const skip = (page - 1) * limit;
    users = await userService.getUsersWithSkipAndLimit(where, skip, limit);
    if(!users){
      return res.status(200).json({ message: "no users in this page" });
    }

    const results = users.map(
      ({id, utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl}) =>
        ({id, utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl}
      )
    );
    return res.status(200).json({
      count: count,
      results: results,
    });
  },

  async getUser(req, res) {
    const id = parseInt(req.params.userId, 10);
    let user;

    // cashier
    if(req.user.role === "cashier"){
      user = await userService.getUserWithAvailablePromo(id);
      const { utorid, name, points, verified, promotions } = user;
      return res.status(200).json({ id, utorid, name, points, verified, promotions });
    }
    // manager or higher
    else{
      user = await userService.getUserWithAllPromo(id);
      const { utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl, promotions } = user;
      return res.status(200).json({ id, utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl, promotions });
    }
  },

  async updateUser(req, res) {
    const id = parseInt(req.params.userId, 10);
    const user = await userService.getUserById(id);
    let updateData = {};

    if(req.body.email !== undefined){
      updateData.email = req.body.email;
    }

    // don't care when verified === false
    if (req.body.verified !== undefined) {
      if (!/^(true)$/.test(req.body.verified)) {
        return res.status(400).json({ error: "verified field should be boolean" });
      }
      updateData.verified = req.body.verified;
    }

    if (req.body.suspicious !== undefined) {
      updateData.suspicious = req.body.suspicious;
    }

    if (req.body.role !== undefined) {
      // suspicious user cannot be promoted to cashier
      if (req.body.role === "cashier" && user.suspicious === true) {
        return res.status(400).json({ error: "A suspicious user cannot be promoted to cashier" });
      }

      let allowedRoles;
      if(req.user.role === "manager"){
        allowedRoles = ["regular", "cashier"];
      }
      // superuser can promote anyone
      else{
        allowedRoles = ["regular", "cashier", "manager", "superuser"];
      }

      if (!allowedRoles.includes(req.body.role)) {
        return res.status(403).json({ error: `You are not allowed to promote someone to ${req.body.role}` });
      }

      updateData.role = req.body.role;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    const updatedUser = await userService.updateUserById(id, updateData);
    const response = { id: updatedUser.id, utorid: updatedUser.utorid, name: updatedUser.name };
    for (const key of Object.keys(updateData)) {
      response[key] = updatedUser[key];
    }

    return res.status(200).json(response);
  },

  async updateMyself(req, res){
    let updateData = {};

    if(req.body.name !== undefined){
      updateData.name = req.body.name;
    }

    if(req.body.email !== undefined){
      updateData.email = req.body.email;
    }

    if(req.body.birthday !== undefined){
      const [y, m, d] = req.body.birthday.split('-').map(Number);
      updateData.birthday = new Date(y, m - 1, d);
    }

    if (req.file !== undefined) {
      updateData.avatarUrl = '/uploads/avatars/' + req.file.filename;
    }

    if(Object.keys(updateData).length === 0){
      return res.status(400).json({ error: "No update fields provided" });
    }

    updateData.verified = true;

    const updatedUser = await userService.updateUserById(req.user.id, updateData);
    return res.status(200).json({
      id: updatedUser.id,
      utorid: updatedUser.utorid,
      name: updatedUser.name,
      email: updatedUser.email,
      birthday: updatedUser.birthday,
      role: updatedUser.role,
      points: updatedUser.points,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin,
      verified: updatedUser.verified,
      avatarUrl: updatedUser.avatarUrl
    });
  },

  async getMyself(req, res){
    const myself = await userService.getUserWithAllPromo(req.user.id);
    const { id, utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl, promotions } = myself
    return res.status(200).json({ id, utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl, promotions });
  },

  async updateMyPassword(req, res){
    const myself = await userService.getUserWithAllPromo(req.user.id);

    // see if old matches
    const isMatch = await bcrypt.compare(req.body.old, myself.password);
    if(!isMatch){
      return res.status(403).json({ error: "the provided current password is incorrect" })
    }

    const hashedPassword = await bcrypt.hash(req.body["new"], 10);
    const updated = await userService.updateUserById(req.user.id, { password: hashedPassword });
    return res.status(200).json({ message: "password updated" });
  }
};

module.exports = userController;