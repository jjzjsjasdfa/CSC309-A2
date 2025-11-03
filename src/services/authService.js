const userRepository = require("../repositories/userRepository");
const bcrypt = require('bcrypt');

const authService = {
  async authenticate(utorid, password) {
    let user = await userRepository.findByUtorid(utorid);

    // handle error
    if (!user) throw new Error("User not found");
    if (user && !(await bcrypt.compare(password, user.password))) throw new Error("utorid and password do not match");

    // update lastLogin and expiresAt
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    user = await userRepository.updateUserByUtorid(utorid, { lastLogin: new Date(), expiresAt });

    return user;
  },
}


module.exports = authService;