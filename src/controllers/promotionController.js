const promotionService = require("../services/promotionService");

const promotionController = {
  async create(req, res) {
    try {
      const promo = await promotionService.createPromotion(req.body);
      return res.status(201).json(promo);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async getAll(req, res) {
    try {
      const promos = await promotionService.getAllPromotions();
      return res.status(200).json({ count: promos.length, results: promos });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const promo = await promotionService.getPromotionById(parseInt(req.params.id));
      return res.status(200).json(promo);
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const promo = await promotionService.updatePromotion(parseInt(req.params.id), req.body);
      return res.status(200).json(promo);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      await promotionService.deletePromotion(parseInt(req.params.id));
      return res.status(204).end();
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
};

module.exports = promotionController;
