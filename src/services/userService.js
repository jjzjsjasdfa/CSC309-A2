const userRepository = require("../repositories/userRepository");
const { v4: uuidv4 } = require('uuid');

const userService = {
  async registerRegularUser(utorid, name, email) {
    const existing = await userRepository.findByUtorid(utorid);
    if (existing) throw new Error(`User ${utorid} already exists.`);

    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return await userRepository.createUser(utorid, name, email, resetToken, expiresAt);
  },

  async getUsers(where, skip, limit){
    return await userRepository.findMany(where, skip, limit);
  },

  async getUser(id){
    return await userRepository.findById(id);
  },

  async getUserWithAvailablePromo(id){
    return await userRepository.findByIdIncludeAvailablePromo(id);
  },

  async getUserWithAllPromo(id){
    return await userRepository.findByIdIncludeAllPromo(id);
  }
};

module.exports = userService;