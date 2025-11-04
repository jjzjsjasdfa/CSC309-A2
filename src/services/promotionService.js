const promotionRepository = require("../repositories/promotionRepository");

const toDbType = (t) => (t === "one-time" ? "onetime" : t);
const toApiType = (t) => (t === "onetime" ? "one-time" : t);

function ensureValidDates(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date");
  }
  if (end <= start) {
    throw new Error("endTime must be after startTime");
  }
  return { start, end };
}

function ensureNumberOrNull(v, name) {
  if (v === undefined || v === null) return null;
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new Error(`${name} must be a number`);
  }
  if (v < 0) throw new Error(`${name} must be non-negative`);
  return v;
}

const promotionService = {
  async createPromotion(data) {
    const { name, description, type, startTime, endTime } = data;
    if (!name || !description || !type || !startTime || !endTime) {
      throw new Error("Missing required fields");
    }
    if (!["automatic", "one-time"].includes(type)) {
      throw new Error("type must be 'automatic' or 'one-time'");
    }

    const { start, end } = ensureValidDates(startTime, endTime);

    const minSpending = ensureNumberOrNull(data.minSpending, "minSpending");
    const rate = ensureNumberOrNull(data.rate, "rate");
    const points = (data.points === undefined || data.points === null)
      ? null
      : (Number.isInteger(data.points) && data.points >= 0 ? data.points : (() => { throw new Error("points must be a non-negative integer"); })());

    const created = await promotionRepository.create({
      name,
      description,
      type: toDbType(type),
      startTime: start,
      endTime: end,
      minSpending,
      rate,
      points
    });

    return { ...created, type: toApiType(created.type) };
  },

  async getAllPromotions() {
    const promos = await promotionRepository.findMany();
    return promos.map(p => ({ ...p, type: toApiType(p.type) }));
  },

  async getPromotionById(id) {
    const promo = await promotionRepository.findById(id);
    if (!promo) throw new Error("Promotion not found");
    return { ...promo, type: toApiType(promo.type) };
  },

  async updatePromotion(id, data) {
    const existing = await promotionRepository.findById(id);
    if (!existing) throw new Error("Promotion not found");

    const patch = {};

    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;

    if (data.type !== undefined) {
      if (!["automatic", "one-time"].includes(data.type)) {
        throw new Error("type must be 'automatic' or 'one-time'");
      }
      patch.type = toDbType(data.type);
    }

    let newStart = existing.startTime;
    let newEnd = existing.endTime;
    if (data.startTime !== undefined) newStart = new Date(data.startTime);
    if (data.endTime !== undefined) newEnd = new Date(data.endTime);
    if (data.startTime !== undefined || data.endTime !== undefined) {
      if (Number.isNaN(newStart.getTime()) || Number.isNaN(newEnd.getTime())) {
        throw new Error("Invalid date");
      }
      if (newEnd <= newStart) {
        throw new Error("endTime must be after startTime");
      }
      patch.startTime = newStart;
      patch.endTime = newEnd;
    }

    if (data.minSpending !== undefined) patch.minSpending = ensureNumberOrNull(data.minSpending, "minSpending");
    if (data.rate !== undefined) patch.rate = ensureNumberOrNull(data.rate, "rate");
    if (data.points !== undefined) {
      if (!Number.isInteger(data.points) || data.points < 0) throw new Error("points must be a non-negative integer");
      patch.points = data.points;
    }

    const updated = await promotionRepository.update(id, patch);
    return { ...updated, type: toApiType(updated.type) };
  },

  async deletePromotion(id) {
    const promo = await promotionRepository.findById(id);
    if (!promo) throw new Error("Promotion not found");
    if (promo.startTime <= new Date()) {
      throw new Error("Cannot delete a promotion that has already started");
    }
    await promotionRepository.delete(id);
  }
};

module.exports = promotionService;
