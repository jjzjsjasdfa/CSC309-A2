const express = require("express")
const router = express.Router();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const mw = require('../middleware/middleware');

router.route("/")
  .post(mw.validateBodyPayload(["utorid", "name", "email"]), async (req, res) => {
    if(req.body.role === "regular"){
      res.status(403).json({ error: "You need to be Cashier or higher" });
    }

    const { utorid: u, name: n, email: e } = req.body;

    // check the type of each field
    if(!/^[a-zA-Z0-9]{7,8}$/.test(u)){
      res.status(400).json({ error: "utorid should be alphanumeric, 7-8 characters" });
    } else if(!/^.{1,50}$/.test(n)){
      res.status(400).json({ error: "name should be 1-50 characters" });
    } else if(!/^.+@mail\.utoronto\.ca$/.test(e)){
      res.status(400).json({ error: "email should be valid University of Toronto email in the format name@mail.utoronto.ca" });
    }

    const newUser = await prisma.user.create({
      data: { utorid: u, name: n, email: e }
    });

    const { id, utorid, name, email, verified, expiresAt, resetToken } = newUser;
    res.status(201).json(
      { id, utorid, name, email, verified, expiresAt, resetToken }
    );

  })
  .get(async (req, res) => {
    if(req.body.role === "regular" || req.body.role === "cashier"){
      res.status(403).json({ error: "You need to be Manager or higher" });
    }

    const keys = ["name", "role", "verified", "activated"];
    let page, limit;
    const where = {};
    keys.forEach(key => {
        if(req.query[key] !== undefined){
          if(key === "verified" || key === "activated"){
            where[key] = req.query[key] === "true";
          }else if(key === "page"){
            page = Number(req.query[key]);
          }else if(key === "limit"){
            limit = Number(req.query[key]);
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
    );

    const skip = (page - 1) * limit;
    const users = await prisma.user.findMany({
      where: where,
      skip: skip,
      take: limit,
    });

    res.status(200).json({
      count: users.length,
      results: users
    });
  })
  .all((req, res) => {
    res.set('Allow', 'POST');
    res.sendStatus(405);
  });

router.route("/:id")
  .get((req, res) => {
    res.send(`Fetching user with ID: ${req.params.id}`);
  })
  .put((req, res) => {
    res.send(`Updating user with ID: ${req.params.id}`);
  })
  .delete((req, res) => {
    res.send(`Deleting user with ID: ${req.params.id}`);
  });

router.post("/", (req, res) => res.send("User created"));
module.exports = router;