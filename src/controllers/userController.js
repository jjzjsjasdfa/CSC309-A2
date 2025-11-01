const userService = require("../services/userService");

const userController = {
  async register(req, res) {
    try {
      const { utorid, name, email } = req.body;
      const newUser = await userService.registerRegularUser(utorid, name, email);
      const { id, utorid: u, name: n, email: e, verified, expiresAt, resetToken } = newUser;

      res.status(201).json({ id, utorid: u, name: n, email: e, verified, expiresAt, resetToken });
    } catch (error) {
      res.status(409).json({ error: error.message });
    }
  },

  async getUsers(req, res){
    let page, limit;
      const where = {};
      for(const key in req.query){
        if(req.query[key] !== undefined){
          if(key === "verified" || key === "activated"){
            where[key] = req.query[key] === "true";
          }else if(key === "page"){
            page = Number(req.query[key]);
          }else if(key === "limit"){
            if(!/^[0-9]+$/.test(req.query[key])){
              res.status(400).json({ error: "Payload field that is supposed to be number is not number" });
            }
            else{
              limit = Number(req.query[key]);
            }
          }
        }
        else {
          // default value
          if(key === "page"){
            page = 1;
          }
          if(key === "limit"){
            limit = 10;
          }
        }
      }

      const skip = (page - 1) * limit;
      const users = await userService.getUsers(where, limit, skip);
      const results = users.map(
        ({id, utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl}) =>
          ({id, utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl}
        )
      );
      res.status(200).json({
        count: users.length,
        results: users,
      });
  },

  async getUser(req, res) {
    const id = req.params.userId;
    let user;

    // cashier
    if(req.user.role === "cashier"){
      user = await userService.getUserWithAvailablePromo(id);
      const { utorid, name, points, verified, promotions } = user;
      res.status(200).json({ id, utorid, name, points, verified, promotions });
    }
    // manager or higher
    else{
      user = await userService.getUserWithAllPromo(id);
      const { utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl, promotions } = user;
      res.status(200).json({ id, utorid, name, email, birthday, role, points, createdAt, lastLogin, verified, avatarUrl, promotions });
    }
  },

  async updateUser(req, res) {
    const user = req.user;
    const { email, verified, suspicious, role } = req.body;

    const updateData = {};

    if (email !== undefined){
      updateData.email = email;
    }

    if (verified !== undefined && verified === false) {
      updateData.verified = true;
    }

    if (suspicious !== undefined) {
      // Only allow setting suspicious if role is not being promoted to cashier
      if (role === "cashier" && suspicious === true) {
        return res.status(400).json({ error: "Cannot make a cashier suspicious" });
      }
      updateData.suspicious = suspicious;
    }

    if (role !== undefined) {
      // Role restrictions
      const requesterRole = req.requesterRole; // e.g., set in authenticate middleware
      const allowedRoles = requesterRole === "manager" ? ["regular", "cashier"]
                          : requesterRole === "superuser" ? ["regular", "cashier", "manager", "superuser"]
                          : [];

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: "Role change not allowed" });
      }

      updateData.role = role;

      // Promote to cashier -> set suspicious to false if not explicitly provided
      if (role === "cashier" && suspicious === undefined) {
        updateData.suspicious = false;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }

    try {
      const updatedUser = await userService.updateUser(user.id, updateData);

      // Return only updated fields + id/utorid/name
      const response = { id: updatedUser.id, utorid: updatedUser.utorid, name: updatedUser.name };
      for (const key of Object.keys(updateData)) {
        response[key] = updatedUser[key];
      }

      res.status(200).json(response);
    } catch (err) {
      res.status(500).json({ error: "Failed to update user", details: err.message });
    }
  }
};

module.exports = userController;
